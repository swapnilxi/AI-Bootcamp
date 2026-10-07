import { prisma } from "@/lib/prisma";
import { isValidTimeZone } from "../lib/time";

export interface BookingSettings {
  /** IANA timezone the practice works in; weekly hours are defined in this zone */
  timezone: string;
  /** New bookings start as PENDING and must be approved by an admin */
  requireApproval: boolean;
  /** Earliest bookable slot, in hours from now */
  minLeadHours: number;
  /** Furthest bookable date, in days from today */
  maxAdvanceDays: number;
  /** Gap kept free after each session */
  bufferMinutes: number;
  /** Where new-booking alerts are emailed (falls back to ADMIN_NOTIFY_EMAIL env) */
  adminNotifyEmail: string;
}

const KEYS: Record<keyof BookingSettings, string> = {
  timezone: "booking.timezone",
  requireApproval: "booking.requireApproval",
  minLeadHours: "booking.minLeadHours",
  maxAdvanceDays: "booking.maxAdvanceDays",
  bufferMinutes: "booking.bufferMinutes",
  adminNotifyEmail: "booking.adminNotifyEmail",
};

export function defaultBookingSettings(): BookingSettings {
  const envTz = process.env.PRACTICE_TIMEZONE;
  return {
    timezone: envTz && isValidTimeZone(envTz) ? envTz : "America/New_York",
    requireApproval: true,
    minLeadHours: 12,
    maxAdvanceDays: 60,
    bufferMinutes: 15,
    adminNotifyEmail: process.env.ADMIN_NOTIFY_EMAIL || "",
  };
}

export async function getBookingSettings(): Promise<BookingSettings> {
  const rows = await prisma.platformSetting.findMany({
    where: { key: { in: Object.values(KEYS) } },
  });
  const map = new Map(rows.map((r) => [r.key, r.value]));
  const d = defaultBookingSettings();
  const num = (k: string, fallback: number) => {
    const v = Number(map.get(k));
    return Number.isFinite(v) && map.has(k) ? v : fallback;
  };
  const tz = map.get(KEYS.timezone);
  return {
    timezone: tz && isValidTimeZone(tz) ? tz : d.timezone,
    requireApproval: map.has(KEYS.requireApproval) ? map.get(KEYS.requireApproval) === "true" : d.requireApproval,
    minLeadHours: num(KEYS.minLeadHours, d.minLeadHours),
    maxAdvanceDays: num(KEYS.maxAdvanceDays, d.maxAdvanceDays),
    bufferMinutes: num(KEYS.bufferMinutes, d.bufferMinutes),
    adminNotifyEmail: map.get(KEYS.adminNotifyEmail) || d.adminNotifyEmail,
  };
}

export async function saveBookingSettings(patch: Partial<BookingSettings>): Promise<BookingSettings> {
  const entries = Object.entries(patch).filter(([k, v]) => k in KEYS && v !== undefined) as [
    keyof BookingSettings,
    string | number | boolean,
  ][];
  await prisma.$transaction(
    entries.map(([k, v]) =>
      prisma.platformSetting.upsert({
        where: { key: KEYS[k] },
        create: { key: KEYS[k], value: String(v) },
        update: { value: String(v) },
      })
    )
  );
  return getBookingSettings();
}
