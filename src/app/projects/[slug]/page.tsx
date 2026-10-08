import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader, DifficultyPill, MetaPill } from "@/components/learning/primitives";
import { ModuleStepper, ModulePager } from "./ModuleStepper";
import { STAGES, PROJECT_MODULES, moduleHref, type Task } from "./modules";

export const revalidate = 3600;

const STAGE_LABEL: Record<string, string> = {
  REQUIREMENTS: "Requirements",
  ARCHITECTURE: "Architecture",
  IMPLEMENTATION: "Implementation",
  TESTING: "Testing",
  DEPLOYMENT: "Deployment",
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = await prisma.project.findUnique({ where: { slug }, select: { title: true, summary: true } });
  if (!project) return { title: "Project not found | AI Bootcamp" };
  return { title: `${project.title} | AI Bootcamp`, description: project.summary };
}

/** The full project brief, staged the way the work actually proceeds. */
export default async function ProjectDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = await prisma.project.findUnique({
    where: { slug },
    include: { path: { select: { slug: true, title: true } } },
  });

  if (!project) notFound();

  const tasks = project.tasks as unknown as Task[];
  const requirements = project.requirements as string[];
  const techStack = project.techStack as string[];

  return (
    <div className="mx-auto max-w-5xl space-y-12 px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      {/* Top back navigation */}
      <div className="flex items-center justify-between -mb-6">
        <Link
          href="/projects"
          className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-text-muted hover:text-gold transition-colors group"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          <span>All Projects</span>
        </Link>
        {project.path && (
          <Link
            href={`/paths/${project.path.slug}`}
            className="hidden sm:inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-gold transition-colors"
          >
            <span>Part of</span>
            <span className="font-medium text-text">{project.path.title}</span>
            <span>path →</span>
          </Link>
        )}
      </div>

      <PageHeader
        eyebrow={project.isCapstone ? "Capstone project" : "Project"}
        title={project.title}
        lede={project.summary}
      />

      <div className="flex flex-wrap gap-2">
        <DifficultyPill level={project.difficulty} />
        <MetaPill>{project.estimatedHours} hours</MetaPill>
        {project.path && (
          <Link href={`/paths/${project.path.slug}`}>
            <MetaPill className="hover:border-gold/40 hover:text-gold transition-colors">
              {project.path.title} path
            </MetaPill>
          </Link>
        )}
      </div>

      <ModuleStepper projectSlug={slug} activeSlug="" />

      <section className="space-y-5">
        <h2 className="font-serif text-2xl text-text">Project modules</h2>
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PROJECT_MODULES.map((module, idx) => (
            <li key={module.slug || "overview"}>
              <Link
                href={moduleHref(slug, module.slug)}
                className={`editorial-card glow-tl block h-full space-y-2 rounded-2xl p-5 transition-colors ${
                  idx === 0 ? "border-gold/30" : ""
                }`}
              >
                <span className="text-[11px] font-semibold uppercase tracking-widest text-gold">
                  Module {idx + 1}
                </span>
                <p className="text-sm font-semibold text-text">{module.title}</p>
                <p className="text-xs leading-relaxed text-text-muted">{module.description}</p>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      <section className="card-premium glow-tl space-y-4 rounded-3xl p-7 sm:p-9">
        <h2 className="font-serif text-2xl text-text">The problem</h2>
        <p className="text-base leading-relaxed text-text-muted">{project.problemStatement}</p>
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">Why it matters</p>
          <p className="mt-2 text-sm leading-relaxed text-text-muted">{project.businessContext}</p>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="editorial-card glow-tl space-y-4 rounded-2xl p-6">
          <h2 className="font-serif text-xl text-text">Requirements</h2>
          <ul className="space-y-2.5">
            {requirements.map((r) => (
              <li key={r} className="flex gap-2.5 text-sm text-text-muted">
                <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                {r}
              </li>
            ))}
          </ul>
        </div>
        <div className="editorial-card glow-tr space-y-4 rounded-2xl p-6">
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
        </div>
      </section>

      <section className="card-premium glow-l space-y-4 rounded-3xl p-7 sm:p-9">
        <h2 className="font-serif text-2xl text-text">Architecture</h2>
        <p className="whitespace-pre-line text-sm leading-relaxed text-text-muted">{project.architecture}</p>
      </section>

      <section className="space-y-6">
        <h2 className="font-serif text-2xl text-text">How to work it</h2>
        <div className="space-y-8">
          {STAGES.map((stage) => {
            const stageTasks = tasks.filter((t) => t.stage === stage);
            if (stageTasks.length === 0) return null;
            const stageModule = PROJECT_MODULES.find((m) => m.stage === stage);
            return (
              <div key={stage} className="space-y-3">
                <h3 className="flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-2.5 text-xs font-semibold uppercase tracking-widest text-text-muted">
                    <span className="h-px w-6 bg-cream/40" aria-hidden="true" />
                    {STAGE_LABEL[stage]}
                  </span>
                  {stageModule && (
                    <Link
                      href={moduleHref(slug, stageModule.slug)}
                      className="text-[11px] font-semibold uppercase tracking-wider text-gold hover:underline"
                    >
                      Open module →
                    </Link>
                  )}
                </h3>
                <ul className="space-y-3">
                  {stageTasks.map((task) => (
                    <li key={task.title} className="editorial-card glow-tl rounded-2xl p-5">
                      <p className="text-sm font-semibold text-text">{task.title}</p>
                      <p className="mt-1.5 text-sm leading-relaxed text-text-muted">{task.detail}</p>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-3xl border border-cream/20 bg-cream/5 p-7 text-center sm:p-9">
        <h2 className="font-serif text-xl text-text">Stuck on this project?</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-text-muted">
          The AI Tutor knows this brief. It will review your architecture, explain an error or give you a
          progressive hint — without handing you the implementation.
        </p>
      </section>

      <ModulePager projectSlug={slug} activeSlug="" />
    </div>
  );
}
