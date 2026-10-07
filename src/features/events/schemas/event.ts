import { z } from "zod";

const isoDate = z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date or time" });

export const createEventSchema = z
    .object({
        title: z.string().min(3, "Title must be at least 3 characters").max(140),
        summary: z.string().min(10, "Summary must be at least 10 characters").max(300),
        description: z.string().min(20, "Description must be at least 20 characters"),
        category: z.string().default("Workshop"),
        location: z.string().max(200).optional().nullable(),
        isOnline: z.boolean().default(false),
        meetingUrl: z.string().url("Enter a valid meeting link").optional().nullable().or(z.literal("")),
        coverImage: z.string().url("Enter a valid image URL").optional().nullable().or(z.literal("")),
        startsAt: isoDate,
        endsAt: isoDate,
        timezone: z.string().default("America/New_York"),
        capacity: z.coerce.number().int().min(1).max(100000).optional().nullable(),
        price: z.coerce.number().min(0).default(0),
        /** Admins may host on behalf of an instructor; instructors host their own. */
        hostId: z.string().optional(),
        /** Plan this event from a community request, and credit the requester. */
        requestId: z.string().optional(),
    })
    .refine((data) => Date.parse(data.endsAt) > Date.parse(data.startsAt), {
        message: "The end time must be after the start time",
        path: ["endsAt"],
    })
    .refine((data) => !data.isOnline || !!data.meetingUrl || !!data.location, {
        message: "An online event needs a meeting link",
        path: ["meetingUrl"],
    });

export const updateEventSchema = z
    .object({
        title: z.string().min(3).max(140).optional(),
        summary: z.string().min(10).max(300).optional(),
        description: z.string().min(20).optional(),
        category: z.string().optional(),
        location: z.string().max(200).optional().nullable(),
        isOnline: z.boolean().optional(),
        meetingUrl: z.string().url().optional().nullable().or(z.literal("")),
        coverImage: z.string().url().optional().nullable().or(z.literal("")),
        startsAt: isoDate.optional(),
        endsAt: isoDate.optional(),
        timezone: z.string().optional(),
        capacity: z.coerce.number().int().min(1).max(100000).optional().nullable(),
        price: z.coerce.number().min(0).optional(),
    })
    .refine(
        (data) => !(data.startsAt && data.endsAt) || Date.parse(data.endsAt) > Date.parse(data.startsAt),
        { message: "The end time must be after the start time", path: ["endsAt"] }
    );

export const eventApprovalSchema = z.object({
    approvalStatus: z.enum(["APPROVED", "REJECTED", "PENDING"]).optional(),
    rejectionReason: z.string().max(1000).optional().nullable(),
});

export const createEventRequestSchema = z.object({
    title: z.string().min(3, "Give your request a short title").max(140),
    details: z.string().min(20, "Tell us a little more about the event you have in mind"),
    category: z.string().default("Workshop"),
    proposedDate: isoDate.optional().nullable(),
    /** Tag an admin or instructor who should help plan this. */
    taggedUserId: z.string().optional().nullable(),
});

export const updateEventRequestSchema = z.object({
    title: z.string().min(3).max(140).optional(),
    details: z.string().min(20).optional(),
    category: z.string().optional(),
    proposedDate: isoDate.optional().nullable(),
    taggedUserId: z.string().optional().nullable(),
    adminNotes: z.string().max(1000).optional().nullable(),
    status: z.enum(["OPEN", "PLANNED", "DECLINED"]).optional(),
});