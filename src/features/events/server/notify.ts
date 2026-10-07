import { prisma } from "@/lib/prisma";
import { EVENT_PATHS } from "../routes";

/**
 * Event notices are recorded in `NotificationLog` rather than sent through the
 * booking pipeline, which is scoped to `Booking` rows. Like the classes
 * approval route, these are best-effort audit entries: a failure here must
 * never fail the request that triggered it.
 */
async function record(entry: {
    kind: string;
    recipient: string;
    userId?: string;
    subject: string;
    body: string;
    sentById?: string;
}) {
    await prisma.notificationLog
        .create({
            data: {
                channel: "EMAIL",
                kind: entry.kind,
                recipient: entry.recipient,
                subject: entry.subject,
                body: entry.body.slice(0, 4000),
                status: "SENT",
                userId: entry.userId,
                sentById: entry.sentById,
            },
        })
        .catch((err) => console.error("event notification log failed:", err));
}

const displayName = (name?: string | null) => name || "there";

/** Tell the host their event was approved (or rejected) by an admin. */
export async function notifyHostOfDecision(event: {
    id: string;
    title: string;
    approvalStatus: string;
    rejectionReason?: string | null;
    host: { id: string; name: string | null; email: string } | null;
    reviewedById?: string;
}) {
    if (!event.host?.email) return;
    const approved = event.approvalStatus === "APPROVED";
    const url = EVENT_PATHS.detail(event.id);

    await record({
        kind: approved ? "event_approved" : "event_status_change",
        recipient: event.host.email,
        userId: event.host.id,
        sentById: event.reviewedById,
        subject: `Event review update: ${event.title}`,
        body: approved
            ? `Greetings ${displayName(event.host.name)},\n\nYour event "${event.title}" has been approved by administration and is now visible to members.\n\nManage your events: ${url}`
            : `Greetings ${displayName(event.host.name)},\n\nYour event "${event.title}" was not approved.\nReason: ${event.rejectionReason || "Not specified"}\n\nRevise it and resubmit: ${url}`,
    });
}

/** Tell the member who requested an event that it has been approved. */
export async function notifyRequesterOfApproval(event: {
    id: string;
    title: string;
    originRequestId?: string | null;
    originRequest?: {
        requester: { id: string; name: string | null; email: string };
    } | null;
    reviewedById?: string;
}) {
    const requester = event.originRequest?.requester;
    if (!requester?.email) return;

    await record({
        kind: "event_request_approved",
        recipient: requester.email,
        userId: requester.id,
        sentById: event.reviewedById,
        subject: `Your requested event is confirmed: ${event.title}`,
        body: `Dear ${displayName(requester.name)},\n\nGood news — the event you requested, "${event.title}", has been approved and is now open to members.\n\nView the event: ${EVENT_PATHS.detail(event.id)}`,
    });
}

/** Ask admins to review a newly submitted instructor event. */
export async function alertAdminsOfSubmission(event: {
    id: string;
    title: string;
    startsAt: Date;
    host: { name: string | null };
}) {
    const admins = await prisma.user.findMany({
        where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } },
        select: { id: true, email: true },
    });

    await Promise.all(
        admins.map((admin) =>
            record({
                kind: "event_submitted",
                recipient: admin.email,
                userId: admin.id,
                subject: `Event awaiting approval: ${event.title}`,
                body: `${displayName(event.host.name)} submitted "${event.title}" for ${event.startsAt.toDateString()}.\n\nThis event is not visible to members until it is approved.\n\nReview it: ${EVENT_PATHS.detail(event.id)}`,
            })
        )
    );
}

/** Notify an admin or instructor that a member tagged them with a request. */
export async function notifyTaggedUserOfRequest(request: {
    id: string;
    title: string;
    taggedUser?: { id: string; name: string | null; email: string } | null;
    requester?: { name: string | null } | null;
}) {
    if (!request?.taggedUser?.email) return;

    await record({
        kind: "event_request_tagged",
        recipient: request.taggedUser.email,
        userId: request.taggedUser.id,
        subject: `A member requested an event: ${request.title}`,
        body: `Greetings ${displayName(request.taggedUser.name)},\n\n${displayName(request.requester?.name)} has asked the practice to host an event titled "${request.title}".\n\nPlan it from your dashboard: ${EVENT_PATHS.list}`,
    });
}

/** Tell a member their request was picked up, or politely declined. */
export async function notifyRequesterOfStatus(request: {
    id: string;
    title: string;
    status: string;
    adminNotes?: string | null;
    requester?: { id: string; name: string | null; email: string } | null;
    eventId?: string | null;
}) {
    if (!request.requester?.email) return;
    const planned = request.status === "PLANNED";

    await record({
        kind: planned ? "event_request_planned" : "event_request_declined",
        recipient: request.requester.email,
        userId: request.requester.id,
        subject: planned
            ? `We're planning your event: ${request.title}`
            : `An update on your event request: ${request.title}`,
        body: planned
            ? `Dear ${displayName(request.requester.name)},\n\nThank you for suggesting "${request.title}". We are planning it now — you will hear from us again once it is announced.\n\nRequest details: ${EVENT_PATHS.list}`
            : `Dear ${displayName(request.requester.name)},\n\nThank you for suggesting "${request.title}". We are not able to host this one at the present time.\n\n${request.adminNotes ? `Notes: ${request.adminNotes}\n\n` : ""}You are always welcome to suggest another.`,
    });
}