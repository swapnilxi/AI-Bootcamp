import { NextResponse } from "next/server";
import { Prisma, type ProjectStage } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { STAGES, getModule, tasksForStage, type Task } from "@/app/projects/[slug]/modules";
import type { LessonContext, LessonVariants } from "@/lib/ai/lessonHtml";

export function isProjectStage(value: string): value is ProjectStage {
  return (STAGES as readonly string[]).includes(value);
}

/** Loads the project and finds-or-creates its per-stage generated-lesson row. */
export async function loadOrCreateModuleLesson(slug: string, stage: string) {
  if (!isProjectStage(stage)) {
    return { error: NextResponse.json({ error: "Unknown project stage" }, { status: 404 }) } as const;
  }
  const project = await prisma.project.findUnique({ where: { slug } });
  if (!project) {
    return { error: NextResponse.json({ error: "Project not found" }, { status: 404 }) } as const;
  }

  const moduleLesson = await prisma.projectModuleLesson.upsert({
    where: { projectId_stage: { projectId: project.id, stage } },
    update: {},
    create: { projectId: project.id, stage },
  });

  return { ok: true, project, moduleLesson, stage } as const;
}

/** Builds the shared lesson-generation context for a project's stage. */
export function buildProjectStageContext(
  project: { title: string; problemStatement: string; architecture: string; requirements: unknown; tasks: unknown },
  stage: ProjectStage,
  sourceText: string
): LessonContext {
  const projectModule = getModule(stage.toLowerCase());
  const stageTasks = tasksForStage(project.tasks as unknown as Task[], stage);
  const index = STAGES.indexOf(stage);
  return {
    title: projectModule?.title ?? stage,
    domainLabel: project.title,
    domainDescription: project.problemStatement,
    sourceText: `${sourceText}

<architecture>
${project.architecture}
</architecture>
<requirements>
${JSON.stringify(project.requirements)}
</requirements>
<tasks>
${stageTasks.map((t) => `- ${t.title}: ${t.detail}`).join("\n") || "(none staged)"}
</tasks>`,
    projectTrack: {
      projectName: project.title,
      positionLabel: `Stage ${index + 1} of ${STAGES.length}`,
      focus: projectModule?.description ?? stage,
    },
  };
}

export function requireModuleRead(moduleLesson: { generatedHtml: string | null }) {
  if (!moduleLesson.generatedHtml) {
    return NextResponse.json({ error: "Generate the lesson first" }, { status: 400 });
  }
  return null;
}

/** Merges a new variant into the stage's stored `variants` JSON. */
export async function saveModuleVariant(moduleLessonId: string, patch: LessonVariants, existing: unknown) {
  const merged: LessonVariants = { ...((existing as LessonVariants) || {}), ...patch };
  await prisma.projectModuleLesson.update({ where: { id: moduleLessonId }, data: { variants: merged as Prisma.InputJsonValue } });
  return merged;
}
