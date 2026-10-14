/* Push service worker for AI Bootcamp browser notifications.
 * FCM delivers data-only messages through the standard Push API, so no Firebase SDK
 * (and therefore no config) is needed here. Server payload: { data: { title, body, href } }. */

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch (e) {
    payload = { data: { body: event.data ? event.data.text() : "" } };
  }
  const d = payload.data || payload.notification || payload;
  const title = d.title || "AI Bootcamp";
  event.waitUntil(
    self.registration.showNotification(title, {
      body: d.body || "",
      icon: "/icon.png",
      badge: "/favicon.svg",
      data: { href: d.href || "/notifications" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const href = (event.notification.data && event.notification.data.href) || "/notifications";
  const url = new URL(href, self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((wins) => {
      for (const w of wins) {
        if (w.url.startsWith(self.location.origin) && "focus" in w) {
          w.navigate(url);
          return w.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});
