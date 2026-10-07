import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Serves a practice set.
 *
 * `mode=weak` is the adaptive path: it reads the learner's skill standing and
 * draws questions from whatever they are weakest at, which is the difference
 * between a question bank and a practice engine.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const skill = url.searchParams.get("skill");
  const kind = url.searchParams.get("kind");
  const mode = url.searchParams.get("mode") ?? "mixed";
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 10) || 10, 25);

  const session = await getServerSession(authOptions);
  const where: Record<string, unknown> = { status: "PUBLISHED" };

  if (skill) where.skill = { slug: skill };
  if (kind) where.kind = kind;

  if (mode === "weak" && session?.user?.id) {
    const weak = await prisma.userSkill.findMany({
      where: { userId: session.user.id, state: "IN_PROGRESS", masteryPct: { lt: 50 } },
      select: { skillId: true },
      orderBy: { masteryPct: "asc" },
      take: 4,
    });
    if (weak.length > 0) where.skillId = { in: weak.map((w) => w.skillId) };
  }

  const questions = await prisma.practiceQuestion.findMany({
    where,
    take: limit,
    include: { skill: { select: { slug: true, name: true } } },
    orderBy: { createdAt: "asc" },
  });

  // The answer and explanation are withheld until the learner has answered;
  // shipping them with the question would make the drill pointless.
  return NextResponse.json({
    questions: questions.map((q) => ({
      id: q.id,
      kind: q.kind,
      difficulty: q.difficulty,
      prompt: q.prompt,
      options: q.options,
      hint: q.hint,
      estimatedMinutes: q.estimatedMinutes,
      skill: q.skill,
    })),
  });
}
