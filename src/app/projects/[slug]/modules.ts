/**
 * A project's brief is walked as a sequence of modules: the overview, then
 * one module per build stage. Every project has the same shape (summary,
 * requirements, architecture, a staged task list), so this structure applies
 * uniformly across the catalogue without any extra authoring.
 */

export interface Task {
  title: string;
  detail: string;
  stage: string;
}

export const STAGES = ["REQUIREMENTS", "ARCHITECTURE", "IMPLEMENTATION", "TESTING", "DEPLOYMENT"] as const;
export type Stage = (typeof STAGES)[number];

export interface ProjectModule {
  /** Empty string is the overview module, served at /projects/[slug]. */
  slug: string;
  stage?: Stage;
  title: string;
  shortTitle: string;
  description: string;
}

export const PROJECT_MODULES: ProjectModule[] = [
  {
    slug: "",
    title: "Overview",
    shortTitle: "Overview",
    description: "The brief: the problem, why it matters, the stack and the shape of the work.",
  },
  {
    slug: "requirements",
    stage: "REQUIREMENTS",
    title: "Requirements",
    shortTitle: "Requirements",
    description: "What the finished thing has to do before anything gets built.",
  },
  {
    slug: "architecture",
    stage: "ARCHITECTURE",
    title: "Architecture",
    shortTitle: "Architecture",
    description: "The shape of the system, decided before the first line of implementation.",
  },
  {
    slug: "implementation",
    stage: "IMPLEMENTATION",
    title: "Implementation",
    shortTitle: "Build",
    description: "The build itself, task by task.",
  },
  {
    slug: "testing",
    stage: "TESTING",
    title: "Testing",
    shortTitle: "Testing",
    description: "Proving it holds up, including the paths that are supposed to fail.",
  },
  {
    slug: "deployment",
    stage: "DEPLOYMENT",
    title: "Deployment",
    shortTitle: "Ship it",
    description: "Getting it in front of someone, with the basics a real deploy needs.",
  },
];

export function getModule(slug: string): ProjectModule | undefined {
  return PROJECT_MODULES.find((m) => m.slug === slug);
}

export function moduleHref(projectSlug: string, moduleSlug: string): string {
  return moduleSlug ? `/projects/${projectSlug}/${moduleSlug}` : `/projects/${projectSlug}`;
}

export function tasksForStage(tasks: Task[], stage: Stage): Task[] {
  return tasks.filter((t) => t.stage === stage);
}
