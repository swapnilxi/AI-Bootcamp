"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  Calendar,
  Clock,
  Video,
  Download,
  Shield,
  ArrowRight,
  ExternalLink,
  Hourglass,
  XCircle,
  CalendarClock,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SlotPicker, type SlotValue } from "@/features/booking";

interface BookingView {
  id: string;
  referenceCode: string;
  serviceTitle: string;
  serviceSlug: string;
  scheduledAt: string;
  endTime: string;
  durationMinutes: number;
  status: "PENDING" | "CONFIRMED" | "RESCHEDULED" | "COMPLETED" | "CANCELLED";
  clientName: string;
  clientEmail: string;
  meetingLink: string | null;
  cancellationReason: string | null;
  accessToken?: string;
}

const STATUS_COPY: Record<BookingView["status"], { badge: string; title: string; tone: string }> = {
  PENDING: { badge: "Awaiting Confirmation", title: "Your Request Is Received", tone: "text-text-muted" },
  CONFIRMED: { badge: "Session Confirmed", title: "Your Session Is Reserved", tone: "text-gold" },
  RESCHEDULED: { badge: "Confirmed · New Time", title: "Your Session Is Reserved", tone: "text-gold" },
  COMPLETED: { badge: "Completed", title: "Thank You for Your Session", tone: "text-emerald-300" },
  CANCELLED: { badge: "Cancelled", title: "This Booking Was Cancelled", tone: "text-text-muted" },
};

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const refCode = searchParams.get("ref");
  const token = searchParams.get("t");

  const [booking, setBooking] = useState<BookingView | null>(null);
  const [timezone, setTimezone] = useState<string>("");
  const [canChange, setCanChange] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [mode, setMode] = useState<"view" | "reschedule" | "cancel">("view");
  const [newSlot, setNewSlot] = useState<SlotValue | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const qs = token ? `?t=${encodeURIComponent(token)}` : "";

  const load = useCallback(async () => {
    setLoadError(false);
    if (!refCode) {
      setLoading(false);
      setNotFound(true);
      return;
    }
    try {
      const res = await fetch(`/api/bookings/${encodeURIComponent(refCode)}${qs}`);
      if (!res.ok) {
        // Only a genuine 404 means the booking doesn't exist; any other
        // status (500, rate limit, etc.) is transient and retryable.
        if (res.status === 404) setNotFound(true);
        else setLoadError(true);
        return;
      }
      const data = await res.json();
      setBooking(data.booking);
      setTimezone(data.timezone);
      setCanChange(data.canClientChange);
    } catch {
      // A thrown fetch (offline, DNS, etc.) is transient too — not "not found".
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [refCode, qs]);

  useEffect(() => {
    load();
  }, [load]);

  async function submit(body: Record<string, unknown>, success: string) {
    if (!booking) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/bookings/${booking.id}${qs}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not update your booking");
      setNotice(success);
      setMode("view");
      setNewSlot(null);
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const fmt = (iso: string, opts: Intl.DateTimeFormatOptions) =>
    new Date(iso).toLocaleString("en-US", { ...opts, timeZone: timezone || undefined });

  function calendarStamp(iso: string) {
    return new Date(iso).toISOString().replace(/-|:|\.\d\d\d/g, "");
  }

  function getGoogleCalendarUrl() {
    if (!booking) return "#";
    const title = encodeURIComponent(`AI Session: ${booking.serviceTitle}`);
    const details = encodeURIComponent(
      `Private session with AI Bootcamp.\nReference: ${booking.referenceCode}\nJoin: ${booking.meetingLink || "Shared by email"}`
    );
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${calendarStamp(
      booking.scheduledAt
    )}/${calendarStamp(booking.endTime)}&details=${details}`;
  }

  function downloadIcs() {
    if (!booking) return;
    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//AI Bootcamp//AI Session//EN",
      "BEGIN:VEVENT",
      `UID:${booking.referenceCode}@aibootcamp.com`,
      `DTSTAMP:${calendarStamp(new Date().toISOString())}`,
      `DTSTART:${calendarStamp(booking.scheduledAt)}`,
      `DTEND:${calendarStamp(booking.endTime)}`,
      `SUMMARY:AI Session - ${booking.serviceTitle}`,
      `DESCRIPTION:Reference: ${booking.referenceCode}`,
      booking.meetingLink ? `URL:${booking.meetingLink}` : "",
      "STATUS:CONFIRMED",
      "END:VEVENT",
      "END:VCALENDAR",
    ]
      .filter(Boolean)
      .join("\r\n");
    const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `session-${booking.referenceCode}.ics`;
    link.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return <div className="max-w-3xl mx-auto py-24 text-center text-text-muted">Retrieving your booking…</div>;
  }

  if (loadError) {
    return (
      <div role="alert" className="max-w-md mx-auto my-20 p-8 rounded-2xl bg-black-raised/80 border border-white/[0.07] text-center space-y-4">
        <h1 className="font-serif text-2xl text-ink">Could not load your booking</h1>
        <p className="text-sm text-text-muted">
          That was likely a temporary network issue, not a missing booking. Try again.
        </p>
        <Button onClick={load} variant="primary" size="md">
          Try again
        </Button>
      </div>
    );
  }

  if (notFound || !booking) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 rounded-2xl bg-black-raised/80 border border-white/[0.07] text-center space-y-4">
        <h1 className="font-serif text-2xl text-ink">Booking not found</h1>
        <p className="text-sm text-text-muted">
          Open the link from your confirmation email, or sign in to see your bookings.
        </p>
        <div className="flex justify-center gap-3">
          <Button href="/my-bookings" variant="secondary" size="md">
            My bookings
          </Button>
          <Button href="/book" variant="primary" size="md">
            Book a session
          </Button>
        </div>
      </div>
    );
  }

  const copy = STATUS_COPY[booking.status];
  const isActive = ["PENDING", "CONFIRMED", "RESCHEDULED"].includes(booking.status);
  const isConfirmed = booking.status === "CONFIRMED" || booking.status === "RESCHEDULED";
  const StatusIcon =
    booking.status === "PENDING" ? Hourglass : booking.status === "CANCELLED" ? XCircle : CheckCircle2;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
      <div className="card-premium p-8 sm:p-12 text-center space-y-8">
        <div className="w-16 h-16 rounded-full bg-cream/8 border border-cream/20 flex items-center justify-center mx-auto">
          <StatusIcon className={`w-8 h-8 ${copy.tone}`} />
        </div>

        <div>
          <span
            className={`text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full border border-white/10 bg-white/[0.03] inline-block mb-3 ${copy.tone}`}
          >
            {copy.badge}
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl text-ink font-normal">{copy.title}</h1>
          <p className="text-text-muted text-base max-w-lg mx-auto mt-3">
            {booking.status === "PENDING" ? (
              <>
                The mentor will review your requested time shortly. You&apos;ll receive a confirmation at{" "}
                <strong className="text-ink">{booking.clientEmail}</strong>
                {" "}and on WhatsApp, if you opted in.
              </>
            ) : isConfirmed ? (
              <>
                Details have been sent to <strong className="text-ink">{booking.clientEmail}</strong>.
              </>
            ) : booking.cancellationReason ? (
              booking.cancellationReason
            ) : null}
          </p>
        </div>

        {notice && (
          <p className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-sm">{notice}</p>
        )}
        {error && <p className="p-3 rounded-xl bg-cream/8 border border-cream/20 text-text text-sm">{error}</p>}

        <div className="inline-block p-4 rounded-xl bg-black/40 border border-white/[0.07] text-left">
          <span className="text-xs text-text-muted uppercase block">Booking Reference</span>
          <span className="font-mono text-2xl font-bold text-text tracking-wider">{booking.referenceCode}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left p-6 rounded-xl bg-black/30 border border-white/[0.06] text-sm">
          <div>
            <span className="text-xs text-text-muted uppercase block">Session</span>
            <p className="font-serif text-lg text-ink mt-0.5">{booking.serviceTitle}</p>
          </div>
          <div>
            <span className="text-xs text-text-muted uppercase block">Date & Time</span>
            <p className="font-medium text-ink mt-0.5 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-text-muted" />
              {fmt(booking.scheduledAt, {
                weekday: "long",
                month: "long",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
                timeZoneName: "short",
              })}
            </p>
          </div>
          <div>
            <span className="text-xs text-text-muted uppercase block">Format</span>
            <p className="font-medium text-ink mt-0.5 flex items-center gap-1.5">
              <Video className="w-4 h-4 text-text-muted" />
              Private 1-on-1 video call · {booking.durationMinutes} min
            </p>
          </div>
          <div>
            <span className="text-xs text-text-muted uppercase block">Join Link</span>
            {booking.meetingLink ? (
              <a
                href={booking.meetingLink}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-text mt-0.5 inline-flex items-center gap-1 hover:underline"
              >
                Open meeting <ExternalLink className="w-3.5 h-3.5" />
              </a>
            ) : (
              <p className="text-text-muted mt-0.5">Shared once your session is confirmed</p>
            )}
          </div>
        </div>

        {isConfirmed && (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href={getGoogleCalendarUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-cream text-[#0C0B0A] hover:bg-cream/90 text-sm font-semibold transition-colors"
            >
              <Calendar className="w-4 h-4" />
              Add to Google Calendar
            </a>
            <button
              onClick={downloadIcs}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg border border-white/10 text-ink hover:border-gold/50 text-sm font-medium transition-colors"
            >
              <Download className="w-4 h-4 text-text-muted" />
              Apple / Outlook (.ics)
            </button>
          </div>
        )}

        {/* Client self-service: reschedule or cancel (24h cutoff) */}
        {isActive && (
          <div className="pt-6 border-t border-white/[0.07] space-y-4 text-left">
            {!canChange ? (
              <p className="text-xs text-text-muted text-center">
                Changes are possible up to 24 hours before your session. For anything closer, please contact us.
              </p>
            ) : mode === "view" ? (
              <div className="flex flex-col sm:flex-row justify-center gap-3">
                <button
                  onClick={() => setMode("reschedule")}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-cream/20 text-text text-sm hover:bg-cream/10 transition-colors"
                >
                  <CalendarClock className="w-4 h-4" /> Choose another time
                </button>
                <button
                  onClick={() => setMode("cancel")}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-white/10 text-text-muted text-sm hover:text-clay hover:border-clay/40 transition-colors"
                >
                  <XCircle className="w-4 h-4" /> Cancel booking
                </button>
              </div>
            ) : mode === "reschedule" ? (
              <div className="space-y-5">
                <h2 className="font-serif text-xl text-ink">Pick a new time</h2>
                <SlotPicker serviceId={booking.serviceSlug} value={newSlot} onChange={setNewSlot} />
                <div className="flex justify-end gap-3">
                  <button onClick={() => setMode("view")} className="px-5 py-2.5 rounded-xl border border-white/10 text-sm text-text-muted">
                    Back
                  </button>
                  <button
                    disabled={!newSlot || busy}
                    onClick={() =>
                      newSlot &&
                      submit(
                        { action: "reschedule", date: newSlot.date, time: newSlot.time },
                        "Your new time has been requested. We'll confirm it shortly."
                      )
                    }
                    className="px-5 py-2.5 rounded-xl bg-cream hover:bg-cream/90 text-[#0C0B0A] text-sm font-semibold disabled:opacity-40"
                  >
                    {busy ? "Saving…" : "Confirm new time"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <h2 className="font-serif text-xl text-ink">Cancel this booking?</h2>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={2}
                  maxLength={500}
                  placeholder="Reason (optional)"
                  className="w-full p-3 rounded-xl border border-white/10 bg-black/60 text-sm text-ink focus:outline-none focus:border-gold/60"
                />
                <div className="flex justify-end gap-3">
                  <button onClick={() => setMode("view")} className="px-5 py-2.5 rounded-xl border border-white/10 text-sm text-text-muted">
                    Keep booking
                  </button>
                  <button
                    disabled={busy}
                    onClick={() => submit({ action: "cancel", reason: reason || undefined }, "Your booking has been cancelled.")}
                    className="px-5 py-2.5 rounded-xl bg-cream/10 border border-cream/25 text-text text-sm font-semibold disabled:opacity-40"
                  >
                    {busy ? "Cancelling…" : "Cancel booking"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {booking.status === "CANCELLED" && (
          <Button href={`/book?service=${booking.serviceSlug}`} variant="primary" size="md">
            Book a new time <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        )}

        <div className="text-xs text-text-muted max-w-md mx-auto p-4 rounded-lg bg-black/30 border border-white/[0.06] space-y-1 text-left">
          <p className="font-semibold text-ink flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-text-muted" />
            Preparation note
          </p>
          <p>
            If you didn&apos;t provide birth details while booking, reply to your confirmation email with your birth date,
            exact time and city.
          </p>
        </div>

        <div className="pt-8 border-t border-white/[0.07]">
          <h3 className="font-serif text-xl text-ink">Keep everything in one place</h3>
          <p className="text-sm text-text-muted mt-1 max-w-md mx-auto">
            Create a free client account to see all your bookings, recordings and academy classes.
          </p>
          <div className="mt-4">
            <Button
              href={`/register?email=${encodeURIComponent(booking.clientEmail)}&name=${encodeURIComponent(booking.clientName)}`}
              variant="secondary"
              size="md"
            >
              Create client account <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BookingConfirmationPage() {
  return (
    <Suspense fallback={<div className="max-w-2xl mx-auto py-24 text-center text-text-muted">Loading…</div>}>
      <ConfirmationContent />
    </Suspense>
  );
}
