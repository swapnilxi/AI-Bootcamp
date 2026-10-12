import { prisma } from "@/lib/prisma";
import {
  appUrl,
  formatInZone,
  getBookingSettings,
  manageBookingUrl,
} from "@/features/booking/server";
import {
  ChannelResult,
  isEmailConfigured,
  isWhatsAppConfigured,
  sendEmail,
  sendWhatsApp,
  whatsappLink,
} from "./channels";
import { notifyRoles, notifyUserId } from "./dispatch";
import { BookingNoticeKind, renderBookingNotice, renderEmailHtml } from "./templates";

export type Channel = "EMAIL" | "WHATSAPP";

export interface DeliveryReport {
  channel: Channel;
  status: ChannelResult["status"];
  error?: string;
}

export function notificationCapabilities() {
  return { email: isEmailConfigured(), whatsapp: isWhatsAppConfigured() };
}

async function log(entry: {
  channel: Channel;
  kind: string;
  recipient: string;
  subject?: string;
  body: string;
  result: ChannelResult;
  bookingId?: string;
  userId?: string;
  sentById?: string;
}) {
  await prisma.notificationLog.create({
    data: {
      channel: entry.channel,
      kind: entry.kind,
      recipient: entry.recipient,
      subject: entry.subject,
      body: entry.body.slice(0, 4000),
      status: entry.result.status,
      error: entry.result.error,
      bookingId: entry.bookingId,
      userId: entry.userId,
      sentById: entry.sentById,
    },
  });
}

/**
 * Send a booking lifecycle message to the client over the chosen channels.
 * Never throws: failures are logged and reported back for the admin UI.
 */
export async function notifyBooking(
  bookingId: string,
  kind: BookingNoticeKind,
  opts: { channels?: Channel[]; customMessage?: string; sentById?: string } = {}
): Promise<{ deliveries: DeliveryReport[]; whatsappLink: string | null }> {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId }, include: { service: true } });
  if (!booking) return { deliveries: [], whatsappLink: null };

  const settings = await getBookingSettings();
  const msg = renderBookingNotice(kind, booking, {
    timezone: settings.timezone,
    manageUrl: manageBookingUrl(booking),
    customMessage: opts.customMessage,
  });

  const channels = opts.channels ?? (booking.whatsappOptIn ? ["EMAIL", "WHATSAPP"] : ["EMAIL"]);
  const deliveries: DeliveryReport[] = [];

  for (const channel of channels) {
    try {
      const result =
        channel === "EMAIL"
          ? await sendEmail(booking.clientEmail, msg.subject, msg.text, msg.html)
          : await sendWhatsApp(booking.clientPhone, msg.whatsapp);
      deliveries.push({ channel, status: result.status, error: result.error });
      await log({
        channel,
        kind,
        recipient: channel === "EMAIL" ? booking.clientEmail : booking.clientPhone,
        subject: channel === "EMAIL" ? msg.subject : undefined,
        body: channel === "EMAIL" ? msg.text : msg.whatsapp,
        result,
        bookingId,
        userId: booking.userId ?? undefined,
        sentById: opts.sentById,
      });
    } catch (err) {
      console.error(`notifyBooking ${channel} failed:`, err);
      deliveries.push({ channel, status: "FAILED", error: "Unexpected error" });
    }
  }

  // In-app copy for clients with an account (email/WhatsApp already went out above).
  if (booking.userId) {
    await notifyUserId(booking.userId, {
      kind: `booking_${kind}`,
      title: msg.subject,
      body: msg.text.split("\n\n").slice(1, 3).join("\n"),
      href: "/my-bookings",
      email: false,
    });
  }

  return { deliveries, whatsappLink: whatsappLink(booking.clientPhone, msg.whatsapp) };
}

/** Email the practice when a client books, reschedules or cancels. */
export async function alertAdmin(bookingId: string, event: "new" | "rescheduled" | "cancelled") {
  try {
    const settings = await getBookingSettings();
    const b = await prisma.booking.findUnique({ where: { id: bookingId }, include: { service: true } });
    if (!b) return;
    const when = formatInZone(b.scheduledAt, settings.timezone);
    const verb = { new: "New booking request", rescheduled: "Booking rescheduled by client", cancelled: "Booking cancelled by client" }[event];
    const subject = `${verb}: ${b.clientName} · ${b.service.title}`;

    // In-app alert for admins (and the assigned mentor), independent of the alert inbox below.
    const inApp = { kind: `admin_booking_${event}`, title: subject, body: `${when} · ${b.durationMinutes} min · Ref ${b.referenceCode}`, href: `/dashboard/admin?booking=${b.id}`, email: false };
    await Promise.all([notifyRoles(["ADMIN", "SUPER_ADMIN"], inApp), notifyUserId(b.instructorId, inApp)]);

    if (!settings.adminNotifyEmail) return;
    const lines = [
      `${verb}.`,
      `${b.service.title}\n${when} · ${b.durationMinutes} min\nReference: ${b.referenceCode}`,
      `Client: ${b.clientName}\nEmail: ${b.clientEmail}\nPhone: ${b.clientPhone}`,
      b.status === "PENDING" ? "This booking is awaiting your approval." : `Status: ${b.status}`,
    ];
    const url = `${appUrl()}/dashboard/admin?booking=${b.id}`;
    const result = await sendEmail(
      settings.adminNotifyEmail,
      subject,
      `${lines.join("\n\n")}\n\nOpen in dashboard: ${url}`,
      renderEmailHtml(verb, lines, { label: "Open in dashboard", url })
    );
    await log({ channel: "EMAIL", kind: "admin_alert", recipient: settings.adminNotifyEmail, subject, body: lines.join("\n\n"), result, bookingId });
  } catch (err) {
    console.error("alertAdmin failed:", err);
  }
}

/** Direct message from an admin to a user (not tied to a booking). */
export async function notifyUser(
  user: { id: string; email: string; name: string | null; phone: string | null },
  message: { subject: string; body: string },
  channels: Channel[],
  sentById: string
): Promise<{ deliveries: DeliveryReport[]; whatsappLink: string | null }> {
  const first = (user.name || "").split(" ")[0] || "there";
  const text = `Dear ${first},\n\n${message.body}\n\n— AI Bootcamp`;
  const wa = `*AI Bootcamp*\n\n${message.body}`;
  const deliveries: DeliveryReport[] = [];

  // Always drop it in the user's in-app inbox as well.
  await notifyUserId(user.id, { kind: "custom", title: message.subject, body: message.body, email: false, sentById });

  for (const channel of channels) {
    let result: ChannelResult;
    if (channel === "EMAIL") {
      result = await sendEmail(user.email, message.subject, text, renderEmailHtml(message.subject, [`Dear ${first},`, message.body]));
    } else if (!user.phone) {
      result = { status: "FAILED", error: "No phone number on file" };
    } else {
      result = await sendWhatsApp(user.phone, wa);
    }
    deliveries.push({ channel, status: result.status, error: result.error });
    await log({
      channel,
      kind: "custom",
      recipient: channel === "EMAIL" ? user.email : user.phone || "-",
      subject: channel === "EMAIL" ? message.subject : undefined,
      body: channel === "EMAIL" ? text : wa,
      result,
      userId: user.id,
      sentById,
    });
  }
  return { deliveries, whatsappLink: whatsappLink(user.phone, wa) };
}

export { notify, absoluteUrl } from "./dispatch";

export { notifyUserId, notifyRoles } from "./dispatch";
