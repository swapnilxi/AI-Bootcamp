import { z } from "zod";

const optionalUrl = z
  .string()
  .trim()
  .url("Video link must be a valid URL")
  .or(z.literal(""))
  .optional()
  .transform((v) => (v ? v : null));

export const createLessonSchema = z.object({
  title: z.string().trim().min(3, "Lesson title must be at least 3 characters").max(140),
  summary: z.string().trim().max(300).optional().transform((v) => (v ? v : null)),
  content: z.string().trim().min(10, "Lesson notes must be at least 10 characters"),
  videoUrl: optionalUrl,
  durationMinutes: z.coerce.number().int().min(1).max(600).optional().nullable(),
  isPreview: z.boolean().default(false),
  showAuthor: z.boolean().default(true),
});

export const updateLessonSchema = z.object({
  title: z.string().trim().min(3).max(140).optional(),
  summary: z.string().trim().max(300).optional().transform((v) => (v === undefined ? undefined : v || null)),
  content: z.string().trim().min(10).optional(),
  videoUrl: z
    .string()
    .trim()
    .url("Video link must be a valid URL")
    .or(z.literal(""))
    .optional()
    .transform((v) => (v === undefined ? undefined : v || null)),
  durationMinutes: z.coerce.number().int().min(1).max(600).optional().nullable(),
  isPreview: z.boolean().optional(),
  showAuthor: z.boolean().optional(),
});

export const reorderLessonsSchema = z.object({
  lessonIds: z.array(z.string().min(1)).min(1),
});
