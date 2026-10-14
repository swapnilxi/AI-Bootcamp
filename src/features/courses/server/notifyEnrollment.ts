import { notifyUserId } from "@/lib/notify/dispatch";
import { notifyEnrollmentMilestone } from "./notifyCreator";

/** Confirm to the learner and tell the instructor of record about a new enrolment. */
export async function enrollmentNotices(
  learnerId: string,
  learnerName: string | null | undefined,
  course: { id: string; title: string; instructorId: string }
) {
  const href = `/courses/${course.id}`;
  await Promise.all([
    notifyUserId(learnerId, {
      kind: "enrollment_confirmed",
      title: `You're enrolled: ${course.title}`,
      body: `Your seat in "${course.title}" is confirmed. Pick up where you left off any time.`,
      href,
    }),
    // Instructors don't need an email per learner — in-app only avoids inbox spam.
    course.instructorId !== learnerId
      ? notifyUserId(course.instructorId, {
          kind: "new_enrollment",
          title: `New learner in ${course.title}`,
          body: `${learnerName || "A learner"} just enrolled in "${course.title}".`,
          href,
          email: false,
        })
      : Promise.resolve(),
    notifyEnrollmentMilestone(course),
  ]);
}
