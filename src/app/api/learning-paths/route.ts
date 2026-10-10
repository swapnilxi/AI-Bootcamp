import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdminRole, isInstructorRole } from "@/lib/roles";

const createPathSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(120),
  tagline: z.string().trim().min(3, "Tagline must be at least 3 characters").max(160),
  description: z.string().trim().min(10, "Description must be at least 10 characters"),
  outcome: z.string().trim().min(10, "Outcome must be at least 10 characters"),
});

/** Lists learning paths (career tracks) with how many courses and projects sit under each. */
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!isInstructorRole(session?.user?.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const paths = await prisma.learningPath.findMany({
    orderBy: { order: "asc" },
    include: { _count: { select: { courses: true, projects: true } } },
  });

  return NextResponse.json({
    paths: paths.map((p) => ({
      id: p.id,
      slug: p.slug,
      title: p.title,
      courseCount: p._count.courses,
      projectCount: p._count.projects,
    })),
  });
}

/** Admin-only: creates a new learning path (career track / "class"). */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!isAdminRole(session?.user?.role)) {
    return NextResponse.json({ error: "Only administrators can create a new class" }, { status: 403 });
  }

  const result = createPathSchema.safeParse(await req.json().catch(() => ({})));
  if (!result.success) {
    return NextResponse.json({ error: result.error.errors[0]?.message || "Invalid request" }, { status: 400 });
  }
  const { title, tagline, description, outcome } = result.data;

  const baseSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
  const slug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;

  const last = await prisma.learningPath.findFirst({ orderBy: { order: "desc" }, select: { order: true } });

  const path = await prisma.learningPath.create({
    data: {
      slug,
      title,
      tagline,
      description,
      outcome,
      order: (last?.order ?? -1) + 1,
    },
  });

  return NextResponse.json({ message: "Class created", path }, { status: 201 });
}
