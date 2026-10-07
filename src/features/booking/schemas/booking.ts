import { z } from "zod";

/** Calendar date in the practice timezone. */
export const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD");

/** Wall-clock start time in the practice timezone. */
export const timeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Time must be HH:mm");

export const channelsSchema = z.array(z.enum(["EMAIL", "WHATSAPP"])).max(2).default([]);

/** Only http(s) links are accepted for a meeting URL. */
export const meetingLinkSchema = z
  .string()
  .trim()
  .url("Meeting link must be a valid URL")
  .refine((u) => /^https?:\/\//i.test(u), "Meeting link must start with http:// or https://");

export const createBookingSchema = z.object({
  serviceId: z.string().min(1, "Service selection is required"),
  scheduledDate: dateSchema,
  scheduledTime: timeSchema,
  clientName: z.string().trim().min(2, "Name must be at least 2 characters").max(70),
  clientEmail: z.string().trim().email("Valid email is required"),
  clientPhone: z.string().trim().min(6, "Valid phone or WhatsApp number is required").max(30),
  whatsappOptIn: z.boolean().default(true),
  /** What the learner wants out of the session. */
  goal: z.string().max(400).optional(),
  clientNotes: z.string().max(1000).optional(),
  instructorId: z.string().optional(),
});

/** What the client who owns a booking may do to it. */
export const clientActionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("cancel"), reason: z.string().max(500).optional() }),
  z.object({ action: z.literal("reschedule"), date: dateSchema, time: timeSchema }),
]);

/** What an administrator or the assigned mentor may do to a booking. */
export const adminActionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("approve"),
    meetingLink: meetingLinkSchema.optional().or(z.literal("")),
    message: z.string().max(1000).optional(),
    channels: channelsSchema,
  }),
  z.object({
    action: z.literal("decline"),
    reason: z.string().max(500).optional(),
    message: z.string().max(1000).optional(),
    channels: channelsSchema,
  }),
  z.object({
    action: z.literal("cancel"),
    reason: z.string().max(500).optional(),
    message: z.string().max(1000).optional(),
    channels: channelsSchema,
  }),
  z.object({
    action: z.literal("reschedule"),
    date: dateSchema,
    time: timeSchema,
    message: z.string().max(1000).optional(),
    channels: channelsSchema,
  }),
  z.object({ action: z.literal("complete") }),
  z.object({
    action: z.literal("update"),
    clientName: z.string().trim().min(2).max(70).optional(),
    clientEmail: z.string().trim().email().optional(),
    clientPhone: z.string().trim().min(6).max(30).optional(),
    whatsappOptIn: z.boolean().optional(),
    clientNotes: z.string().max(1000).nullable().optional(),
    meetingLink: meetingLinkSchema.nullable().optional().or(z.literal("")),
    adminNotes: z.string().max(2000).nullable().optional(),
  }),
  z.object({
    action: z.literal("reassign"),
    instructorId: z.string().nullable().optional(),
    reason: z.string().max(500).optional(),
    message: z.string().max(1000).optional(),
    channels: channelsSchema,
  }),
]);

/** Ad-hoc message an admin sends about a booking. */
export const notifySchema = z.object({
  kind: z
    .enum(["custom", "confirmed", "reminder", "rescheduled", "cancelled", "declined", "received"])
    .default("custom"),
  message: z.string().trim().max(1000).optional(),
  channels: z.array(z.enum(["EMAIL", "WHATSAPP"])).min(1, "Choose at least one channel").max(2),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type ClientAction = z.infer<typeof clientActionSchema>;
export type AdminAction = z.infer<typeof adminActionSchema>;
