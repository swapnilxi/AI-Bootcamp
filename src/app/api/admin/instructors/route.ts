import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/roles";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || !isAdminRole(session.user.role)) {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status"); // PENDING | APPROVED | REJECTED | ALL
    const type = searchParams.get("type"); // INSTRUCTOR | MENTOR | BOTH | ALL

    // Staff plus users who have applied to become instructors
    const where: any = {
      OR: [
        { role: { in: ["INSTRUCTOR", "ADMIN", "SUPER_ADMIN"] } },
        { role: { in: ["USER", "SUBSCRIBER"] }, approvalStatus: { in: ["PENDING", "REJECTED"] } },
      ],
    };

    if (status && status !== "ALL") {
      where.approvalStatus = status;
    }

    if (type && type !== "ALL") {
      where.mentorType = type;
    }

    const mentors = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
        bio: true,
        mentorType: true,
        specialties: true,
        sessionPrice: true,
        sessionDuration: true,
        approvalStatus: true,
        rejectionReason: true,
        approvalNudgesCount: true,
        lastNudgedAt: true,
        createdAt: true,
        _count: {
          select: {
            createdCourses: true,
            assignedBookings: true,
          },
        },
      },
      orderBy: [
        { approvalStatus: "asc" }, // PENDING first
        { lastNudgedAt: "desc" },
        { createdAt: "desc" },
      ],
    });

    const pendingCount = await prisma.user.count({
      where: {
        role: { in: ["INSTRUCTOR", "USER", "SUBSCRIBER"] },
        approvalStatus: "PENDING",
      },
    });

    return NextResponse.json({
      mentors: mentors.map((p) => ({
        ...p,
        sessionPrice: p.sessionPrice ? Number(p.sessionPrice) : 120,
      })),
      pendingCount,
    });
  } catch (error) {
    console.error("GET /api/admin/instructors error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
