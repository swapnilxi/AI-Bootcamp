"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Calendar,
  Clock,
  Video,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

interface BookingItem {
  id: string;
  referenceCode: string;
  serviceTitle: string;
  scheduledAt: string;
  durationMinutes: number;
  clientName: string;
  clientEmail: string;
  status: string;
  accessToken?: string;
  meetingLink?: string | null;
  price: number;
}

export default function MyBookingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/my-bookings");
      return;
    }

    if (status === "authenticated") {
      fetchBookings();
    }
  }, [status, router]);

  async function fetchBookings() {
    try {
      const res = await fetch("/api/bookings");
      if (res.ok) {
        const data = await res.json();
        setBookings(data.bookings || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-24 text-center text-ink/60">
        Loading scheduled sessions...
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-mist pb-6">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl text-ink font-normal">
            My Sessions
          </h1>
          <p className="text-sm text-ink/70 mt-1">
            Review your upcoming and completed AI advising sessions.
          </p>
        </div>

        <Button href="/book" variant="primary" size="md">
          <span>Book New Session</span>
          <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </div>

      {bookings.length > 0 ? (
        <div className="space-y-6">
          {bookings.map((b) => (
            <div key={b.id} className="editorial-card p-6 sm:p-8 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-mist pb-3">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm font-bold text-text bg-mist/60 px-2.5 py-1 rounded-full">
                    {b.referenceCode}
                  </span>
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                      b.status === "CONFIRMED" || b.status === "RESCHEDULED"
                        ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/25"
                        : b.status === "PENDING"
                        ? "bg-cream/10 text-text-muted border border-cream/20"
                        : b.status === "COMPLETED"
                        ? "bg-white/5 text-text-muted border border-white/10"
                        : "bg-cream/10 text-text-muted border border-cream/20"
                    }`}
                  >
                    {b.status === "PENDING" ? "AWAITING CONFIRMATION" : b.status === "RESCHEDULED" ? "CONFIRMED" : b.status}
                  </span>
                </div>
                <span className="font-serif text-xl font-medium text-ink">
                  ${b.price} USD
                </span>
              </div>

              <div>
                <h3 className="font-serif text-2xl text-ink font-medium">
                  {b.serviceTitle}
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-ink/80 pt-1">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-text-muted shrink-0" />
                  <span>
                    {new Date(b.scheduledAt).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-text-muted shrink-0" />
                  <span>{b.durationMinutes} Minutes (1-on-1 Session)</span>
                </div>
              </div>

              <div className="flex justify-end">
                <Link
                  href={`/book/confirmation?ref=${b.referenceCode}&t=${b.accessToken}`}
                  className="text-xs font-semibold text-text-muted hover:underline"
                >
                  View &amp; manage →
                </Link>
              </div>

              {b.meetingLink && (b.status === "CONFIRMED" || b.status === "RESCHEDULED") && (
                <div className="pt-3 border-t border-mist flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <span className="text-xs text-ink/70">
                    Video call link ready for your scheduled session:
                  </span>
                  <a
                    href={b.meetingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-cream text-[#0C0B0A] text-xs font-semibold hover:bg-cream/90 transition-colors"
                  >
                    <Video className="w-4 h-4" />
                    <span>Join Video Session</span>
                    <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="editorial-card p-12 text-center space-y-4 max-w-md mx-auto">
          <Calendar className="w-10 h-10 text-text-muted mx-auto" />
          <h3 className="font-serif text-2xl text-ink font-medium">No Scheduled Sessions</h3>
          <p className="text-sm text-ink/70">
            You do not currently have any scheduled sessions.
          </p>
          <Button href="/book" variant="primary" size="md">
            Schedule a Session →
          </Button>
        </div>
      )}
    </div>
  );
}
