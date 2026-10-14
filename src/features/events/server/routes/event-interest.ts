import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/roles";
import { notifyHostOfInterest } from "../notify";

interface RouteParams {
    params: Promise<{ id: string }>;
}

/** Members express interest in an event. One row per person per event. */
async function setInterest(eventId: string, userId: string) {
    const existed = await prisma.eventInterest.findUnique({ where: { eventId_userId: { eventId, userId } }, select: { id: true } });
    await prisma.eventInterest.upsert({
        where: { eventId_userId: { eventId, userId } },
        create: { eventId, userId },
        update: {},
    });
    const count = await prisma.eventInterest.count({ where: { eventId } });
    if (!existed) await notifyHostOfInterest(eventId, userId, count);
    return count;
}

/** POST /api/events/[id]/interest — I would like to attend this event. */
export async function POST(_req: Request, { params }: RouteParams) {
    try {
        const { id } = await params;
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized: Please sign in to register interest" }, { status: 401 });
        }

        const event = await prisma.event.findUnique({
            where: { id },
            select: { id: true, capacity: true, approvalStatus: true, isPublished: true, endsAt: true, _count: { select: { interests: true } } },
        });
        if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

        // Interest is only meaningful for events members can actually see.
        const isAdmin = isAdminRole(session.user.role);
        if (event.approvalStatus !== "APPROVED" || !event.isPublished) {
            return NextResponse.json({ error: "This event is not open yet" }, { status: 403 });
        }
        if (new Date(event.endsAt).getTime() < Date.now()) {
            return NextResponse.json({ error: "This event has already taken place" }, { status: 400 });
        }
        if (event.capacity && event._count.interests >= event.capacity) {
            return NextResponse.json({ error: "This event is fully booked" }, { status: 409 });
        }

        const interestCount = await setInterest(id, session.user.id);
        return NextResponse.json({ success: true, isInterested: true, interestCount });
    } catch (error) {
        console.error("POST event interest error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

/** DELETE /api/events/[id]/interest — withdraw interest. */
export async function DELETE(_req: Request, { params }: RouteParams) {
    try {
        const { id } = await params;
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await prisma.eventInterest
            .deleteMany({ where: { eventId: id, userId: session.user.id } })
            .catch(() => null);

        const interestCount = await prisma.eventInterest.count({ where: { eventId: id } });
        return NextResponse.json({ success: true, isInterested: false, interestCount });
    } catch (error) {
        console.error("DELETE event interest error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}