import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { Prisma } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isInstructorRole } from "@/lib/roles";
import { loadOrCreateModuleLesson } from "@/lib/projects/moduleLesson";

interface RouteParams {
  params: Promise<{ slug: string; stage: string }>;
}

/** Finds (or creates) the generated-lesson row for one project stage. */
export async function GET(_req: Request, { params }: RouteParams) {
  const { slug, stage } = await params;
  const loaded = await loadOrCreateModuleLesson(slug, stage);
  if ("error" in loaded) return loaded.error;
  const { moduleLesson } = loaded;
  const author = moduleLesson.authorId
    ? await prisma.user.findUnique({ where: { id: moduleLesson.authorId }, select: { name: true } })
    : null;
  return NextResponse.json({
    generatedHtml: moduleLesson.generatedHtml,
    variants: moduleLesson.variants,
    htmlUpdatedAt: moduleLesson.htmlUpdatedAt,
    authorName: author?.name ?? null,
    showAuthor: moduleLesson.showAuthor,
  });
}

/** Instructor-only: clears a stage's generated preview so it can be regenerated from scratch. */
export async function DELETE(_req: Request, { params }: RouteParams) {
  const { slug, stage } = await params;
  const session = await getServerSession(authOptions);
  if (!isInstructorRole(session?.user?.role)) {
    return NextResponse.json({ error: "Only an instructor or administrator can clear this preview" }, { status: 403 });
  }

  const loaded = await loadOrCreateModuleLesson(slug, stage);
  if ("error" in loaded) return loaded.error;
  const { moduleLesson } = loaded;

  await prisma.projectModuleLesson.update({
    where: { id: moduleLesson.id },
    data: { generatedHtml: null, variants: Prisma.DbNull, htmlUpdatedAt: null },
  });
  return NextResponse.json({ message: "Preview cleared" });
}
