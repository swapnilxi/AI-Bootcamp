"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useSession } from "next-auth/react";
import {
  X,
  Calendar,
  Clock,
  User,
  Mail,
  Phone,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";

interface Mentor {
  id: string;
  name: string | null;
  avatarUrl: string | null;
  mentorType?: string | null;
  sessionPrice?: number | null;
  sessionDuration?: number | null;
  specialties?: string | null;
}

interface MentorBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  mentor: Mentor | null;
}

export function MentorBookingModal({
  isOpen,
  onClose,
  mentor,
}: MentorBookingModalProps) {
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);

  const [date, setDate] = useState("");
  const [minDate, setMinDate] = useState("");
  const [time, setTime] = useState("");
  const [availableSlots, setAvailableSlots] = useState<Array<{ time: string; start: string }>>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotNotice, setSlotNotice] = useState<string | null>(null);
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientNotes, setClientNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<{
    referenceCode: string;
    scheduledAt: string;
    meetingLink?: string | null;
  } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Set default minimum date (tomorrow)
  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yyyy = tomorrow.getFullYear();
    const mm = String(tomorrow.getMonth() + 1).padStart(2, "0");
    const dd = String(tomorrow.getDate()).padStart(2, "0");
    const formatted = `${yyyy}-${mm}-${dd}`;
    setMinDate(formatted);
    if (!date) {
      setDate(formatted);
    }

    if (session?.user) {
      setClientName(session.user.name || "");
      setClientEmail(session.user.email || "");
    }
  }, [session, isOpen]);

  // Fetch real available slots when date or mentor changes
  useEffect(() => {
    if (!date || !mentor) return;

    let isMounted = true;
    setLoadingSlots(true);
    setSlotNotice(null);

    const duration = mentor.sessionDuration || 60;
    fetch(`/api/availability?date=${date}&duration=${duration}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!isMounted) return;
        if (!data || !data.available || !data.slots || data.slots.length === 0) {
          setAvailableSlots([]);
          setTime("");
          setSlotNotice(data?.reason || "No open session slots on this date (e.g. weekend or fully booked).");
        } else {
          setAvailableSlots(data.slots);
          setSlotNotice(null);
          // Keep current time if present, otherwise default to first available
          if (!data.slots.some((s: any) => s.time === time)) {
            setTime(data.slots[0].time);
          }
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error("Availability error:", err);
        setAvailableSlots([]);
        setSlotNotice("Unable to verify slots for this date.");
      })
      .finally(() => {
        if (isMounted) setLoadingSlots(false);
      });

    return () => {
      isMounted = false;
    };
  }, [date, mentor?.sessionDuration, mentor?.id]);

  if (!isOpen || !mentor || !mounted) return null;

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Fetch first available service ID to link session
      const servicesRes = await fetch("/api/mentorship");
      const servicesData = await servicesRes.json();
      const serviceId = servicesData.services?.[0]?.id || "code-review";

      // 2. Submit booking with instructorId
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId,
          scheduledDate: date,
          scheduledTime: time,
          clientName,
          clientEmail,
          clientPhone,
          clientNotes: clientNotes
            ? `[Direct 1:1 Booking with ${mentor.name || "Mentor"}]: ${clientNotes}`
            : `Direct 1:1 session booked with ${mentor.name || "Mentor"}`,
          instructorId: mentor.id,
          whatsappOptIn: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to schedule private session");
      }

      setConfirmedBooking({
        referenceCode: data.booking.referenceCode,
        scheduledAt: data.booking.scheduledAt,
        meetingLink: data.booking.meetingLink,
      });
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadge = (type?: string | null) => {
    if (type === "MENTOR") return "AI Engineering Mentor";
    if (type === "BOTH") return "Master Instructor & Mentor";
    return "AI Engineering Instructor";
  };

  return createPortal(
    <div data-lenis-prevent className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg max-h-[calc(100vh-2rem)] overflow-y-auto bg-[#141418] border border-gold/40 rounded-2xl shadow-2xl p-6 sm:p-8 text-ink">
        {/* Glow ambient background */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gold/10 rounded-full blur-3xl pointer-events-none" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-text-muted hover:text-white hover:bg-white/5 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {confirmedBooking ? (
          <div className="text-center py-6 space-y-5 animate-scale-in">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto text-3xl">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="text-xs uppercase tracking-[0.2em] text-gold font-semibold">
                Direct Session Reserved
              </span>
              <h3 className="font-serif text-2xl text-ink">
                Booking Reference #{confirmedBooking.referenceCode}
              </h3>
              <p className="text-xs sm:text-sm text-text-muted max-w-md mx-auto">
                Your private 1:1 session with{" "}
                <strong className="text-gold">{mentor.name}</strong> has been scheduled.
                Both <strong className="text-ink">{mentor.name}</strong> and academy administration have been notified.
              </p>
            </div>

            <div className="bg-black/40 border border-white/10 rounded-xl p-4 text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-text-muted">Mentor:</span>
                <span className="font-semibold text-ink">{mentor.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Date & Time:</span>
                <span className="font-semibold text-ink">
                  {new Date(confirmedBooking.scheduledAt).toLocaleDateString(undefined, {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Direct Video Room:</span>
                <span className="text-gold truncate max-w-[200px]">
                  {confirmedBooking.meetingLink || "Ready at session time"}
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3.5 rounded-xl bg-gold hover:bg-[#FFB073] text-black font-semibold text-sm transition-colors shadow-md"
            >
              Done & Return to Directory
            </button>
          </div>
        ) : (
          <form onSubmit={handleBooking} className="space-y-5">
            {/* Header info */}
            <div className="flex items-center gap-4 border-b border-white/10 pb-4">
              {mentor.avatarUrl ? (
                <img
                  src={mentor.avatarUrl}
                  alt={mentor.name || "Mentor"}
                  className="w-14 h-14 rounded-2xl object-cover border border-gold/40 shadow-md shrink-0"
                />
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-gold/10 border border-gold/30 text-gold flex items-center justify-center font-serif text-xl font-bold shrink-0">
                  {mentor.name?.charAt(0) || "P"}
                </div>
              )}
              <div className="min-w-0">
                <span className="text-[10px] uppercase tracking-wider text-gold font-semibold block">
                  {getRoleBadge(mentor.mentorType)}
                </span>
                <h3 className="font-serif text-xl text-ink font-medium truncate">
                  Book 1:1 with {mentor.name}
                </h3>
                <p className="text-xs text-text-muted">
                  ${mentor.sessionPrice || 150} USD • {mentor.sessionDuration || 60} min private session
                </p>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Date & Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs text-text-muted flex items-center gap-1.5 font-medium">
                  <Calendar className="w-3.5 h-3.5 text-gold" />
                  <span>Session Date</span>
                </label>
                <input
                  type="date"
                  required
                  min={minDate}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-ink text-sm focus:border-gold focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-text-muted flex items-center justify-between font-medium">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-gold" />
                    <span>Preferred Time</span>
                  </span>
                  {loadingSlots && (
                    <span className="text-[10px] text-gold flex items-center gap-1 animate-pulse">
                      Checking slots…
                    </span>
                  )}
                </label>

                {availableSlots.length > 0 ? (
                  <select
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-ink text-sm focus:border-gold focus:outline-none"
                  >
                    {availableSlots.map((slot) => {
                      const [hStr, mStr] = slot.time.split(":");
                      const h = parseInt(hStr, 10);
                      const m = mStr || "00";
                      const ampm = h >= 12 ? "PM" : "AM";
                      const formattedH = h % 12 === 0 ? 12 : h % 12;
                      const label = `${formattedH}:${m} ${ampm} (${h < 12 ? "Morning" : h < 17 ? "Afternoon" : "Evening"})`;
                      return (
                        <option key={slot.time} value={slot.time}>
                          {label}
                        </option>
                      );
                    })}
                  </select>
                ) : (
                  <div className="px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
                    {loadingSlots ? "Checking mentor availability…" : slotNotice || "No slots available on this date. Please pick another date."}
                  </div>
                )}
              </div>
            </div>

            {/* Contact details */}
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs text-text-muted flex items-center gap-1.5 font-medium">
                  <User className="w-3.5 h-3.5 text-gold" />
                  <span>Your Full Name</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alexandra Thorne"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-ink text-sm focus:border-gold focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs text-text-muted flex items-center gap-1.5 font-medium">
                    <Mail className="w-3.5 h-3.5 text-gold" />
                    <span>Email Address</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="you@domain.com"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-ink text-sm focus:border-gold focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-text-muted flex items-center gap-1.5 font-medium">
                    <Phone className="w-3.5 h-3.5 text-gold" />
                    <span>WhatsApp / Phone</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+1 (555) 000-0000"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-ink text-sm focus:border-gold focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-text-muted font-medium">
                  What would you like to focus on during this session? (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Review my RAG pipeline, mock system design interview, agent architecture is stuck..."
                  value={clientNotes}
                  onChange={(e) => setClientNotes(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-black/40 border border-white/10 text-ink text-xs focus:border-gold focus:outline-none resize-none"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading || loadingSlots || availableSlots.length === 0 || !time}
                className="w-full py-3.5 rounded-xl bg-gold hover:bg-[#FFB073] text-black font-semibold text-sm transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin" />
                    <span>Transmitting Booking Request…</span>
                  </>
                ) : availableSlots.length === 0 ? (
                  <span>Please Select An Available Date</span>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Confirm Session with {mentor.name}</span>
                  </>
                )}
              </button>
              <p className="text-[11px] text-text-muted text-center mt-2">
                Instant notification dispatched to both the mentor and academy administration.
              </p>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
}
