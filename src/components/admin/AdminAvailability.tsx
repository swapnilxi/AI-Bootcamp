"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle2, MinusCircle, Plus, Trash2 } from "lucide-react";
import { inputClass, labelClass } from "./shared";

interface Hours {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDuration: number;
}

interface Settings {
  timezone: string;
  requireApproval: boolean;
  minLeadHours: number;
  maxAdvanceDays: number;
  bufferMinutes: number;
  adminNotifyEmail: string;
}

interface Snapshot {
  settings: Settings;
  weeklyHours: Hours[];
  blockedDates: { id: string; date: string; reason: string | null }[];
  channels: { email: boolean; whatsapp: boolean };
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Europe/Zurich",
  "Asia/Kolkata",
  "Asia/Dubai",
  "Asia/Singapore",
  "Australia/Sydney",
  "UTC",
];

/** Admin: weekly hours, booking rules, blocked dates, and notification channel status. */
export function AdminAvailability() {
  const [snap, setSnap] = useState<Snapshot | null>(null);
  const [hours, setHours] = useState<Hours[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [block, setBlock] = useState({ date: "", reason: "" });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  function apply(data: Snapshot) {
    setSnap(data);
    setHours(data.weeklyHours);
    setSettings(data.settings);
  }

  useEffect(() => {
    fetch("/api/admin/availability")
      .then((r) => r.json())
      .then(apply);
  }, []);

  async function put(body: Record<string, unknown>, success: string) {
    setSaving(true);
    setMsg(null);
    const res = await fetch("/api/admin/availability", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setMsg({ ok: false, text: data.error || "Could not save" });
      return;
    }
    apply(data);
    setMsg({ ok: true, text: success });
  }

  if (!snap || !settings) return <p className="text-sm text-text-muted p-8">Loading availability…</p>;

  const card = "rounded-2xl border border-white/[0.07] bg-black-raised/80 backdrop-blur-sm p-6 space-y-5";

  return (
    <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
      <div className="xl:col-span-3 space-y-6">
        {/* Weekly hours */}
        <section className={card}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif text-xl text-ink">Weekly hours</h3>
              <p className="text-xs text-text-muted mt-1">
                Times are in {settings.timezone.replace(/_/g, " ")}. Add several ranges to a day for breaks.
              </p>
            </div>
          </div>
          <div className="space-y-3">
            {DAYS.map((day, dow) => {
              const ranges = hours.map((h, i) => ({ ...h, i })).filter((h) => h.dayOfWeek === dow);
              return (
                <div key={day} className="flex flex-col sm:flex-row sm:items-start gap-3 py-3 border-b border-white/[0.05] last:border-0">
                  <div className="sm:w-32 shrink-0 flex items-center justify-between sm:block">
                    <p className={`text-sm ${ranges.length ? "text-ink" : "text-text-muted"}`}>{day}</p>
                    {!ranges.length && <p className="text-[11px] text-text-muted">Closed</p>}
                  </div>
                  <div className="flex-1 space-y-2">
                    {ranges.map((r) => (
                      <div key={r.i} className="flex flex-wrap items-center gap-2">
                        <input
                          type="time"
                          value={r.startTime}
                          onChange={(e) => setHours(hours.map((h, i) => (i === r.i ? { ...h, startTime: e.target.value } : h)))}
                          className={`${inputClass} w-32`}
                        />
                        <span className="text-text-muted text-xs">to</span>
                        <input
                          type="time"
                          value={r.endTime}
                          onChange={(e) => setHours(hours.map((h, i) => (i === r.i ? { ...h, endTime: e.target.value } : h)))}
                          className={`${inputClass} w-32`}
                        />
                        <select
                          value={r.slotDuration}
                          onChange={(e) => setHours(hours.map((h, i) => (i === r.i ? { ...h, slotDuration: Number(e.target.value) } : h)))}
                          className={`${inputClass} w-36`}
                          title="Start a new slot every…"
                        >
                          {[15, 30, 45, 60, 90, 120].map((m) => (
                            <option key={m} value={m}>
                              every {m} min
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => setHours(hours.filter((_, i) => i !== r.i))}
                          className="min-h-0 p-2 rounded-lg text-text-muted hover:text-clay"
                          aria-label={`Remove ${day} range`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => setHours([...hours, { dayOfWeek: dow, startTime: "10:00", endTime: "18:00", slotDuration: 60 }])}
                      className="min-h-0 inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add hours
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-end">
            <button
              disabled={saving}
              onClick={() => put({ weeklyHours: hours }, "Weekly hours saved")}
              className="px-5 py-2 rounded-xl bg-cream hover:bg-cream/90 text-[#0C0B0A] text-sm font-semibold disabled:opacity-40"
            >
              Save weekly hours
            </button>
          </div>
        </section>

        {/* Blocked dates */}
        <section className={card}>
          <h3 className="font-serif text-xl text-ink">Days off & holidays</h3>
          <div className="flex flex-wrap items-end gap-2">
            <div>
              <label className={labelClass}>Date</label>
              <input type="date" value={block.date} onChange={(e) => setBlock({ ...block, date: e.target.value })} className={`${inputClass} w-44`} />
            </div>
            <div className="flex-1 min-w-[160px]">
              <label className={labelClass}>Reason (shown to clients)</label>
              <input value={block.reason} onChange={(e) => setBlock({ ...block, reason: e.target.value })} className={inputClass} placeholder="e.g. Retreat" />
            </div>
            <button
              disabled={!block.date || saving}
              onClick={() => put({ blockDate: block }, "Date blocked").then(() => setBlock({ date: "", reason: "" }))}
              className="px-4 py-2.5 rounded-xl border border-cream/30 text-cream text-sm hover:bg-cream/10 disabled:opacity-40"
            >
              Block date
            </button>
          </div>
          {snap.blockedDates.length === 0 ? (
            <p className="text-sm text-text-muted">No upcoming days off.</p>
          ) : (
            <ul className="space-y-2">
              {snap.blockedDates.map((b) => (
                <li key={b.id} className="flex items-center justify-between rounded-xl border border-white/[0.06] px-4 py-2.5 text-sm">
                  <span className="text-text">
                    {new Date(`${b.date}T12:00:00Z`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                    {b.reason && <span className="text-text-muted"> · {b.reason}</span>}
                  </span>
                  <button onClick={() => put({ unblockId: b.id }, "Date unblocked")} className="min-h-0 text-xs text-text-muted hover:text-clay">
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="xl:col-span-2 space-y-6">
        {/* Booking rules */}
        <section className={card}>
          <h3 className="font-serif text-xl text-ink">Booking rules</h3>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.requireApproval}
              onChange={(e) => setSettings({ ...settings, requireApproval: e.target.checked })}
              className="mt-1 w-4 h-4 min-h-0 accent-[#F97316]"
            />
            <span>
              <span className="block text-sm text-ink">Require approval</span>
              <span className="block text-xs text-text-muted">
                New bookings wait as &ldquo;Pending&rdquo; until you approve them. Turn off to confirm instantly.
              </span>
            </span>
          </label>
          <div>
            <label className={labelClass}>Practice timezone</label>
            <select value={settings.timezone} onChange={(e) => setSettings({ ...settings, timezone: e.target.value })} className={inputClass}>
              {[...new Set([settings.timezone, ...TIMEZONES])].map((tz) => (
                <option key={tz} value={tz}>
                  {tz.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {(
              [
                ["minLeadHours", "Notice (hrs)", 0, 168],
                ["maxAdvanceDays", "Book ahead (days)", 1, 365],
                ["bufferMinutes", "Buffer (min)", 0, 120],
              ] as const
            ).map(([key, label, min, max]) => (
              <div key={key}>
                <label className={labelClass}>{label}</label>
                <input
                  type="number"
                  min={min}
                  max={max}
                  value={settings[key]}
                  onChange={(e) => setSettings({ ...settings, [key]: Number(e.target.value) })}
                  className={inputClass}
                />
              </div>
            ))}
          </div>
          <div>
            <label className={labelClass}>Email new-booking alerts to</label>
            <input
              type="email"
              value={settings.adminNotifyEmail}
              onChange={(e) => setSettings({ ...settings, adminNotifyEmail: e.target.value })}
              className={inputClass}
              placeholder="you@practice.com"
            />
          </div>
          <div className="flex justify-end">
            <button
              disabled={saving}
              onClick={() => put({ settings }, "Booking rules saved")}
              className="px-5 py-2 rounded-xl bg-cream hover:bg-cream/90 text-[#0C0B0A] text-sm font-semibold disabled:opacity-40"
            >
              Save rules
            </button>
          </div>
        </section>

        {/* Channel status */}
        <section className={card}>
          <h3 className="font-serif text-xl text-ink">Notification channels</h3>
          {(
            [
              ["Email", snap.channels.email, "SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM"],
              ["WhatsApp (automatic)", snap.channels.whatsapp, "TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM"],
            ] as const
          ).map(([name, ok, vars]) => (
            <div key={name} className="flex items-start gap-3">
              {ok ? <CheckCircle2 className="w-4 h-4 text-emerald-300 mt-0.5" /> : <MinusCircle className="w-4 h-4 text-cream mt-0.5" />}
              <div>
                <p className="text-sm text-ink">
                  {name}: <span className={ok ? "text-emerald-300" : "text-cream"}>{ok ? "connected" : "not configured"}</span>
                </p>
                {!ok && <p className="text-[11px] text-text-muted mt-0.5">Set {vars} in your environment.</p>}
              </div>
            </div>
          ))}
          <p className="text-[11px] text-text-muted">
            Without a WhatsApp provider you can still message clients in one click: each booking has an &ldquo;Open WhatsApp
            chat&rdquo; button with the message pre-filled.
          </p>
        </section>

        {msg && (
          <p className={`text-sm p-3 rounded-xl border ${msg.ok ? "text-emerald-300 border-emerald-500/25 bg-emerald-500/10" : "text-cream border-cream/25 bg-cream/10"}`}>
            {msg.text}
          </p>
        )}
      </div>
    </div>
  );
}
