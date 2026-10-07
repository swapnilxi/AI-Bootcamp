import { prisma } from "@/lib/prisma";
import { PageHeader, DifficultyPill, MetaPill, CatalogueCard, EmptyState } from "@/components/learning/primitives";

export const metadata = {
  title: "AI Projects | AI Bootcamp",
  description:
    "Project-based AI learning: chatbots, RAG assistants, multi-agent research systems and production capstones — each with a brief, an architecture and a task list.",
};

export const revalidate = 3600;

const TIERS = [
  { level: "BEGINNER", title: "Beginner", blurb: "One new idea at a time, shipped end to end." },
  { level: "INTERMEDIATE", title: "Intermediate", blurb: "Several moving parts, measured rather than assumed." },
  { level: "ADVANCED", title: "Advanced", blurb: "Systems with real coordination and real failure modes." },
  { level: "PRODUCTION", title: "Production", blurb: "What a team would actually run, evaluation and all." },
] as const;

/** Projects are a first-class product surface, grouped by how hard they are rather than by topic. */
export default async function ProjectsPage() {
  const projects = await prisma.project.findMany({
    where: { status: "PUBLISHED" },
    orderBy: [{ difficulty: "asc" }, { order: "asc" }],
    include: { path: { select: { title: true } } },
  });

  return (
    <div className="mx-auto max-w-7xl space-y-14 px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <PageHeader
        eyebrow="Project-based learning"
        title="You learn AI by building AI"
        lede="Every project ships with a problem statement, the business context behind it, an architecture, a tech stack and a staged task list — the same brief you would get on a team."
      />

      {projects.length === 0 ? (
        <EmptyState title="No projects yet" body="Seed the database to load the project catalogue." />
      ) : (
        TIERS.map((tier) => {
          const tierProjects = projects.filter((p) => p.difficulty === tier.level);
          if (tierProjects.length === 0) return null;
          return (
            <section key={tier.level} className="space-y-6">
              <div className="flex flex-wrap items-baseline gap-3 border-b border-black-line pb-4">
                <h2 className="font-serif text-2xl text-text">{tier.title}</h2>
                <p className="text-sm text-text-muted">{tier.blurb}</p>
              </div>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {tierProjects.map((project) => (
                  <CatalogueCard
                    key={project.id}
                    href={`/projects/${project.slug}`}
                    title={project.title}
                    summary={project.summary}
                    glow={project.isCapstone ? "glow-br" : "glow-tl"}
                    pills={
                      <>
                        <DifficultyPill level={project.difficulty} />
                        <MetaPill>{project.estimatedHours}h</MetaPill>
                        {project.isCapstone && (
                          <MetaPill className="!border-cream/30 !bg-cream/10 !text-cream">Capstone</MetaPill>
                        )}
                      </>
                    }
                    footer={
                      <span>
                        {(project.techStack as string[]).slice(0, 4).join(" · ")}
                        {project.path ? ` — ${project.path.title} path` : ""}
                      </span>
                    }
                  />
                ))}
              </div>
            </section>
          );
        })
      )}
    </div>
  );
}
