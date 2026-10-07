import { prisma } from "@/lib/prisma";
import { PageHeader, DifficultyPill, MetaPill, CatalogueCard, EmptyState } from "@/components/learning/primitives";

export const metadata = {
  title: "AI Labs | AI Bootcamp",
  description:
    "Hands-on AI labs: LLM, RAG, Agent, Multi-Agent, Vision and Evaluation. Change one variable at a time and watch what it does.",
};

export const revalidate = 3600;

const KIND_LABEL: Record<string, string> = {
  LLM: "LLM",
  RAG: "RAG",
  AGENT: "Agents",
  MULTI_AGENT: "Multi-Agent",
  VISION: "Vision",
  EVALUATION: "Evaluation",
};

/** AI Labs: environments where a concept can be poked rather than only read about. */
export default async function LabsPage() {
  const labs = await prisma.lab.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { order: "asc" },
  });

  return (
    <div className="mx-auto max-w-7xl space-y-12 px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <PageHeader
        eyebrow="AI Labs"
        title="Turn the knobs and see what moves"
        lede="Reading that temperature raises variance is not the same as watching it happen. Each lab isolates one system so you can change a single variable and measure the result."
      />

      {labs.length === 0 ? (
        <EmptyState title="No labs yet" body="Seed the database to load the lab catalogue." />
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {labs.map((lab) => (
            <CatalogueCard
              key={lab.id}
              href={`/labs/${lab.slug}`}
              title={lab.title}
              summary={lab.summary}
              pills={
                <>
                  <MetaPill className="!border-cream/25 !bg-cream/10 !text-cream">{KIND_LABEL[lab.kind] ?? lab.kind}</MetaPill>
                  <DifficultyPill level={lab.difficulty} />
                  <MetaPill>{lab.estimatedMinutes} min</MetaPill>
                </>
              }
              footer={<span>{(lab.objectives as string[]).length} objectives · {(lab.steps as unknown[]).length} steps</span>}
            />
          ))}
        </div>
      )}
    </div>
  );
}
