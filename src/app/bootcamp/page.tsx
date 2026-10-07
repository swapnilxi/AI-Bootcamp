import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader, DifficultyPill, MetaPill, EmptyState } from "@/components/learning/primitives";
import { Button } from "@/components/ui/Button";

export const metadata = {
  title: "12-Week AI Engineer Bootcamp | AI Bootcamp",
  description:
    "A cohort-paced run through the AI Engineer path: twelve weeks, each with learning goals, labs, an assignment and a milestone, ending in a deployed production capstone.",
};

export const revalidate = 3600;

/** The cohort experience: the same curriculum, but paced and with a weekly milestone to hit. */
export default async function BootcampPage() {
  const bootcamp = await prisma.bootcamp.findFirst({
    where: { status: "PUBLISHED" },
    include: {
      path: { select: { slug: true, title: true, outcome: true } },
      weeks: {
        orderBy: { weekNumber: "asc" },
        include: {
          course: { select: { id: true, title: true } },
          project: { select: { slug: true, title: true } },
        },
      },
    },
  });

  if (!bootcamp) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        <EmptyState title="No bootcamp published" body="Seed the database to load the 12-week AI Engineer bootcamp." />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-12 px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <PageHeader
        eyebrow={`${bootcamp.durationWeeks}-week cohort`}
        title={bootcamp.title}
        lede={bootcamp.description}
        actions={
          bootcamp.path && (
            <Button href={`/paths/${bootcamp.path.slug}`} variant="secondary" size="md">
              Self-paced version
            </Button>
          )
        }
      />

      <div className="flex flex-wrap gap-2">
        <DifficultyPill level={bootcamp.difficulty} />
        <MetaPill>{bootcamp.weeks.length} weeks</MetaPill>
        <MetaPill>Weekly milestone</MetaPill>
        <MetaPill>Capstone in week {bootcamp.durationWeeks}</MetaPill>
      </div>

      {bootcamp.path && (
        <section className="card-premium glow-l rounded-3xl p-7 sm:p-9">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-text-muted">You finish able to</p>
          <p className="mt-3 font-serif text-xl leading-relaxed text-text sm:text-2xl">{bootcamp.path.outcome}</p>
        </section>
      )}

      <section className="space-y-4">
        <h2 className="font-serif text-2xl text-text">The twelve weeks</h2>
        <ol className="space-y-4">
          {bootcamp.weeks.map((week) => (
            <li key={week.id} className="editorial-card glow-l rounded-2xl p-6">
              <div className="flex flex-col gap-5 sm:flex-row">
                <div className="flex shrink-0 sm:w-24 sm:flex-col">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-cream/20 bg-cream/5 font-serif text-xl text-text">
                    {week.weekNumber}
                  </span>
                </div>

                <div className="flex-1 space-y-3">
                  <div>
                    <h3 className="font-serif text-lg text-text">{week.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-text-muted">{week.summary}</p>
                  </div>

                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">Goals</p>
                    <ul className="mt-2 space-y-1.5">
                      {(week.goals as string[]).map((g) => (
                        <li key={g} className="flex gap-2.5 text-sm text-text-muted">
                          <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-cream/60" />
                          {g}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <MetaPill className="!border-cream/20 !bg-cream/8 !text-text">
                      Milestone: {week.milestone}
                    </MetaPill>
                    {week.course && (
                      <Link href={`/courses/${week.course.id}`}>
                        <MetaPill className="hover:border-gold/40 hover:text-gold transition-colors">
                          Course: {week.course.title}
                        </MetaPill>
                      </Link>
                    )}
                    {week.project && (
                      <Link href={`/projects/${week.project.slug}`}>
                        <MetaPill className="hover:border-gold/40 hover:text-gold transition-colors">
                          Project: {week.project.title}
                        </MetaPill>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
