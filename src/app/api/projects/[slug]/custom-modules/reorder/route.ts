import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isInstructorRole } from "@/lib/roles";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

const reorderSchema = z.object({
  moduleIds: z.array(z.string().min(1)).min(1),
});

/** Instructor/admin: reorders a project's custom modules (the fixed 5 build stages always stay first). */
export async function POST(req: Request, { params }: RouteParams) {
  const { slug } = await params;
  const session = await getServerSession(authOptions);
  if (!isInstructorRole(session?.user?.role)) {
    return NextResponse.json({ error: "Only an instructor or administrator can reorder modules" }, { status: 403 });
  }

  const project = await prisma.project.findUnique({ where: { slug }, select: { id: true } });
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const result = reorderSchema.safeParse(await req.json().catch(() => ({})));
  if (!result.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const modules = await prisma.projectModule.findMany({ where: { projectId: project.id }, select: { id: true } });
  const validIds = new Set(modules.map((m) => m.id));
  if (result.data.moduleIds.some((id) => !validIds.has(id)) || result.data.moduleIds.length !== modules.length) {
    return NextResponse.json({ error: "Module list doesn't match this project's modules" }, { status: 400 });
  }

  await prisma.$transaction(
    result.data.moduleIds.map((id, index) => prisma.projectModule.update({ where: { id }, data: { order: index } }))
  );

  return NextResponse.json({ message: "Reordered" });
}
