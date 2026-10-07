"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarDays, Clock, MapPin, Video, Users, Heart, Sparkles, Hourglass } from "lucide-react";
import { EVENT_ROUTES } from "../routes";

export interface EventItem {
    id: string;
    title: string;
    slug: string;
    summary: string;
    category: string;
    location: string | null;
    isOnline: boolean;
    coverImage: string | null;
    startsAt: string | Date;
    endsAt: string | Date;
    timezone: string;
    capacity: number | null;
    price: number;
    host?: {
        id: string;
        name?: string | null;
        avatarUrl?: string | null;
    } | null;
    interestCount: number;
    isInterested: boolean;
    isPast: boolean;
    approvalStatus: "PENDING" | "APPROVED" | "REJECTED";
    canManage: boolean;
}

/** Shared date/time formatting so cards and detail pages agree. */
export function formatEventDate(startsAt: string | Date): string {
    return new Date(startsAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

export function formatEventTime(startsAt: string | Date, endsAt: string | Date): string {
    const opts: Intl.DateTimeFormatOptions = { hour: "numeric", minute: "2-digit" };
    return `${new Date(startsAt).toLocaleTimeString("en-US", opts)} – ${new Date(endsAt).toLocaleTimeString(
        "en-US",
        opts
    )}`;
}

interface EventCardProps {
    event: EventItem;
}

/**
 * A single event in the catalog. Hosts and admins also see events that are
 * still awaiting approval, which are clearly badged so their state is obvious.
 */
export function EventCard({ event }: EventCardProps) {
    const router = useRouter();
    const [interested, setInterested] = useState(event.isInterested);
    const [interestCount, setInterestCount] = useState(event.interestCount);
    const [busy, setBusy] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const isPending = event.approvalStatus === "PENDING";
    const isRejected = event.approvalStatus === "REJECTED";
    const isFull = !!event.capacity && interestCount >= event.capacity && !interested;
    const cannotRegister = isPending || isRejected || event.isPast || isFull;

    /** Toggle this member's interest in the event. */
    async function toggleInterest() {
        setErrorMsg(null);
        const previous = { interested, interestCount };

        // Optimistic: the heart flips immediately and rolls back on failure.
        setInterested(!interested);
        setInterestCount(interestCount + (interested ? -1 : 1));

        try {
            const res = await fetch(EVENT_ROUTES.interest(event.id), {
                method: interested ? "DELETE" : "POST",
            });
            const data = await res.json().catch(() => ({}));

            if (res.status === 401) {
                setInterested(previous.interested);
                setInterestCount(previous.interestCount);
                router.push(`/login?callbackUrl=/events/${event.id}`);
                return;
            }
            if (!res.ok) {
                setInterested(previous.interested);
                setInterestCount(previous.interestCount);
                setErrorMsg(data.error || "Could not update your interest");
                return;
            }
            if (typeof data.interestCount === "number") setInterestCount(data.interestCount);
        } catch {
            setInterested(previous.interested);
            setInterestCount(previous.interestCount);
            setErrorMsg("An unexpected error occurred");
        }
    }

    const priceLabel = `$${event.price.toFixed(event.price % 1 === 0 ? 0 : 2)}`;

    return (
        <article
            onClick={(e) => {
                const target = e.target as HTMLElement;
                if (target.closest("button") || target.closest("a")) return;
                router.push(`/events/${event.id}`);
            }}
            className="editorial-card group relative flex h-full cursor-pointer flex-col rounded-2xl p-6 sm:p-8 transition-all duration-300 hover:border-gold/50"
        >
            {/* Badges */}
            <div className="mb-5 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-full border border-cream/15 bg-cream/8 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-text">
                    {event.category}
                </span>

                {isPending && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-cream/20 bg-cream/8 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-text">
                        <Hourglass className="h-3 w-3" /> Awaiting Approval
                    </span>
                )}

                {isRejected && (
                    <span className="inline-flex items-center rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-red-300">
                        Not Approved
                    </span>
                )}

                {event.price === 0 ? (
                    <span className="inline-flex items-center rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-300">
                        Free
                    </span>
                ) : (
                    <span className="inline-flex items-baseline gap-1 rounded-full border border-cream/15 bg-cream/6 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-text">
                        {priceLabel}
                        <span className="text-[9px] text-text-muted">USD</span>
                    </span>
                )}

                {interested && !cannotRegister && (
                    <span className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-300">
                        <Sparkles className="h-3.5 w-3.5" /> Going
                    </span>
                )}
            </div>

            {/* Title */}
            <Link href={`/events/${event.id}`} className="block">
                <h3 className="mb-3 line-clamp-2 font-serif text-[1.6rem] font-medium leading-snug text-ink transition-colors group-hover:text-gold">
                    {event.title}
                </h3>
            </Link>

            {/* Summary */}
            <p className="mb-6 line-clamp-3 text-sm leading-relaxed text-ink/70">{event.summary}</p>

            {/* Details */}
            <div className="mb-6 space-y-2.5 text-sm text-ink/70">
                <div className="flex items-center gap-2.5">
                    <CalendarDays className="h-4 w-4 shrink-0 text-text-muted" />
                    <span>{formatEventDate(event.startsAt)}</span>
                </div>
                <div className="flex items-center gap-2.5">
                    <Clock className="h-4 w-4 shrink-0 text-text-muted" />
                    <span>{formatEventTime(event.startsAt, event.endsAt)}</span>
                </div>
                <div className="flex items-center gap-2.5">
                    {event.isOnline ? (
                        <>
                            <Video className="h-4 w-4 shrink-0 text-text-muted" />
                            <span>Online</span>
                        </>
                    ) : (
                        <>
                            <MapPin className="h-4 w-4 shrink-0 text-text-muted" />
                            <span className="truncate">{event.location || "Location to be announced"}</span>
                        </>
                    )}
                </div>
                {event.capacity && (
                    <div className="flex items-center gap-2.5">
                        <Users className="h-4 w-4 shrink-0 text-text-muted" />
                        <span>
                            {interestCount} interested
                            {isFull && !interested ? " · Full" : ""}
                        </span>
                    </div>
                )}
            </div>

            {errorMsg && (
                <p role="alert" className="mb-3 text-xs text-red-300">
                    {errorMsg}
                </p>
            )}

            {/* Footer */}
            <div className="mt-auto flex items-center gap-3 border-t border-white/[0.06] pt-5">
                <span className="min-w-0 flex-1 truncate text-xs text-ink/50">
                    Hosted by <span className="text-ink/70">{event.host?.name || "AI Bootcamp"}</span>
                </span>

                {!cannotRegister && (
                    <button
                        type="button"
                        onClick={toggleInterest}
                        disabled={busy}
                        aria-pressed={interested}
                        className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-semibold transition-colors disabled:opacity-60 ${interested
                                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                                : "border-white/10 bg-white/[0.02] text-ink hover:border-gold/60 hover:bg-white/[0.04]"
                            }`}
                    >
                        <Heart className={`h-3.5 w-3.5 ${interested ? "fill-current" : ""}`} />
                        {interested ? "Interested" : "I'm Interested"}
                    </button>
                )}
            </div>
        </article>
    );
}