import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notifyBooking } from "@/lib/notify";

/**
 * Sends one reminder per confirmed booking starting in the next 36 hours.
 * Called by Vercel Cron (see vercel.json); protected by CRON_SECRET.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const due = await prisma.booking.findMany({
    where: {
      status: { in: ["CONFIRMED", "RESCHEDULED"] },
      reminderSentAt: null,
      scheduledAt: { gt: now, lte: new Date(now.getTime() + 36 * 3_600_000) },
    },
    select: { id: true },
  });

  let sent = 0;
  for (const b of due) {
    const { deliveries } = await notifyBooking(b.id, "reminder");
    if (deliveries.some((d) => d.status === "SENT")) sent++;
    await prisma.booking.update({ where: { id: b.id }, data: { reminderSentAt: new Date() } });
  }

  return NextResponse.json({ due: due.length, sent });
}
