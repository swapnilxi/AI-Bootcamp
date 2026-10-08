import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader, MetaPill } from "@/components/learning/primitives";
import { ModuleStepper, ModulePager } from "../ModuleStepper";
import { getModule, tasksForStage, type Task } from "../modules";

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Promise<{ slug: string; module: string }> }) {
  const { slug, module: moduleSlug } = await params;
  const projectModule = getModule(moduleSlug);
  if (!projectModule) return { title: "Module not found | AI Bootcamp" };
  const project = await prisma.project.findUnique({ where: { slug }, select: { title: true } });
  if (!project) return { title: "Project not found | AI Bootcamp" };
  return { title: `${projectModule.title} — ${project.title} | AI Bootcamp`, description: projectModule.description };
}

/** One stage of a project's brief, broken out of the overview into its own module. */
export default async function ProjectModulePage({
  params,
}: {
  params: Promise<{ slug: string; module: string }>;
}) {
  const { slug, module: moduleSlug } = await params;
  const projectModule = getModule(moduleSlug);
  if (!projectModule || !projectModule.stage) notFound();

  const project = await prisma.project.findUnique({ where: { slug } });
  if (!project) notFound();

  const tasks = tasksForStage(project.tasks as unknown as Task[], projectModule.stage);
  const requirements = project.requirements as string[];
  const techStack = project.techStack as string[];

  return (
    <div className="mx-auto max-w-5xl space-y-12 px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <PageHeader
        eyebrow={`Module · ${project.title}`}
        title={projectModule.title}
        lede={projectModule.description}
      />

      <ModuleStepper projectSlug={slug} activeSlug={moduleSlug} />

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

      <section className="space-y-5">
        <h2 className="font-serif text-2xl text-text">Tasks</h2>
        {tasks.length === 0 ? (
          <p className="text-sm text-text-muted">No tasks are staged for this module yet.</p>
        ) : (
          <ul className="space-y-3">
            {tasks.map((task) => (
              <li key={task.title} className="editorial-card glow-tl rounded-2xl p-5">
                <p className="text-sm font-semibold text-text">{task.title}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-text-muted">{task.detail}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <ModulePager projectSlug={slug} activeSlug={moduleSlug} />
    </div>
  );
}
