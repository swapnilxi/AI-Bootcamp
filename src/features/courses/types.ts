/**
 * Shared shapes for the classes feature. These describe the JSON the feature's
 * API returns, so a host application can consume the endpoints without
 * depending on Prisma's generated types.
 */

export type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED";

export type ClassFilter =
  | "all"
  | "free"
  | "subscriber"
  | "protected"
  | "mine"
  | "teaching";

export interface InstructorRef {
  id: string;
  name?: string | null;
  avatarUrl?: string | null;
  role?: string | null;
  mentorType?: string | null;
}

/** A class as returned by `GET /api/courses` (catalog listing). */
export interface ClassSummary {
  id: string;
  title: string;
  slug: string;
  description: string;
  schedule: string | Date;
  durationMinutes: number;
  price: number;
  isSubscriberOnly: boolean;
  isPasswordProtected: boolean;
  instructor?: InstructorRef | null;
  enrollmentCount: number;
  lessonCount: number;
  completedLessons: number;
  isEnrolled: boolean;
  canManage: boolean;
  createdAt: string | Date;
}

/** A lesson row in a class's outline — content is withheld unless accessible. */
export interface LessonSummary {
  id: string;
  title: string;
  summary: string | null;
  durationMinutes: number | null;
  order: number;
  isPreview: boolean;
  approvalStatus: ApprovalStatus;
  rejectionReason: string | null;
  hasVideo: boolean;
  isAccessible: boolean;
  isCompleted: boolean;
}

/** Full lesson payload, returned only to viewers who may read the content. */
export interface LessonDetail extends LessonSummary {
  content: string;
  videoUrl: string | null;
}

/** A class as returned by `GET /api/courses/[id]`. */
export interface ClassDetail {
  id: string;
  title: string;
  slug: string;
  description: string;
  syllabus: string | null;
  /** Null unless the viewer may read the course materials. */
  content: string | null;
  schedule: string | Date;
  durationMinutes: number;
  price: number;
  isSubscriberOnly: boolean;
  isPasswordProtected: boolean;
  instructorId: string;
  approvalStatus: ApprovalStatus;
  isPublished: boolean;
  rejectionReason: string | null;
  instructor: InstructorRef | null;
  enrollmentCount: number;
  lessons: LessonSummary[];
  completedLessons: number;
  isEnrolled: boolean;
  unlockedWithPassword: boolean;
  canManage: boolean;
  canViewContent: boolean;
  createdAt: string | Date;
}
