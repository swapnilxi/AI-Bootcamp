/**
 * Classes feature — public, client-safe surface.
 *
 * Everything exported here is safe to import from a client component. Server
 * pieces (Prisma queries, access checks, route handlers) live behind
 * `@/features/courses/server` so they never reach the browser bundle.
 */

// Types
export type { ClassItem } from "./components/ClassCard";
export type {
  ClassSummary,
  ClassDetail,
  LessonSummary,
  LessonDetail,
  ClassFilter,
  ApprovalStatus,
} from "./types";

// Validation schemas (isomorphic — reusable on the client for form validation)
export {
  createClassSchema,
  updateClassSchema,
  unlockClassSchema,
} from "./schemas/class";
export {
  createLessonSchema,
  updateLessonSchema,
  reorderLessonsSchema,
} from "./schemas/lesson";

// Components
export { ClassCard } from "./components/ClassCard";
export { InstructorSelect } from "./components/InstructorSelect";
export { LessonManager } from "./components/LessonManager";
export { PasswordUnlockModal } from "./components/PasswordUnlockModal";

// Hooks
export { useClasses } from "./hooks/useClasses";

// Route paths the feature owns, so a host app can mount them elsewhere
export { CLASS_ROUTES } from "./routes";
