import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/roles";
import {
  getBookingSettings,
  isValidTimeZone,
  saveBookingSettings,
  timeToMinutes,
  zonedToUtc,
} from "@/features/booking/server";
import { notificationCapabilities } from "@/lib/notify";

const TIME = z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Times must be HH:mm");

const putSchema = z.object({
  weeklyHours: z
    .array(
      z.object({
        dayOfWeek: z.number().int().min(0).max(6),
        startTime: TIME,
        endTime: TIME,
        slotDuration: z.number().int().min(15).max(240).default(60),
      })
    )
    .max(28)
    .optional(),
  settings: z
    .object({
      timezone: z.string().refine(isValidTimeZone, "Unknown timezone").optional(),
      requireApproval: z.boolean().optional(),
      minLeadHours: z.number().int().min(0).max(168).optional(),
      maxAdvanceDays: z.number().int().min(1).max(365).optional(),
      bufferMinutes: z.number().int().min(0).max(120).optional(),
      adminNotifyEmail: z.string().trim().email().or(z.literal("")).optional(),
    })
    .optional(),
  blockDate: z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), reason: z.string().max(200).optional() }).optional(),
  unblockId: z.string().optional(),
});

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  return session?.user?.id && isAdminRole(session.user.role) ? session : null;
}

async function snapshot() {
  const settings = await getBookingSettings();
  const [weeklyHours, blockedDates] = await Promise.all([
    prisma.availabilitySlot.findMany({ where: { isActive: true }, orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }] }),
    prisma.blockedDate.findMany({ where: { date: { gte: new Date(Date.now() - 86_400_000) } }, orderBy: { date: "asc" } }),
  ]);
  return {
    settings,
    weeklyHours: weeklyHours.map((h) => ({
      dayOfWeek: h.dayOfWeek,
      startTime: h.startTime,
      endTime: h.endTime,
      slotDuration: h.slotDuration,
    })),
    blockedDates: blockedDates.map((b) => ({
      id: b.id,
      date: new Intl.DateTimeFormat("en-CA", { timeZone: settings.timezone }).format(b.date),
      reason: b.reason,
    })),
    channels: notificationCapabilities(),
  };
}

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return NextResponse.json(await snapshot());
}

export async function PUT(req: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = putSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message || "Invalid data" }, { status: 400 });
  }
  const { weeklyHours, settings, blockDate, unblockId } = parsed.data;

  if (weeklyHours) {
    for (const h of weeklyHours) {
      if (timeToMinutes(h.endTime) <= timeToMinutes(h.startTime)) {
        return NextResponse.json({ error: "Each day's end time must be after its start time" }, { status: 400 });
      }
    }
    // Replace the whole weekly schedule atomically
    await prisma.$transaction([
      prisma.availabilitySlot.deleteMany({}),
      ...weeklyHours.map((h) => prisma.availabilitySlot.create({ data: { ...h, isActive: true } })),
    ]);
  }

  if (settings) await saveBookingSettings(settings);

  if (blockDate) {
    const tz = (await getBookingSettings()).timezone;
    await prisma.blockedDate.create({
      data: { date: zonedToUtc(blockDate.date, "00:00", tz), reason: blockDate.reason || "Mentor unavailable" },
    });
  }

  if (unblockId) {
    await prisma.blockedDate.deleteMany({ where: { id: unblockId } });
  }

  return NextResponse.json(await snapshot());
}
