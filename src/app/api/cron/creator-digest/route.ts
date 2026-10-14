import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notifyUserId } from "@/lib/notify/dispatch";

/**
 * Weekly creator digest: one summary per instructor/mentor covering the last 7 days.
 * Called by Vercel Cron (see vercel.json); protected by CRON_SECRET. Creators with
 * nothing to report are skipped, so quiet weeks send nothing.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const since = new Date(Date.now() - 7 * 86_400_000);
  const creators = await prisma.user.findMany({
    where: { role: { in: ["INSTRUCTOR", "ADMIN", "SUPER_ADMIN"] }, createdCourses: { some: {} } },
    select: { id: true, createdCourses: { select: { id: true, title: true } } },
  });

  let sent = 0;
  for (const c of creators) {
    const courseIds = c.createdCourses.map((x) => x.id);
    const [enrolled, completed, pendingLessons, rejectedLessons, interested] = await Promise.all([
      prisma.enrollment.count({ where: { courseId: { in: courseIds }, enrolledAt: { gte: since } } }),
      prisma.lessonProgress.count({ where: { lesson: { courseId: { in: courseIds } }, completedAt: { gte: since } } }),
      prisma.lesson.count({ where: { courseId: { in: courseIds }, approvalStatus: "PENDING" } }),
      prisma.lesson.count({ where: { courseId: { in: courseIds }, approvalStatus: "REJECTED" } }),
      prisma.eventInterest.count({ where: { event: { hostId: c.id }, createdAt: { gte: since } } }),
    ]);
    if (!enrolled && !completed && !pendingLessons && !rejectedLessons && !interested) continue;

    const lines = [
      enrolled && `${enrolled} new ${enrolled === 1 ? "learner" : "learners"} enrolled`,
      completed && `${completed} ${completed === 1 ? "lesson was" : "lessons were"} completed by your learners`,
      interested && `${interested} new ${interested === 1 ? "person is" : "people are"} interested in your events`,
      pendingLessons && `${pendingLessons} ${pendingLessons === 1 ? "lesson is" : "lessons are"} waiting for admin review`,
      rejectedLessons && `${rejectedLessons} ${rejectedLessons === 1 ? "lesson needs" : "lessons need"} changes before approval`,
    ].filter(Boolean);

    await notifyUserId(c.id, {
      kind: "creator_digest",
      title: "Your week on AI Bootcamp",
      body: lines.map((l) => `• ${l}`).join("\n"),
      href: "/dashboard/instructor",
      push: false,
    });
    sent++;
  }

  return NextResponse.json({ creators: creators.length, sent });
}
