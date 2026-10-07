import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { Prisma } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/roles";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { assertSlotStillFree, resolveSlot, SlotTakenError } from "../availability";
import { getBookingSettings } from "../settings";
import { generateReferenceCode } from "../access";
import { serializeBooking } from "../serialize";
import { createBookingSchema } from "../../schemas/booking";
import { alertAdmin, notifyBooking } from "@/lib/notify";


export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const limiter = await rateLimit(`booking-create:${ip}`, { limit: 5, windowMs: 10 * 60 * 1000 });
    if (!limiter.success) {
      return NextResponse.json({ error: "Too many booking requests. Please wait a few minutes." }, { status: 429 });
    }

    const result = createBookingSchema.safeParse(await req.json().catch(() => ({})));
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0]?.message || "Validation error", issues: result.error.format() },
        { status: 400 }
      );
    }
    const data = result.data;

    const service = await prisma.service.findFirst({
      where: { OR: [{ id: data.serviceId }, { slug: data.serviceId }], isActive: true },
    });
    if (!service) {
      return NextResponse.json({ error: "Selected service not found" }, { status: 404 });
    }

    let duration = service.durationMinutes;
    if (data.instructorId) {
      const instructor = await prisma.user.findUnique({
        where: { id: data.instructorId },
        select: { sessionDuration: true },
      });
      if (instructor?.sessionDuration) {
        duration = instructor.sessionDuration;
      }
    }

    // Re-validate the slot server-side (weekly hours, lead time, overlaps, blocked dates)
    const slot = await resolveSlot(data.scheduledDate, data.scheduledTime, duration);
    if (!slot.ok) {
      return NextResponse.json({ error: slot.error }, { status: 409 });
    }

    const settings = await getBookingSettings();
    const session = await getServerSession(authOptions);

    const referenceCode = await generateReferenceCode();
    // Claim the slot inside a transaction: resolveSlot above read availability a
    // moment ago, and a concurrent request may have taken it since.
    const booking = await prisma.$transaction(async (tx) => {
      if (!(await assertSlotStillFree(tx, slot.start, slot.end, settings.bufferMinutes))) {
        throw new SlotTakenError();
      }
      return tx.booking.create({
        data: {
          referenceCode,
          serviceId: service.id,
          scheduledAt: slot.start,
          durationMinutes: duration,
          endTime: slot.end,
          clientName: data.clientName,
          clientEmail: data.clientEmail.toLowerCase(),
          clientPhone: data.clientPhone,
          whatsappOptIn: data.whatsappOptIn,
          goal: data.goal || null,
          clientNotes: data.clientNotes || null,
          status: settings.requireApproval ? "PENDING" : "CONFIRMED",
          confirmedAt: settings.requireApproval ? null : new Date(),
          meetingLink: `https://meet.aibootcamp.dev/session-${referenceCode.toLowerCase()}`,
          userId: session?.user?.id || null,
          instructorId: data.instructorId || null,
        },
        include: {
          service: true,
          instructor: {
            select: { id: true, name: true, email: true, mentorType: true, avatarUrl: true },
          },
        },
      });
    });

    // Notify client and admin
    await Promise.allSettled([
      notifyBooking(booking.id, booking.status === "PENDING" ? "received" : "confirmed"),
      alertAdmin(booking.id, "new"),
      // Notify assigned mentor / mentor
      booking.instructor?.email
        ? prisma.notificationLog.create({
            data: {
              channel: "EMAIL",
              kind: "mentor_alert",
              recipient: booking.instructor.email,
              subject: `New Private Session Request [${booking.referenceCode}]`,
              body: `Greetings ${booking.instructor.name || "Mentor"},\n\nA client has booked a private session (${service.title}) with you scheduled for ${slot.start.toLocaleString()}.\nClient: ${data.clientName} (${data.clientEmail}, ${data.clientPhone}).\nReference: ${booking.referenceCode}.`,
              status: "SENT",
              bookingId: booking.id,
            },
          })
        : Promise.resolve(null),
    ]);

    return NextResponse.json(
      {
        message:
          booking.status === "PENDING"
            ? "Booking request received. You'll be notified once it's confirmed."
            : "Session successfully booked!",
        booking: serializeBooking(booking, { includeToken: true }),
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof SlotTakenError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("POST booking error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/** Admins: all bookings (filterable). Mentors: their assigned bookings. Clients: their own bookings. */
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isAdmin = isAdminRole(session.user.role);
    const isInstructor = session.user.role === "INSTRUCTOR";
    const { searchParams } = new URL(req.url);
    const view = searchParams.get("view"); // pending | upcoming | past | cancelled
    const q = searchParams.get("q")?.trim();
    const userId = searchParams.get("userId");
    const instructorId = searchParams.get("instructorId");
    const now = new Date();

    let where: Prisma.BookingWhereInput;

    if (isAdmin) {
      where = {
        ...(userId && { userId }),
        ...(instructorId && { instructorId }),
        ...(view === "pending" && { status: "PENDING" }),
        ...(view === "upcoming" && { status: { in: ["CONFIRMED", "RESCHEDULED"] }, endTime: { gte: now } }),
        ...(view === "past" && { OR: [{ status: "COMPLETED" }, { status: { in: ["CONFIRMED", "RESCHEDULED"] }, endTime: { lt: now } }] }),
        ...(view === "cancelled" && { status: "CANCELLED" }),
        ...(q && {
          AND: [
            {
              OR: [
                { clientName: { contains: q } },
                { clientEmail: { contains: q.toLowerCase() } },
                { clientPhone: { contains: q } },
                { referenceCode: { contains: q.toUpperCase() } },
              ],
            },
          ],
        }),
      };
    } else if (isInstructor) {
      // Instructors see bookings assigned to them OR bookings they created as clients
      where = {
        OR: [
          { instructorId: session.user.id },
          { userId: session.user.id },
          { clientEmail: (session.user.email || "").toLowerCase() },
        ],
      };
    } else {
      where = { OR: [{ userId: session.user.id }, { clientEmail: (session.user.email || "").toLowerCase() }] };
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        service: { select: { title: true, slug: true, price: true, durationMinutes: true } },
        instructor: { select: { id: true, name: true, email: true, mentorType: true, avatarUrl: true } },
      },
      orderBy: { scheduledAt: view === "past" || view === "cancelled" ? "desc" : "asc" },
      take: 500,
    });

    const pendingCount = isAdmin ? await prisma.booking.count({ where: { status: "PENDING" } }) : undefined;

    return NextResponse.json({
      bookings: bookings.map((b) => serializeBooking(b, { admin: isAdmin, includeToken: !isAdmin })),
      ...(isAdmin && { pendingCount }),
    });
  } catch (error) {
    console.error("GET bookings error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
