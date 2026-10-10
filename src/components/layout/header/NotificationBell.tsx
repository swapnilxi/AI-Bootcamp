"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@/components/ui/Icon";

interface Notification {
  id: string;
  title: string;
  body: string;
  time: string;
  read: boolean;
}

const DEMO_NOTIFICATIONS: Notification[] = [
  {
    id: "1",
    title: "New lesson available",
    body: "RAG with Gemini 2.0 is now live in the AI Engineering path.",
    time: "2m ago",
    read: false,
  },
  {
    id: "2",
    title: "Project feedback",
    body: "Your RAG chatbot submission has been reviewed.",
    time: "1h ago",
    read: false,
  },
  {
    id: "3",
    title: "Bootcamp reminder",
    body: "Live session starts in 30 minutes — AI Agents deep-dive.",
    time: "3h ago",
    read: true,
  },
];

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState(DEMO_NOTIFICATIONS);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () =>
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

  const markRead = (id: string) =>
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );

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
              {unreadCount}
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
                      onClick={() => markRead(n.id)}
                      className={`flex gap-3 px-4 py-3 cursor-pointer transition-colors duration-150 ${
                        n.read
                          ? "hover:bg-white/5"
                          : "bg-orange/5 hover:bg-orange/8"
                      }`}
                    >
                      {/* Unread dot */}
                      <div className="mt-1.5 shrink-0">
                        <span
                          className={`block w-2 h-2 rounded-full ${
                            n.read ? "bg-transparent" : "bg-orange"
                          }`}
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-cream truncate">
                          {n.title}
                        </p>
                        <p className="text-xs text-cream/55 mt-0.5 line-clamp-2">
                          {n.body}
                        </p>
                        <p className="text-[10px] text-cream/35 mt-1">{n.time}</p>
                      </div>
                    </li>
                  ))
                )}
              </ul>

              {/* Footer */}
              <div className="px-4 py-2.5 border-t border-black-line/60">
                <button className="w-full text-center text-xs text-cream/40 hover:text-orange transition-colors">
                  View all notifications
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
