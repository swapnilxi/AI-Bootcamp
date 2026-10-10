import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { z } from "zod";
import { z as z4 } from "zod/v4";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getClassAccess } from "../access";
import { isAdminRole } from "@/lib/roles";
import { aiPreflight } from "@/lib/ai/guard";
import { describeAiError } from "@/lib/ai/client";
import { AiRefusalError, generateStructured } from "@/lib/ai/structured";
import { BRAND_VOICE } from "@/lib/ai/prompts";
import { runLessonRead } from "@/lib/ai/lessonHtml";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const requestSchema = z.object({
  topic: z.string().trim().min(3, "Enter a topic or paste some notes first").max(8000),
  documentText: z.string().trim().max(20000).optional(),
  customTitle: z.string().trim().max(140).optional(),
  showAuthor: z.boolean().default(true),
});

const LessonFromTopic = z4.object({
  title: z4.string().describe("A concise, specific lesson title under 80 characters — derive it from the material, don't just restate the topic verbatim"),
  summary: z4.string().describe("One sentence, under 200 characters, describing what the learner will gain"),
  content: z4
    .string()
    .describe(
      "Lesson notes in plain text with short paragraphs, simple numbered or dashed lists, and a final 'Exercise:' section. No markdown headings, no bold."
    ),
  durationMinutes: z4.number().int().describe("Realistic study time in minutes, between 10 and 60"),
});

/** Instructor/admin tool: turn a topic or pasted notes (plus an optional attached document) straight into a new lesson, draft notes and interactive HTML included. */
export async function POST(req: Request, { params }: RouteParams) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cls = await prisma.course.findUnique({ where: { id }, include: { path: true } });
  if (!cls) {
    return NextResponse.json({ error: "Class not found" }, { status: 404 });
  }
  const guidance = [cls.path?.aiContext?.trim(), cls.aiContext?.trim()].filter(Boolean).join("\n\n") || undefined;

  const access = await getClassAccess(session, cls);
  if (!access.canManage) {
    return NextResponse.json(
      { error: "Forbidden: Only this class's instructor or an administrator can generate lessons" },
      { status: 403 }
    );
  }

  const parsed = requestSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message || "Invalid request" }, { status: 400 });
  }
  const { topic, documentText, customTitle, showAuthor } = parsed.data;

  const preflight = await aiPreflight(req, "lesson-generate", session.user.id, 8);
  if (!preflight.ok) return preflight.response;

  const existingLessons = await prisma.lesson.findMany({
    where: { courseId: id },
    orderBy: { order: "asc" },
    select: { title: true, order: true },
  });
  const existingList = existingLessons.map((l, i) => `${i + 1}. ${l.title}`).join("\n") || "(none yet)";
  const sourceText = documentText ? `${topic}\n\n<attached_document>\n${documentText}\n</attached_document>` : topic;

  try {
    const draft = await generateStructured({
      credential: preflight.credential,
      schema: LessonFromTopic,
      effort: "medium",
      system: `${BRAND_VOICE}

You help academy instructors turn a topic or a set of pasted notes into a new lesson. Write for adult learners who are new to the topic unless the class description implies otherwise. Keep notes between 250 and 600 words. The instructor will review and edit your draft before publishing.`,
      prompt: `Create a new lesson for this class from the material below.

<class>
Title: ${cls.title}
Description: ${cls.description}
</class>
${guidance ? `\n<guidance>\n${guidance}\n</guidance>\n` : ""}
<existing_lessons>
${existingList}
</existing_lessons>

<material>
${sourceText}
</material>

Build on the existing lessons without repeating them.`,
    });

    const title = (customTitle || draft.title).slice(0, 140);

    // The interactive HTML view is a bonus on top of lesson creation — if it
    // fails, the lesson still saves and can be generated later from its page.
    let generatedHtml: string | null = null;
    try {
      generatedHtml = await runLessonRead(preflight.credential, {
        title,
        domainLabel: cls.title,
        domainDescription: cls.description,
        guidance,
        sourceText: draft.content,
      });
    } catch {
      generatedHtml = null;
    }

    const last = existingLessons.at(-1);
    const lesson = await prisma.lesson.create({
      data: {
        courseId: id,
        title,
        summary: draft.summary.slice(0, 300),
        content: draft.content,
        durationMinutes: Math.min(60, Math.max(10, Math.round(draft.durationMinutes))),
        order: (last?.order ?? -1) + 1,
        authorId: session.user.id,
        showAuthor,
        approvalStatus: isAdminRole(session.user.role) ? "APPROVED" : "PENDING",
        generatedHtml,
        htmlUpdatedAt: generatedHtml ? new Date() : null,
      },
    });

    return NextResponse.json({ message: "Lesson created", lesson }, { status: 201 });
  } catch (error) {
    if (error instanceof AiRefusalError) {
      return NextResponse.json({ error: "Couldn't generate a lesson from that material — try narrowing it." }, { status: 422 });
    }
    const { message, status } = describeAiError(error);
    return NextResponse.json({ error: message }, { status });
  }
}
