"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@/components/ui/Icon";
import { currentPushState, disablePush, enablePush, onForegroundPush, type PushState } from "@/lib/push/client";
import { NotificationIcon } from "@/components/notifications/NotificationIcon";
import { timeAgo, type NotificationItem } from "@/lib/notify/client";

const POLL_MS = 60_000;

export function NotificationBell() {
  const { status } = useSession();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications?limit=10", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.items);
      setUnreadCount(data.unreadCount);
    } catch {
      /* offline — keep what we have */
    }
  }, []);

  const [push, setPush] = useState<PushState>("unconfigured");
  const [pushBusy, setPushBusy] = useState(false);
  const [pushError, setPushError] = useState("");

  useEffect(() => setPush(currentPushState()), []);

  // Foreground push (tab open) → refresh the bell immediately instead of waiting for the poll.
  useEffect(() => {
    if (status !== "authenticated" || push !== "on") return;
    let off = () => {};
    onForegroundPush(() => load()).then((unsub) => (off = unsub));
    return () => off();
  }, [status, push, load]);

  const togglePush = async () => {
    setPushBusy(true);
    setPushError("");
    try {
      setPush(push === "on" ? await disablePush() : await enablePush());
    } catch (e) {
      setPushError((e as Error).message || "Couldn't change browser alerts");
    } finally {
      setPushBusy(false);
    }
  };

  // Poll while signed in; refresh on tab focus so a returning user sees fresh items.
  useEffect(() => {
    if (status !== "authenticated") return;
    load();
    const timer = setInterval(load, POLL_MS);
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", onFocus);
    };
  }, [status, load]);

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })));
    setUnreadCount(0);
    fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    }).catch(() => load());
  };

  const openItem = (n: NotificationItem) => {
    if (!n.readAt) {
      setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, readAt: new Date().toISOString() } : x)));
      setUnreadCount((c) => Math.max(0, c - 1));
      fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [n.id] }),
      }).catch(() => load());
    }
    if (n.href) {
      setOpen(false);
      router.push(n.href);
    }
  };

  // Notifications are per-account; nothing to show a signed-out visitor.
  if (status !== "authenticated") return null;

  return (
    <div className="relative">
      {/* Bell button */}
      <motion.button
        type="button"
        onClick={() => setOpen((v) => !v)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
        className="relative inline-flex items-center justify-center w-9 h-9 rounded-full transition-colors duration-200 border border-black-line bg-black-raised/80 text-cream hover:border-orange hover:shadow-[0_0_12px_rgba(var(--orange-rgb),0.25)]"
      >
        <Icon name="bell" size={16} className="text-cream/80" />

        {/* Unread badge */}
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              key="badge"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-4 h-4 rounded-full bg-orange text-black text-[9px] font-bold leading-none"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Dropdown panel */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="absolute right-0 top-[calc(100%+10px)] z-50 w-80 rounded-2xl border border-black-line bg-black/90 backdrop-blur-xl shadow-[0_24px_48px_-12px_rgba(0,0,0,0.8)] overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-black-line/60">
                <span className="text-sm font-semibold text-cream">
                  Notifications
                </span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-xs text-orange hover:text-orange/80 transition-colors"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              {/* List */}
              <ul className="divide-y divide-black-line/40 max-h-72 overflow-y-auto">
                {notifications.length === 0 ? (
                  <li className="px-4 py-6 text-center text-sm text-cream/40">
                    No notifications yet
                  </li>
                ) : (
                  notifications.map((n) => (
                    <li
                      key={n.id}
                      onClick={() => openItem(n)}
                      className={`flex gap-3 px-4 py-3 cursor-pointer transition-colors duration-150 ${
                        n.readAt
                          ? "hover:bg-white/5"
                          : "bg-orange/5 hover:bg-orange/8"
                      }`}
                    >
                      <NotificationIcon kind={n.kind} />
                      <div className="min-w-0">
                        <p className="flex items-center gap-1.5 text-xs font-semibold text-cream">
                          <span className="truncate">{n.title}</span>
                          {!n.readAt && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-orange" aria-label="unread" />}
                        </p>
                        <p className="text-xs text-cream/55 mt-0.5 line-clamp-2">
                          {n.body}
                        </p>
                        <p className="text-[10px] text-cream/35 mt-1">{timeAgo(n.createdAt)}</p>
                      </div>
                    </li>
                  ))
                )}
              </ul>

              {/* Footer */}
              <div className="px-4 py-2.5 border-t border-black-line/60 space-y-1.5">
                {push !== "unsupported" && push !== "unconfigured" && (
                  <div className="text-center">
                    {push === "denied" ? (
                      <p className="text-[11px] text-cream/40">Browser alerts are blocked — allow them in your browser's site settings.</p>
                    ) : (
                      <button
                        type="button"
                        onClick={togglePush}
                        disabled={pushBusy}
                        className="text-[11px] text-orange hover:text-orange/80 disabled:opacity-50"
                      >
                        {pushBusy ? "Working…" : push === "on" ? "Turn off browser alerts" : "Turn on browser alerts"}
                      </button>
                    )}
                    {pushError && <p className="text-[11px] text-red-400 mt-1">{pushError}</p>}
                  </div>
                )}
                <Link
                  href="/notifications"
                  onClick={() => setOpen(false)}
                  className="block w-full text-center text-xs text-cream/40 hover:text-orange transition-colors"
                >
                  View all notifications
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
