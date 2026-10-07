import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canManageClass } from "@/lib/roles";
import { hasClassEntitlement } from "../entitlements";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Please log in to enroll" }, { status: 401 });
    }

    const targetClass = await prisma.course.findUnique({ where: { id } });
    if (!targetClass) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    const canManage = canManageClass(session.user.role, session.user.id, targetClass.instructorId);

    // Already enrolled is idempotent, and must stay reachable so a student who
    // paid earlier can still open their seat.
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: session.user.id, courseId: id } },
    });
    if (existingEnrollment) {
      return NextResponse.json(
        { message: "You are already enrolled in this class", enrollment: existingEnrollment },
        { status: 200 }
      );
    }

    // Approval/publication, subscriber tier and payment are all decided here.
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

    let unlockedWithPassword = false;

    if (targetClass.isPasswordProtected) {
      const body = await req.json().catch(() => ({}));
      const providedPassword = body?.password;

      if (!providedPassword) {
        return NextResponse.json(
          {
            error: "This class requires an access key password to enroll.",
            requiresPassword: true,
          },
          { status: 403 }
        );
      }

      if (!targetClass.passwordHash) {
        return NextResponse.json({ error: "No password configured" }, { status: 500 });
      }

      const isMatch = await bcrypt.compare(providedPassword, targetClass.passwordHash);
      if (!isMatch) {
        return NextResponse.json({ error: "Invalid class password" }, { status: 401 });
      }

      unlockedWithPassword = true;
    }

    const enrollment = await prisma.enrollment.create({
      data: { userId: session.user.id, courseId: id, unlockedWithPassword },
    });

    return NextResponse.json({ message: "Successfully enrolled in class!", enrollment });
  } catch (error) {
    console.error("Enrollment error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
