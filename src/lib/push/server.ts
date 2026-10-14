import "server-only";
import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import { prisma } from "@/lib/prisma";

/**
 * Browser push via Firebase Cloud Messaging (free). Configured by one env var,
 * FIREBASE_SERVICE_ACCOUNT_JSON (the whole service-account JSON, single line).
 * Without it every function here is a silent no-op, so the rest of the app works unchanged.
 */

export function isPushConfigured(): boolean {
  return !!process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
}

let app: App | null = null;
function getAdminApp(): App | null {
  if (app) return app;
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) return null;
  try {
    app = getApps()[0] ?? initializeApp({ credential: cert(JSON.parse(raw)) });
    return app;
  } catch (err) {
    console.error("Firebase admin init failed (check FIREBASE_SERVICE_ACCOUNT_JSON):", (err as Error).message);
    return null;
  }
}

export interface PushPayload {
  title: string;
  body: string;
  /** App-relative link opened when the notification is clicked. */
  href?: string;
}

/** Push to every registered device of a user. Returns { sent, failed }; never throws. */
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<{ sent: number; failed: number }> {
  const none = { sent: 0, failed: 0 };
  const adminApp = getAdminApp();
  if (!adminApp) return none;
  try {
    const rows = await prisma.pushToken.findMany({ where: { userId }, select: { token: true } });
    if (!rows.length) return none;

    const res = await getMessaging(adminApp).sendEachForMulticast({
      tokens: rows.map((r) => r.token),
      // Data-only: the service worker builds the notification, so we control click handling.
      data: { title: payload.title, body: payload.body.slice(0, 240), href: payload.href || "/notifications" },
      webpush: { headers: { Urgency: "normal", TTL: "86400" } },
    });

    // Drop tokens FCM says are dead (uninstalled / permission revoked) so we stop retrying them.
    const dead = rows
      .filter((_, i) => {
        const code = res.responses[i].error?.code;
        return code === "messaging/registration-token-not-registered" || code === "messaging/invalid-registration-token";
      })
      .map((r) => r.token);
    if (dead.length) await prisma.pushToken.deleteMany({ where: { token: { in: dead } } });

    return { sent: res.successCount, failed: res.failureCount };
  } catch (err) {
    console.error("sendPushToUser failed:", err);
    return none;
  }
}
