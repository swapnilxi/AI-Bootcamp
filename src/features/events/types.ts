/**
 * Shared shapes for the events feature. These describe the JSON the feature's
 * API returns, so a host application can consume the endpoints without
 * depending on Prisma's generated types.
 */

export type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED";

/** Lifecycle of a community request, from "nobody has looked at it yet". */
export type EventRequestStatus = "OPEN" | "PLANNED" | "DECLINED";

export type EventCategory = "Workshop" | "Webinar" | "Retreat" | "Circle" | "Course";

export const EVENT_CATEGORIES: EventCategory[] = ["Workshop", "Webinar", "Retreat", "Circle", "Course"];

/**
 * Catalog filters. `upcoming` and `past` split the approved list by the current
 * clock; `mine` is what the signed-in member has flagged interest in, and
 * `hosting` / `requests` are the staff views.
 */
export type EventFilter =
    | "all"
    | "upcoming"
    | "past"
    | "online"
    | "mine"
    | "hosting"
    | "pending";

export interface HostRef {
    id: string;
    name?: string | null;
    avatarUrl?: string | null;
    role?: string | null;
    mentorType?: string | null;
    bio?: string | null;
}

/** An event as returned by `GET /api/events` (catalog listing). */
export interface EventSummary {
    id: string;
    title: string;
    slug: string;
    summary: string;
    category: string;
    location: string | null;
    isOnline: boolean;
    coverImage: string | null;
    startsAt: string | Date;
    endsAt: string | Date;
    timezone: string;
    capacity: number | null;
    price: number;
    host: HostRef | null;
    interestCount: number;
    isInterested: boolean;
    isPast: boolean;
    approvalStatus: ApprovalStatus;
    canManage: boolean;
}

/** A single event as returned by `GET /api/events/[id]`. */
export interface EventDetail extends EventSummary {
    description: string;
    meetingUrl: string | null;
    hostId: string;
    rejectionReason: string | null;
    isPublished: boolean;
    interests: { userId: string; name: string | null; avatarUrl: string | null; createdAt: string | Date }[];
    /** Set when the event fulfils a community request, so the UI can credit it. */
    originRequestId: string | null;
}

/** A community request, returned by the request endpoints. */
export interface EventRequestSummary {
    id: string;
    title: string;
    details: string;
    category: string;
    proposedDate: string | Date | null;
    status: EventRequestStatus;
    adminNotes: string | null;
    eventId: string | null;
    createdAt: string | Date;
    requester: HostRef | null;
    taggedUser: HostRef | null;
}