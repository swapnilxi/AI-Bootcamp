import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/roles";

export const dynamic = "force-dynamic";

/**
 * Users eligible to teach or offer healing (Instructor, Mentor, Admin, SuperAdmin).
 * Publicly viewable for faculty directory.
 */
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const isCallerAdmin = session?.user?.role ? isAdminRole(session.user.role) : false;
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type"); // INSTRUCTOR | MENTOR | ALL
    const status = searchParams.get("status"); // PENDING | APPROVED | ALL

    const where: any = {
      role: { in: ["INSTRUCTOR", "ADMIN", "SUPER_ADMIN"] },
    };

    // Non-admins can only see approved faculty
    if (!isCallerAdmin) {
      where.approvalStatus = "APPROVED";
    } else if (status && status !== "ALL") {
      where.approvalStatus = status;
    }

    if (type && type !== "ALL") {
      if (type === "MENTOR") {
        where.mentorType = { in: ["MENTOR", "BOTH"] };
      } else if (type === "INSTRUCTOR") {
        where.mentorType = { in: ["INSTRUCTOR", "BOTH"] };
      }
    }

    const instructors = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        role: true,
        avatarUrl: true,
        bio: true,
        mentorType: true,
        specialties: true,
        sessionPrice: true,
        sessionDuration: true,
        aiChatEnabled: true,
        aiChatStyle: true,
        aiGreeting: true,
        aiSampleQuestions: true,
        approvalStatus: true,
        rejectionReason: true,
        approvalNudgesCount: true,
        lastNudgedAt: true,
        createdAt: true,
        ...(isCallerAdmin ? { email: true } : {}),
        _count: {
          select: {
            createdCourses: true,
            assignedBookings: true,
          },
        },
        createdCourses: {
          where: isCallerAdmin ? {} : { approvalStatus: "APPROVED", isPublished: true },
          take: 3,
          select: {
            id: true,
            title: true,
            slug: true,
            price: true,
            durationMinutes: true,
          },
        },
      },
      orderBy: [
        { role: "desc" },
        { createdCourses: { _count: "desc" } },
        { name: "asc" },
      ],
    });

    return NextResponse.json({
      instructors: instructors.map((inst) => ({
        ...inst,
        sessionPrice: inst.sessionPrice ? Number(inst.sessionPrice) : 120,
        mentorType: inst.mentorType || (inst.role === "INSTRUCTOR" ? "INSTRUCTOR" : "BOTH"),
      })),
    });
  } catch (error) {
    console.error("GET /api/instructors error:", error);
    return NextResponse.json({ error: "Failed to fetch instructors" }, { status: 500 });
  }
}
