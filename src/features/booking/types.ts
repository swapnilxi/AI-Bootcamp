/**
 * Shared shapes for the booking feature — the JSON its API returns, so a host
 * application can consume the endpoints without depending on Prisma's types.
 */

export type BookingStatus =
  | "PENDING"
  | "CONFIRMED"
  | "RESCHEDULED"
  | "CANCELLED"
  | "COMPLETED";

export type NotifyChannel = "EMAIL" | "WHATSAPP";

export type BookingView = "pending" | "upcoming" | "past" | "cancelled";

export interface MentorRef {
  id: string;
  name?: string | null;
  email?: string;
  mentorType?: string | null;
  avatarUrl?: string | null;
}

/** One bookable time in the practice timezone. */
export interface Slot {
  /** Wall-clock time in the practice timezone, "HH:mm" */
  time: string;
  /** Exact start instant (ISO, UTC) */
  start: string;
}

export interface DayAvailability {
  date: string;
  available: boolean;
  reason?: string;
  slots: Slot[];
}

/** A booking as returned by the API. Admin-only fields appear for staff. */
export interface BookingRecord {
  id: string;
  referenceCode: string;
  serviceTitle: string;
  serviceSlug: string;
  price: number;
  scheduledAt: string | Date;
  endTime: string | Date;
  durationMinutes: number;
  status: BookingStatus;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientNotes: string | null;
  whatsappOptIn: boolean;
  /** Only shared once the session is confirmed, or to staff. */
  meetingLink: string | null;
  cancellationReason: string | null;
  confirmedAt: string | Date | null;
  createdAt: string | Date;
  instructorId: string | null;
  instructor: MentorRef | null;
  /** Signed token letting a guest manage this booking without an account. */
  accessToken?: string;
  adminNotes?: string | null;
  userId?: string | null;
  reminderSentAt?: string | Date | null;
}
