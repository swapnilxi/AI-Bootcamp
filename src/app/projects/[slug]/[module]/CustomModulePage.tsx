import { notFound } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { ArrowLeft } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isInstructorRole } from "@/lib/roles";
import { PageHeader } from "@/components/learning/primitives";
import { ModuleStepper, ModulePager } from "../ModuleStepper";
import { LessonViewer } from "@/components/lessons/LessonViewer";
import { DeleteModuleButton } from "@/components/projects/DeleteModuleButton";
import { EditModuleButton } from "@/components/projects/EditModuleButton";
import type { LessonVariants } from "@/lib/lessons/shared";

/** Renders an instructor-added module (beyond the project's fixed 5 build stages). */
export async function CustomModulePage({ slug, moduleSlug }: { slug: string; moduleSlug: string }) {
  const project = await prisma.project.findUnique({ where: { slug } });
  if (!project) notFound();

  const customModule = await prisma.projectModule.findUnique({
    where: { projectId_slug: { projectId: project.id, slug: moduleSlug } },
  });
  if (!customModule) notFound();

  const session = await getServerSession(authOptions);
  const isInstructor = isInstructorRole(session?.user?.role);

  const author = customModule.authorId
    ? await prisma.user.findUnique({ where: { id: customModule.authorId }, select: { name: true } })
    : null;

  const customModules = await prisma.projectModule.findMany({
    where: { projectId: project.id },
    orderBy: { order: "asc" },
    select: { slug: true, title: true },
  });

  return (
    <div className="mx-auto max-w-5xl space-y-12 px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <div className="flex items-center justify-between -mb-6">
        <Link
          href={`/projects/${slug}`}
          className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-text-muted hover:text-gold transition-colors group"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          <span>Back to Project Overview</span>
        </Link>
        {isInstructor && (
          <div className="flex items-center gap-4">
            <EditModuleButton
              projectSlug={slug}
              moduleSlug={moduleSlug}
              initialTitle={customModule.title}
              initialDescription={customModule.description}
            />
            <DeleteModuleButton projectSlug={slug} moduleSlug={moduleSlug} />
          </div>
        )}
      </div>

      <PageHeader eyebrow={`Module · ${project.title}`} title={customModule.title} lede={customModule.description} />

      <ModuleStepper projectSlug={slug} activeSlug={moduleSlug} customModules={customModules} />

      <LessonViewer
        breadcrumb={[project.title, customModule.title]}
        title={customModule.title}
        authorName={author?.name ?? null}
        showAuthor={customModule.showAuthor}
        initialGeneratedHtml={customModule.generatedHtml}
        initialVariants={customModule.variants as unknown as LessonVariants | null}
        endpoints={{
          generate: `/api/projects/${slug}/custom-modules/${moduleSlug}/generate`,
          easyRead: `/api/projects/${slug}/custom-modules/${moduleSlug}/easy-read`,
          deeper: `/api/projects/${slug}/custom-modules/${moduleSlug}/deeper`,
          breakdown: `/api/projects/${slug}/custom-modules/${moduleSlug}/breakdown`,
          visualize: `/api/projects/${slug}/custom-modules/${moduleSlug}/visualize`,
          revise: `/api/projects/${slug}/custom-modules/${moduleSlug}/revise`,
        }}
        canManage={isInstructor}
        downloadFilename={`${customModule.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.html`}
      />

      <ModulePager projectSlug={slug} activeSlug={moduleSlug} customModules={customModules} />
    </div>
  );
}
