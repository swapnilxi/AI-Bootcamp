import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canManageUsers } from "@/lib/rbac";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!canManageUsers(session.user.role)) {
      return NextResponse.json(
        { error: "Forbidden: Admin privileges required" },
        { status: 403 }
      );
    }

    const q = new URL(req.url).searchParams.get("q")?.trim();
    const users = await prisma.user.findMany({
      where: q
        ? { OR: [{ name: { contains: q } }, { email: { contains: q.toLowerCase() } }, { phone: { contains: q } }] }
        : undefined,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
        phone: true,
        createdAt: true,
        _count: {
          select: {
            enrollments: true,
            createdCourses: true,
            bookings: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error("GET admin users error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
