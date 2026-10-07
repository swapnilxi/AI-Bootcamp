import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { z } from "zod";
import { z as z4 } from "zod/v4";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getClassAccess } from "@/features/courses/server";
import { aiPreflight } from "@/lib/ai/guard";
import { describeAiError } from "@/lib/ai/client";
import { AiRefusalError, generateStructured } from "@/lib/ai/structured";
import { BRAND_VOICE } from "@/lib/ai/prompts";

const requestSchema = z.object({
  courseId: z.string().min(1),
  title: z.string().trim().min(3, "Enter a lesson title first").max(140),
  brief: z.string().trim().max(1500).optional(),
});

const LessonDraft = z4.object({
  summary: z4.string().describe("One sentence, under 200 characters, describing what the learner will gain"),
  content: z4
    .string()
    .describe(
      "Lesson notes in plain text with short paragraphs, simple numbered or dashed lists, and a final 'Exercise:' section. No markdown headings, no bold."
    ),
  durationMinutes: z4.number().int().describe("Realistic study time in minutes, between 10 and 60"),
});

/** Instructor tool: draft a lesson's summary, notes and exercise from its title. */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = requestSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message || "Invalid request" }, { status: 400 });
  }
  const { courseId, title, brief } = parsed.data;

  const cls = await prisma.course.findUnique({
    where: { id: courseId },
    include: { lessons: { orderBy: { order: "asc" }, select: { title: true } } },
  });
  if (!cls) return NextResponse.json({ error: "Class not found" }, { status: 404 });

  const access = await getClassAccess(session, cls);
  if (!access.canManage) {
    return NextResponse.json({ error: "Only this class's instructor or an administrator can use the lesson writer" }, { status: 403 });
  }

  const blocked = await aiPreflight(req, "lesson-draft", session.user.id, 30);
  if (blocked) return blocked;

  const existing = cls.lessons.map((l, i) => `${i + 1}. ${l.title}`).join("\n") || "(none yet)";

  try {
    const draft = await generateStructured({
      schema: LessonDraft,
      effort: "medium",
      system: `${BRAND_VOICE}

You help academy instructors draft lesson notes. Write for adult learners who are new to the topic unless the class description implies otherwise. Be accurate to the classical tradition; where schools disagree, say so briefly. Keep notes between 250 and 600 words. The instructor will review and edit your draft before publishing.`,
      prompt: `Draft a lesson for this class.

<class>
Title: ${cls.title}
Description: ${cls.description}
</class>

<existing_lessons>
${existing}
</existing_lessons>

<new_lesson_title>${title}</new_lesson_title>
${brief ? `<instructor_notes>\n${brief}\n</instructor_notes>` : ""}

Build on the existing lessons without repeating them.`,
    });

    return NextResponse.json({
      draft: {
        summary: draft.summary.slice(0, 300),
        content: draft.content,
        durationMinutes: Math.min(60, Math.max(10, Math.round(draft.durationMinutes))),
      },
    });
  } catch (error) {
    if (error instanceof AiRefusalError) {
      return NextResponse.json({ error: "The lesson writer couldn't draft this topic. Try a different title." }, { status: 422 });
    }
    const { message, status } = describeAiError(error);
    return NextResponse.json({ error: message }, { status });
  }
}
