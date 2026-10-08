import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader, DifficultyPill, MetaPill, EmptyState } from "@/components/learning/primitives";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

export const metadata = {
  title: "AI Career Paths | AI Bootcamp",
  description:
    "Structured AI learning paths — AI Engineer, Generative AI Specialist and AI Agent Engineer. Each is a sequenced journey, not a pile of courses.",
};

export const revalidate = 3600;

/** Learning paths: the spine of the product. A learner picks one and everything else sequences against it. */
export default async function PathsPage() {
  const paths = await prisma.learningPath.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { order: "asc" },
    include: {
      milestones: { orderBy: { order: "asc" } },
      _count: { select: { courses: true, projects: true } },
    },
  });

  return (
    <div className="mx-auto max-w-7xl space-y-14 px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <PageHeader
        eyebrow="AI Career Paths"
        title="Pick the journey, not the course"
        lede="Each path sequences courses, labs, practice and projects into one route with a stated outcome. You always know what comes next and why."
        actions={<Button href="/bootcamp" variant="secondary" size="md">See the 12-week bootcamp</Button>}
      />

      {paths.length === 0 ? (
        <EmptyState
          icon={<Icon name="path" size={28} />}
          title="No paths published yet"
          body="The curriculum has not been seeded. Run the database seed to load the AI Engineer, Generative AI and Agent Engineer paths."
        />
      ) : (
        <div className="grid gap-8 lg:grid-cols-3">
          {paths.map((path) => (
            <article key={path.id} className="card-premium glow-tl flex flex-col gap-5 p-7">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <DifficultyPill level={path.difficulty} />
                  <MetaPill>{path.estimatedWeeks} weeks</MetaPill>
                </div>
                <h2 className="font-serif text-2xl text-text leading-snug">{path.title}</h2>
                <p className="text-sm font-medium text-text-muted">{path.tagline}</p>
                <p className="text-sm leading-relaxed text-text-muted">{path.description}</p>
              </div>

              <div className="rounded-2xl border border-cream/15 bg-cream/5 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">You finish able to</p>
                <p className="mt-1.5 text-sm leading-relaxed text-text">{path.outcome}</p>
              </div>

              <ol className="space-y-2.5">
                {path.milestones.map((m, i) => (
                  <li key={m.id} className="flex gap-3 text-sm">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-cream/25 text-[10px] font-semibold text-cream">
                      {i + 1}
                    </span>
                    <span className="text-text-muted">
                      <span className="text-text">{m.title}</span> — {m.summary}
                    </span>
                  </li>
                ))}
              </ol>

              <div className="mt-auto flex items-center justify-between gap-3 border-t border-white/[0.06] pt-4">
                <span className="text-xs text-text-muted">
                  {path._count.courses} courses · {path._count.projects} projects
                </span>
                <Link
                  href={`/paths/${path.slug}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-cream/30 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-cream transition-colors hover:bg-cream/10"
                >
                  Explore
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
