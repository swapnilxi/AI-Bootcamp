"use client";

import React, { useState } from "react";
import { Megaphone } from "lucide-react";
import { inputClass, labelClass } from "./shared";

const ROLES = [
  { value: "USER", label: "Learners" },
  { value: "SUBSCRIBER", label: "Subscribers" },
  { value: "INSTRUCTOR", label: "Instructors" },
  { value: "ADMIN", label: "Admins" },
  { value: "SUPER_ADMIN", label: "Super admins" },
] as const;

/** Announce to everyone in the selected roles: lands in their bell, optionally by email too. */
export function AdminBroadcast() {
  const [roles, setRoles] = useState<string[]>(["USER", "SUBSCRIBER"]);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [href, setHref] = useState("");
  const [email, setEmail] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  const toggle = (r: string) => setRoles((cur) => (cur.includes(r) ? cur.filter((x) => x !== r) : [...cur, r]));

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirm(`Send this to ${roles.length} role group(s)${email ? " by email as well" : ""}? This can't be undone.`)) return;
    setBusy(true);
    setResult(null);
    const res = await fetch("/api/admin/notifications/broadcast", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roles, title, message, href, email }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.ok) {
      setResult({ ok: true, text: `Sent to ${data.recipients} user(s).` });
      setTitle("");
      setMessage("");
      setHref("");
    } else {
      setResult({ ok: false, text: data.error || "Could not send" });
    }
  };

  return (
    <form onSubmit={send} className="max-w-xl space-y-4 rounded-2xl border border-white/10 bg-black/40 p-6">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-ink">
        <Megaphone size={18} className="text-gold" /> Broadcast announcement
      </h2>
      <div>
        <span className={labelClass}>Audience</span>
        <div className="flex flex-wrap gap-2">
          {ROLES.map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() => toggle(r.value)}
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${roles.includes(r.value) ? "border-gold bg-gold/15 text-gold" : "border-white/10 text-ink/60"}`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className={labelClass}>Title</label>
        <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} required />
      </div>
      <div>
        <label className={labelClass}>Message</label>
        <textarea className={inputClass} rows={4} value={message} onChange={(e) => setMessage(e.target.value)} maxLength={2000} required />
      </div>
      <div>
        <label className={labelClass}>Link (optional, e.g. /events)</label>
        <input className={inputClass} value={href} onChange={(e) => setHref(e.target.value)} placeholder="/events" />
      </div>
      <label className="flex items-center gap-2 text-sm text-ink/80">
        <input type="checkbox" checked={email} onChange={(e) => setEmail(e.target.checked)} /> Also send by email (needs SMTP configured)
      </label>
      {result && <p className={`text-sm ${result.ok ? "text-green-400" : "text-red-400"}`}>{result.text}</p>}
      <button
        type="submit"
        disabled={busy || !roles.length}
        className="rounded-lg bg-cream px-5 py-2.5 text-sm font-semibold text-[#0C0B0A] disabled:opacity-50"
      >
        {busy ? "Sending…" : "Send announcement"}
      </button>
    </form>
  );
}
