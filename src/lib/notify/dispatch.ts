import { prisma } from "@/lib/prisma";
import { appUrl } from "@/features/booking/server/access";
import { sendEmail } from "./channels";
import { sendPushToUser } from "@/lib/push/server";
import { renderEmailHtml } from "./templates";

/**
 * One entry point for every platform event that should reach a person:
 *  - an in-app `Notification` (header bell + /notifications) — always, free, no setup
 *  - an email via SMTP (when `email` is true and SMTP is configured)
 *  - an honest `NotificationLog` row, so the admin audit trail shows SENT / FAILED / SKIPPED
 *
 * Nothing here throws: a failed notification must never fail the request that caused it.
 */

export interface NotifyPayload {
  kind: string;
  title: string;
  body: string;
  /** App-relative link (e.g. "/dashboard/admin"); made absolute in emails. */
  href?: string;
  /** Also send an email. Defaults to true. */
  email?: boolean;
  /** Also push to the user's registered browsers. Defaults to true; no-op if push isn't configured. */
  push?: boolean;
  sentById?: string;
  /**
   * Fold into an unread notification of the same kind + link from the last hour instead of
   * adding another (and skip push/email). For noisy streams like "3 lessons need review".
   */
  coalesce?: boolean;
}

interface Recipient {
  id: string;
  email: string;
  name: string | null;
}

export function absoluteUrl(href?: string): string | undefined {
  if (!href) return undefined;
  return /^https?:\/\//.test(href) ? href : `${appUrl()}${href.startsWith("/") ? "" : "/"}${href}`;
}

export async function notify(to: Recipient, payload: NotifyPayload): Promise<void> {
  if (payload.coalesce) {
    try {
      const existing = await prisma.notification.findFirst({
        where: { userId: to.id, kind: payload.kind, href: payload.href ?? null, readAt: null, createdAt: { gte: new Date(Date.now() - 3_600_000) } },
        select: { id: true },
      });
      if (existing) {
        await prisma.notification.update({
          where: { id: existing.id },
          data: { title: payload.title, body: payload.body.slice(0, 2000), createdAt: new Date() },
        });
        return;
      }
    } catch (err) {
      console.error("coalesce failed:", err);
    }
  }

  try {
    await prisma.notification.create({
      data: { userId: to.id, kind: payload.kind, title: payload.title, body: payload.body.slice(0, 2000), href: payload.href },
    });
  } catch (err) {
    console.error("in-app notification failed:", err);
  }

  if (payload.push !== false) {
    const { sent, failed } = await sendPushToUser(to.id, { title: payload.title, body: payload.body, href: payload.href });
    // Only audit-log when a device was actually attempted (most users have none).
    if (sent + failed > 0) {
      await prisma.notificationLog
        .create({
          data: {
            channel: "PUSH",
            kind: payload.kind,
            recipient: to.email,
            subject: payload.title,
            body: payload.body.slice(0, 4000),
            status: sent > 0 ? "SENT" : "FAILED",
            error: failed ? `${failed} device(s) failed` : undefined,
            userId: to.id,
            sentById: payload.sentById,
          },
        })
        .catch((err) => console.error("push log failed:", err));
    }
  }

  if (payload.email === false || !to.email) return;

  const first = (to.name || "").split(" ")[0] || "there";
  const url = absoluteUrl(payload.href);
  const text = `Hi ${first},\n\n${payload.body}${url ? `\n\nOpen: ${url}` : ""}\n\n— AI Bootcamp`;
  const result = await sendEmail(
    to.email,
    payload.title,
    text,
    renderEmailHtml(payload.title, [`Hi ${first},`, payload.body], url ? { label: "Open in AI Bootcamp", url } : undefined)
  );
  await prisma.notificationLog
    .create({
      data: {
        channel: "EMAIL",
        kind: payload.kind,
        recipient: to.email,
        subject: payload.title,
        body: text.slice(0, 4000),
        status: result.status,
        error: result.error,
        userId: to.id,
        sentById: payload.sentById,
      },
    })
    .catch((err) => console.error("notification log failed:", err));
}

/** Notify a user by id (looks up their email/name). No-op if the user is gone. */
export async function notifyUserId(userId: string | null | undefined, payload: NotifyPayload): Promise<void> {
  if (!userId) return;
  try {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true, name: true } });
    if (user) await notify(user, payload);
  } catch (err) {
    console.error("notifyUserId failed:", err);
  }
}

/** Notify every user holding one of the given roles (default: all admins). */
export async function notifyRoles(
  roles: ("USER" | "SUBSCRIBER" | "INSTRUCTOR" | "ADMIN" | "SUPER_ADMIN")[] | undefined,
  payload: NotifyPayload,
  opts: { excludeUserId?: string } = {}
): Promise<number> {
  try {
    const users = await prisma.user.findMany({
      where: { role: { in: roles ?? ["ADMIN", "SUPER_ADMIN"] }, ...(opts.excludeUserId ? { id: { not: opts.excludeUserId } } : {}) },
      select: { id: true, email: true, name: true },
    });
    // Sequential in small batches keeps SMTP providers (and SQLite) from being flooded.
    for (let i = 0; i < users.length; i += 10) {
      await Promise.all(users.slice(i, i + 10).map((u) => notify(u, payload)));
    }
    return users.length;
  } catch (err) {
    console.error("notifyRoles failed:", err);
    return 0;
  }
}
