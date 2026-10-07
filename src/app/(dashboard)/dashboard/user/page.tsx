import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { ArrowRight, BookOpen, Flame, Target } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getLearnerSnapshot } from "@/lib/learning/progress";
import { ProgressBar, StatTile, MetaPill, DifficultyPill } from "@/components/learning/primitives";
import { InstructorApplicationNotice } from "@/components/ui/InstructorApplicationNotice";
import { Button } from "@/components/ui/Button";

export const dynamic = "force-dynamic";

/**
 * The learner's home. A compact version of /progress — the next action and the
 * courses in flight — so the first thing after signing in is a decision, not a
 * catalogue.
 */
export default async function UserDashboardPage() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  const snap = await getLearnerSnapshot(userId);

  const [enrollments, profile] = await Promise.all([
    userId
      ? prisma.enrollment.findMany({
          where: { userId },
          orderBy: { enrolledAt: "desc" },
          take: 6,
          include: {
            course: {
              select: {
                id: true,
                title: true,
                description: true,
                difficulty: true,
                estimatedHours: true,
                _count: { select: { lessons: true } },
              },
            },
          },
        })
      : Promise.resolve([]),
    userId
      ? prisma.user.findUnique({
          where: { id: userId },
          select: { approvalStatus: true, rejectionReason: true, role: true },
        })
      : Promise.resolve(null),
  ]);

  // How far through each enrolled course the learner is.
  const completedByCourse = userId
    ? await prisma.lessonProgress.groupBy({
        by: ["lessonId"],
        where: { userId },
      })
    : [];
  const completedLessonIds = new Set(completedByCourse.map((p) => p.lessonId));
  const lessonsByCourse = userId
    ? await prisma.lesson.findMany({
        where: { courseId: { in: enrollments.map((e) => e.course.id) } },
        select: { id: true, courseId: true },
      })
    : [];

  const progressFor = (courseId: string) => {
    const lessons = lessonsByCourse.filter((l) => l.courseId === courseId);
    if (lessons.length === 0) return 0;
    const done = lessons.filter((l) => completedLessonIds.has(l.id)).length;
    return Math.round((done / lessons.length) * 100);
  };

  return (
    <div className="space-y-10">
      {profile?.approvalStatus && profile.approvalStatus !== "APPROVED" && (
        <InstructorApplicationNotice
          role={profile.role}
          approvalStatus={profile.approvalStatus}
          rejectionReason={profile.rejectionReason}
        />
      )}

      <header className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-gold">
          {snap.path ? `${snap.path.title} path` : "Your journey"}
        </p>
        <h1 className="font-serif text-3xl font-normal text-text sm:text-4xl">
          {snap.name ? `Welcome back, ${snap.name.split(" ")[0]}` : "Welcome back"}
        </h1>
      </header>

      {/* What to do next. */}
      <section className="card-premium card-featured glow-tl rounded-3xl p-6 sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl space-y-2.5">
            <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-gold">
              <Target className="h-3.5 w-3.5" />
              Do this next
            </p>
            <h2 className="font-serif text-2xl text-text">{snap.nextAction.label}</h2>
            <p className="text-sm leading-relaxed text-text-muted">{snap.nextAction.reason}</p>
          </div>
          <Link
            href={snap.nextAction.href}
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[linear-gradient(180deg,#FFB073_0%,#FF7315_55%,#DC4C00_100%)] px-6 py-3 text-sm font-semibold text-black transition-transform hover:-translate-y-0.5"
          >
            Go
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {snap.path && (
          <div className="mt-7 border-t border-white/[0.07] pt-5">
            <ProgressBar value={snap.pathProgressPct} label="Path progress" />
          </div>
        )}
      </section>

      <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          value={
            <span className="inline-flex items-center gap-2">
              {snap.streakDays}
              {snap.streakDays > 0 && <Flame className="h-5 w-5 text-gold" />}
            </span>
          }
          label="Day streak"
        />
        <StatTile value={snap.mastered} label="Skills mastered" hint={`${snap.inProgress} in progress`} />
        <StatTile value={snap.lessonsCompleted} label="Lessons completed" />
        <StatTile
          value={snap.practiceAttempted ? `${snap.practiceAccuracy}%` : "—"}
          label="Practice accuracy"
        />
      </section>

      {/* Courses in flight. */}
      <section className="space-y-5">
        <div className="flex items-end justify-between gap-4 border-b border-black-line pb-4">
          <h2 className="font-serif text-2xl text-text">Your courses</h2>
          <Link href="/courses" className="text-xs uppercase tracking-wider text-gold hover:underline">
            Browse all
          </Link>
        </div>

        {enrollments.length === 0 ? (
          <div className="editorial-card glow-tl space-y-4 rounded-2xl p-8 text-center">
            <BookOpen className="mx-auto h-6 w-6 text-gold" />
            <h3 className="font-serif text-xl text-text">You are not enrolled in anything yet</h3>
            <p className="mx-auto max-w-md text-sm text-text-muted">
              Pick a path and the first course will be chosen for you, or browse the catalogue and start
              wherever you like.
            </p>
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <Button href="/paths" variant="primary" size="sm">
                Choose a path
              </Button>
              <Button href="/courses" variant="secondary" size="sm">
                Browse courses
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {enrollments.map(({ id, course }) => (
              <Link
                key={id}
                href={`/courses/${course.id}`}
                className="editorial-card glow-tl group flex h-full flex-col gap-4 rounded-2xl p-6"
              >
                <div className="flex-1 space-y-2.5">
                  <h3 className="font-serif text-lg leading-snug text-text transition-colors group-hover:text-gold">
                    {course.title}
                  </h3>
                  <p className="line-clamp-2 text-sm leading-relaxed text-text-muted">{course.description}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <DifficultyPill level={course.difficulty} />
                  <MetaPill>{course._count.lessons} lessons</MetaPill>
                </div>
                <ProgressBar value={progressFor(course.id)} label="Complete" />
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Weak areas, if any. */}
      {snap.weakAreas.length > 0 && (
        <section className="space-y-5">
          <div className="flex items-end justify-between gap-4 border-b border-black-line pb-4">
            <h2 className="font-serif text-2xl text-text">Worth shoring up</h2>
            <Link href="/progress" className="text-xs uppercase tracking-wider text-gold hover:underline">
              Full skill graph
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {snap.weakAreas.slice(0, 3).map((s) => (
              <Link
                key={s.slug}
                href={`/practice?skill=${s.slug}`}
                className="editorial-card glow-tl space-y-3 rounded-2xl p-5"
              >
                <h3 className="text-sm font-semibold text-text">{s.name}</h3>
                <ProgressBar value={s.masteryPct} />
                <p className="text-xs text-text-muted">{s.masteryPct}% has stuck — drill it</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
