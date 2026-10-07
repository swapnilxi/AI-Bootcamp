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

    const where: any = {};
    if (status && status !== "ALL") {
      where.approvalStatus = status;
    }

    const classes = await prisma.course.findMany({
      where,
      include: {
        instructor: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            mentorType: true,
            role: true,
          },
        },
        lessons: {
          orderBy: { order: "asc" },
          select: {
            id: true,
            title: true,
            summary: true,
            order: true,
            durationMinutes: true,
            isPreview: true,
            approvalStatus: true,
            rejectionReason: true,
          },
        },
        _count: {
          select: {
            enrollments: true,
            lessons: true,
          },
        },
      },
      orderBy: [
        { approvalStatus: "asc" }, // PENDING first
        { createdAt: "desc" },
      ],
    });

    const pendingClassesCount = await prisma.course.count({
      where: { approvalStatus: "PENDING" },
    });

    const pendingModulesCount = await prisma.lesson.count({
      where: { approvalStatus: "PENDING" },
    });

    return NextResponse.json({
      classes: classes.map((c) => ({
        ...c,
        price: Number(c.price),
      })),
      pendingClassesCount,
      pendingModulesCount,
    });
  } catch (error) {
    console.error("GET /api/admin/classes error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
