import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isInstructorRole } from "@/lib/roles";
import { STAGES } from "@/app/projects/[slug]/modules";

const taskSchema = z.object({
  title: z.string().trim().min(1).max(140),
  detail: z.string().trim().min(1).max(500),
  stage: z.enum(STAGES),
});

const patchSchema = z.object({
  requirements: z.array(z.string().trim().min(1).max(200)).max(20).optional(),
  architecture: z.string().trim().min(1).max(4000).optional(),
  techStack: z.array(z.string().trim().min(1).max(40)).max(20).optional(),
  starterRepoUrl: z.string().trim().max(300).optional(),
  datasetUrl: z.string().trim().max(300).optional(),
  tasks: z.array(taskSchema).max(100).optional(),
});

/** Instructor content editing for a project's stage fields: requirements, architecture, tech stack and the staged task list. */
export async function PATCH(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const session = await getServerSession(authOptions);
  if (!isInstructorRole(session?.user?.role)) {
    return NextResponse.json({ error: "Only instructors can edit project content" }, { status: 403 });
  }

  const { slug } = await params;
  const parsed = patchSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message || "Invalid request" }, { status: 400 });
  }
  const data = parsed.data;
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const project = await prisma.project.findUnique({ where: { slug }, select: { id: true } });
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  await prisma.project.update({
    where: { slug },
    data: {
      ...(data.requirements !== undefined && { requirements: data.requirements }),
      ...(data.architecture !== undefined && { architecture: data.architecture }),
      ...(data.techStack !== undefined && { techStack: data.techStack }),
      ...(data.starterRepoUrl !== undefined && { starterRepoUrl: data.starterRepoUrl || null }),
      ...(data.datasetUrl !== undefined && { datasetUrl: data.datasetUrl || null }),
      ...(data.tasks !== undefined && { tasks: data.tasks }),
    },
  });

  return NextResponse.json({ ok: true });
}
