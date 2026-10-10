import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdminRole, isInstructorRole } from "@/lib/roles";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const updateSchema = z.object({
  title: z.string().trim().min(3).max(120).optional(),
  tagline: z.string().trim().min(3).max(160).optional(),
  description: z.string().trim().min(10).optional(),
  outcome: z.string().trim().min(10).optional(),
  aiContext: z.string().max(2000).optional(),
});

/** One learning path's detail, including its AI context (instructor/admin only). */
export async function GET(_req: Request, { params }: RouteParams) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!isInstructorRole(session?.user?.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const path = await prisma.learningPath.findUnique({ where: { id } });
  if (!path) return NextResponse.json({ error: "Class not found" }, { status: 404 });

  return NextResponse.json({ path });
}

/** Admin-only: edits a learning path's details and AI guidance. */
export async function PATCH(req: Request, { params }: RouteParams) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!isAdminRole(session?.user?.role)) {
    return NextResponse.json({ error: "Only administrators can edit a class" }, { status: 403 });
  }

  const result = updateSchema.safeParse(await req.json().catch(() => ({})));
  if (!result.success) {
    return NextResponse.json({ error: result.error.errors[0]?.message || "Invalid request" }, { status: 400 });
  }

  const path = await prisma.learningPath.update({ where: { id }, data: result.data });
  return NextResponse.json({ message: "Class updated", path });
}
