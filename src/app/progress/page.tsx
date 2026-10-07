import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { ArrowRight, Flame, Target } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { getLearnerSnapshot } from "@/lib/learning/progress";
import { PageHeader, ProgressBar, StatTile } from "@/components/learning/primitives";
import { SkillGraph } from "@/components/learning/SkillGraph";
import { Button } from "@/components/ui/Button";

export const metadata = {
  title: "Your Progress | AI Bootcamp",
  description: "Your AI skill graph, learning strength and the single next action that moves you forward.",
};

export const dynamic = "force-dynamic";

/**
 * The progress dashboard.
 *
 * It is built to answer one question on sight: where am I and what should I do
 * next? The recommended action is therefore the first thing on the page, with
 * its reasoning attached, and the numbers sit underneath as support.
 */
export default async function ProgressPage() {
  const session = await getServerSession(authOptions);
  const snap = await getLearnerSnapshot(session?.user?.id);

  return (
    <div className="mx-auto max-w-7xl space-y-12 px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <PageHeader
        eyebrow={snap.path ? `${snap.path.title} path` : "Your journey"}
        title={snap.signedIn ? `Where you are, ${snap.name ?? "learner"}` : "Your AI skill graph"}
        lede={
          snap.signedIn
            ? snap.path?.outcome ?? "Pick a path and the platform will sequence everything else against it."
            : "Sign in to track mastery, keep a streak and get a recommended next action based on what you actually struggle with."
        }
        actions={
          !snap.signedIn ? (
            <Button href="/login" variant="primary" size="md">
              Sign in
            </Button>
          ) : undefined
        }
      />

      {/* The verdict, first. */}
      <section className="card-premium card-featured glow-tl rounded-3xl p-7 sm:p-9">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl space-y-3">
            <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-text-muted">
              <Target className="h-3.5 w-3.5" />
              Recommended next
            </p>
            <h2 className="font-serif text-2xl text-text sm:text-3xl">{snap.nextAction.label}</h2>
            <p className="text-sm leading-relaxed text-text-muted">{snap.nextAction.reason}</p>
          </div>
          <Link
            href={snap.nextAction.href}
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[linear-gradient(180deg,#FFB073_0%,#FF7315_55%,#DC4C00_100%)] px-7 py-3.5 text-sm font-semibold text-black transition-transform hover:-translate-y-0.5"
          >
            Go
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {snap.path && (
          <div className="mt-8 border-t border-white/[0.07] pt-6">
            <ProgressBar value={snap.pathProgressPct} label={`${snap.path.title} path`} />
          </div>
        )}
      </section>

      {/* Learning analytics. */}
      <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          value={
            <span className="inline-flex items-center gap-2">
              {snap.streakDays}
              {snap.streakDays > 0 && <Flame className="h-5 w-5 text-gold" />}
            </span>
          }
          label="Day streak"
          hint={snap.streakDays > 0 ? "Keep it going" : "Answer one question to start"}
        />
        <StatTile value={snap.mastered} label="Skills mastered" hint={`${snap.inProgress} in progress`} />
        <StatTile
          value={snap.practiceAttempted ? `${snap.practiceAccuracy}%` : "—"}
          label="Practice accuracy"
          hint={`${snap.practiceAttempted} questions answered`}
        />
        <StatTile
          value={snap.projectsCompleted}
          label="Projects shipped"
          hint={`${snap.projectsStarted} started`}
        />
      </section>

      {/* Weak areas — the honest part. */}
      {snap.weakAreas.length > 0 && (
        <section className="space-y-5">
          <div className="flex items-end justify-between gap-4 border-b border-black-line pb-4">
            <div>
              <h2 className="font-serif text-2xl text-text">Where you are weakest</h2>
              <p className="mt-1 text-sm text-text-muted">
                Started but not stuck. These are worth clearing before adding anything new.
              </p>
            </div>
            <Link href="/practice" className="text-xs uppercase tracking-wider text-text-muted hover:underline">
              Drill all
            </Link>
          </div>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {snap.weakAreas.map((s) => (
              <div key={s.slug} className="editorial-card glow-tl space-y-4 rounded-2xl p-6">
                <div>
                  <h3 className="font-serif text-lg text-text">{s.name}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-text-muted">{s.description}</p>
                </div>
                <ProgressBar value={s.masteryPct} label="Mastery" />
                <Link
                  href={`/practice?skill=${s.slug}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-cream/30 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-cream transition-colors hover:bg-cream/10"
                >
                  Practise this
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* The skill graph. */}
      <section className="space-y-5">
        <div className="border-b border-black-line pb-4">
          <h2 className="font-serif text-2xl text-text">Skill graph</h2>
          <p className="mt-1 text-sm text-text-muted">
            Each skill opens when the ones it depends on are mastered. Locked is not a gate for its own sake —
            it means the prerequisite genuinely matters.
          </p>
        </div>
        <SkillGraph skills={snap.skills} />
      </section>

      {!snap.signedIn && (
        <section className="rounded-3xl border border-cream/20 bg-cream/5 p-8 text-center">
          <h2 className="font-serif text-xl text-text">This gets personal once you sign in</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-text-muted">
            Mastery, streak, weak areas and the recommended next action are all computed from your own practice
            history and project work.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button href="/register" variant="primary" size="md">
              Create an account
            </Button>
            <Button href="/paths" variant="secondary" size="md">
              Browse paths
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}
