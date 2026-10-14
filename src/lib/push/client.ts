"use client";

/** Browser-side push helpers (Firebase Cloud Messaging web). Config comes from NEXT_PUBLIC_FIREBASE_* env vars. */

const SW_URL = "/firebase-messaging-sw.js";
const STORAGE_KEY = "push-token";

function firebaseConfig() {
  return {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };
}

/** True when the Firebase env vars are filled in (build-time). */
export function pushConfigured(): boolean {
  const c = firebaseConfig();
  return !!(c.apiKey && c.projectId && c.messagingSenderId && c.appId && process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY);
}

export function pushSupported(): boolean {
  return typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

export type PushState = "unsupported" | "unconfigured" | "denied" | "off" | "on";

export function currentPushState(): PushState {
  if (!pushSupported()) return "unsupported";
  if (!pushConfigured()) return "unconfigured";
  if (Notification.permission === "denied") return "denied";
  let stored: string | null = null;
  try {
    stored = localStorage.getItem(STORAGE_KEY);
  } catch {}
  return Notification.permission === "granted" && stored ? "on" : "off";
}

async function getMessagingInstance() {
  const [{ getApps, initializeApp }, { getMessaging }] = await Promise.all([import("firebase/app"), import("firebase/messaging")]);
  const app = getApps()[0] ?? initializeApp(firebaseConfig());
  return getMessaging(app);
}

/** Ask permission, get an FCM token for this browser, and register it with the server. */
export async function enablePush(): Promise<PushState> {
  const state = currentPushState();
  if (state === "unsupported" || state === "unconfigured" || state === "denied") return state;

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return permission === "denied" ? "denied" : "off";

  const registration = await navigator.serviceWorker.register(SW_URL);
  await navigator.serviceWorker.ready;
  const { getToken } = await import("firebase/messaging");
  const token = await getToken(await getMessagingInstance(), {
    vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
    serviceWorkerRegistration: registration,
  });
  if (!token) return "off";

  const res = await fetch("/api/notifications/push", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Could not register this device");
  try {
    localStorage.setItem(STORAGE_KEY, token);
  } catch {}
  return "on";
}

/** Unregister this browser on the server and drop the FCM token. */
export async function disablePush(): Promise<PushState> {
  let token: string | null = null;
  try {
    token = localStorage.getItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
  if (token) {
    await fetch("/api/notifications/push", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    }).catch(() => {});
    try {
      const { deleteToken } = await import("firebase/messaging");
      await deleteToken(await getMessagingInstance());
    } catch {}
  }
  return currentPushState();
}

/** While the tab is open, FCM delivers to the page instead of the worker — run `cb` so the bell can refresh. */
export async function onForegroundPush(cb: () => void): Promise<() => void> {
  if (currentPushState() !== "on") return () => {};
  try {
    const { onMessage } = await import("firebase/messaging");
    return onMessage(await getMessagingInstance(), cb);
  } catch {
    return () => {};
  }
}
