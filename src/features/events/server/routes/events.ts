import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/roles";
import { createEventSchema } from "../../schemas/event";
import { canHostEvents } from "../access";
import { alertAdminsOfSubmission } from "../notify";
import { hostSelect, serializeEvent, uniqueSlug } from "../serialize";

/**
 * GET /api/events
 * Public catalog. Members only ever see approved, published events; the host
 * of an event and admins additionally see pending ones so they can track status.
 */
export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        const { searchParams } = new URL(req.url);
        const filter = searchParams.get("filter") ?? "all";

        const isAdmin = !!session?.user?.role && isAdminRole(session.user.role);
        const viewerId = session?.user?.id ?? null;
        const now = new Date();

        const where: Record<string, unknown> = {};

        // Visibility gate: by default only approved + published events are visible.
        const staffFilter = filter === "hosting" || filter === "pending";
        if (staffFilter) {
            if (!canHostEvents(session?.user?.role)) {
                return NextResponse.json({ events: [] });
            }
            if (filter === "hosting") {
                where.hostId = viewerId ?? "__none__";
                where.startsAt = { gte: now };
            } else {
                where.approvalStatus = "PENDING";
                if (!isAdmin) where.hostId = viewerId ?? "__none__";
            }
        } else if (!isAdmin) {
            where.approvalStatus = "APPROVED";
            where.isPublished = true;
        }

        if (filter === "upcoming") {
            where.startsAt = { gte: now };
        } else if (filter === "past") {
            where.endsAt = { lt: now };
        } else if (filter === "online") {
            where.isOnline = true;
        } else if (filter === "mine" && viewerId) {
            where.interests = { some: { userId: viewerId } };
            where.approvalStatus = "APPROVED";
        } else if (filter === "mine") {
            return NextResponse.json({ events: [] });
        }

        const events = await prisma.event.findMany({
            where,
            include: { host: { select: hostSelect }, _count: { select: { interests: true } } },
            orderBy: { startsAt: filter === "past" ? "desc" : "asc" },
        });

        // One extra query for the viewer's interests, rather than one per event.
        const interestedIds = new Set<string>();
        if (viewerId && events.length) {
            const rows = await prisma.eventInterest.findMany({
                where: { userId: viewerId, eventId: { in: events.map((e) => e.id) } },
                select: { eventId: true },
            });
            rows.forEach((r) => interestedIds.add(r.eventId));
        }

        const viewer = viewerId ? { id: viewerId, isAdmin } : null;
        return NextResponse.json({
            events: events.map((e) => serializeEvent(e, viewer, interestedIds)),
        });
    } catch (error) {
        console.error("GET events error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

/**
 * POST /api/events
 * Instructors, admins and super admins may create an event at any time. The
 * event is created `PENDING` and invisible to members until an admin approves
 * it; the host is responsible for tracking its approval state.
 *
 * Optionally pass `requestId` to build the event out of a community request,
 * which links the requester to the event so they are told when it is approved.
 */
export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        if (!canHostEvents(session.user.role)) {
            return NextResponse.json(
                { error: "Forbidden: Only instructors and administrators can create events" },
                { status: 403 }
            );
        }

        const body = await req.json().catch(() => ({}));
        const parsed = createEventSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: parsed.error.errors[0]?.message || "Invalid payload" },
                { status: 400 }
            );
        }
        const data = parsed.data;

        // Admins may host on behalf of an approved instructor; instructors cannot.
        let hostId = session.user.id;
        if (data.hostId && data.hostId !== session.user.id) {
            if (!isAdminRole(session.user.role)) {
                return NextResponse.json(
                    { error: "Forbidden: Only administrators can assign another host" },
                    { status: 403 }
                );
            }
            const host = await prisma.user.findUnique({
                where: { id: data.hostId },
                select: { id: true, role: true, approvalStatus: true },
            });
            if (!host || !["INSTRUCTOR", "ADMIN", "SUPER_ADMIN"].includes(host.role)) {
                return NextResponse.json({ error: "The chosen host is not an instructor" }, { status: 400 });
            }
            hostId = host.id;
        }

        const isAdmin = isAdminRole(session.user.role);

        // If this event fulfils a request, only staff tagged with it may do so.
        let originRequestId: string | null = null;
        if (data.requestId) {
            const request = await prisma.eventRequest.findUnique({
                where: { id: data.requestId },
                select: { id: true, taggedUserId: true, requesterId: true, status: true, eventId: true },
            });
            if (!request) {
                return NextResponse.json({ error: "Request not found" }, { status: 404 });
            }
            if (request.eventId) {
                return NextResponse.json({ error: "That request already has an event" }, { status: 409 });
            }
            const mayClaim =
                isAdmin ||
                (!!session.user.id && (request.taggedUserId === session.user.id || request.requesterId === session.user.id));
            if (!mayClaim) {
                return NextResponse.json(
                    { error: "Forbidden: This request is assigned to someone else" },
                    { status: 403 }
                );
            }
            originRequestId = request.id;
        }

        const event = await prisma.event.create({
            data: {
                title: data.title,
                slug: await uniqueSlug(data.title),
                summary: data.summary,
                description: data.description,
                category: data.category,
                location: data.location || null,
                isOnline: data.isOnline,
                meetingUrl: data.meetingUrl || null,
                coverImage: data.coverImage || null,
                startsAt: new Date(data.startsAt),
                endsAt: new Date(data.endsAt),
                timezone: data.timezone,
                capacity: data.capacity ?? null,
                price: data.price,
                hostId,
                originRequestId,
                // Admins publish their own events straight away; instructors wait for review.
                approvalStatus: isAdmin ? "APPROVED" : "PENDING",
                isPublished: isAdmin,
                approvedAt: isAdmin ? new Date() : null,
                reviewedById: isAdmin ? session.user.id : null,
            },
            include: { host: { select: hostSelect }, _count: { select: { interests: true } } },
        });

        // Link the request to its event and tell the requester we're planning it.
        if (originRequestId) {
            await prisma.eventRequest.update({
                where: { id: originRequestId },
                data: { eventId: event.id, status: "PLANNED" },
            });
        }

        if (!isAdmin) {
            await alertAdminsOfSubmission({
                id: event.id,
                title: event.title,
                startsAt: event.startsAt,
                host: { name: event.host.name },
            });
        }

        return NextResponse.json(
            { event: serializeEvent(event, { id: session.user.id, isAdmin }, new Set()) },
            { status: 201 }
        );
    } catch (error) {
        console.error("POST events error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}