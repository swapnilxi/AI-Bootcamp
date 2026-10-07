import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canManageClass } from "@/lib/roles";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { unlockClassSchema } from "../../schemas/class";
import { hasClassEntitlement } from "../entitlements";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * Exchange a class access key for an enrolment. Course materials are only
 * returned once the caller is signed in, entitled to the class, and has given
 * the correct key — an anonymous caller never receives `content`.
 */
export async function POST(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Please log in to unlock this class" }, { status: 401 });
    }

    const ip = getClientIp(req);
    // Rate-limit password attempts per account & class (max 5 attempts per 5 minutes)
    const limiter = await rateLimit(`class-unlock:${session.user.id}:${ip}:${id}`, {
      limit: 5,
      windowMs: 5 * 60 * 1000,
    });
    if (!limiter.success) {
      return NextResponse.json(
        { error: "Too many incorrect password attempts. Please wait 5 minutes." },
        { status: 429 }
      );
    }

    const result = unlockClassSchema.safeParse(await req.json().catch(() => ({})));
    if (!result.success) {
      return NextResponse.json({ error: "Password is required" }, { status: 400 });
    }

    const targetClass = await prisma.course.findUnique({ where: { id } });
    if (!targetClass) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    const canManage = canManageClass(session.user.role, session.user.id, targetClass.instructorId);

    // Approval, subscriber tier and payment gate the key exchange too, so an
    // access key alone can't buy a seat in a paid or unpublished class.
    const entitlement = await hasClassEntitlement(
      { userId: session.user.id, role: session.user.role, canManage },
      {
        id: targetClass.id,
        price: Number(targetClass.price),
        isSubscriberOnly: targetClass.isSubscriberOnly,
        approvalStatus: targetClass.approvalStatus,
        isPublished: targetClass.isPublished,
      }
    );
    if (!entitlement.ok) {
      return NextResponse.json({ error: entitlement.error }, { status: entitlement.status });
    }

    if (!targetClass.isPasswordProtected) {
      // Nothing to unlock — enrolment is the route to the materials.
      return NextResponse.json(
        { error: "This class is not password-protected. Enroll to access it." },
        { status: 400 }
      );
    }

    if (!targetClass.passwordHash) {
      return NextResponse.json(
        { error: "No password configured for this class" },
        { status: 500 }
      );
    }

    const isMatch = await bcrypt.compare(result.data.password, targetClass.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { error: `Incorrect password. ${limiter.remaining} attempts remaining.` },
        { status: 401 }
      );
    }

    await prisma.enrollment.upsert({
      where: { userId_courseId: { userId: session.user.id, courseId: id } },
      create: { userId: session.user.id, courseId: id, unlockedWithPassword: true },
      update: { unlockedWithPassword: true },
    });

    return NextResponse.json({
      message: "Class successfully unlocked!",
      content: targetClass.content,
      unlocked: true,
    });
  } catch (error) {
    console.error("Unlock class error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
