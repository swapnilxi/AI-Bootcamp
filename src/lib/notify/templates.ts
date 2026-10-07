import { formatInZone } from "@/features/booking/server";

export type BookingNoticeKind =
  | "received"
  | "confirmed"
  | "declined"
  | "rescheduled"
  | "cancelled"
  | "reminder"
  | "custom";

export interface BookingForNotice {
  referenceCode: string;
  clientName: string;
  scheduledAt: Date;
  durationMinutes: number;
  meetingLink: string | null;
  cancellationReason?: string | null;
  service: { title: string };
}

export interface RenderedMessage {
  subject: string;
  text: string;
  html: string;
  whatsapp: string;
}

const BRAND = "AI Bootcamp";

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

/** Wraps paragraphs in a simple branded, dark-gold, email-client-safe layout. */
export function renderEmailHtml(heading: string, paragraphs: string[], cta?: { label: string; url: string }) {
  const body = paragraphs
    .map((p) => `<p style="margin:0 0 14px;color:#d9d3c7;font-size:15px;line-height:1.6">${escapeHtml(p).replace(/\n/g, "<br>")}</p>`)
    .join("");
  const button = cta
    ? `<p style="margin:22px 0 6px"><a href="${cta.url}" style="display:inline-block;background:#FF7315;color:#0B0B0D;text-decoration:none;font-weight:600;padding:12px 22px;border-radius:6px;font-size:14px">${escapeHtml(cta.label)}</a></p>`
    : "";
  return `<!doctype html><html><body style="margin:0;background:#0B0B0D;padding:28px 12px;font-family:Helvetica,Arial,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#141417;border:1px solid #26262B;border-radius:10px">
<tr><td style="padding:26px 30px 8px;border-bottom:1px solid #26262B">
<p style="margin:0;color:#FF7315;font-family:Georgia,serif;font-size:20px;letter-spacing:1px">${BRAND}</p></td></tr>
<tr><td style="padding:26px 30px">
<h1 style="margin:0 0 16px;color:#F2EDE3;font-family:Georgia,serif;font-weight:normal;font-size:24px">${escapeHtml(heading)}</h1>
${body}${button}
</td></tr>
<tr><td style="padding:16px 30px 24px;border-top:1px solid #26262B;color:#8a857b;font-size:12px">Confidential consultative AI engineering · Reply to this email if you have any questions.</td></tr>
</table></td></tr></table></body></html>`;
}

/** Message copy for each booking lifecycle event, rendered for email and WhatsApp. */
export function renderBookingNotice(
  kind: BookingNoticeKind,
  b: BookingForNotice,
  opts: { timezone: string; manageUrl: string; customMessage?: string }
): RenderedMessage {
  const when = formatInZone(b.scheduledAt, opts.timezone);
  const first = b.clientName.split(" ")[0];
  const details = `${b.service.title}\n${when} · ${b.durationMinutes} minutes\nReference: ${b.referenceCode}`;
  const meeting = b.meetingLink ? `Join link: ${b.meetingLink}` : "";
  const note = opts.customMessage?.trim() ? opts.customMessage.trim() : "";

  const copy: Record<BookingNoticeKind, { subject: string; heading: string; lines: string[] }> = {
    received: {
      subject: `Request received: ${b.service.title} (${b.referenceCode})`,
      heading: "We've received your request",
      lines: [
        `Dear ${first},`,
        "Thank you for requesting a session. Your preferred time is being held while the mentor reviews it, and you'll receive a confirmation shortly.",
        details,
      ],
    },
    confirmed: {
      subject: `Confirmed: ${b.service.title} on ${when}`,
      heading: "Your session is confirmed",
      lines: [`Dear ${first},`, "Your session is confirmed. We look forward to speaking with you.", details, meeting],
    },
    declined: {
      subject: `Update on your request (${b.referenceCode})`,
      heading: "We couldn't confirm this time",
      lines: [
        `Dear ${first},`,
        "Unfortunately we're unable to confirm your requested session.",
        details,
        b.cancellationReason ? `Note from the mentor: ${b.cancellationReason}` : "",
        "You're welcome to choose another time that suits you.",
      ],
    },
    rescheduled: {
      subject: `New time: ${b.service.title} on ${when}`,
      heading: "Your session has a new time",
      lines: [`Dear ${first},`, "Your session has been moved to the time below.", details, meeting],
    },
    cancelled: {
      subject: `Cancelled: ${b.service.title} (${b.referenceCode})`,
      heading: "Your session was cancelled",
      lines: [
        `Dear ${first},`,
        "This session has been cancelled.",
        details,
        b.cancellationReason ? `Reason: ${b.cancellationReason}` : "",
      ],
    },
    reminder: {
      subject: `Reminder: ${b.service.title} ${when}`,
      heading: "Your session is coming up",
      lines: [
        `Dear ${first},`,
        "A gentle reminder of your upcoming session. Please have your birth details to hand and join a few minutes early.",
        details,
        meeting,
      ],
    },
    custom: {
      subject: `Message about your session (${b.referenceCode})`,
      heading: "A message from the practice",
      lines: [`Dear ${first},`, note, details],
    },
  };

  const c = copy[kind];
  // Mentor's personal note is added to every lifecycle message when provided
  const lines = [...c.lines, kind !== "custom" && note ? `Note: ${note}` : ""].filter(Boolean);
  const cta = { label: "View your booking", url: opts.manageUrl };

  return {
    subject: c.subject,
    text: `${lines.join("\n\n")}\n\nView or manage your booking: ${opts.manageUrl}\n\n— ${BRAND}`,
    html: renderEmailHtml(c.heading, lines, cta),
    whatsapp: `*${BRAND}*\n${c.heading}\n\n${lines.slice(1).join("\n\n")}\n\nManage: ${opts.manageUrl}`,
  };
}
