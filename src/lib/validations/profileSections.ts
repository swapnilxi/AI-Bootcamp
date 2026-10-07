import { z } from "zod";

const text = (max: number) => z.string().max(max).default("");

/** Only web links or site-relative paths: blocks javascript:, data: and similar schemes. */
const safeUrl = z
  .string()
  .max(2000)
  .refine((u) => u === "" || /^https?:\/\//i.test(u) || (u.startsWith("/") && !u.startsWith("//")), {
    message: "Links must start with http:// or https://",
  })
  .default("");

const id = z.string().min(1).max(64);

const item = z.discriminatedUnion("kind", [
  z.object({ id, kind: z.literal("text"), value: text(5000) }),
  z.object({ id, kind: z.literal("bullet"), text: text(600), icon: z.string().max(16).optional() }),
  z.object({
    id,
    kind: z.literal("testimonial"),
    quote: text(1500),
    author: text(120),
    role: z.string().max(120).optional(),
    avatarInitial: z.string().max(4).optional(),
  }),
  z.object({ id, kind: z.literal("faq"), question: text(300), answer: text(2000) }),
  z.object({
    id,
    kind: z.literal("credential"),
    title: text(200),
    institution: z.string().max(200).optional(),
    year: z.string().max(10).optional(),
    icon: z.string().max(16).optional(),
  }),
  z.object({ id, kind: z.literal("video"), url: safeUrl, caption: z.string().max(200).optional() }),
  z.object({ id, kind: z.literal("gallery"), imageUrl: safeUrl, caption: z.string().max(200).optional() }),
]);

const section = z.object({
  id,
  type: z.enum([
    "bio_extended", "philosophy", "journey", "credentials", "offerings", "testimonials",
    "video_intro", "gallery", "faq", "mantra", "research", "custom",
  ]),
  title: z.string().trim().min(1, "Every section needs a title").max(120),
  icon: z.string().max(16).default(""),
  content: text(10000),
  items: z.array(item).max(40).default([]),
  visible: z.boolean().default(true),
  order: z.number().int().min(0).max(1000).default(0),
});

export const profileSectionsSchema = z.array(section).max(30, "A profile can have at most 30 sections");

/** Parse and validate the JSON string sent by the profile editor; returns normalized JSON. */
export function parseProfileSections(raw: string): { ok: true; json: string } | { ok: false; error: string } {
  if (raw.length > 300_000) return { ok: false, error: "Profile sections are too large" };
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return { ok: false, error: "Profile sections must be valid JSON" };
  }
  const parsed = profileSectionsSchema.safeParse(data);
  if (!parsed.success) {
    const issue = parsed.error.errors[0];
    return { ok: false, error: issue?.message || "Invalid profile sections" };
  }
  return { ok: true, json: JSON.stringify(parsed.data) };
}
