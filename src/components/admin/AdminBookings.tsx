"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CalendarClock,
  Check,
  CheckCircle2,
  Clock,
  ExternalLink,
  Mail,
  MessageCircle,
  Phone,
  Search,
  Send,
  UserCheck,
  X,
} from "lucide-react";
import { SlotPicker, type SlotValue } from "@/features/booking";
import {
  Channel,
  ChannelPicker,
  DeliveryReport,
  Drawer,
  NotifyResult,
  StatusBadge,
  inputClass,
  labelClass,
} from "./shared";

interface NotificationEntry {
  id: string;
  channel: Channel;
  kind: string;
  recipient: string;
  subject: string | null;
  status: string;
  error: string | null;
  createdAt: string;
}

export interface AdminBooking {
  id: string;
  referenceCode: string;
  serviceTitle: string;
  serviceSlug: string;
  price: number;
  scheduledAt: string;
  durationMinutes: number;
  status: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  whatsappOptIn: boolean;
  goal: string | null;
  clientNotes: string | null;
  meetingLink: string | null;
  adminNotes: string | null;
  cancellationReason: string | null;
  notifications: NotificationEntry[];
  instructorId?: string | null;
  instructor?: {
    id: string;
    name: string | null;
    email?: string | null;
    mentorType?: string | null;
    avatarUrl?: string | null;
  } | null;
}

type View = "pending" | "upcoming" | "past" | "cancelled" | "all";

const VIEWS: [View, string][] = [
  ["pending", "Pending approval"],
  ["upcoming", "Upcoming"],
  ["past", "Past"],
  ["cancelled", "Cancelled"],
  ["all", "All"],
];

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

/** Admin: booking queue with approval workflow and client messaging. */
export function AdminBookings({ onPendingCount }: { onPendingCount?: (n: number) => void }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [view, setView] = useState<View>("pending");
  const [q, setQ] = useState("");
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(searchParams.get("booking"));

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (view !== "all") params.set("view", view);
    if (q.trim()) params.set("q", q.trim());
    const res = await fetch(`/api/bookings?${params}`);
    if (res.ok) {
      const data = await res.json();
      setBookings(data.bookings || []);
      setPendingCount(data.pendingCount ?? 0);
      onPendingCount?.(data.pendingCount ?? 0);
    }
    setLoading(false);
  }, [view, q, onPendingCount]);

  useEffect(() => {
    const t = setTimeout(load, q ? 300 : 0);
    return () => clearTimeout(t);
  }, [load, q]);

  function close() {
    setOpenId(null);
    if (searchParams.get("booking")) router.replace("/dashboard/admin");
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {VIEWS.map(([key, label]) => (
            <button
              key={key}
              onClick={() => setView(key)}
              className={`min-h-0 px-4 py-2 rounded-full text-xs font-semibold border transition-colors ${
                view === key ? "bg-gold text-black border-gold" : "border-white/10 text-text-muted hover:text-text"
              }`}
            >
              {label}
              {key === "pending" && pendingCount > 0 && (
                <span className={`ml-2 px-1.5 py-0.5 rounded-full text-[10px] ${view === key ? "bg-black/20" : "bg-amber-500/20 text-amber-300"}`}>
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="relative lg:w-72">
          <Search className="absolute left-3 top-3 w-4 h-4 text-text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name, email, phone, ref…"
            className={`${inputClass} pl-9`}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-white/[0.07] bg-black-raised/80 backdrop-blur-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-sm text-text-muted">Loading bookings…</div>
        ) : bookings.length === 0 ? (
          <div className="p-12 text-center text-sm text-text-muted">
            {view === "pending" ? "No bookings are waiting for approval." : "No bookings in this view."}
          </div>
        ) : (
          <ul className="divide-y divide-white/[0.05]">
            {bookings.map((b) => (
              <li key={b.id}>
                <button
                  onClick={() => setOpenId(b.id)}
                  className="w-full text-left px-5 py-4 grid grid-cols-1 md:grid-cols-12 gap-3 items-center hover:bg-white/[0.02] transition-colors"
                >
                  <div className="md:col-span-4 min-w-0">
                    <p className="text-sm text-ink font-medium truncate">{b.clientName}</p>
                    <p className="text-xs text-text-muted truncate">
                      {b.clientEmail} · {b.clientPhone}
                    </p>
                  </div>
                  <div className="md:col-span-3 min-w-0">
                    <p className="text-sm text-text truncate">{b.serviceTitle}</p>
                    <p className="text-[11px] font-mono text-gold/80">{b.referenceCode}</p>
                  </div>
                  <div className="md:col-span-3 text-sm text-text flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-gold/70" /> {fmtDate(b.scheduledAt)}
                  </div>
                  <div className="md:col-span-2 md:text-right">
                    <StatusBadge status={b.status} />
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {openId && <BookingDrawer id={openId} onClose={close} onChanged={load} />}
    </div>
  );
}

function BookingDrawer({ id, onClose, onChanged }: { id: string; onClose: () => void; onChanged: () => void }) {
  const [b, setB] = useState<AdminBooking | null>(null);
  const [timezone, setTimezone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<NotifyResult | null>(null);
  const [panel, setPanel] = useState<"none" | "approve" | "decline" | "cancel" | "reschedule" | "message" | "reassign">("none");

  // Action form state
  const [channels, setChannels] = useState<Channel[]>(["EMAIL", "WHATSAPP"]);
  const [message, setMessage] = useState("");
  const [reason, setReason] = useState("");
  const [meetingLink, setMeetingLink] = useState("");
  const [slot, setSlot] = useState<SlotValue | null>(null);
  const [edit, setEdit] = useState<Partial<AdminBooking>>({});
  const [instructorsList, setInstructorsList] = useState<any[]>([]);
  const [selectedInstructorId, setSelectedInstructorId] = useState<string>("");

  useEffect(() => {
    fetch("/api/instructors")
      .then((res) => (res.ok ? res.json() : { instructors: [] }))
      .then((data) => setInstructorsList(data.instructors || []))
      .catch(() => null);
  }, []);

  const load = useCallback(async () => {
    const res = await fetch(`/api/bookings/${id}`);
    if (!res.ok) {
      setError("Booking not found");
      return;
    }
    const data = await res.json();
    setB(data.booking);
    setSelectedInstructorId(data.booking.instructorId || "");
    setTimezone(data.timezone);
    setMeetingLink(data.booking.meetingLink || "");
    setChannels(data.booking.whatsappOptIn ? ["EMAIL", "WHATSAPP"] : ["EMAIL"]);
    setEdit({});
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  function openPanel(p: typeof panel) {
    setPanel(p);
    setMessage("");
    setReason("");
    setSlot(null);
    setError(null);
    setResult(null);
  }

  async function act(body: Record<string, unknown>, url = `/api/bookings/${id}`, method = "PATCH") {
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Action failed");
      setResult(data.notified ?? (data.deliveries ? data : null));
      setPanel("none");
      await load();
      onChanged();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const tzFmt = (iso: string) =>
    new Date(iso).toLocaleString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZone: timezone || undefined,
      timeZoneName: "short",
    });

  const waText = b
    ? `Hello ${b.clientName.split(" ")[0]}, this is AI Bootcamp regarding your ${b.serviceTitle} session (${b.referenceCode}).`
    : "";
  const waHref = b ? `https://wa.me/${b.clientPhone.replace(/[^\d]/g, "")}?text=${encodeURIComponent(waText)}` : "#";

  const isOpen = b && !["CANCELLED", "COMPLETED"].includes(b.status);
  const dirty = Object.keys(edit).length > 0;

  return (
    <Drawer
      open
      onClose={onClose}
      title={b ? b.clientName : "Booking"}
      subtitle={
        b && (
          <span className="flex items-center gap-2">
            <span className="font-mono text-gold/80">{b.referenceCode}</span> · <StatusBadge status={b.status} />
          </span>
        )
      }
    >
      {!b ? (
        <p className="text-sm text-text-muted">{error || "Loading…"}</p>
      ) : (
        <>
          {/* Summary */}
          <section className="rounded-2xl border border-white/[0.07] bg-black/30 p-5 space-y-2">
            <p className="font-serif text-xl text-ink">{b.serviceTitle}</p>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-text-muted">Assigned Mentor:</span>
              <span className="text-gold font-medium">
                {b.instructor?.name
                  ? `${b.instructor.name} (${b.instructor.mentorType === "MENTOR" ? "Mentor" : b.instructor.mentorType === "BOTH" ? "Instructor & Mentor" : "Instructor"})`
                  : "General Practice (Unassigned)"}
              </span>
            </div>
            <p className="text-sm text-text flex items-center gap-2">
              <CalendarClock className="w-4 h-4 text-gold" /> {tzFmt(b.scheduledAt)} · {b.durationMinutes} min · ${b.price}
            </p>
            {b.cancellationReason && <p className="text-xs text-clay">{b.cancellationReason}</p>}
            <div className="flex flex-wrap gap-2 pt-2">
              <a href={`mailto:${b.clientEmail}`} className="min-h-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 text-xs text-text-muted hover:text-gold">
                <Mail className="w-3.5 h-3.5" /> {b.clientEmail}
              </a>
              <a href={`tel:${b.clientPhone}`} className="min-h-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 text-xs text-text-muted hover:text-gold">
                <Phone className="w-3.5 h-3.5" /> {b.clientPhone}
              </a>
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-emerald-500/30 text-xs text-emerald-200 hover:bg-emerald-500/10"
              >
                <MessageCircle className="w-3.5 h-3.5" /> Open WhatsApp chat
              </a>
              {b.meetingLink && (
                <a href={b.meetingLink} target="_blank" rel="noopener noreferrer" className="min-h-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 text-xs text-text-muted hover:text-gold">
                  <ExternalLink className="w-3.5 h-3.5" /> Meeting link
                </a>
              )}
            </div>
          </section>

          {error && <p className="p-3 rounded-xl bg-clay/10 border border-clay/30 text-clay text-sm">{error}</p>}
          <DeliveryReport result={result} />

          {/* Actions */}
          <section className="space-y-4">
            <h3 className={labelClass}>Actions</h3>
            <div className="flex flex-wrap gap-2">
              {b.status === "PENDING" && (
                <>
                  <ActionButton primary icon={Check} label="Approve" onClick={() => openPanel("approve")} />
                  <ActionButton icon={X} label="Decline" onClick={() => openPanel("decline")} />
                </>
              )}
              {isOpen && <ActionButton icon={CalendarClock} label="Reschedule" onClick={() => openPanel("reschedule")} />}
              {isOpen && b.status !== "PENDING" && <ActionButton icon={X} label="Cancel" onClick={() => openPanel("cancel")} />}
              {isOpen && b.status !== "PENDING" && (
                <ActionButton icon={CheckCircle2} label="Mark completed" onClick={() => act({ action: "complete" })} disabled={busy} />
              )}
              <ActionButton icon={UserCheck} label="Reroute Mentor" onClick={() => openPanel("reassign")} />
              <ActionButton icon={Send} label="Send message" onClick={() => openPanel("message")} />
            </div>

            {panel !== "none" && (
              <div className="rounded-2xl border border-gold/25 bg-gold/[0.03] p-5 space-y-4">
                {panel === "reassign" && (
                  <div className="space-y-3">
                    <div>
                      <label className={labelClass}>Assign to Faculty / Mentor</label>
                      <select
                        value={selectedInstructorId}
                        onChange={(e) => setSelectedInstructorId(e.target.value)}
                        className={inputClass}
                      >
                        <option value="">-- General Practice (Unassigned) --</option>
                        {instructorsList.map((inst) => (
                          <option key={inst.id} value={inst.id}>
                            {inst.name} ({inst.mentorType === "MENTOR" ? "Mentor" : inst.mentorType === "BOTH" ? "Instructor & Mentor" : "Instructor"}) - ${inst.sessionPrice || 120}/session
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Rerouting Reason (Logged in history)</label>
                      <input
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        className={inputClass}
                        placeholder="e.g. Routed to the RAG specialist based on the repo they sent"
                        maxLength={500}
                      />
                    </div>
                  </div>
                )}
                {panel === "approve" && (
                  <div>
                    <label className={labelClass}>Meeting link</label>
                    <input value={meetingLink} onChange={(e) => setMeetingLink(e.target.value)} className={inputClass} placeholder="https://zoom.us/j/…" />
                  </div>
                )}
                {panel === "reschedule" && (
                  <SlotPicker serviceId={b.serviceSlug} value={slot} onChange={setSlot} />
                )}
                {(panel === "decline" || panel === "cancel") && (
                  <div>
                    <label className={labelClass}>Reason (shared with the client)</label>
                    <input value={reason} onChange={(e) => setReason(e.target.value)} className={inputClass} maxLength={500} />
                  </div>
                )}
                {panel !== "reassign" && (
                  <>
                    <div>
                      <label className={labelClass}>{panel === "message" ? "Message" : "Personal note (optional)"}</label>
                      <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        rows={panel === "message" ? 4 : 2}
                        maxLength={1000}
                        className={inputClass}
                        placeholder={panel === "message" ? "Write to the client…" : "Added to the notification"}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Notify client via</label>
                      <ChannelPicker value={channels} onChange={setChannels} />
                      {panel !== "message" && channels.length === 0 && (
                        <p className="text-[11px] text-text-muted mt-1.5">No channel selected: the client won&apos;t be notified.</p>
                      )}
                    </div>
                  </>
                )}
                <div className="flex justify-end gap-3">
                  <button onClick={() => setPanel("none")} className="px-4 py-2 rounded-xl border border-white/10 text-sm text-text-muted">
                    Back
                  </button>
                  <button
                    disabled={busy || (panel === "reschedule" && !slot) || (panel === "message" && (!message.trim() || channels.length === 0))}
                    onClick={() => {
                      const note = message.trim() || undefined;
                      if (panel === "reassign") {
                        act({ action: "reassign", instructorId: selectedInstructorId || null, reason: reason || undefined });
                        return;
                      }
                      if (panel === "approve") act({ action: "approve", meetingLink, message: note, channels });
                      if (panel === "decline") act({ action: "decline", reason: reason || undefined, message: note, channels });
                      if (panel === "cancel") act({ action: "cancel", reason: reason || undefined, message: note, channels });
                      if (panel === "reschedule" && slot) act({ action: "reschedule", date: slot.date, time: slot.time, message: note, channels });
                      if (panel === "message") act({ kind: "custom", message: note, channels }, `/api/bookings/${id}/notify`, "POST");
                    }}
                    className="px-5 py-2 rounded-xl bg-gold hover:bg-[#FFB073] text-black text-sm font-semibold disabled:opacity-40"
                  >
                    {busy
                      ? "Working…"
                      : panel === "reassign"
                      ? "Confirm Reroute"
                      : panel === "approve"
                      ? channels.length ? "Approve & notify" : "Approve"
                      : panel === "decline"
                      ? channels.length ? "Decline & notify" : "Decline"
                      : panel === "cancel"
                      ? channels.length ? "Cancel & notify" : "Cancel booking"
                      : panel === "reschedule"
                      ? channels.length ? "Move & notify" : "Move booking"
                      : "Send"}
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* Editable client details */}
          <section className="space-y-4">
            <h3 className={labelClass}>Client & session details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(
                [
                  ["clientName", "Name", "text"],
                  ["clientEmail", "Email", "email"],
                  ["clientPhone", "Phone / WhatsApp", "tel"],
                  ["goal", "Session goal", "text"],
                  ["meetingLink", "Meeting link", "url"],
                ] as const
              ).map(([key, label, type]) => {
                const raw = (key in edit ? edit[key] : b[key]) as string | null;
                const value = raw || "";
                return (
                  <div key={key} className={key === "meetingLink" || key === "goal" ? "sm:col-span-2" : ""}>
                    <label className={labelClass}>{label}</label>
                    <input type={type} value={value} onChange={(e) => setEdit({ ...edit, [key]: e.target.value })} className={inputClass} />
                  </div>
                );
              })}
              <div className="sm:col-span-2">
                <label className={labelClass}>Client notes</label>
                <textarea
                  rows={2}
                  value={(("clientNotes" in edit ? edit.clientNotes : b.clientNotes) as string) || ""}
                  onChange={(e) => setEdit({ ...edit, clientNotes: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Private admin notes</label>
                <textarea
                  rows={3}
                  value={(("adminNotes" in edit ? edit.adminNotes : b.adminNotes) as string) || ""}
                  onChange={(e) => setEdit({ ...edit, adminNotes: e.target.value })}
                  className={inputClass}
                  placeholder="Only visible to admins"
                />
              </div>
              <label className="sm:col-span-2 flex items-center gap-2 text-sm text-text-muted">
                <input
                  type="checkbox"
                  className="w-4 h-4 min-h-0 accent-[#FF7315]"
                  checked={"whatsappOptIn" in edit ? !!edit.whatsappOptIn : b.whatsappOptIn}
                  onChange={(e) => setEdit({ ...edit, whatsappOptIn: e.target.checked })}
                />
                Client agreed to WhatsApp updates
              </label>
            </div>
            {dirty && (
              <div className="flex justify-end gap-3">
                <button onClick={() => setEdit({})} className="px-4 py-2 rounded-xl border border-white/10 text-sm text-text-muted">
                  Discard
                </button>
                <button
                  disabled={busy}
                  onClick={() =>
                    act({
                      action: "update",
                      ...Object.fromEntries(
                        Object.entries(edit).map(([k, v]) => [k, typeof v === "string" && v === "" && !["clientName", "clientEmail", "clientPhone"].includes(k) ? null : v])
                      ),
                    })
                  }
                  className="px-5 py-2 rounded-xl bg-gold hover:bg-[#FFB073] text-black text-sm font-semibold disabled:opacity-40"
                >
                  Save details
                </button>
              </div>
            )}
          </section>

          {/* Notification history */}
          <section className="space-y-3">
            <h3 className={labelClass}>Message history</h3>
            {b.notifications.length === 0 ? (
              <p className="text-sm text-text-muted">No messages sent yet.</p>
            ) : (
              <ul className="space-y-2">
                {b.notifications.map((n) => (
                  <li key={n.id} className="flex items-start gap-3 text-xs rounded-xl border border-white/[0.06] p-3">
                    {n.channel === "EMAIL" ? <Mail className="w-4 h-4 text-gold/70 shrink-0" /> : <MessageCircle className="w-4 h-4 text-emerald-300/70 shrink-0" />}
                    <div className="min-w-0 flex-1">
                      <p className="text-text">
                        <span className="capitalize">{n.kind.replace("_", " ")}</span> → {n.recipient}
                      </p>
                      {n.subject && <p className="text-text-muted truncate">{n.subject}</p>}
                      {n.error && n.status !== "SENT" && <p className="text-text-muted">{n.error}</p>}
                    </div>
                    <div className="text-right shrink-0">
                      <p className={n.status === "SENT" ? "text-emerald-300" : n.status === "SKIPPED" ? "text-amber-300" : "text-clay"}>{n.status}</p>
                      <p className="text-text-muted">{new Date(n.createdAt).toLocaleString()}</p>
                    </div>
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

function ActionButton({
  icon: ActionIcon,
  label,
  onClick,
  primary,
  disabled,
}: {
  icon: typeof Check;
  label: string;
  onClick: () => void;
  primary?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`min-h-0 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-colors disabled:opacity-40 ${
        primary ? "bg-gold text-black border-gold hover:bg-[#FFB073]" : "border-white/10 text-text hover:border-gold/40 hover:text-gold"
      }`}
    >
      <ActionIcon className="w-4 h-4" /> {label}
    </button>
  );
}
