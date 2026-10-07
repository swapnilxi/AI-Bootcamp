import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import type { Session } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdminRole, isInstructorRole } from "@/lib/roles";
import { verifyBookingToken } from "../access";
import { assertSlotStillFree, resolveSlot, SlotTakenError } from "../availability";
import { getBookingSettings } from "../settings";
import { serializeBooking } from "../serialize";
import { adminActionSchema, clientActionSchema } from "../../schemas/booking";
import { Channel, alertAdmin, notifyBooking } from "@/lib/notify";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/** Clients may change a booking up to this long before it starts. */
const CLIENT_CHANGE_CUTOFF_MS = 24 * 3_600_000;

async function loadBooking(id: string) {
  return prisma.booking.findFirst({
    where: { OR: [{ id }, { referenceCode: id.toUpperCase() }] },
    include: {
      service: true,
      instructor: {
        select: { id: true, name: true, email: true, mentorType: true, avatarUrl: true },
      },
      notifications: { orderBy: { createdAt: "desc" }, take: 50 },
    },
  });
}

type LoadedBooking = NonNullable<Awaited<ReturnType<typeof loadBooking>>>;

function accessFor(session: Session | null, booking: LoadedBooking, token: string | null) {
  const admin = isAdminRole(session?.user?.role);
  const owner =
    !!session?.user?.id &&
    (booking.userId === session.user.id || booking.clientEmail === (session.user.email || "").toLowerCase());
  const guest = verifyBookingToken(booking.id, token);
  // The mentor a booking is assigned to can manage it (but not reassign it)
  const mentor =
    !!session?.user?.id && isInstructorRole(session.user.role) && booking.instructorId === session.user.id;
  return { admin, mentor, client: owner || guest };
}

/** Admins, the booking's owner, or a guest holding the signed link token. */
export async function GET(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const token = new URL(req.url).searchParams.get("t");
    const session = await getServerSession(authOptions);

    const booking = await loadBooking(id);
    // Same 404 for missing and forbidden, so references can't be probed
    if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    const access = accessFor(session, booking, token);
    if (!access.admin && !access.mentor && !access.client) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }
    const staff = access.admin || access.mentor;

    const settings = await getBookingSettings();
    return NextResponse.json({
      booking: serializeBooking(booking, { admin: staff, includeToken: access.client }),
      timezone: settings.timezone,
      canClientChange:
        !["CANCELLED", "COMPLETED"].includes(booking.status) &&
        booking.scheduledAt.getTime() - Date.now() > CLIENT_CHANGE_CUTOFF_MS,
    });
  } catch (error) {
    console.error("GET booking error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const token = new URL(req.url).searchParams.get("t");
    const session = await getServerSession(authOptions);

    const booking = await loadBooking(id);
    if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    const access = accessFor(session, booking, token);
    if (!access.admin && !access.mentor && !access.client) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    return access.admin || access.mentor
      ? handleAdmin(booking, body, session!.user.id, access.admin)
      : handleClient(booking, body);
  } catch (error) {
    console.error("PATCH booking error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

async function respond(bookingId: string, extra: Record<string, unknown> = {}, admin = true) {
  const fresh = await loadBooking(bookingId);
  return NextResponse.json({ booking: fresh && serializeBooking(fresh, { admin, includeToken: !admin }), ...extra });
}

async function handleAdmin(booking: LoadedBooking, body: unknown, adminId: string, isAdmin: boolean) {
  const parsed = adminActionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message || "Invalid action" }, { status: 400 });
  }
  const a = parsed.data;
  if (a.action === "reassign" && !isAdmin) {
    return NextResponse.json({ error: "Only an administrator can reassign a booking" }, { status: 403 });
  }
  const closed = booking.status === "CANCELLED" || booking.status === "COMPLETED";

  switch (a.action) {
    case "approve": {
      if (booking.status !== "PENDING") {
        return NextResponse.json({ error: "Only pending bookings can be approved" }, { status: 409 });
      }
      await prisma.booking.update({
        where: { id: booking.id },
        data: {
          status: "CONFIRMED",
          confirmedAt: new Date(),
          ...(a.meetingLink ? { meetingLink: a.meetingLink } : {}),
        },
      });
      const notified = a.channels.length
        ? await notifyBooking(booking.id, "confirmed", { channels: a.channels, customMessage: a.message, sentById: adminId })
        : null;
      return respond(booking.id, { notified });
    }
    case "decline":
    case "cancel": {
      if (closed) return NextResponse.json({ error: `Booking is already ${booking.status.toLowerCase()}` }, { status: 409 });
      if (a.action === "decline" && booking.status !== "PENDING") {
        return NextResponse.json({ error: "Only pending bookings can be declined; cancel it instead" }, { status: 409 });
      }
      await prisma.booking.update({
        where: { id: booking.id },
        data: { status: "CANCELLED", cancellationReason: a.reason || null },
      });
      const notified = a.channels.length
        ? await notifyBooking(booking.id, a.action === "decline" ? "declined" : "cancelled", {
            channels: a.channels,
            customMessage: a.message,
            sentById: adminId,
          })
        : null;
      return respond(booking.id, { notified });
    }
    case "reschedule": {
      if (closed) return NextResponse.json({ error: `Booking is already ${booking.status.toLowerCase()}` }, { status: 409 });
      const slot = await resolveSlot(a.date, a.time, booking.durationMinutes, booking.id);
      if (!slot.ok) return NextResponse.json({ error: slot.error }, { status: 409 });
      const { bufferMinutes } = await getBookingSettings();
      try {
        await prisma.$transaction(async (tx) => {
          if (!(await assertSlotStillFree(tx, slot.start, slot.end, bufferMinutes, booking.id))) {
            throw new SlotTakenError();
          }
          await tx.booking.update({
            where: { id: booking.id },
            data: {
              scheduledAt: slot.start,
              endTime: slot.end,
              // An admin-chosen time is confirmed by definition
              status: "RESCHEDULED",
              confirmedAt: booking.confirmedAt ?? new Date(),
              reminderSentAt: null,
            },
          });
        });
      } catch (err) {
        if (err instanceof SlotTakenError) return NextResponse.json({ error: err.message }, { status: err.status });
        throw err;
      }
      const notified = a.channels.length
        ? await notifyBooking(booking.id, "rescheduled", { channels: a.channels, customMessage: a.message, sentById: adminId })
        : null;
      return respond(booking.id, { notified });
    }
    case "complete": {
      if (booking.status === "CANCELLED") return NextResponse.json({ error: "Cancelled bookings can't be completed" }, { status: 409 });
      await prisma.booking.update({ where: { id: booking.id }, data: { status: "COMPLETED" } });
      return respond(booking.id);
    }
    case "update": {
      const { action: _action, meetingLink, clientEmail, ...rest } = a;
      void _action;
      await prisma.booking.update({
        where: { id: booking.id },
        data: {
          ...Object.fromEntries(Object.entries(rest).filter(([, v]) => v !== undefined)),
          ...(clientEmail !== undefined && { clientEmail: clientEmail.toLowerCase() }),
          ...(meetingLink !== undefined && { meetingLink: meetingLink || null }),
        },
      });
      return respond(booking.id);
    }
    case "reassign": {
      const prevInstructor = booking.instructor?.name || "Unassigned";
      let newInstructorName = "Unassigned";

      if (a.instructorId) {
        const newInst = await prisma.user.findUnique({
          where: { id: a.instructorId },
          select: { id: true, name: true, email: true, mentorType: true },
        });
        if (newInst) {
          newInstructorName = `${newInst.name || "Mentor"} (${newInst.mentorType || "INSTRUCTOR"})`;
          if (newInst.email) {
            await prisma.notificationLog.create({
              data: {
                channel: "EMAIL",
                kind: "mentor_reassigned",
                recipient: newInst.email,
                subject: `Reassigned Booking Session [${booking.referenceCode}]`,
                body: `Greetings ${newInst.name || "Mentor"},\n\nAdmin has reassigned session session [${booking.referenceCode}] to you for ${booking.scheduledAt.toLocaleString()}.\nClient: ${booking.clientName} (${booking.clientEmail}).\nNotes: ${a.reason || "None"}`,
                status: "SENT",
                bookingId: booking.id,
              },
            }).catch(() => null);
          }
        }
      }

      await prisma.booking.update({
        where: { id: booking.id },
        data: {
          instructorId: a.instructorId || null,
          adminNotes: a.reason
            ? `${booking.adminNotes ? booking.adminNotes + "\n" : ""}[Rerouted from ${prevInstructor} to ${newInstructorName}]: ${a.reason}`
            : booking.adminNotes,
        },
      });
      return respond(booking.id);
    }
  }
}

async function handleClient(booking: LoadedBooking, body: unknown) {
  const parsed = clientActionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message || "Invalid action" }, { status: 400 });
  }
  if (booking.status === "CANCELLED" || booking.status === "COMPLETED") {
    return NextResponse.json({ error: `This booking is already ${booking.status.toLowerCase()}` }, { status: 409 });
  }
  if (booking.scheduledAt.getTime() - Date.now() < CLIENT_CHANGE_CUTOFF_MS) {
    return NextResponse.json(
      { error: "Changes are possible up to 24 hours before your session. Please contact us directly." },
      { status: 409 }
    );
  }

  const a = parsed.data;
  if (a.action === "cancel") {
    await prisma.booking.update({
      where: { id: booking.id },
      data: { status: "CANCELLED", cancellationReason: a.reason ? `Cancelled by client: ${a.reason}` : "Cancelled by client" },
    });
    await Promise.allSettled([notifyBooking(booking.id, "cancelled"), alertAdmin(booking.id, "cancelled")]);
    return respond(booking.id, {}, false);
  }

  const slot = await resolveSlot(a.date, a.time, booking.durationMinutes, booking.id);
  if (!slot.ok) return NextResponse.json({ error: slot.error }, { status: 409 });
  const settings = await getBookingSettings();
  try {
    await prisma.$transaction(async (tx) => {
      if (!(await assertSlotStillFree(tx, slot.start, slot.end, settings.bufferMinutes, booking.id))) {
        throw new SlotTakenError();
      }
      await tx.booking.update({
        where: { id: booking.id },
        data: {
          scheduledAt: slot.start,
          endTime: slot.end,
          status: settings.requireApproval ? "PENDING" : "RESCHEDULED",
          reminderSentAt: null,
        },
      });
    });
  } catch (err) {
    if (err instanceof SlotTakenError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
  await Promise.allSettled([
    notifyBooking(booking.id, settings.requireApproval ? "received" : "rescheduled"),
    alertAdmin(booking.id, "rescheduled"),
  ]);
  return respond(booking.id, {}, false);
}
