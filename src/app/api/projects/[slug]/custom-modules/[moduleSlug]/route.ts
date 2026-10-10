import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isInstructorRole } from "@/lib/roles";
import { loadCustomModule } from "@/lib/projects/customModule";

const updateSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(140).optional(),
  description: z.string().trim().min(10, "Description must be at least 10 characters").max(500).optional(),
});

interface RouteParams {
  params: Promise<{ slug: string; moduleSlug: string }>;
}

/** Full content for one custom module. */
export async function GET(_req: Request, { params }: RouteParams) {
  const { slug, moduleSlug } = await params;
  const loaded = await loadCustomModule(slug, moduleSlug);
  if ("error" in loaded) return loaded.error;
  const { customModule } = loaded;

  const author = customModule.authorId
    ? await prisma.user.findUnique({ where: { id: customModule.authorId }, select: { name: true } })
    : null;

  return NextResponse.json({
    id: customModule.id,
    slug: customModule.slug,
    title: customModule.title,
    description: customModule.description,
    generatedHtml: customModule.generatedHtml,
    variants: customModule.variants,
    htmlUpdatedAt: customModule.htmlUpdatedAt,
    authorName: author?.name ?? null,
    showAuthor: customModule.showAuthor,
  });
}

/** Instructor/admin: renames a custom module or edits what it's about. */
export async function PATCH(req: Request, { params }: RouteParams) {
  const { slug, moduleSlug } = await params;
  const session = await getServerSession(authOptions);
  if (!isInstructorRole(session?.user?.role)) {
    return NextResponse.json({ error: "Only an instructor or administrator can edit a module" }, { status: 403 });
  }

  const loaded = await loadCustomModule(slug, moduleSlug);
  if ("error" in loaded) return loaded.error;

  const result = updateSchema.safeParse(await req.json().catch(() => ({})));
  if (!result.success) {
    return NextResponse.json({ error: result.error.errors[0]?.message || "Invalid request" }, { status: 400 });
  }

  const updated = await prisma.projectModule.update({
    where: { id: loaded.customModule.id },
    data: result.data,
  });
  return NextResponse.json({ message: "Module updated", module: updated });
}

/** Instructor/admin: permanently removes a custom module. */
export async function DELETE(_req: Request, { params }: RouteParams) {
  const { slug, moduleSlug } = await params;
  const session = await getServerSession(authOptions);
  if (!isInstructorRole(session?.user?.role)) {
    return NextResponse.json({ error: "Only an instructor or administrator can remove a module" }, { status: 403 });
  }

  const loaded = await loadCustomModule(slug, moduleSlug);
  if ("error" in loaded) return loaded.error;

  await prisma.projectModule.delete({ where: { id: loaded.customModule.id } });
  return NextResponse.json({ message: "Module removed" });
}
