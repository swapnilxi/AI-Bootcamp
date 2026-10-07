import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/roles";
import { createEventRequestSchema, updateEventRequestSchema } from "../../schemas/event";
import { canHostEvents } from "../access";
import { notifyRequesterOfStatus, notifyTaggedUserOfRequest } from "../notify";
import { hostSelect } from "../serialize";

const requestInclude = {
    requester: { select: hostSelect },
    taggedUser: { select: hostSelect },
} as const;

/**
 * GET /api/event-requests
 * Members see the requests they raised; staff see the ones assigned to them
 * plus the whole open queue for admins.
 */
export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const scope = searchParams.get("scope") ?? "mine";
        const isAdmin = isAdminRole(session.user.role);

        const where: Record<string, unknown> = {};
        if (scope === "mine") {
            where.requesterId = session.user.id;
        } else if (scope === "tagged") {
            where.taggedUserId = session.user.id;
            where.status = "OPEN";
        } else if (scope === "all") {
            if (!canHostEvents(session.user.role)) {
                return NextResponse.json({ requests: [] });
            }
            where.status = "OPEN";
        }

        const requests = await prisma.eventRequest.findMany({
            where,
            include: requestInclude,
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json({ requests });
    } catch (error) {
        console.error("GET event requests error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

/**
 * POST /api/event-requests
 * Any signed-in member can ask for an event, optionally tagging an admin or
 * instructor to take responsibility for planning it.
 */
export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized: Please sign in to make a request" }, { status: 401 });
        }

        const body = await req.json().catch(() => ({}));
        const parsed = createEventRequestSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: parsed.error.errors[0]?.message || "Invalid payload" },
                { status: 400 }
            );
        }
        const data = parsed.data;

        // The tagged person must be someone who can actually host the event.
        let taggedUserId: string | null = null;
        let taggedUser: { id: string; name: string | null; email: string } | null = null;
        if (data.taggedUserId) {
            const tagged = await prisma.user.findUnique({
                where: { id: data.taggedUserId },
                select: { id: true, name: true, email: true, role: true },
            });
            if (!tagged || !canHostEvents(tagged.role)) {
                return NextResponse.json({ error: "That person cannot host events" }, { status: 400 });
            }
            taggedUserId = tagged.id;
            taggedUser = { id: tagged.id, name: tagged.name, email: tagged.email };
        }

        const request = await prisma.eventRequest.create({
            data: {
                title: data.title,
                details: data.details,
                category: data.category,
                proposedDate: data.proposedDate ? new Date(data.proposedDate) : null,
                requesterId: session.user.id,
                taggedUserId,
            },
            include: requestInclude,
        });

        // Let the tagged host know someone asked them to plan something.
        if (taggedUser) {
            await notifyTaggedUserOfRequest({
                id: request.id,
                title: request.title,
                taggedUser,
                requester: { name: session.user.name ?? null },
            });
        }

        return NextResponse.json({ request }, { status: 201 });
    } catch (error) {
        console.error("POST event request error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

/**
 * Shared update used by `PATCH /api/event-requests/[id]`. A member may edit
 * their own request while it is still open; staff may update status and notes.
 */
export async function updateRequest(req: Request, id: string) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existing = await prisma.eventRequest.findUnique({
        where: { id },
        select: { id: true, requesterId: true, taggedUserId: true, status: true },
    });
    if (!existing) return NextResponse.json({ error: "Request not found" }, { status: 404 });

    const isAdmin = isAdminRole(session.user.role);
    const isTaggedHost = existing.taggedUserId === session.user.id;
    const isRequester = existing.requesterId === session.user.id;

    if (!isAdmin && !isTaggedHost) {
        // A member can only edit their own request, and only while it is open.
        if (!isRequester || existing.status !== "OPEN") {
            return NextResponse.json({ error: "Forbidden: You cannot edit this request" }, { status: 403 });
        }
    }

    const body = await req.json().catch(() => ({}));
    const parsed = updateEventRequestSchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json(
            { error: parsed.error.errors[0]?.message || "Invalid payload" },
            { status: 400 }
        );
    }
    const data = parsed.data;

    // Only staff may set status or admin notes.
    const staffChanges: Record<string, unknown> = {};
    if (isAdmin || isTaggedHost) {
        if (data.status !== undefined) staffChanges.status = data.status;
        if (data.adminNotes !== undefined) staffChanges.adminNotes = data.adminNotes;
    }
    // Re-tagging is allowed by anyone who can otherwise edit the request.
    let taggedUserId = existing.taggedUserId;
    if (data.taggedUserId !== undefined) {
        if (data.taggedUserId) {
            const tagged = await prisma.user.findUnique({
                where: { id: data.taggedUserId },
                select: { id: true, role: true },
            });
            if (!tagged || !canHostEvents(tagged.role)) {
                return NextResponse.json({ error: "That person cannot host events" }, { status: 400 });
            }
            taggedUserId = tagged.id;
        } else {
            taggedUserId = null;
        }
    }

    const request = await prisma.eventRequest.update({
        where: { id },
        data: {
            title: data.title,
            details: data.details,
            category: data.category,
            proposedDate: data.proposedDate ? new Date(data.proposedDate) : undefined,
            taggedUserId: data.taggedUserId !== undefined ? taggedUserId : undefined,
            ...staffChanges,
        },
        include: requestInclude,
    });

    // Tell the member when their request is picked up or declined.
    const statusChanged = data.status && data.status !== existing.status;
    if (statusChanged && (data.status === "PLANNED" || data.status === "DECLINED")) {
        const requester = await prisma.user.findUnique({
            where: { id: existing.requesterId },
            select: { id: true, name: true, email: true },
        });
        await notifyRequesterOfStatus({
            id: request.id,
            title: request.title,
            status: request.status,
            adminNotes: request.adminNotes,
            requester,
            eventId: request.eventId,
        });
    }

    // Warn a newly tagged host that they have taken on a request.
    if (taggedUserId && taggedUserId !== existing.taggedUserId) {
        const tagged = await prisma.user.findUnique({
            where: { id: taggedUserId },
            select: { id: true, name: true, email: true },
        });
        await notifyTaggedUserOfRequest({
            id: request.id,
            title: request.title,
            taggedUser: tagged,
            requester: { name: request.requester?.name ?? null },
        });
    }

    return NextResponse.json({ request });
}