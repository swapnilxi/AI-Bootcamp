import { notFound } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { ArrowLeft } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isInstructorRole } from "@/lib/roles";
import { Sparkles } from "lucide-react";
import { PageHeader, DifficultyPill, MetaPill } from "@/components/learning/primitives";
import { ModuleStepper, ModulePager } from "./ModuleStepper";
import { PROJECT_MODULES, moduleHref } from "./modules";
import { AddModuleButton } from "@/components/projects/AddModuleButton";
import { CustomModulesGrid } from "@/components/projects/CustomModulesGrid";

export const revalidate = 3600;

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

  const session = await getServerSession(authOptions);
  const isInstructor = isInstructorRole(session?.user?.role);

  const customModules = await prisma.projectModule.findMany({
    where: { projectId: project.id },
    orderBy: { order: "asc" },
    select: { id: true, slug: true, title: true, description: true },
  });

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

      <ModuleStepper projectSlug={slug} activeSlug="" customModules={customModules} />

      <section className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-serif text-2xl text-text">Project modules</h2>
          {isInstructor && (
            <div className="flex items-center gap-2">
              <Link
                href={`/dashboard/lessons/generate?mode=project&project=${slug}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-cream/25 bg-cream/[0.08] px-4 py-2 text-xs font-semibold text-cream transition-colors hover:bg-cream/15"
              >
                <Sparkles className="h-3.5 w-3.5" /> Generate lesson
              </Link>
              <AddModuleButton projectSlug={slug} />
            </div>
          )}
        </div>
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
          <CustomModulesGrid
            projectSlug={slug}
            initialModules={customModules}
            isInstructor={isInstructor}
            startIndex={PROJECT_MODULES.length + 1}
          />
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

      <section className="rounded-3xl border border-cream/20 bg-cream/5 p-7 text-center sm:p-9">
        <h2 className="font-serif text-xl text-text">Stuck on this project?</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-text-muted">
          The AI Tutor knows this brief. It will review your architecture, explain an error or give you a
          progressive hint — without handing you the implementation.
        </p>
      </section>

      <ModulePager projectSlug={slug} activeSlug="" customModules={customModules} />
    </div>
  );
}
