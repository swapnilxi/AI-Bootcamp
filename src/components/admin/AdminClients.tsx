"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Mail, MessageCircle, Phone, Search, Send } from "lucide-react";
import { Channel, ChannelPicker, DeliveryReport, Drawer, NotifyResult, StatusBadge, inputClass, labelClass } from "./shared";

interface UserRow {
  id: string;
  name: string | null;
  email: string;
  role: string;
  phone: string | null;
  createdAt: string;
  _count: { bookings: number; enrollments: number };
}

interface UserDetail extends UserRow {
  bio: string | null;
}


/** Admin: searchable client directory with editable profiles and direct messaging. */
export function AdminClients() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/users${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ""}`);
    if (res.ok) setUsers((await res.json()).users || []);
    setLoading(false);
  }, [q]);

  useEffect(() => {
    const t = setTimeout(load, q ? 300 : 0);
    return () => clearTimeout(t);
  }, [load, q]);

  return (
    <div className="space-y-5">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-3 w-4 h-4 text-text-muted" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email or phone…" className={`${inputClass} pl-9`} />
      </div>

      <div className="rounded-2xl border border-white/[0.07] bg-black-raised/80 backdrop-blur-sm overflow-x-auto">
        {loading ? (
          <div className="p-12 text-center text-sm text-text-muted">Loading clients…</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-[11px] uppercase tracking-wider text-text-muted border-b border-white/[0.07]">
              <tr>
                <th className="py-3 px-5">Client</th>
                <th className="py-3 px-5">Phone</th>
                <th className="py-3 px-5">Role</th>
                <th className="py-3 px-5">Bookings</th>
                <th className="py-3 px-5">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05]">
              {users.map((u) => (
                <tr key={u.id} onClick={() => setOpenId(u.id)} className="cursor-pointer hover:bg-white/[0.02] transition-colors">
                  <td className="py-3.5 px-5">
                    <p className="text-ink font-medium">{u.name || "—"}</p>
                    <p className="text-xs text-text-muted">{u.email}</p>
                  </td>
                  <td className="py-3.5 px-5 text-text-muted">{u.phone || "—"}</td>
                  <td className="py-3.5 px-5 text-xs text-text-muted">{u.role.replace("_", " ")}</td>
                  <td className="py-3.5 px-5 text-text-muted">{u._count.bookings}</td>
                  <td className="py-3.5 px-5 text-xs text-text-muted">{new Date(u.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-10 text-center text-text-muted">
                    No clients found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {openId && <ClientDrawer id={openId} onClose={() => setOpenId(null)} onChanged={load} />}
    </div>
  );
}

function ClientDrawer({ id, onClose, onChanged }: { id: string; onClose: () => void; onChanged: () => void }) {
  const [user, setUser] = useState<UserDetail | null>(null);
  const [canEdit, setCanEdit] = useState(false);
  const [bookings, setBookings] = useState<{ id: string; referenceCode: string; serviceTitle: string; scheduledAt: string; status: string }[]>([]);
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [channels, setChannels] = useState<Channel[]>(["EMAIL"]);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<NotifyResult | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/users/${id}`);
    if (!res.ok) {
      setError("Could not load this user");
      return;
    }
    const data = await res.json();
    const u: UserDetail = data.user;
    setUser(u);
    setCanEdit(data.canEdit);
    setBookings(data.bookings);
    setForm({
      name: u.name || "",
      email: u.email,
      phone: u.phone || "",
      bio: u.bio || "",
    });
    if (u.phone) setChannels(["EMAIL", "WHATSAPP"]);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    const payload = Object.fromEntries(
      Object.entries(form).map(([k, v]) => [k, v === "" && !["name", "email"].includes(k) ? null : v])
    );
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error || "Could not save");
      return;
    }
    setSaved(true);
    await load();
    onChanged();
  }

  async function send() {
    setSending(true);
    setResult(null);
    setError(null);
    const res = await fetch(`/api/admin/users/${id}/notify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, message, channels }),
    });
    const data = await res.json();
    setSending(false);
    if (!res.ok) {
      setError(data.error || "Could not send");
      return;
    }
    setResult(data);
    setMessage("");
  }

  const field = (key: string, label: string, type = "text", span = false) => (
    <div className={span ? "sm:col-span-2" : ""}>
      <label className={labelClass}>{label}</label>
      <input
        type={type}
        disabled={!canEdit}
        value={form[key] ?? ""}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        className={`${inputClass} disabled:opacity-60`}
      />
    </div>
  );

  return (
    <Drawer open onClose={onClose} title={user?.name || user?.email || "Client"} subtitle={user && `${user.role.replace("_", " ")} · joined ${new Date(user.createdAt).toLocaleDateString()}`}>
      {!user ? (
        <p className="text-sm text-text-muted">{error || "Loading…"}</p>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            <a href={`mailto:${user.email}`} className="min-h-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 text-xs text-text-muted hover:text-gold">
              <Mail className="w-3.5 h-3.5" /> {user.email}
            </a>
            {user.phone && (
              <>
                <a href={`tel:${user.phone}`} className="min-h-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 text-xs text-text-muted hover:text-gold">
                  <Phone className="w-3.5 h-3.5" /> {user.phone}
                </a>
                <a
                  href={`https://wa.me/${user.phone.replace(/[^\d]/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-h-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-emerald-500/30 text-xs text-emerald-200 hover:bg-emerald-500/10"
                >
                  <MessageCircle className="w-3.5 h-3.5" /> WhatsApp chat
                </a>
              </>
            )}
          </div>

          {error && <p className="p-3 rounded-xl bg-clay/10 border border-clay/30 text-clay text-sm">{error}</p>}

          <form onSubmit={save} className="space-y-4">
            <h3 className={labelClass}>Profile</h3>
            {!canEdit && <p className="text-xs text-amber-300">Only a super administrator can edit administrator accounts.</p>}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {field("name", "Full name")}
              {field("email", "Email", "email")}
              {field("phone", "Phone / WhatsApp (with country code)", "tel")}
              <div className="sm:col-span-2">
                <label className={labelClass}>Bio / notes</label>
                <textarea
                  disabled={!canEdit}
                  rows={3}
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  className={`${inputClass} disabled:opacity-60`}
                />
              </div>
            </div>
            {canEdit && (
              <div className="flex items-center justify-end gap-3">
                {saved && <span className="text-xs text-emerald-300">Saved</span>}
                <button disabled={saving} className="px-5 py-2 rounded-xl bg-gold hover:bg-[#FFB073] text-black text-sm font-semibold disabled:opacity-40">
                  {saving ? "Saving…" : "Save profile"}
                </button>
              </div>
            )}
          </form>

          <section className="space-y-3">
            <h3 className={labelClass}>Send a message</h3>
            <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject (used for email)" className={inputClass} maxLength={120} />
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} placeholder="Your message…" className={inputClass} maxLength={2000} />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <ChannelPicker value={channels} onChange={setChannels} whatsappAvailable={!!user.phone} />
              <button
                onClick={send}
                disabled={sending || !subject.trim() || !message.trim() || channels.length === 0}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-gold hover:bg-[#FFB073] text-black text-sm font-semibold disabled:opacity-40"
              >
                <Send className="w-4 h-4" /> {sending ? "Sending…" : "Send"}
              </button>
            </div>
            {!user.phone && <p className="text-[11px] text-text-muted">Add a phone number to enable WhatsApp.</p>}
            <DeliveryReport result={result} />
          </section>

          <section className="space-y-3">
            <h3 className={labelClass}>Recent bookings</h3>
            {bookings.length === 0 ? (
              <p className="text-sm text-text-muted">No bookings.</p>
            ) : (
              <ul className="space-y-2">
                {bookings.map((bk) => (
                  <li key={bk.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] p-3 text-sm">
                    <div className="min-w-0">
                      <p className="text-text truncate">{bk.serviceTitle}</p>
                      <p className="text-xs text-text-muted">
                        <span className="font-mono text-gold/80">{bk.referenceCode}</span> · {new Date(bk.scheduledAt).toLocaleString()}
                      </p>
                    </div>
                    <StatusBadge status={bk.status} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </Drawer>
  );
}
