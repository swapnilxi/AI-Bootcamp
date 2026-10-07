import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader, DifficultyPill, MetaPill, CatalogueCard } from "@/components/learning/primitives";
import { Button } from "@/components/ui/Button";

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const path = await prisma.learningPath.findUnique({ where: { slug }, select: { title: true, description: true } });
  if (!path) return { title: "Path not found | AI Bootcamp" };
  return { title: `${path.title} Path | AI Bootcamp`, description: path.description };
}

/** One path, laid out as the sequence a learner actually walks: courses in order, then the projects that prove it. */
export default async function PathDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const path = await prisma.learningPath.findUnique({
    where: { slug },
    include: {
      milestones: { orderBy: { order: "asc" } },
      courses: {
        where: { isPublished: true },
        orderBy: { order: "asc" },
        include: { _count: { select: { lessons: true, modules: true } } },
      },
      projects: { where: { status: "PUBLISHED" }, orderBy: { order: "asc" } },
      bootcamps: { where: { status: "PUBLISHED" }, select: { slug: true, title: true, durationWeeks: true } },
    },
  });

  if (!path) notFound();

  const totalHours = path.courses.reduce((sum, c) => sum + c.estimatedHours, 0);
  const capstone = path.projects.find((p) => p.isCapstone);

  return (
    <div className="mx-auto max-w-7xl space-y-14 px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <PageHeader
        eyebrow={`${path.estimatedWeeks}-week path`}
        title={path.title}
        lede={path.description}
        actions={
          <>
            <Button href={path.courses[0] ? `/courses/${path.courses[0].id}` : "/courses"} variant="primary" size="md">
              Start the path
            </Button>
            {path.bootcamps[0] && (
              <Button href={`/bootcamp`} variant="secondary" size="md">
                Cohort version
              </Button>
            )}
          </>
        }
      />

      <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="editorial-card glow-tl rounded-2xl p-5">
          <p className="font-serif text-3xl text-text tabular-nums">{path.courses.length}</p>
          <p className="mt-2 text-xs uppercase tracking-wider text-text-muted">Courses</p>
        </div>
        <div className="editorial-card glow-tl rounded-2xl p-5">
          <p className="font-serif text-3xl text-text tabular-nums">{totalHours}h</p>
          <p className="mt-2 text-xs uppercase tracking-wider text-text-muted">Taught content</p>
        </div>
        <div className="editorial-card glow-tl rounded-2xl p-5">
          <p className="font-serif text-3xl text-text tabular-nums">{path.projects.length}</p>
          <p className="mt-2 text-xs uppercase tracking-wider text-text-muted">Projects</p>
        </div>
        <div className="editorial-card glow-tl rounded-2xl p-5">
          <p className="font-serif text-3xl text-text tabular-nums">{path.estimatedWeeks}</p>
          <p className="mt-2 text-xs uppercase tracking-wider text-text-muted">Weeks, full-time pace</p>
        </div>
      </section>

      <section className="card-premium glow-l rounded-3xl p-7 sm:p-9">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-gold">The outcome</p>
        <p className="mt-3 font-serif text-xl leading-relaxed text-text sm:text-2xl">{path.outcome}</p>
      </section>

      <section className="space-y-6">
        <h2 className="font-serif text-2xl text-text">Milestones</h2>
        <ol className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {path.milestones.map((m, i) => (
            <li key={m.id} className="editorial-card glow-tl rounded-2xl p-5">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-gold/40 bg-gold/10 text-xs font-semibold text-gold">
                {i + 1}
              </span>
              <h3 className="mt-3 text-sm font-semibold text-text">{m.title}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-text-muted">{m.summary}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="space-y-6">
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-serif text-2xl text-text">Courses, in order</h2>
          <Link href="/courses" className="text-xs uppercase tracking-wider text-gold hover:underline">
            All courses
          </Link>
        </div>
        <div className="space-y-4">
          {path.courses.map((course, i) => (
            <Link
              key={course.id}
              href={`/courses/${course.id}`}
              className="editorial-card glow-l group flex flex-col gap-4 rounded-2xl p-6 sm:flex-row sm:items-center"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gold/30 bg-gold/[0.07] font-serif text-lg text-gold">
                {i + 1}
              </span>
              <div className="flex-1 space-y-2">
                <h3 className="font-serif text-lg text-text group-hover:text-gold transition-colors">
                  {course.title}
                </h3>
                <p className="text-sm leading-relaxed text-text-muted">{course.description}</p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <DifficultyPill level={course.difficulty} />
                  <MetaPill>{course.estimatedHours}h</MetaPill>
                  <MetaPill>{course._count.lessons} lessons</MetaPill>
                  {(course.technologies as string[]).slice(0, 3).map((t) => (
                    <MetaPill key={t}>{t}</MetaPill>
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {path.projects.length > 0 && (
        <section className="space-y-6">
          <h2 className="font-serif text-2xl text-text">What you build</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {path.projects.map((project) => (
              <CatalogueCard
                key={project.id}
                href={`/projects/${project.slug}`}
                title={project.isCapstone ? `${project.title} · Capstone` : project.title}
                summary={project.summary}
                pills={
                  <>
                    <DifficultyPill level={project.difficulty} />
                    <MetaPill>{project.estimatedHours}h</MetaPill>
                  </>
                }
              />
            ))}
          </div>
        </section>
      )}

      {capstone && (
        <section className="card-premium card-featured glow-br rounded-3xl p-7 sm:p-10">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-gold">Capstone</p>
          <h2 className="mt-3 font-serif text-2xl text-text sm:text-3xl">{capstone.title}</h2>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-text-muted">{capstone.problemStatement}</p>
          <div className="mt-6">
            <Button href={`/projects/${capstone.slug}`} variant="primary" size="md">
              See the brief
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}
