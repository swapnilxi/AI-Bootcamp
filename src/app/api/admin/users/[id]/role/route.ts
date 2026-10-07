import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isSuperAdmin } from "@/lib/rbac";
import { Role } from "@prisma/client";
import { z } from "zod";

const roleUpdateSchema = z.object({
  role: z.nativeEnum(Role),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // STRICT RBAC: Only Super Admin can assign or revoke roles
    if (!isSuperAdmin(session.user.role)) {
      return NextResponse.json(
        { error: "Forbidden: Only Super Administrators can alter user roles" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const result = roleUpdateSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: "Invalid role specified" }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Safety guard: prevent demoting the active super admin if they are updating themselves
    if (session.user.id === id && result.data.role !== Role.SUPER_ADMIN) {
      const superAdminCount = await prisma.user.count({
        where: { role: Role.SUPER_ADMIN },
      });
      if (superAdminCount <= 1) {
        return NextResponse.json(
          { error: "Cannot demote the sole Super Administrator" },
          { status: 400 }
        );
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { role: result.data.role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      message: `User role successfully updated to ${updatedUser.role}`,
      user: updatedUser,
    });
  } catch (error) {
    console.error("PATCH role error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
