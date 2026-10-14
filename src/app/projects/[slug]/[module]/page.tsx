import { notFound } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { ArrowLeft } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isInstructorRole } from "@/lib/roles";
import { PageHeader, MetaPill } from "@/components/learning/primitives";
import { ModuleStepper, ModulePager } from "../ModuleStepper";
import { getModule, STAGES, type Task } from "../modules";
import { BuildPreview } from "@/components/projects/BuildPreview";
import { StageEditor } from "@/components/projects/StageEditor";
import { LessonViewer } from "@/components/lessons/LessonViewer";
import { loadOrCreateModuleLesson } from "@/lib/projects/moduleLesson";
import { CustomModulePage } from "./CustomModulePage";
import { parseInteractivity, type LessonVariants } from "@/lib/lessons/shared";

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Promise<{ slug: string; module: string }> }) {
  const { slug, module: moduleSlug } = await params;
  const projectModule = getModule(moduleSlug);
  const project = await prisma.project.findUnique({ where: { slug }, select: { id: true, title: true } });
  if (!project) return { title: "Project not found | AI Bootcamp" };
  if (projectModule) {
    return { title: `${projectModule.title} — ${project.title} | AI Bootcamp`, description: projectModule.description };
  }
  const customModule = await prisma.projectModule.findUnique({
    where: { projectId_slug: { projectId: project.id, slug: moduleSlug } },
    select: { title: true, description: true },
  });
  if (!customModule) return { title: "Module not found | AI Bootcamp" };
  return { title: `${customModule.title} — ${project.title} | AI Bootcamp`, description: customModule.description };
}

/** One stage of a project's brief, broken out of the overview into its own module. */
export default async function ProjectModulePage({
  params,
}: {
  params: Promise<{ slug: string; module: string }>;
}) {
  const { slug, module: moduleSlug } = await params;
  const projectModule = getModule(moduleSlug);
  if (!projectModule || !projectModule.stage) {
    return <CustomModulePage slug={slug} moduleSlug={moduleSlug} />;
  }

  const project = await prisma.project.findUnique({ where: { slug } });
  if (!project) notFound();

  const session = await getServerSession(authOptions);
  const isInstructor = isInstructorRole(session?.user?.role);

  const allTasks = project.tasks as unknown as Task[];
  const requirements = project.requirements as string[];
  const techStack = project.techStack as string[];

  const moduleLessonLoad = await loadOrCreateModuleLesson(slug, projectModule.stage);
  const moduleLesson = "error" in moduleLessonLoad ? null : moduleLessonLoad.moduleLesson;
  const moduleLessonAuthor = moduleLesson?.authorId
    ? await prisma.user.findUnique({ where: { id: moduleLesson.authorId }, select: { name: true } })
    : null;
  const stageIndex = STAGES.indexOf(projectModule.stage);
  const customModules = await prisma.projectModule.findMany({
    where: { projectId: project.id },
    orderBy: { order: "asc" },
    select: { slug: true, title: true },
  });

  return (
    <div className="mx-auto max-w-5xl space-y-12 px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      {/* Top back navigation */}
      <div className="flex items-center justify-between -mb-6">
        <Link
          href={`/projects/${slug}`}
          className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-text-muted hover:text-gold transition-colors group"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          <span>Back to Project Overview</span>
        </Link>
        <Link
          href="/projects"
          className="hidden sm:inline-flex items-center text-xs text-text-muted hover:text-gold transition-colors"
        >
          All Projects →
        </Link>
      </div>

      <PageHeader
        eyebrow={`Module · ${project.title}`}
        title={projectModule.title}
        lede={projectModule.description}
      />

      <ModuleStepper projectSlug={slug} activeSlug={moduleSlug} customModules={customModules} />

      {moduleLesson && (
        <LessonViewer
          breadcrumb={[project.title, projectModule.title]}
          title={projectModule.title}
          positionLabel={`Stage ${stageIndex + 1} of ${STAGES.length}`}
          authorName={moduleLessonAuthor?.name ?? null}
          showAuthor={moduleLesson.showAuthor}
          initialGeneratedHtml={moduleLesson.generatedHtml}
          initialVariants={moduleLesson.variants as unknown as LessonVariants | null}
        initialInteractivity={parseInteractivity(moduleLesson.interactivity)}
          endpoints={{
            generate: `/api/projects/${slug}/modules/${projectModule.stage}/lesson/generate`,
            easyRead: `/api/projects/${slug}/modules/${projectModule.stage}/lesson/easy-read`,
            deeper: `/api/projects/${slug}/modules/${projectModule.stage}/lesson/deeper`,
            breakdown: `/api/projects/${slug}/modules/${projectModule.stage}/lesson/breakdown`,
            visualize: `/api/projects/${slug}/modules/${projectModule.stage}/lesson/visualize`,
            revise: `/api/projects/${slug}/modules/${projectModule.stage}/lesson/revise`,
          }}
          canManage={isInstructor}
          clearEndpoint={`/api/projects/${slug}/modules/${projectModule.stage}/lesson`}
          downloadFilename={`${projectModule.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.html`}
        />
      )}

      <StageEditor
        slug={slug}
        stage={projectModule.stage}
        isInstructor={isInstructor}
        requirements={requirements}
        architecture={project.architecture}
        techStack={techStack}
        starterRepoUrl={project.starterRepoUrl}
        datasetUrl={project.datasetUrl}
        tasks={allTasks}
      >
        {projectModule.stage === "REQUIREMENTS" && (
          <section className="editorial-card glow-tl space-y-4 rounded-2xl p-6 sm:p-8">
            <h2 className="font-serif text-xl text-text">What has to be true</h2>
            <ul className="space-y-2.5">
              {requirements.map((r) => (
                <li key={r} className="flex gap-2.5 text-sm text-text-muted">
                  <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                  {r}
                </li>
              ))}
            </ul>
          </section>
        )}

        {projectModule.stage === "ARCHITECTURE" && (
          <section className="card-premium glow-l space-y-4 rounded-3xl p-7 sm:p-9">
            <h2 className="font-serif text-2xl text-text">The shape of the system</h2>
            <p className="whitespace-pre-line text-sm leading-relaxed text-text-muted">{project.architecture}</p>
          </section>
        )}

        {projectModule.stage === "IMPLEMENTATION" && (
          <section className="editorial-card glow-tr space-y-4 rounded-2xl p-6 sm:p-8">
            <h2 className="font-serif text-xl text-text">Tech stack</h2>
            <div className="flex flex-wrap gap-2">
              {techStack.map((t) => (
                <MetaPill key={t}>{t}</MetaPill>
              ))}
            </div>
            {project.starterRepoUrl && (
              <a
                href={project.starterRepoUrl}
                className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-text-muted hover:underline"
              >
                Starter repository
              </a>
            )}
          </section>
        )}

        {projectModule.stage === "DEPLOYMENT" && project.datasetUrl && (
          <section className="editorial-card glow-tr space-y-2 rounded-2xl p-6 sm:p-8">
            <h2 className="font-serif text-xl text-text">Dataset</h2>
            <a
              href={project.datasetUrl}
              className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-text-muted hover:underline"
            >
              Dataset reference
            </a>
          </section>
        )}
      </StageEditor>

      {projectModule.stage === "IMPLEMENTATION" && <BuildPreview projectSlug={slug} />}

      <ModulePager projectSlug={slug} activeSlug={moduleSlug} customModules={customModules} />
    </div>
  );
}
