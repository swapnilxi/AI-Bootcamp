import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { LessonContext, LessonVariants } from "@/lib/lessons/shared";

/** Loads a project and one of its instructor-added custom modules by slug. */
export async function loadCustomModule(projectSlug: string, moduleSlug: string) {
  const project = await prisma.project.findUnique({ where: { slug: projectSlug } });
  if (!project) {
    return { error: NextResponse.json({ error: "Project not found" }, { status: 404 }) } as const;
  }
  const customModule = await prisma.projectModule.findUnique({
    where: { projectId_slug: { projectId: project.id, slug: moduleSlug } },
  });
  if (!customModule) {
    return { error: NextResponse.json({ error: "Module not found" }, { status: 404 }) } as const;
  }
  return { ok: true, project, customModule } as const;
}

export function buildCustomModuleContext(
  project: { title: string; problemStatement: string; aiContext?: string },
  customModule: { title: string; description: string },
  sourceText: string
): LessonContext {
  return {
    title: customModule.title,
    domainLabel: project.title,
    domainDescription: project.problemStatement,
    guidance: project.aiContext?.trim() || undefined,
    sourceText,
    projectTrack: {
      projectName: project.title,
      positionLabel: "An additional module",
      focus: customModule.description,
    },
  };
}

export function requireCustomModuleRead(customModule: { generatedHtml: string | null }) {
  if (!customModule.generatedHtml) {
    return NextResponse.json({ error: "Generate the lesson first" }, { status: 400 });
  }
  return null;
}

export async function saveCustomModuleVariant(moduleId: string, patch: LessonVariants, existing: unknown) {
  const merged: LessonVariants = { ...((existing as LessonVariants) || {}), ...patch };
  await prisma.projectModule.update({ where: { id: moduleId }, data: { variants: merged as Prisma.InputJsonValue } });
  return merged;
}
