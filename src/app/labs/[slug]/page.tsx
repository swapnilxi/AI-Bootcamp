import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader, DifficultyPill, MetaPill } from "@/components/learning/primitives";
import { LabBench, type LabParameter } from "@/components/learning/LabBench";

export const revalidate = 3600;

interface Step {
  title: string;
  detail: string;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const lab = await prisma.lab.findUnique({ where: { slug }, select: { title: true, summary: true } });
  if (!lab) return { title: "Lab not found | AI Bootcamp" };
  return { title: `${lab.title} | AI Bootcamp`, description: lab.summary };
}

export default async function LabDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const lab = await prisma.lab.findUnique({ where: { slug } });
  if (!lab) notFound();

  const steps = lab.steps as unknown as Step[];
  const objectives = lab.objectives as string[];

  return (
    <div className="mx-auto max-w-6xl space-y-12 px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <PageHeader eyebrow={`${lab.kind.replace("_", "-")} lab`} title={lab.title} lede={lab.description} />

      <div className="flex flex-wrap gap-2">
        <DifficultyPill level={lab.difficulty} />
        <MetaPill>{lab.estimatedMinutes} minutes</MetaPill>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-10">
          <LabBench
            parameters={lab.parameters as unknown as LabParameter[]}
            steps={steps}
            labTitle={lab.title}
          />
        </div>

        <aside className="space-y-6">
          <section className="editorial-card glow-tr space-y-3 rounded-2xl p-6">
            <h2 className="font-serif text-lg text-text">What you should get out of it</h2>
            <ul className="space-y-2.5">
              {objectives.map((o) => (
                <li key={o} className="flex gap-2.5 text-sm text-text-muted">
                  <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                  {o}
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl border border-cream/20 bg-cream/[0.05] p-6">
            <h2 className="font-serif text-lg text-text">Ask as you go</h2>
            <p className="mt-2 text-sm leading-relaxed text-text-muted">
              The AI Tutor knows which lab you are in. Ask it why an output changed and it will answer against
              this lab&apos;s mechanism, not in general.
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}
