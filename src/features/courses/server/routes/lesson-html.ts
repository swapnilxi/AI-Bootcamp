import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getClassAccess } from "../access";
import { aiPreflight } from "@/lib/ai/guard";
import { describeAiError } from "@/lib/ai/client";
import { AiRefusalError } from "@/lib/ai/structured";
import {
  runLessonRead,
  runLessonRevise,
  runLessonEasyRead,
  runLessonDeeper,
  runLessonBreakdown,
  runLessonVisualize,
  TruncatedGenerationError,
  type LessonVariants,
} from "@/lib/ai/lessonHtml";

interface RouteParams {
  params: Promise<{ id: string; lessonId: string }>;
}

async function loadLessonWithAccess(courseId: string, lessonId: string, req: Request) {
  const session = await getServerSession(authOptions);
  const lesson = await prisma.lesson.findUnique({ where: { id: lessonId }, include: { course: { include: { path: true } } } });
  if (!lesson || lesson.courseId !== courseId) {
    return { error: NextResponse.json({ error: "Lesson not found" }, { status: 404 }) } as const;
  }
  const access = await getClassAccess(session, lesson.course);
  if (!access.canViewContent && !lesson.isPreview) {
    return { error: NextResponse.json({ error: "Enroll in this class to view this lesson" }, { status: 403 }) } as const;
  }
  const preflight = await aiPreflight(req, "lesson-html", session?.user?.id, 20);
  if (!preflight.ok) return { error: preflight.response } as const;
  return { ok: true, lesson, access, credential: preflight.credential } as const;
}

/** Combines the parent path's AI guidance with the course's own, as "inherited" + course-level context. */
function courseGuidance(course: { aiContext: string; path: { aiContext: string } | null }): string | undefined {
  const parts = [course.path?.aiContext?.trim(), course.aiContext?.trim()].filter(Boolean);
  return parts.length ? parts.join("\n\n") : undefined;
}

function handleAiError(error: unknown) {
  if (error instanceof AiRefusalError) {
    return NextResponse.json({ error: "Couldn't generate that — try a narrower request." }, { status: 422 });
  }
  if (error instanceof TruncatedGenerationError) {
    return NextResponse.json({ error: error.message }, { status: 422 });
  }
  const { message, status } = describeAiError(error);
  return NextResponse.json({ error: message }, { status });
}

/** Clears a lesson's generated preview (Read + every variant) so it can be regenerated from scratch. */
export async function clearHandler(req: Request, { params }: RouteParams) {
  const { id, lessonId } = await params;
  const session = await getServerSession(authOptions);
  const lesson = await prisma.lesson.findUnique({ where: { id: lessonId }, include: { course: true } });
  if (!lesson || lesson.courseId !== id) {
    return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
  }
  const access = await getClassAccess(session, lesson.course);
  if (!access.canManage) {
    return NextResponse.json({ error: "Only this class's instructor or an administrator can clear this preview" }, { status: 403 });
  }
  await prisma.lesson.update({
    where: { id: lessonId },
    data: { generatedHtml: null, variants: Prisma.DbNull, htmlUpdatedAt: null },
  });
  return NextResponse.json({ message: "Preview cleared" });
}

/** (Re)generates the standalone "Read" lesson from the lesson's notes. */
export async function generateHandler(req: Request, { params }: RouteParams) {
  const { id, lessonId } = await params;
  const loaded = await loadLessonWithAccess(id, lessonId, req);
  if ("error" in loaded) return loaded.error;
  const { lesson, credential } = loaded;

  try {
    const html = await runLessonRead(credential, {
      title: lesson.title,
      domainLabel: lesson.course.title,
      domainDescription: lesson.course.description,
      guidance: courseGuidance(lesson.course),
      sourceText: lesson.content,
    });
    const updated = await prisma.lesson.update({
      where: { id: lessonId },
      data: { generatedHtml: html, htmlUpdatedAt: new Date() },
    });
    return NextResponse.json({ generatedHtml: updated.generatedHtml, htmlUpdatedAt: updated.htmlUpdatedAt });
  } catch (error) {
    return handleAiError(error);
  }
}

const reviseSchema = z.object({
  instruction: z.string().trim().max(500).optional(),
  html: z.string().optional(),
});

/** "Update" (AI reprompt) and "Edit" (direct save) both land here, distinguished by which field is sent. */
export async function reviseHandler(req: Request, { params }: RouteParams) {
  const { id, lessonId } = await params;
  const loaded = await loadLessonWithAccess(id, lessonId, req);
  if ("error" in loaded) return loaded.error;
  const { lesson, credential } = loaded;

  const parsed = reviseSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const { instruction, html: directHtml } = parsed.data;
  if (!instruction && !directHtml) {
    return NextResponse.json({ error: "Provide an instruction or edited HTML" }, { status: 400 });
  }
  if (!lesson.generatedHtml && !directHtml) {
    return NextResponse.json({ error: "Generate the lesson first" }, { status: 400 });
  }

  try {
    const html = directHtml ? directHtml : await runLessonRevise(credential, instruction!, lesson.generatedHtml!);
    const updated = await prisma.lesson.update({
      where: { id: lessonId },
      data: { generatedHtml: html, htmlUpdatedAt: new Date() },
    });
    return NextResponse.json({ generatedHtml: updated.generatedHtml, htmlUpdatedAt: updated.htmlUpdatedAt });
  } catch (error) {
    return handleAiError(error);
  }
}

async function saveVariant(lessonId: string, patch: LessonVariants, existing: unknown) {
  const merged: LessonVariants = { ...((existing as LessonVariants) || {}), ...patch };
  await prisma.lesson.update({ where: { id: lessonId }, data: { variants: merged as Prisma.InputJsonValue } });
  return merged;
}

function requireRead(lesson: { generatedHtml: string | null }) {
  if (!lesson.generatedHtml) {
    return NextResponse.json({ error: "Generate the lesson first" }, { status: 400 });
  }
  return null;
}

export async function easyReadHandler(req: Request, { params }: RouteParams) {
  const { id, lessonId } = await params;
  const loaded = await loadLessonWithAccess(id, lessonId, req);
  if ("error" in loaded) return loaded.error;
  const { lesson, credential } = loaded;
  const guard = requireRead(lesson);
  if (guard) return guard;

  try {
    const result = await runLessonEasyRead(credential, lesson.title, lesson.generatedHtml!);
    const variants = await saveVariant(
      lessonId,
      { easyRead: { html: result.html, summary: result.summary, updatedAt: new Date().toISOString() } },
      lesson.variants
    );
    return NextResponse.json({ variants });
  } catch (error) {
    return handleAiError(error);
  }
}

export async function deeperHandler(req: Request, { params }: RouteParams) {
  const { id, lessonId } = await params;
  const loaded = await loadLessonWithAccess(id, lessonId, req);
  if ("error" in loaded) return loaded.error;
  const { lesson, credential } = loaded;
  const guard = requireRead(lesson);
  if (guard) return guard;

  try {
    const result = await runLessonDeeper(credential, lesson.title, lesson.generatedHtml!);
    const variants = await saveVariant(
      lessonId,
      { deeper: { html: result.html, summary: result.summary, updatedAt: new Date().toISOString() } },
      lesson.variants
    );
    return NextResponse.json({ variants });
  } catch (error) {
    return handleAiError(error);
  }
}

export async function breakdownHandler(req: Request, { params }: RouteParams) {
  const { id, lessonId } = await params;
  const loaded = await loadLessonWithAccess(id, lessonId, req);
  if ("error" in loaded) return loaded.error;
  const { lesson, credential } = loaded;
  const guard = requireRead(lesson);
  if (guard) return guard;

  try {
    const result = await runLessonBreakdown(credential, lesson.title, lesson.generatedHtml!);
    const variants = await saveVariant(
      lessonId,
      { breakdown: { chunks: result.chunks, updatedAt: new Date().toISOString() } },
      lesson.variants
    );
    return NextResponse.json({ variants });
  } catch (error) {
    return handleAiError(error);
  }
}

export async function visualizeHandler(req: Request, { params }: RouteParams) {
  const { id, lessonId } = await params;
  const loaded = await loadLessonWithAccess(id, lessonId, req);
  if ("error" in loaded) return loaded.error;
  const { lesson, credential } = loaded;
  const guard = requireRead(lesson);
  if (guard) return guard;

  try {
    const result = await runLessonVisualize(
      credential,
      {
        title: lesson.title,
        domainLabel: lesson.course.title,
        domainDescription: lesson.course.description,
        guidance: courseGuidance(lesson.course),
        sourceText: lesson.generatedHtml!,
      },
      lesson.generatedHtml!
    );
    const variants = await saveVariant(
      lessonId,
      {
        visual: {
          visualType: result.visualType,
          title: result.title,
          explanation: result.explanation,
          html: result.html,
          updatedAt: new Date().toISOString(),
        },
      },
      lesson.variants
    );
    return NextResponse.json({ variants });
  } catch (error) {
    return handleAiError(error);
  }
}
