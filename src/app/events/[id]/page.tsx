"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
    CalendarDays,
    Clock,
    MapPin,
    Video,
    Users,
    Heart,
    ArrowLeft,
    AlertCircle,
    Loader2,
    Hourglass,
    ExternalLink,
} from "lucide-react";
import { EVENT_ROUTES, formatEventDate, formatEventTime } from "@/features/events";
import type { EventDetail } from "@/features/events";
import { Button } from "@/components/ui/Button";
import { EventApprovalPanel } from "@/features/events/components/EventApprovalPanel";

export default function EventDetailPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const { data: session } = useSession();

    const [event, setEvent] = useState<EventDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const [actionError, setActionError] = useState<string | null>(null);

    const load = useCallback(async () => {
        if (!id) return;
        try {
            const res = await fetch(EVENT_ROUTES.detail(id));
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.error || "Could not load this event");
            setEvent(data.event);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not load this event");
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        setLoading(true);
        load();
    }, [load]);

    async function toggleInterest() {
        if (!event) return;
        setBusy(true);
        setActionError(null);
        const wasInterested = event.isInterested;

        setEvent({
            ...event,
            isInterested: !wasInterested,
            interestCount: event.interestCount + (wasInterested ? -1 : 1),
        });

        try {
            const res = await fetch(EVENT_ROUTES.interest(event.id), {
                method: wasInterested ? "DELETE" : "POST",
            });
            const data = await res.json().catch(() => ({}));

            if (res.status === 401) {
                router.push(`/login?callbackUrl=/events/${event.id}`);
                return;
            }
            if (!res.ok) {
                setEvent(event);
                setActionError(data.error || "Could not update your interest");
                return;
            }
            if (typeof data.interestCount === "number") {
                setEvent((prev) => (prev ? { ...prev, interestCount: data.interestCount } : prev));
            }
        } catch {
            setEvent(event);
            setActionError("An unexpected error occurred");
        } finally {
            setBusy(false);
        }
    }

    if (loading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-gold" />
            </div>
        );
    }

    if (error || !event) {
        return (
            <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 px-4 py-24 text-center">
                <AlertCircle className="h-10 w-10 text-red-300" />
                <h1 className="font-serif text-3xl text-ink">Event unavailable</h1>
                <p className="text-ink/70">{error ?? "We could not find that event."}</p>
                <Button href="/events" variant="secondary" size="sm">
                    <ArrowLeft className="mr-1 h-4 w-4" />
                    <span>Back to events</span>
                </Button>
            </div>
        );
    }

    const isPending = event.approvalStatus === "PENDING";
    const isRejected = event.approvalStatus === "REJECTED";
    const isFull = !!event.capacity && event.interestCount >= event.capacity && !event.isInterested;
    const canRegister = !isPending && !isRejected && !event.isPast && !isFull;

    return (
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
            <Link
                href="/events"
                className="mb-8 inline-flex items-center gap-2 text-sm text-ink/60 transition-colors hover:text-gold"
            >
                <ArrowLeft className="h-4 w-4" />
                All events
            </Link>

            {/* Approval banners — only visible to the host and admins */}
            {isPending && (
                <div className="mb-8 flex items-start gap-3 rounded-xl border border-cream/20 bg-cream/[0.07] p-5">
                    <Hourglass className="mt-0.5 h-5 w-5 shrink-0 text-cream" />
                    <div>
                        <p className="font-semibold text-cream">Awaiting approval</p>
                        <p className="mt-1 text-sm text-ink/70">
                            This event is not visible to members yet. An administrator reviews every event before it is
                            announced — you will be notified as soon as it is approved.
                        </p>
                    </div>
                </div>
            )}

            {isRejected && (
                <div className="mb-8 flex items-start gap-3 rounded-xl border border-red-500/25 bg-red-500/[0.07] p-5">
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-300" />
                    <div>
                        <p className="font-semibold text-red-200">This event was not approved</p>
                        {event.rejectionReason && <p className="mt-1 text-sm text-ink/70">{event.rejectionReason}</p>}
                    </div>
                </div>
            )}

            {/* Hero */}
            <header className="mb-10 border-b border-mist pb-8">
                <div className="mb-5 flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-cream/20 bg-cream/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-cream">
                        {event.category}
                    </span>
                    <span
                        className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${event.price === 0
                            ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-300"
                            : "border-cream/20 bg-cream/[0.07] text-cream"
                            }`}
                    >
                        {event.price === 0 ? "Free" : `$${event.price.toFixed(event.price % 1 === 0 ? 0 : 2)} USD`}
                    </span>
                    {event.isPast && (
                        <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-ink/60">
                            Past event
                        </span>
                    )}
                </div>

                <h1 className="font-serif text-4xl font-normal leading-tight text-ink sm:text-5xl">
                    {event.title}
                </h1>
                <p className="mt-4 text-lg leading-relaxed text-ink/70">{event.summary}</p>
            </header>

            {/* Facts */}
            <dl className="mb-10 grid gap-4 rounded-2xl border border-mist bg-black-raised/40 p-6 sm:grid-cols-2">
                <div className="flex items-start gap-3">
                    <CalendarDays className="mt-0.5 h-5 w-5 shrink-0 text-cream" />
                    <div>
                        <dt className="text-xs uppercase tracking-wide text-ink/50">Date</dt>
                        <dd className="mt-1 text-sm text-ink">{formatEventDate(event.startsAt)}</dd>
                    </div>
                </div>
                <div className="flex items-start gap-3">
                    <Clock className="mt-0.5 h-5 w-5 shrink-0 text-cream" />
                    <div>
                        <dt className="text-xs uppercase tracking-wide text-ink/50">Time</dt>
                        <dd className="mt-1 text-sm text-ink">{formatEventTime(event.startsAt, event.endsAt)}</dd>
                    </div>
                </div>
                <div className="flex items-start gap-3">
                    {event.isOnline ? (
                        <Video className="mt-0.5 h-5 w-5 shrink-0 text-cream" />
                    ) : (
                        <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-cream" />
                    )}
                    <div>
                        <dt className="text-xs uppercase tracking-wide text-ink/50">
                            {event.isOnline ? "Format" : "Location"}
                        </dt>
                        <dd className="mt-1 text-sm text-ink">
                            {event.isOnline ? "Online gathering" : event.location || "To be announced"}
                        </dd>
                    </div>
                </div>
                <div className="flex items-start gap-3">
                    <Users className="mt-0.5 h-5 w-5 shrink-0 text-cream" />
                    <div>
                        <dt className="text-xs uppercase tracking-wide text-ink/50">Attending</dt>
                        <dd className="mt-1 text-sm text-ink">
                            {event.interestCount}
                            {event.capacity ? ` of ${event.capacity}` : ""} interested
                            {isFull && !event.isInterested ? " · Full" : ""}
                        </dd>
                    </div>
                </div>
            </dl>

            {/* Body */}
            <div className="mb-10 whitespace-pre-line text-base leading-relaxed text-ink/80">
                {event.description}
            </div>

            {/* Host */}
            {event.host && (
                <div className="mb-10 flex items-center gap-4 rounded-2xl border border-mist bg-black-raised/40 p-6">
                    {event.host.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={event.host.avatarUrl}
                            alt={event.host.name ?? "Host"}
                            className="h-14 w-14 rounded-full object-cover"
                        />
                    ) : (
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-cream/10 font-serif text-xl text-cream">
                            {(event.host.name || "M").charAt(0)}
                        </div>
                    )}
                    <div>
                        <p className="text-xs uppercase tracking-wide text-ink/50">Hosted by</p>
                        <p className="mt-1 font-serif text-lg text-ink">
                            {event.host.name || "AI Bootcamp"}
                        </p>
                    </div>
                </div>
            )}

            {/* Actions */}
            <div className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-center">
                {canRegister && (
                    <button
                        type="button"
                        onClick={toggleInterest}
                        disabled={busy}
                        aria-pressed={event.isInterested}
                        className={`inline-flex items-center justify-center gap-2 rounded-xl px-8 py-3.5 text-sm font-semibold transition-colors disabled:opacity-60 ${event.isInterested
                            ? "border border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                            : "bg-cream text-black hover:bg-[#FFB073]"
                            }`}
                    >
                        <Heart className={`h-4 w-4 ${event.isInterested ? "fill-current" : ""}`} />
                        {event.isInterested ? "You're on the list" : "I'm Interested"}
                    </button>
                )}

                {event.meetingUrl && (
                    <a
                        href={event.meetingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-8 py-3.5 text-sm font-medium text-ink transition-colors hover:border-gold/60"
                    >
                        <ExternalLink className="h-4 w-4" />
                        Join link
                    </a>
                )}
            </div>

            {actionError && (
                <p role="alert" className="mb-6 text-sm text-red-300">
                    {actionError}
                </p>
            )}

            {isFull && !event.isInterested && !isPending && !isRejected && (
                <p className="mb-6 text-sm text-ink/60">This gathering is fully booked.</p>
            )}

            {/* Admin review controls */}
            {session?.user?.role && isAdminRole(session.user.role) && (
                <EventApprovalPanel event={event} onUpdated={load} />
            )}
        </div>
    );
}

/** Admin check kept local so the page only imports what it needs. */
function isAdminRole(role?: string | null) {
    return role === "ADMIN" || role === "SUPER_ADMIN";
}