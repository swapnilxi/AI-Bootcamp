import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isInstructorRole } from "@/lib/roles";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

const createSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(140),
  description: z.string().trim().min(10, "Description must be at least 10 characters").max(500),
});

/** Lists a project's instructor-added modules, beyond its fixed 5 build stages. */
export async function GET(_req: Request, { params }: RouteParams) {
  const { slug } = await params;
  const project = await prisma.project.findUnique({ where: { slug }, select: { id: true } });
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const modules = await prisma.projectModule.findMany({
    where: { projectId: project.id },
    orderBy: { order: "asc" },
    select: { id: true, slug: true, title: true, description: true, order: true },
  });
  return NextResponse.json({ modules });
}

/** Instructor/admin: adds a new module to a project beyond its fixed build stages. */
export async function POST(req: Request, { params }: RouteParams) {
  const { slug } = await params;
  const session = await getServerSession(authOptions);
  if (!isInstructorRole(session?.user?.role)) {
    return NextResponse.json({ error: "Only an instructor or administrator can add a module" }, { status: 403 });
  }

  const project = await prisma.project.findUnique({ where: { slug }, select: { id: true } });
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const result = createSchema.safeParse(await req.json().catch(() => ({})));
  if (!result.success) {
    return NextResponse.json({ error: result.error.errors[0]?.message || "Invalid request" }, { status: 400 });
  }
  const { title, description } = result.data;

  const baseSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
  let moduleSlug = baseSlug || "module";
  let attempt = 0;
  while (await prisma.projectModule.findUnique({ where: { projectId_slug: { projectId: project.id, slug: moduleSlug } } })) {
    attempt += 1;
    moduleSlug = `${baseSlug}-${attempt + 1}`;
  }

  const last = await prisma.projectModule.findFirst({
    where: { projectId: project.id },
    orderBy: { order: "desc" },
    select: { order: true },
  });

  const module_ = await prisma.projectModule.create({
    data: {
      projectId: project.id,
      slug: moduleSlug,
      title,
      description,
      order: (last?.order ?? -1) + 1,
      authorId: session!.user.id,
    },
  });

  return NextResponse.json({ message: "Module added", module: module_ }, { status: 201 });
}
