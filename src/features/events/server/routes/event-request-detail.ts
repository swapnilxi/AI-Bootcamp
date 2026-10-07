import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/roles";
import { updateRequest } from "./event-requests";
import { hostSelect } from "../serialize";

interface RouteParams {
    params: Promise<{ id: string }>;
}

const requestInclude = {
    requester: { select: hostSelect },
    taggedUser: { select: hostSelect },
} as const;

/** GET /api/event-requests/[id] — visible to the requester and to staff. */
export async function GET(_req: Request, { params }: RouteParams) {
    try {
        const { id } = await params;
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const request = await prisma.eventRequest.findUnique({
            where: { id },
            include: { ...requestInclude, event: { select: { id: true, title: true, slug: true } } },
        });
        if (!request) return NextResponse.json({ error: "Request not found" }, { status: 404 });

        const isAdmin = isAdminRole(session.user.role);
        const mayView =
            isAdmin || request.requesterId === session.user.id || request.taggedUserId === session.user.id;
        if (!mayView) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        return NextResponse.json({ request });
    } catch (error) {
        console.error("GET event request error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

/** PATCH /api/event-requests/[id] — edit, re-tag, or change status/notes. */
export async function PATCH(req: Request, { params }: RouteParams) {
    const { id } = await params;
    return updateRequest(req, id);
}

/** DELETE /api/event-requests/[id] — the requester withdraws their request. */
export async function DELETE(_req: Request, { params }: RouteParams) {
    try {
        const { id } = await params;
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const existing = await prisma.eventRequest.findUnique({
            where: { id },
            select: { requesterId: true, eventId: true },
        });
        if (!existing) return NextResponse.json({ error: "Request not found" }, { status: 404 });
        if (existing.requesterId !== session.user.id && !isAdminRole(session.user.role)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
        // Don't orphan an event that was already created from this request.
        if (existing.eventId) {
            return NextResponse.json(
                { error: "This request already has a planned event; remove that instead" },
                { status: 409 }
            );
        }

        await prisma.eventRequest.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("DELETE event request error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}