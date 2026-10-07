import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/roles";
import { updateEventSchema } from "../../schemas/event";
import { canManageEvent } from "../access";
import { hostSelect, serializeEvent } from "../serialize";

interface RouteParams {
    params: Promise<{ id: string }>;
}

const fullInclude = {
    host: { select: hostSelect },
    _count: { select: { interests: true } },
} as const;

/** Load an event, or return null if it does not exist / must stay hidden. */
export async function loadVisibleEvent(id: string, viewer: { id?: string | null; isAdmin: boolean } | null) {
    const event = await prisma.event.findUnique({ where: { id }, include: fullInclude });
    if (!event) return { event: null, hidden: false };
    const isVisible = event.approvalStatus === "APPROVED" && event.isPublished;
    if (!isVisible && !viewer?.isAdmin) {
        // The host may preview their own pending event; nobody else can.
        const isHost = !!viewer?.id && event.hostId === viewer.id;
        if (!isHost) return { event: null, hidden: true };
    }
    return { event, hidden: false };
}

/** GET /api/events/[id] — a single event, hidden unless approved or viewable. */
export async function GET(_req: Request, { params }: RouteParams) {
    try {
        const { id } = await params;
        const session = await getServerSession(authOptions);
        const isAdmin = !!session?.user?.role && isAdminRole(session.user.role);
        const viewer = session?.user?.id ? { id: session.user.id, isAdmin } : null;

        const { event } = await loadVisibleEvent(id, viewer);
        if (!event) {
            return NextResponse.json({ error: "Event not found" }, { status: 404 });
        }

        const interestedIds = new Set<string>();
        if (session?.user?.id) {
            const mine = await prisma.eventInterest.findUnique({
                where: { eventId_userId: { eventId: event.id, userId: session.user.id } },
                select: { eventId: true },
            });
            if (mine) interestedIds.add(mine.eventId);
        }

        // The meeting link is only for people who committed to the event.
        const interests = await prisma.eventInterest.findMany({
            where: { eventId: event.id },
            include: { user: { select: { id: true, name: true, avatarUrl: true } } },
            orderBy: { createdAt: "asc" },
        });

        const base = serializeEvent(event, viewer, interestedIds);

        return NextResponse.json({
            event: {
                ...base,
                description: event.description,
                meetingUrl: base.isInterested || viewer?.isAdmin || base.canManage ? event.meetingUrl : null,
                hostId: event.hostId,
                rejectionReason: event.rejectionReason,
                isPublished: event.isPublished,
                originRequestId: event.originRequestId,
                interests: interests.map((i) => ({
                    userId: i.user.id,
                    name: i.user.name,
                    avatarUrl: i.user.avatarUrl,
                    createdAt: i.createdAt,
                })),
            },
        });
    } catch (error) {
        console.error("GET event error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

/**
 * PATCH /api/events/[id] — the host or an admin edits the event.
 * Edits to an already-approved event return it to `PENDING` so an admin can
 * re-review the changes, unless the editor is an admin themselves.
 */
export async function PATCH(req: Request, { params }: RouteParams) {
    try {
        const { id } = await params;
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const existing = await prisma.event.findUnique({ where: { id }, select: { id: true, hostId: true, approvalStatus: true } });
        if (!existing) return NextResponse.json({ error: "Event not found" }, { status: 404 });
        if (!canManageEvent(session.user.role, session.user.id, existing.hostId)) {
            return NextResponse.json({ error: "Forbidden: You cannot edit this event" }, { status: 403 });
        }

        const body = await req.json().catch(() => ({}));
        const parsed = updateEventSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: parsed.error.errors[0]?.message || "Invalid payload" },
                { status: 400 }
            );
        }

        const isAdmin = isAdminRole(session.user.role);
        const data = parsed.data;

        // If both dates are updated together, re-check the ordering.
        const startsAt = data.startsAt ? new Date(data.startsAt) : undefined;
        const endsAt = data.endsAt ? new Date(data.endsAt) : undefined;
        if (startsAt && endsAt && endsAt.getTime() <= startsAt.getTime()) {
            return NextResponse.json({ error: "The end time must be after the start time" }, { status: 400 });
        }

        // A non-admin editing an approved event sends it back for review.
        const needsRereview = !isAdmin && existing.approvalStatus === "APPROVED";

        const event = await prisma.event.update({
            where: { id },
            data: {
                title: data.title,
                summary: data.summary,
                description: data.description,
                category: data.category,
                location: data.location,
                isOnline: data.isOnline,
                meetingUrl: data.meetingUrl === "" ? null : data.meetingUrl,
                coverImage: data.coverImage === "" ? null : data.coverImage,
                startsAt,
                endsAt,
                timezone: data.timezone,
                capacity: data.capacity,
                price: data.price,
                ...(needsRereview
                    ? { approvalStatus: "PENDING", isPublished: false, approvedAt: null }
                    : {}),
            },
            include: fullInclude,
        });

        return NextResponse.json({ event: serializeEvent(event, { id: session.user.id, isAdmin }, new Set()) });
    } catch (error) {
        console.error("PATCH event error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

/** DELETE /api/events/[id] — hosts and admins remove an event. */
export async function DELETE(_req: Request, { params }: RouteParams) {
    try {
        const { id } = await params;
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const existing = await prisma.event.findUnique({ where: { id }, select: { hostId: true } });
        if (!existing) return NextResponse.json({ error: "Event not found" }, { status: 404 });
        if (!canManageEvent(session.user.role, session.user.id, existing.hostId)) {
            return NextResponse.json({ error: "Forbidden: You cannot delete this event" }, { status: 403 });
        }

        await prisma.event.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("DELETE event error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}