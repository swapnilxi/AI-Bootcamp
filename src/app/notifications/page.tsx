"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Bell, CheckCheck, Trash2 } from "lucide-react";
import { timeAgo, type NotificationItem } from "@/lib/notify/client";

export default function NotificationsPage() {
  const { status } = useSession();
  const router = useRouter();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [onlyUnread, setOnlyUnread] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/notifications?limit=100${onlyUnread ? "&unread=1" : ""}`, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      setItems(data.items);
      setUnread(data.unreadCount);
    }
    setLoading(false);
  }, [onlyUnread]);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login?callbackUrl=/notifications");
    if (status === "authenticated") load();
  }, [status, load, router]);

  const patch = (body: object) =>
    fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then(load);

  const open = (n: NotificationItem) => {
    if (!n.readAt) patch({ ids: [n.id] });
    if (n.href) router.push(n.href);
  };

  const clearRead = () => fetch("/api/notifications", { method: "DELETE" }).then(load);

  return (
    <main className="min-h-screen pt-28 pb-16 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
          <h1 className="text-2xl font-semibold text-cream flex items-center gap-2">
            <Bell size={22} className="text-orange" /> Notifications
            {unread > 0 && <span className="text-xs bg-orange text-black rounded-full px-2 py-0.5">{unread} new</span>}
          </h1>
          <div className="flex items-center gap-3 text-xs">
            <button onClick={() => setOnlyUnread((v) => !v)} className="text-cream/60 hover:text-orange">
              {onlyUnread ? "Show all" : "Unread only"}
            </button>
            <button onClick={() => patch({ all: true })} disabled={!unread} className="flex items-center gap-1 text-cream/60 hover:text-orange disabled:opacity-40">
              <CheckCheck size={14} /> Mark all read
            </button>
            <button onClick={clearRead} className="flex items-center gap-1 text-cream/60 hover:text-orange">
              <Trash2 size={14} /> Clear read
            </button>
          </div>
        </div>

        {loading ? (
          <p className="text-cream/50 text-sm">Loading…</p>
        ) : items.length === 0 ? (
          <p className="text-cream/50 text-sm border border-black-line rounded-2xl p-8 text-center">
            {onlyUnread ? "You're all caught up." : "No notifications yet."}
          </p>
        ) : (
          <ul className="border border-black-line rounded-2xl divide-y divide-black-line/50 overflow-hidden bg-black-raised/40">
            {items.map((n) => (
              <li
                key={n.id}
                onClick={() => open(n)}
                className={`flex gap-3 px-4 py-4 cursor-pointer transition-colors ${n.readAt ? "hover:bg-white/5" : "bg-orange/5 hover:bg-orange/10"}`}
              >
                <span className={`mt-2 w-2 h-2 rounded-full shrink-0 ${n.readAt ? "bg-transparent" : "bg-orange"}`} />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-cream">{n.title}</p>
                  <p className="text-sm text-cream/60 mt-0.5 whitespace-pre-line">{n.body}</p>
                  <p className="text-[11px] text-cream/35 mt-1.5">{timeAgo(n.createdAt)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
