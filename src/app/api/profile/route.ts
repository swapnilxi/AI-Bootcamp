import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizePhone } from "@/lib/notify/channels";
import { updateProfileSchema } from "@/lib/validations/profile";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        approvalStatus: true,
        rejectionReason: true,
        approvalNudgesCount: true,
        avatarUrl: true,
        phone: true,
        bio: true,
        timezone: true,
        mentorType: true,
        profileSections: true,
        createdAt: true,
        enrollments: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
                slug: true,
                description: true,
                schedule: true,
                durationMinutes: true,
                price: true,
                isSubscriberOnly: true,
                isPasswordProtected: true,
              },
            },
          },
          orderBy: { enrolledAt: "desc" },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      user,
    });
  } catch (error) {
    console.error("GET profile error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const result = updateProfileSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation error", issues: result.error.format() },
        { status: 400 }
      );
    }

    const { name, avatarUrl, bio, phone, role, timezone } = result.data;

    // Becoming an instructor is an application: the role changes only when an admin approves it.
    // Stepping back to Learner (or withdrawing an application) is always allowed, except that a
    // paying subscriber must not lose their subscription.
    let targetRole: any = undefined;
    let applicationStatus: string | undefined = undefined;
    const callerRole = session.user.role;
    if (role === "INSTRUCTOR" && (callerRole === "USER" || callerRole === "SUBSCRIBER")) {
      const current = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { approvalStatus: true },
      });
      if (current?.approvalStatus !== "PENDING") applicationStatus = "PENDING";
    } else if (role === "USER") {
      if (callerRole === "INSTRUCTOR") {
        targetRole = "USER";
        applicationStatus = "APPROVED";
      } else if (callerRole === "USER" || callerRole === "SUBSCRIBER") {
        applicationStatus = "APPROVED"; // withdraw a pending/declined application
      }
    }

    let normalizedPhone: string | null | undefined = undefined;
    if (phone === "") normalizedPhone = null;
    else if (phone) {
      normalizedPhone = normalizePhone(phone);
      if (!normalizedPhone) {
        return NextResponse.json({ error: "Phone number looks invalid; include your country code" }, { status: 400 });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(name !== undefined && { name }),
        ...(avatarUrl !== undefined && { avatarUrl }),
        ...(targetRole !== undefined && { role: targetRole }),
        ...(applicationStatus !== undefined && { approvalStatus: applicationStatus, rejectionReason: null }),
        ...(normalizedPhone !== undefined && { phone: normalizedPhone }),
        ...(bio !== undefined && { bio }),
        ...(timezone !== undefined && { timezone }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        approvalStatus: true,
        avatarUrl: true,
        phone: true,
        bio: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("PUT profile error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
