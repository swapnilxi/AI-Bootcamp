import { prisma } from "@/lib/prisma";
import { notifyRoles, notifyUserId } from "@/lib/notify/dispatch";

/**
 * Creator-facing notifications: things instructors and mentors want to know about
 * their content, plus the review pings admins need when creators submit work.
 */

/** A creator submitted a course or lesson that now waits for admin review. */
export async function notifyReviewSubmitted(opts: {
  what: "course" | "lesson";
  course: { id: string; title: string };
  creatorId: string;
}) {
  const isCourse = opts.what === "course";
  await Promise.all([
    notifyRoles(
      ["ADMIN", "SUPER_ADMIN"],
      {
        kind: isCourse ? "review_submitted" : "review_submitted_lessons",
        title: isCourse ? `New course awaiting review: ${opts.course.title}` : `Lessons awaiting review in ${opts.course.title}`,
        body: isCourse
          ? `A creator submitted "${opts.course.title}". It stays hidden from learners until approved.`
          : `New lesson content was submitted in "${opts.course.title}" and needs approval.`,
        href: "/dashboard/admin",
        // Lessons arrive in bursts while authoring — keep admins' inboxes (and phones) quiet.
        coalesce: !isCourse,
        email: isCourse,
        push: isCourse,
      },
      { excludeUserId: opts.creatorId }
    ),
    notifyUserId(opts.creatorId, {
      kind: isCourse ? "review_submitted_ack" : "review_submitted_ack_lessons",
      title: isCourse ? `Submitted for review: ${opts.course.title}` : `Lesson submitted for review`,
      body: isCourse
        ? "An admin will review your course shortly. You'll be notified as soon as it's approved or needs changes."
        : `Your lesson in "${opts.course.title}" is waiting for admin approval.`,
      href: "/dashboard/instructor",
      coalesce: !isCourse,
      email: false,
      push: false,
    }),
  ]);
}

const MILESTONES = [1, 10, 25, 50, 100, 250, 500, 1000];

/** Celebrate round-number enrolment counts for the course's creator. */
export async function notifyEnrollmentMilestone(course: { id: string; title: string; instructorId: string }) {
  const count = await prisma.enrollment.count({ where: { courseId: course.id } });
  if (!MILESTONES.includes(count)) return;
  await notifyUserId(course.instructorId, {
    kind: "enrollment_milestone",
    title: count === 1 ? `First learner joined ${course.title}` : `${count} learners in ${course.title}`,
    body: count === 1 ? `Your first learner just enrolled in "${course.title}". Nice work!` : `"${course.title}" just reached ${count} enrolled learners.`,
    href: `/courses/${course.id}`,
    push: true,
  });
}

/** After a lesson is completed, tell learner + creator if that finished the whole course. */
export async function notifyIfCourseCompleted(userId: string, course: { id: string; title: string; instructorId: string }) {
  const lessons = await prisma.lesson.findMany({ where: { courseId: course.id, approvalStatus: "APPROVED" }, select: { id: true } });
  if (lessons.length === 0) return;
  const done = await prisma.lessonProgress.count({ where: { userId, lessonId: { in: lessons.map((l) => l.id) } } });
  if (done < lessons.length) return;

  const learner = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
  await Promise.all([
    notifyUserId(userId, {
      kind: "course_completed",
      title: `Course complete: ${course.title}`,
      body: `You finished every lesson in "${course.title}". Great work — see what to learn next.`,
      href: "/progress",
      email: false,
    }),
    course.instructorId !== userId
      ? notifyUserId(course.instructorId, {
          kind: "learner_completed",
          title: `A learner finished ${course.title}`,
          body: `${learner?.name || "A learner"} completed all lessons in "${course.title}".`,
          href: `/courses/${course.id}`,
          email: false,
          push: false,
        })
      : Promise.resolve(),
  ]);
}
