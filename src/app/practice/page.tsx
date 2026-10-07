import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/learning/primitives";
import { PracticeRunner } from "@/components/learning/PracticeRunner";

export const metadata = {
  title: "AI Practice | AI Bootcamp",
  description:
    "Adaptive AI practice: concept, scenario, coding, architecture, debugging and interview questions that aim at whatever you are weakest at.",
};

/** The practice engine. Modes mirror how people actually revise: quick, targeted, or at their weak spots. */
export default async function PracticePage() {
  const skills = await prisma.skill.findMany({
    orderBy: { order: "asc" },
    select: { slug: true, name: true, _count: { select: { questions: true } } },
  });

  return (
    <div className="mx-auto max-w-4xl space-y-10 px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <PageHeader
        eyebrow="AI Practice"
        title="Drill the thing you are worst at"
        lede="Concept, scenario, debugging and architecture questions drawn from the curriculum. Weak-area mode reads your skill graph and aims at the gaps rather than the comfortable parts."
      />

      <Suspense fallback={<p className="text-sm text-text-muted">Loading practice…</p>}>
        <PracticeRunner skills={skills.filter((s) => s._count.questions > 0)} />
      </Suspense>
    </div>
  );
}
