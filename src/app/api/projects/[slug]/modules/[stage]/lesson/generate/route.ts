import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { aiPreflight } from "@/lib/ai/guard";
import { describeAiError } from "@/lib/ai/client";
import { AiRefusalError } from "@/lib/ai/structured";
import { parseInteractivity } from "@/lib/lessons/shared";
import { runLessonRead, TruncatedGenerationError } from "@/lib/ai/lessonHtml";
import { loadOrCreateModuleLesson, buildProjectStageContext } from "@/lib/projects/moduleLesson";

interface RouteParams {
  params: Promise<{ slug: string; stage: string }>;
}

const requestSchema = z.object({
  topic: z.string().trim().max(8000).optional(),
  documentText: z.string().trim().max(20000).optional(),
  customTitle: z.string().trim().max(140).optional(),
  showAuthor: z.boolean().default(true),
});

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

/** Generates the standalone "Read" lesson for this project stage from its brief, staged tasks, and (optionally) extra topic/notes from the lesson generator. */
export async function POST(req: Request, { params }: RouteParams) {
  const { slug, stage } = await params;
  const loaded = await loadOrCreateModuleLesson(slug, stage);
  if ("error" in loaded) return loaded.error;
  const { project, moduleLesson } = loaded;

  const session = await getServerSession(authOptions);
  const gate = await aiPreflight(req, "project-module-lesson", session?.user?.id, 10);
  if (!gate.ok) return gate.response;

  const body = await req.json().catch(() => ({}));
  const interactivity = parseInteractivity((body as { interactivity?: unknown })?.interactivity);
  const parsed = requestSchema.safeParse(body);
  const { topic, documentText, customTitle, showAuthor } = parsed.success
    ? parsed.data
    : { topic: undefined, documentText: undefined, customTitle: undefined, showAuthor: true };

  try {
    const extra = [topic, documentText ? `<attached_document>\n${documentText}\n</attached_document>` : null]
      .filter(Boolean)
      .join("\n\n");
    const ctx = buildProjectStageContext(
      project,
      loaded.stage,
      extra ? `${extra}\n\n(The ${loaded.stage.toLowerCase()} stage of this project.)` : `The ${loaded.stage.toLowerCase()} stage of this project.`
    );
    if (customTitle) ctx.title = customTitle;
    const html = await runLessonRead(gate.credential, ctx, interactivity);
    const updated = await prisma.projectModuleLesson.update({
      where: { id: moduleLesson.id },
      data: {
        generatedHtml: html,
        htmlUpdatedAt: new Date(),
        ...(session?.user?.id ? { authorId: session.user.id, showAuthor } : {}),
      },
    });
    return NextResponse.json({ generatedHtml: updated.generatedHtml, htmlUpdatedAt: updated.htmlUpdatedAt });
  } catch (error) {
    return handleAiError(error);
  }
}
