import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { aiPreflight, sanitizeChat } from "@/lib/ai/guard";
import { streamTextResponse } from "@/lib/ai/stream";
import { TUTOR_SYSTEM } from "@/lib/ai/prompts";

/**
 * The AI Tutor.
 *
 * What makes it a tutor rather than a chatbot is the context block: the
 * learner's active path, skill standing and current page are assembled here and
 * prepended to the system prompt, so the model can pitch an answer at the right
 * level and point at the right next step.
 */

/** A compact picture of where the learner is, built from their skill graph. */
async function describeLearner(userId: string | undefined): Promise<string> {
  if (!userId) {
    return "The learner is signed out, so their progress is unknown. Keep answers self-contained and suggest they sign in to get personalised recommendations.";
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      streakDays: true,
      activePath: { select: { title: true, outcome: true } },
      skills: {
        select: { state: true, masteryPct: true, skill: { select: { name: true } } },
        orderBy: { masteryPct: "desc" },
      },
    },
  });
  if (!user) return "";

  const mastered = user.skills.filter((s) => s.state === "MASTERED").map((s) => s.skill.name);
  const inProgress = user.skills
    .filter((s) => s.state === "IN_PROGRESS")
    .map((s) => `${s.skill.name} (${s.masteryPct}%)`);
  const weak = user.skills
    .filter((s) => s.state === "IN_PROGRESS" && s.masteryPct < 50)
    .map((s) => s.skill.name);

  return [
    `Learner: ${user.name || "anonymous"}.`,
    user.activePath ? `Active path: ${user.activePath.title} — ${user.activePath.outcome}` : "No active path chosen yet.",
    mastered.length ? `Already mastered: ${mastered.join(", ")}.` : "",
    inProgress.length ? `Currently learning: ${inProgress.join(", ")}.` : "",
    weak.length
      ? `Weak areas worth steering toward: ${weak.join(", ")}. Do not assume fluency here.`
      : "",
    `Learning streak: ${user.streakDays} days.`,
  ]
    .filter(Boolean)
    .join("\n");
}

/** What the learner is looking at right now, resolved from the route they sent. */
async function describePage(contextKind: string, contextPath: string): Promise<string> {
  const slug = contextPath.split("/").filter(Boolean);

  if (contextKind === "lesson" && slug.length >= 4) {
    const lesson = await prisma.lesson.findUnique({
      where: { id: slug[3] },
      select: {
        title: true,
        objective: true,
        summary: true,
        keyTakeaways: true,
        commonMistakes: true,
        course: { select: { title: true } },
      },
    });
    if (lesson) {
      return `Currently reading the lesson "${lesson.title}" in the course "${lesson.course.title}".
Objective: ${lesson.objective || lesson.summary || "—"}
Key takeaways: ${JSON.stringify(lesson.keyTakeaways)}
Common mistakes on this topic: ${JSON.stringify(lesson.commonMistakes)}`;
    }
  }

  if (contextKind === "project" && slug.length >= 2) {
    const project = await prisma.project.findUnique({
      where: { slug: slug[1] },
      select: { title: true, problemStatement: true, architecture: true, requirements: true },
    });
    if (project) {
      return `Currently on the project "${project.title}".
Problem: ${project.problemStatement}
Intended architecture: ${project.architecture}
Requirements: ${JSON.stringify(project.requirements)}
Coach them toward their own solution — review and hint, do not hand over an implementation.`;
    }
  }

  if (contextKind === "lab" && slug.length >= 2) {
    const lab = await prisma.lab.findUnique({
      where: { slug: slug[1] },
      select: { title: true, summary: true, objectives: true, steps: true },
    });
    if (lab) {
      return `Currently in the "${lab.title}" lab. ${lab.summary}
Objectives: ${JSON.stringify(lab.objectives)}
Steps: ${JSON.stringify(lab.steps)}`;
    }
  }

  return `Currently on ${contextPath}.`;
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const preflight = await aiPreflight(req, "tutor", session?.user?.id, 40);
  if (!preflight.ok) return preflight.response;

  const body = await req.json().catch(() => ({}));
  const messages = sanitizeChat(body?.messages);
  if (!messages) {
    return NextResponse.json({ error: "A question is required." }, { status: 400 });
  }

  const contextKind = typeof body?.contextKind === "string" ? body.contextKind : "general";
  const contextPath = typeof body?.contextPath === "string" ? body.contextPath.slice(0, 200) : "/";

  const [learner, page] = await Promise.all([
    describeLearner(session?.user?.id),
    describePage(contextKind, contextPath),
  ]);

  const system = `${TUTOR_SYSTEM}

--- Learner context ---
${learner}

--- Current page ---
${page}`;

  return streamTextResponse({ credential: preflight.credential, system, messages, maxTokens: 2048, effort: "medium" });
}
