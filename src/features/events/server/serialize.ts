import { prisma } from "@/lib/prisma";

/** The subset of a User row the event UI needs to show a host. */
export const hostSelect = {
    id: true,
    name: true,
    avatarUrl: true,
    role: true,
    mentorType: true,
} as const;

export interface EventRow {
    id: string;
    title: string;
    slug: string;
    summary: string;
    category: string;
    location: string | null;
    isOnline: boolean;
    coverImage: string | null;
    startsAt: Date;
    endsAt: Date;
    timezone: string;
    capacity: number | null;
    price: unknown;
    hostId: string;
    approvalStatus: string;
    host: { id: string; name: string | null; avatarUrl: string | null; role: string | null; mentorType: string | null };
    _count: { interests: number };
}

/**
 * Shape an event row into the client-facing summary. `interestedIds` is the set
 * of events the viewer has flagged, so a single query covers the whole list.
 */
export function serializeEvent(
    event: EventRow,
    viewer: { id?: string | null; isAdmin: boolean } | null,
    interestedIds: Set<string> = new Set()
) {
    return {
        id: event.id,
        title: event.title,
        slug: event.slug,
        summary: event.summary,
        category: event.category,
        location: event.location,
        isOnline: event.isOnline,
        coverImage: event.coverImage,
        startsAt: event.startsAt,
        endsAt: event.endsAt,
        timezone: event.timezone,
        capacity: event.capacity,
        price: Number(event.price),
        host: event.host,
        interestCount: event._count.interests,
        isInterested: !!viewer?.id && interestedIds.has(event.id),
        isPast: event.endsAt.getTime() < Date.now(),
        approvalStatus: event.approvalStatus as "PENDING" | "APPROVED" | "REJECTED",
        canManage: !!viewer?.id && (viewer.isAdmin || event.hostId === viewer.id),
    };
}

/** Turn a title into a URL-safe slug, keeping it unique-ish and readable. */
export function slugify(title: string): string {
    return title
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 70) || "event";
}

/** Append a short random suffix so two events with the same title both save. */
export async function uniqueSlug(title: string): Promise<string> {
    const base = slugify(title);
    for (let attempt = 0; attempt < 5; attempt += 1) {
        const candidate = attempt === 0 ? base : `${base}-${Math.random().toString(36).slice(2, 6)}`;
        const clash = await prisma.event.findUnique({ where: { slug: candidate }, select: { id: true } });
        if (!clash) return candidate;
    }
    return `${base}-${Date.now().toString(36)}`;
}