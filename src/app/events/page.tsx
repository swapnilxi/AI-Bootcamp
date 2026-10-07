"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Plus, Lightbulb, AlertCircle, Loader2, CalendarHeart } from "lucide-react";
import { EventCard, useEvents, type EventFilter } from "@/features/events";
import { Button } from "@/components/ui/Button";
import { canCreateClasses } from "@/lib/roles";

const FILTERS: { value: EventFilter; label: string }[] = [
    { value: "upcoming", label: "Upcoming" },
    { value: "past", label: "Past Gatherings" },
    { value: "online", label: "Online" },
    { value: "mine", label: "My Interests" },
];

export default function EventsPage() {
    const { data: session } = useSession();
    const [activeFilter, setActiveFilter] = useState<EventFilter>("upcoming");
    const [searchQuery, setSearchQuery] = useState("");

    const userRole = session?.user?.role;
    const canCreate = canCreateClasses(userRole);
    const { events, loading, error, refetch } = useEvents(activeFilter);

    const filtered = useMemo(() => {
        if (!searchQuery) return events;
        const q = searchQuery.toLowerCase();
        return events.filter(
            (e) =>
                e.title.toLowerCase().includes(q) ||
                e.summary.toLowerCase().includes(q) ||
                e.host?.name?.toLowerCase().includes(q)
        );
    }, [events, searchQuery]);

    return (
        <div className="mx-auto max-w-7xl space-y-12 px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
            {/* Header */}
            <div className="flex flex-col justify-between gap-6 border-b border-mist pb-8 md:flex-row md:items-end">
                <div>
                    <span className="mb-3 inline-block rounded-full border border-mist bg-mist/60 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-cream">
                        Gatherings & Circles
                    </span>
                    <h1 className="font-serif text-4xl font-normal leading-tight text-ink sm:text-5xl lg:text-6xl">
                        Events
                    </h1>
                    <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink/75 sm:text-lg">
                        Workshops, webinars and circles led by our faculty and mentors. Register your interest to be
                        told when places open.
                    </p>
                </div>

                <div className="flex shrink-0 flex-wrap gap-3">
                    <Button href="/events/request" variant="secondary" size="md">
                        <Lightbulb className="mr-1 h-4 w-4" />
                        <span>Request an Event</span>
                    </Button>
                    {canCreate && (
                        <Button href="/events/new" variant="primary" size="md">
                            <Plus className="mr-1 h-4 w-4" />
                            <span>Host an Event</span>
                        </Button>
                    )}
                </div>
            </div>

            {/* Filters and search */}
            <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
                    {FILTERS.map((f) => (
                        <button
                            key={f.value}
                            onClick={() => setActiveFilter(f.value)}
                            className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${activeFilter === f.value
                                    ? "bg-cream text-black shadow-sm"
                                    : "border border-white/[0.07] bg-black-raised/80 text-ink backdrop-blur-sm hover:border-gold"
                                }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>

                <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search events…"
                    aria-label="Search events"
                    className="w-full rounded-xl border border-white/[0.07] bg-black-raised/80 px-4 py-2.5 text-sm text-ink placeholder-ink/40 focus:border-gold focus:outline-none sm:w-64"
                />
            </div>

            {/* Results */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-6 w-6 animate-spin text-gold" />
                </div>
            ) : error ? (
                <div className="flex flex-col items-center gap-4 py-20 text-center">
                    <AlertCircle className="h-8 w-8 text-red-300" />
                    <p className="text-ink/70">{error}</p>
                    <Button onClick={refetch} variant="secondary" size="sm">
                        Try again
                    </Button>
                </div>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center gap-4 py-20 text-center">
                    <CalendarHeart className="h-8 w-8 text-cream/60" />
                    <div>
                        <p className="font-serif text-xl text-ink">
                            {activeFilter === "mine" ? "You have not shown interest in anything yet" : "Nothing here yet"}
                        </p>
                        <p className="mt-2 text-sm text-ink/60">
                            {activeFilter === "mine"
                                ? "Browse upcoming events and let us know what appeals to you."
                                : "New gatherings are announced regularly — check back soon, or request one yourself."}
                        </p>
                    </div>
                    <Button href="/events/request" variant="secondary" size="sm">
                        <Lightbulb className="mr-1 h-4 w-4" />
                        <span>Request an Event</span>
                    </Button>
                </div>
            ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {filtered.map((event) => (
                        <EventCard key={event.id} event={event} />
                    ))}
                </div>
            )}

            <p className="text-center text-xs text-ink/40">
                Have an idea for a gathering?{" "}
                <Link href="/events/request" className="text-cream hover:underline">
                    Tell us about it
                </Link>{" "}
                and our faculty will plan it.
            </p>
        </div>
    );
}