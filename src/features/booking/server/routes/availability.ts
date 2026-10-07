import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAvailabilityRange, getDayAvailability, practiceToday } from "../availability";
import { getBookingSettings } from "../settings";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Public slot lookup.
 *   ?date=YYYY-MM-DD&serviceId=...        -> slots for one day
 *   ?from=YYYY-MM-DD&days=14&serviceId=... -> per-day availability summary
 * Dates are calendar days in the practice timezone (returned as `timezone`).
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const serviceId = searchParams.get("serviceId");
    const durationParam = searchParams.get("duration");

    let durationMinutes = durationParam ? Math.max(15, parseInt(durationParam, 10) || 60) : 60;
    if (serviceId) {
      const service = await prisma.service.findFirst({
        where: { OR: [{ id: serviceId }, { slug: serviceId }], isActive: true },
        select: { durationMinutes: true },
      });
      if (!service) return NextResponse.json({ error: "Service not found" }, { status: 404 });
      durationMinutes = service.durationMinutes;
    }

    const settings = await getBookingSettings();
    const date = searchParams.get("date");

    if (date) {
      if (!DATE_RE.test(date)) return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
      const day = await getDayAvailability(date, durationMinutes, { settings });
      return NextResponse.json({ ...day, timezone: settings.timezone, durationMinutes });
    }

    const from = searchParams.get("from") || practiceToday(settings);
    if (!DATE_RE.test(from)) return NextResponse.json({ error: "Invalid from date" }, { status: 400 });
    const days = Math.min(Math.max(Number(searchParams.get("days")) || 14, 1), 31);
    const range = await getAvailabilityRange(from, days, durationMinutes);
    return NextResponse.json({
      timezone: settings.timezone,
      today: practiceToday(settings),
      maxAdvanceDays: settings.maxAdvanceDays,
      durationMinutes,
      days: range.days,
    });
  } catch (error) {
    console.error("GET availability error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
