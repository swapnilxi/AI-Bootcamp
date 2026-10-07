import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Records one answer and returns the verdict.
 *
 * The attempt is also what moves the skill graph: mastery is recomputed from
 * the learner's running accuracy on that skill, so practice is the mechanism by
 * which a skill goes from in-progress to mastered.
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const questionId = typeof body?.questionId === "string" ? body.questionId : null;
  const answer = typeof body?.answer === "string" ? body.answer.slice(0, 4000) : "";
  const confidence = Number.isInteger(body?.confidence) ? body.confidence : null;
  const timeSpentSec = Number.isFinite(body?.timeSpentSec) ? Math.round(body.timeSpentSec) : 0;

  if (!questionId) {
    return NextResponse.json({ error: "questionId is required" }, { status: 400 });
  }

  const question = await prisma.practiceQuestion.findUnique({
    where: { id: questionId },
    select: { id: true, answer: true, explanation: true, skillId: true, options: true },
  });
  if (!question) {
    return NextResponse.json({ error: "Question not found" }, { status: 404 });
  }

  const isCorrect = answer.trim().toLowerCase() === question.answer.trim().toLowerCase();

  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (userId) {
    await prisma.practiceAttempt.create({
      data: { userId, questionId, answer, isCorrect, confidence, timeSpentSec },
    });

    if (question.skillId) {
      const existing = await prisma.userSkill.findUnique({
        where: { userId_skillId: { userId, skillId: question.skillId } },
      });
      const attempts = (existing?.attempts ?? 0) + 1;
      const correct = (existing?.correct ?? 0) + (isCorrect ? 1 : 0);
      const masteryPct = Math.round((correct / attempts) * 100);

      await prisma.userSkill.upsert({
        where: { userId_skillId: { userId, skillId: question.skillId } },
        update: {
          attempts,
          correct,
          masteryPct,
          lastPracticedAt: new Date(),
          state: masteryPct >= 80 && attempts >= 3 ? "MASTERED" : "IN_PROGRESS",
        },
        create: {
          userId,
          skillId: question.skillId,
          attempts,
          correct,
          masteryPct,
          lastPracticedAt: new Date(),
          state: "IN_PROGRESS",
        },
      });
    }
  }

  return NextResponse.json({
    isCorrect,
    correctAnswer: question.answer,
    explanation: question.explanation,
    recorded: !!userId,
  });
}
