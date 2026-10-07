import { prisma } from "@/lib/prisma";
import { BookingSettings, getBookingSettings } from "./settings";
import { addDays, dayOfWeekOf, minutesToTime, timeToMinutes, utcToZoned, zonedToUtc } from "../lib/time";

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

/** Weekly hours used when an admin hasn't configured any (Mon-Fri, 10:00-18:00). */
const DEFAULT_HOURS = [1, 2, 3, 4, 5].map((dayOfWeek) => ({
  dayOfWeek,
  startTime: "10:00",
  endTime: "18:00",
  slotDuration: 60,
}));

async function weeklyHours() {
  const rows = await prisma.availabilitySlot.findMany({ where: { isActive: true } });
  const configured = await prisma.availabilitySlot.count();
  // Once any hours exist (even all inactive) the admin's configuration wins
  return configured > 0 ? rows : DEFAULT_HOURS;
}

/** Today's date in the practice timezone. */
export function practiceToday(settings: BookingSettings): string {
  return utcToZoned(new Date(), settings.timezone).date;
}

/**
 * Bookable slots for a calendar date (in the practice timezone) for a session of
 * `durationMinutes`. Respects weekly hours, blocked dates, lead time, booking
 * horizon, and overlap (+buffer) with existing non-cancelled bookings.
 */
export async function getDayAvailability(
  date: string,
  durationMinutes: number,
  opts: { excludeBookingId?: string; settings?: BookingSettings } = {}
): Promise<DayAvailability> {
  const settings = opts.settings ?? (await getBookingSettings());
  const tz = settings.timezone;

  const today = practiceToday(settings);
  if (date < today) return { date, available: false, reason: "This date has passed", slots: [] };
  if (date > addDays(today, settings.maxAdvanceDays)) {
    return { date, available: false, reason: `Bookings open up to ${settings.maxAdvanceDays} days ahead`, slots: [] };
  }

  const dayStart = zonedToUtc(date, "00:00", tz);
  const dayEnd = zonedToUtc(addDays(date, 1), "00:00", tz);

  const blocked = await prisma.blockedDate.findFirst({
    where: { date: { gte: dayStart, lt: dayEnd } },
  });
  // Blocked dates are stored at local midnight; also match legacy UTC-midnight rows
  const legacyBlocked =
    blocked ??
    (await prisma.blockedDate.findFirst({
      where: { date: { gte: new Date(`${date}T00:00:00.000Z`), lte: new Date(`${date}T23:59:59.999Z`) } },
    }));
  if (legacyBlocked) {
    return { date, available: false, reason: legacyBlocked.reason || "The mentor is unavailable", slots: [] };
  }

  const dow = dayOfWeekOf(date);
  const ranges = (await weeklyHours()).filter((h) => h.dayOfWeek === dow);
  if (ranges.length === 0) {
    return { date, available: false, reason: "No sessions on this day of the week", slots: [] };
  }

  const buffer = settings.bufferMinutes * 60_000;
  const existing = await prisma.booking.findMany({
    where: {
      status: { not: "CANCELLED" },
      scheduledAt: { lt: new Date(dayEnd.getTime() + buffer) },
      endTime: { gt: new Date(dayStart.getTime() - buffer) },
      ...(opts.excludeBookingId && { id: { not: opts.excludeBookingId } }),
    },
    select: { scheduledAt: true, endTime: true },
  });

  const earliest = Date.now() + settings.minLeadHours * 3_600_000;
  const slots: Slot[] = [];
  const seen = new Set<string>();

  for (const range of ranges) {
    const startMin = timeToMinutes(range.startTime);
    const endMin = timeToMinutes(range.endTime);
    const step = Math.max(15, range.slotDuration || 60);
    for (let m = startMin; m + durationMinutes <= endMin; m += step) {
      const time = minutesToTime(m);
      if (seen.has(time)) continue;
      const start = zonedToUtc(date, time, tz);
      const end = new Date(start.getTime() + durationMinutes * 60_000);
      if (start.getTime() < earliest) continue;
      const clashes = existing.some(
        (b) => start.getTime() < b.endTime.getTime() + buffer && end.getTime() + buffer > b.scheduledAt.getTime()
      );
      if (clashes) continue;
      seen.add(time);
      slots.push({ time, start: start.toISOString() });
    }
  }

  slots.sort((a, b) => a.time.localeCompare(b.time));
  return slots.length
    ? { date, available: true, slots }
    : { date, available: false, reason: "Fully booked on this date", slots: [] };
}

/** Availability summary for a run of days starting at `from`. */
export async function getAvailabilityRange(from: string, days: number, durationMinutes: number) {
  const settings = await getBookingSettings();
  const out: { date: string; available: boolean; count: number }[] = [];
  for (let i = 0; i < days; i++) {
    const date = addDays(from, i);
    const day = await getDayAvailability(date, durationMinutes, { settings });
    out.push({ date, available: day.available, count: day.slots.length });
  }
  return { settings, days: out };
}

/** Confirm that `date`+`time` is still a bookable slot (used on create & reschedule). */
export async function resolveSlot(
  date: string,
  time: string,
  durationMinutes: number,
  excludeBookingId?: string
): Promise<{ ok: true; start: Date; end: Date } | { ok: false; error: string }> {
  const day = await getDayAvailability(date, durationMinutes, { excludeBookingId });
  const slot = day.slots.find((s) => s.time === time);
  if (!slot) {
    return { ok: false, error: day.available ? "That time is no longer available. Please pick another slot." : day.reason || "No availability on this date." };
  }
  const start = new Date(slot.start);
  return { ok: true, start, end: new Date(start.getTime() + durationMinutes * 60_000) };
}

/** Minimal surface of a Prisma client or interactive-transaction client. */
type BookingReader = {
  booking: {
    findFirst: (args: {
      where: Record<string, unknown>;
      select: { id: true };
    }) => Promise<{ id: string } | null>;
  };
};

/**
 * Re-check, inside a transaction, that nothing has taken `[start, end)` since
 * `resolveSlot` ran. `resolveSlot` reads availability and the caller writes a
 * moment later; without this two concurrent requests can both pass that read and
 * double-book the same slot.
 */
export async function assertSlotStillFree(
  tx: BookingReader,
  start: Date,
  end: Date,
  bufferMinutes: number,
  excludeBookingId?: string
): Promise<boolean> {
  const buffer = bufferMinutes * 60_000;
  const clash = await tx.booking.findFirst({
    where: {
      status: { not: "CANCELLED" },
      scheduledAt: { lt: new Date(end.getTime() + buffer) },
      endTime: { gt: new Date(start.getTime() - buffer) },
      ...(excludeBookingId && { id: { not: excludeBookingId } }),
    },
    select: { id: true },
  });
  return !clash;
}

/** Raised when a slot was taken between availability lookup and write. */
export class SlotTakenError extends Error {
  readonly status = 409;
  constructor(message = "That time was just booked by someone else. Please pick another slot.") {
    super(message);
    this.name = "SlotTakenError";
  }
}
