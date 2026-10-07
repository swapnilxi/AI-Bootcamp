import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/roles";
import { eventApprovalSchema } from "../../schemas/event";
import { canApproveEvents } from "../access";
import { notifyHostOfDecision, notifyRequesterOfApproval } from "../notify";
import { hostSelect, serializeEvent } from "../serialize";

interface RouteParams {
    params: Promise<{ id: string }>;
}

/**
 * PUT /api/events/[id]/approval — admins gate event visibility.
 *
 * Approving publishes the event to members and notifies two people: the host
 * (so the instructor knows their event is live) and, when the event fulfils a
 * community request, the member who asked for it.
 */
export async function PUT(req: Request, { params }: RouteParams) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id || !canApproveEvents(session.user.role)) {
            return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
        }

        const { id } = await params;
        const body = await req.json().catch(() => ({}));
        const parsed = eventApprovalSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: parsed.error.errors[0]?.message || "Invalid payload" },
                { status: 400 }
            );
        }

        const { approvalStatus, rejectionReason } = parsed.data;
        if (!approvalStatus) {
            return NextResponse.json({ error: "approvalStatus is required" }, { status: 400 });
        }
        if (approvalStatus === "REJECTED" && !rejectionReason) {
            return NextResponse.json({ error: "A reason is required when rejecting" }, { status: 400 });
        }

        const existing = await prisma.event.findUnique({
            where: { id },
            include: {
                host: { select: { id: true, name: true, email: true } },
                originRequest: { select: { requester: { select: { id: true, name: true, email: true } } } },
            },
        });
        if (!existing) return NextResponse.json({ error: "Event not found" }, { status: 404 });

        const approved = approvalStatus === "APPROVED";
        const wasAlreadyApproved = existing.approvalStatus === "APPROVED";

        const event = await prisma.event.update({
            where: { id },
            data: {
                approvalStatus,
                isPublished: approved,
                rejectionReason: approved ? null : rejectionReason || null,
                reviewedById: session.user.id,
                reviewedAt: new Date(),
                approvedAt: approved ? new Date() : null,
            },
            include: { host: { select: hostSelect }, _count: { select: { interests: true } } },
        });

        if (!wasAlreadyApproved) {
            // Always tell the host they have been reviewed.
            await notifyHostOfDecision({
                id: event.id,
                title: event.title,
                approvalStatus,
                rejectionReason,
                host: existing.host,
                reviewedById: session.user.id,
            });

            // And the member who requested it, so they learn it became real.
            if (approved && existing.originRequest) {
                await notifyRequesterOfApproval({
                    id: event.id,
                    title: event.title,
                    originRequestId: event.originRequestId,
                    originRequest: existing.originRequest,
                    reviewedById: session.user.id,
                });
            }
        }

        return NextResponse.json({
            message: `Event ${approved ? "approved and published" : "updated"}`,
            event: serializeEvent(event, { id: session.user.id, isAdmin: true }, new Set()),
        });
    } catch (error) {
        console.error("PUT event approval error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

/** GET /api/events/[id]/approval — the admin review queue for one host. */
export async function GET(_req: Request, { params }: RouteParams) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id || !isAdminRole(session.user.role)) {
            return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
        }

        const { id } = await params;
        const event = await prisma.event.findUnique({
            where: { id },
            include: {
                host: { select: hostSelect },
                _count: { select: { interests: true } },
                originRequest: { select: { id: true, status: true, requester: { select: { id: true, name: true, email: true } } } },
            },
        });
        if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

        return NextResponse.json({
            event: {
                ...serializeEvent(event, { id: session.user.id, isAdmin: true }, new Set()),
                description: event.description,
                rejectionReason: event.rejectionReason,
                isPublished: event.isPublished,
                originRequest: event.originRequest,
            },
        });
    } catch (error) {
        console.error("GET event approval error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}