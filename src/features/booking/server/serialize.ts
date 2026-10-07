import type { Booking, NotificationLog, Service } from "@prisma/client";
import { bookingAccessToken } from "./access";

type BookingWithService = Booking & { service: Pick<Service, "title" | "slug" | "price" | "durationMinutes"> };

/** Public shape of a booking. Admin-only fields are included only when `admin` is true. */
export function serializeBooking(
  b: BookingWithService & { notifications?: NotificationLog[] },
  opts: { admin?: boolean; includeToken?: boolean } = {}
) {
  return {
    id: b.id,
    referenceCode: b.referenceCode,
    serviceTitle: b.service.title,
    serviceSlug: b.service.slug,
    price: Number(b.service.price),
    scheduledAt: b.scheduledAt,
    endTime: b.endTime,
    durationMinutes: b.durationMinutes,
    status: b.status,
    clientName: b.clientName,
    clientEmail: b.clientEmail,
    clientPhone: b.clientPhone,
    goal: b.goal,
    clientNotes: b.clientNotes,
    whatsappOptIn: b.whatsappOptIn,
    // The join link is only shared once the session is confirmed
    meetingLink: b.status === "CONFIRMED" || b.status === "RESCHEDULED" || opts.admin ? b.meetingLink : null,
    cancellationReason: b.cancellationReason,
    confirmedAt: b.confirmedAt,
    createdAt: b.createdAt,
    instructorId: b.instructorId,
    instructor: (b as any).instructor
      ? {
          id: (b as any).instructor.id,
          name: (b as any).instructor.name,
          email: opts.admin ? (b as any).instructor.email : undefined,
          mentorType: (b as any).instructor.mentorType,
          avatarUrl: (b as any).instructor.avatarUrl,
        }
      : null,
    ...(opts.includeToken && { accessToken: bookingAccessToken(b.id) }),
    ...(opts.admin && {
      adminNotes: b.adminNotes,
      userId: b.userId,
      reminderSentAt: b.reminderSentAt,
      notifications: (b.notifications || []).map((n) => ({
        id: n.id,
        channel: n.channel,
        kind: n.kind,
        recipient: n.recipient,
        subject: n.subject,
        status: n.status,
        error: n.error,
        createdAt: n.createdAt,
      })),
    }),
  };
}
