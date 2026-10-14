"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Bell, CheckCheck, Trash2, X } from "lucide-react";
import { NotificationIcon } from "@/components/notifications/NotificationIcon";
import { CATEGORIES, dayGroup, kindMeta, timeAgo, type NotificationCategory, type NotificationItem } from "@/lib/notify/client";

const GROUP_ORDER = ["Today", "Yesterday", "Earlier this week", "Older"];

export default function NotificationsPage() {
  const { status } = useSession();
  const router = useRouter();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [onlyUnread, setOnlyUnread] = useState(false);
  const [category, setCategory] = useState<NotificationCategory | "all">("all");

  const load = useCallback(async () => {
    const res = await fetch("/api/notifications?limit=100", { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      setItems(data.items);
      setUnread(data.unreadCount);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login?callbackUrl=/notifications");
    if (status === "authenticated") load();
  }, [status, load, router]);

  const counts = useMemo(() => {
    const c: Partial<Record<NotificationCategory, number>> = {};
    for (const n of items) if (!n.readAt) c[kindMeta(n.kind).category] = (c[kindMeta(n.kind).category] ?? 0) + 1;
    return c;
  }, [items]);

  const visible = useMemo(
    () => items.filter((n) => (category === "all" || kindMeta(n.kind).category === category) && (!onlyUnread || !n.readAt)),
    [items, category, onlyUnread]
  );

  const groups = useMemo(() => {
    const map = new Map<string, NotificationItem[]>();
    for (const n of visible) map.set(dayGroup(n.createdAt), [...(map.get(dayGroup(n.createdAt)) ?? []), n]);
    return GROUP_ORDER.filter((g) => map.has(g)).map((g) => ({ label: g, items: map.get(g)! }));
  }, [visible]);

  const patch = (body: object) =>
    fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then(load);

  const open = (n: NotificationItem) => {
    if (!n.readAt) patch({ ids: [n.id] });
    if (n.href) router.push(n.href);
  };

  const dismiss = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setItems((prev) => prev.filter((n) => n.id !== id));
    fetch(`/api/notifications?id=${id}`, { method: "DELETE" }).then(load);
  };

  const clearRead = () => fetch("/api/notifications", { method: "DELETE" }).then(load);

  const tab = (active: boolean) =>
    `shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
      active ? "border-orange bg-orange/15 text-orange" : "border-black-line text-cream/60 hover:text-cream"
    }`;

  return (
    <main className="min-h-screen px-4 pb-16 pt-28">
      <div className="mx-auto max-w-2xl">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h1 className="flex items-center gap-2 text-2xl font-semibold text-cream">
            <Bell size={22} className="text-orange" /> Notifications
            {unread > 0 && <span className="rounded-full bg-orange px-2 py-0.5 text-xs text-black">{unread} new</span>}
          </h1>
          <div className="flex items-center gap-3 text-xs">
            <button onClick={() => patch({ all: true })} disabled={!unread} className="flex items-center gap-1 text-cream/60 hover:text-orange disabled:opacity-40">
              <CheckCheck size={14} /> Mark all read
            </button>
            <button onClick={clearRead} className="flex items-center gap-1 text-cream/60 hover:text-orange">
              <Trash2 size={14} /> Clear read
            </button>
          </div>
        </div>

        <div className="mb-5 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Filter notifications">
          <button role="tab" aria-selected={category === "all"} className={tab(category === "all")} onClick={() => setCategory("all")}>
            All
          </button>
          {CATEGORIES.map((c) => (
            <button key={c.key} role="tab" aria-selected={category === c.key} className={tab(category === c.key)} onClick={() => setCategory(c.key)}>
              {c.label}
              {!!counts[c.key] && <span className="ml-1.5 text-[10px] opacity-80">{counts[c.key]}</span>}
            </button>
          ))}
          <button className={`${tab(onlyUnread)} ml-auto`} onClick={() => setOnlyUnread((v) => !v)}>
            Unread only
          </button>
        </div>

        {loading ? (
          <p className="text-sm text-cream/50">Loading…</p>
        ) : groups.length === 0 ? (
          <div className="rounded-2xl border border-black-line p-10 text-center">
            <Bell size={28} className="mx-auto mb-3 text-cream/25" />
            <p className="text-sm text-cream/50">{onlyUnread || category !== "all" ? "Nothing matches this filter." : "No notifications yet — we'll let you know when something happens."}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {groups.map((g) => (
              <section key={g.label}>
                <h2 className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-cream/40">{g.label}</h2>
                <ul className="divide-y divide-black-line/50 overflow-hidden rounded-2xl border border-black-line bg-black-raised/40">
                  {g.items.map((n) => (
                    <li
                      key={n.id}
                      onClick={() => open(n)}
                      className={`group flex cursor-pointer items-start gap-3 px-4 py-4 transition-colors ${n.readAt ? "hover:bg-white/5" : "bg-orange/5 hover:bg-orange/10"}`}
                    >
                      <NotificationIcon kind={n.kind} />
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-2 text-sm font-semibold text-cream">
                          {n.title}
                          {!n.readAt && <span className="h-2 w-2 shrink-0 rounded-full bg-orange" aria-label="unread" />}
                        </p>
                        <p className="mt-0.5 whitespace-pre-line text-sm text-cream/60">{n.body}</p>
                        <p className="mt-1.5 text-[11px] text-cream/35">{timeAgo(n.createdAt)}</p>
                      </div>
                      <button
                        onClick={(e) => dismiss(e, n.id)}
                        aria-label="Dismiss notification"
                        className="shrink-0 rounded-full p-1 text-cream/30 hover:bg-white/10 hover:text-cream sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100 sm:focus:opacity-100"
                      >
                        <X size={14} />
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
