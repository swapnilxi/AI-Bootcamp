import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdminRole, isInstructorRole } from "@/lib/roles";
import { notifyBooking } from "@/lib/notify";
import { notifySchema } from "../../schemas/booking";

interface RouteParams {
  params: Promise<{ id: string }>;
}


/** Admin: (re)send a booking message to the client over email and/or WhatsApp. */
export async function POST(req: Request, { params }: RouteParams) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = notifySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message || "Invalid request" }, { status: 400 });
  }
  if (parsed.data.kind === "custom" && !parsed.data.message) {
    return NextResponse.json({ error: "Write a message to send" }, { status: 400 });
  }

  const booking = await prisma.booking.findUnique({ where: { id }, select: { id: true, instructorId: true } });
  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  // Admins, or the mentor this booking is assigned to
  const assigned = isInstructorRole(session.user.role) && booking.instructorId === session.user.id;
  if (!isAdminRole(session.user.role) && !assigned) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const result = await notifyBooking(id, parsed.data.kind, {
    channels: parsed.data.channels,
    customMessage: parsed.data.message,
    sentById: session.user.id,
  });
  return NextResponse.json(result);
}
