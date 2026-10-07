/**
 * Every URL the classes feature talks to, in one place. A host application that
 * mounts the feature's route handlers under a different prefix only has to
 * change `base` here.
 */
const base = "/api/courses";

export const CLASS_ROUTES = {
  base,
  list: (filter?: string) => (filter && filter !== "all" ? `${base}?filter=${filter}` : base),
  detail: (id: string) => `${base}/${id}`,
  enroll: (id: string) => `${base}/${id}/enroll`,
  unlock: (id: string) => `${base}/${id}/unlock`,
  checkout: (id: string) => `${base}/${id}/checkout`,
  lessons: (id: string) => `${base}/${id}/lessons`,
  lessonsReorder: (id: string) => `${base}/${id}/lessons/reorder`,
  lesson: (id: string, lessonId: string) => `${base}/${id}/lessons/${lessonId}`,
  lessonProgress: (id: string, lessonId: string) => `${base}/${id}/lessons/${lessonId}/progress`,
  lessonQuiz: (id: string, lessonId: string) => `${base}/${id}/lessons/${lessonId}/quiz`,
  lessonAssistant: (id: string, lessonId: string) => `${base}/${id}/lessons/${lessonId}/assistant`,
  /** Stripe posts here; not called by the client. */
  stripeWebhook: "/api/webhooks/stripe",
} as const;
