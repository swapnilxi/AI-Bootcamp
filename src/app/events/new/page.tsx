"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { ArrowLeft, Calendar, Clock, MapPin, Video, Users, DollarSign, Sparkles, AlertCircle, Loader2, Hourglass } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EVENT_CATEGORIES, EVENT_ROUTES } from "@/features/events";
import { canCreateClasses, isAdminRole } from "@/lib/roles";

interface HostOption {
    id: string;
    name: string | null;
    email: string;
    role: string;
}

function CreateEventForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const requestIdParam = searchParams.get("requestId");

    const { data: session, status: authStatus } = useSession();
    const userRole = session?.user?.role;
    const canCreate = canCreateClasses(userRole);
    const isAdmin = isAdminRole(userRole);

    const [instructors, setInstructors] = useState<HostOption[]>([]);
    const [requestTitle, setRequestTitle] = useState<string | null>(null);

    // Form fields
    const [title, setTitle] = useState("");
    const [summary, setSummary] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("Workshop");
    const [isOnline, setIsOnline] = useState(true);
    const [location, setLocation] = useState("");
    const [meetingUrl, setMeetingUrl] = useState("");
    const [coverImage, setCoverImage] = useState("");
    const [startsAt, setStartsAt] = useState("");
    const [endsAt, setEndsAt] = useState("");
    const [timezone, setTimezone] = useState("America/New_York");
    const [capacity, setCapacity] = useState<string>("");
    const [price, setPrice] = useState<string>("0");
    const [hostId, setHostId] = useState<string>("");

    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Default dates: tomorrow 6 PM to 7:30 PM
    useEffect(() => {
        const now = new Date();
        const tomorrow = new Date(now.setDate(now.getDate() + 1));
        tomorrow.setHours(18, 0, 0, 0);

        const startIso = tomorrow.toISOString().slice(0, 16);
        const end = new Date(tomorrow.getTime() + 90 * 60000);
        const endIso = end.toISOString().slice(0, 16);

        setStartsAt(startIso);
        setEndsAt(endIso);
    }, []);

    // Load request details if requestIdParam is present
    useEffect(() => {
        if (!requestIdParam) return;
        fetch(EVENT_ROUTES.request(requestIdParam))
            .then((res) => res.json())
            .then((data) => {
                if (data.request) {
                    setRequestTitle(data.request.title);
                    setTitle(data.request.title);
                    setCategory(data.request.category || "Workshop");
                    setDescription(data.request.details || "");
                }
            })
            .catch(() => {});
    }, [requestIdParam]);

    // Load available hosts for admin selection
    useEffect(() => {
        if (!isAdmin) return;
        fetch("/api/admin/users")
            .then((res) => res.json())
            .then((data) => {
                if (Array.isArray(data.users)) {
                    const hosts = data.users.filter((u: HostOption) =>
                        ["INSTRUCTOR", "ADMIN", "SUPER_ADMIN"].includes(u.role)
                    );
                    setInstructors(hosts);
                }
            })
            .catch(() => {});
    }, [isAdmin]);

    if (authStatus === "loading") {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-gold" />
            </div>
        );
    }

    if (!session || !canCreate) {
        return (
            <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 px-4 py-24 text-center">
                <AlertCircle className="h-10 w-10 text-red-300" />
                <h1 className="font-serif text-3xl text-ink">Access Restricted</h1>
                <p className="text-ink/70">
                    Only faculty, instructors, and administrators can host events.
                </p>
                <Button href="/events" variant="secondary" size="sm">
                    <ArrowLeft className="mr-1 h-4 w-4" />
                    <span>Back to events</span>
                </Button>
            </div>
        );
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);

        if (!title.trim() || title.length < 3) {
            setError("Title must be at least 3 characters");
            return;
        }
        if (!summary.trim() || summary.length < 10) {
            setError("Summary must be at least 10 characters");
            return;
        }
        if (!description.trim() || description.length < 20) {
            setError("Description must be at least 20 characters");
            return;
        }
        if (isOnline && !meetingUrl.trim() && !location.trim()) {
            setError("Please provide a meeting link or format instructions for online event");
            return;
        }
        if (new Date(endsAt) <= new Date(startsAt)) {
            setError("End time must be after start time");
            return;
        }

        setSubmitting(true);

        try {
            const payload: Record<string, unknown> = {
                title: title.trim(),
                summary: summary.trim(),
                description: description.trim(),
                category,
                isOnline,
                location: location.trim() || null,
                meetingUrl: meetingUrl.trim() || null,
                coverImage: coverImage.trim() || null,
                startsAt: new Date(startsAt).toISOString(),
                endsAt: new Date(endsAt).toISOString(),
                timezone,
                capacity: capacity ? parseInt(capacity, 10) : null,
                price: parseFloat(price) || 0,
            };

            if (isAdmin && hostId) {
                payload.hostId = hostId;
            }
            if (requestIdParam) {
                payload.requestId = requestIdParam;
            }

            const res = await fetch(EVENT_ROUTES.base, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                setError(data.error || "Failed to create event");
                return;
            }

            router.push(`/events/${data.event.id}`);
        } catch {
            setError("An unexpected error occurred. Please try again.");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
            <Link
                href="/events"
                className="mb-8 inline-flex items-center gap-2 text-sm text-ink/60 transition-colors hover:text-gold"
            >
                <ArrowLeft className="h-4 w-4" />
                Back to events
            </Link>

            <div className="mb-8 border-b border-mist pb-6">
                <span className="mb-2 inline-block rounded-full border border-mist bg-mist/60 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-cream">
                    Faculty Portal
                </span>
                <h1 className="font-serif text-3xl font-normal text-ink sm:text-4xl">Host a Gathering</h1>
                <p className="mt-2 text-sm text-ink/75">
                    Schedule a workshop, webinar, retreat, or circle for the AI Bootcamp community.
                </p>
            </div>

            {requestTitle && (
                <div className="mb-8 flex items-start gap-3 rounded-xl border border-cream/20 bg-cream/[0.05] p-4 text-sm text-cream">
                    <Sparkles className="mt-0.5 h-5 w-5 shrink-0" />
                    <div>
                        <p className="font-medium">Planning Community Request</p>
                        <p className="text-xs text-cream/80">
                            Fulfilling request: &ldquo;{requestTitle}&rdquo;. The requester will be notified upon approval.
                        </p>
                    </div>
                </div>
            )}

            {!isAdmin && (
                <div className="mb-8 flex items-start gap-3 rounded-xl border border-cream/20 bg-cream/[0.07] p-4 text-sm text-cream">
                    <Hourglass className="mt-0.5 h-5 w-5 shrink-0 text-cream" />
                    <div>
                        <p className="font-medium">Admin Approval Required</p>
                        <p className="text-xs text-ink/70">
                            Your event will start with state <span className="font-semibold text-cream">Awaiting Approval</span>. An administrator will review and publish it so it becomes visible to members.
                        </p>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Basic Info */}
                <section className="space-y-4 rounded-2xl border border-mist bg-black-raised/40 p-6">
                    <h2 className="font-serif text-lg text-ink">1. Basic Details</h2>

                    <div>
                        <label htmlFor="title" className="block text-xs uppercase tracking-wide text-ink/60 mb-1">
                            Event Title *
                        </label>
                        <input
                            id="title"
                            type="text"
                            required
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. AI Solstice Ritual & Alignment"
                            className="w-full rounded-xl border border-white/10 bg-black-raised px-4 py-3 text-sm text-ink placeholder-ink/40 focus:border-gold focus:outline-none"
                        />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label htmlFor="category" className="block text-xs uppercase tracking-wide text-ink/60 mb-1">
                                Category *
                            </label>
                            <select
                                id="category"
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full rounded-xl border border-white/10 bg-black-raised px-4 py-3 text-sm text-ink focus:border-gold focus:outline-none"
                            >
                                {EVENT_CATEGORIES.map((cat) => (
                                    <option key={cat} value={cat}>
                                        {cat}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {isAdmin && instructors.length > 0 && (
                            <div>
                                <label htmlFor="hostId" className="block text-xs uppercase tracking-wide text-ink/60 mb-1">
                                    Host Instructor
                                </label>
                                <select
                                    id="hostId"
                                    value={hostId}
                                    onChange={(e) => setHostId(e.target.value)}
                                    className="w-full rounded-xl border border-white/10 bg-black-raised px-4 py-3 text-sm text-ink focus:border-gold focus:outline-none"
                                >
                                    <option value="">Self ({session.user.name || session.user.email})</option>
                                    {instructors.map((inst) => (
                                        <option key={inst.id} value={inst.id}>
                                            {inst.name || inst.email} ({inst.role})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    <div>
                        <label htmlFor="summary" className="block text-xs uppercase tracking-wide text-ink/60 mb-1">
                            Short Summary * (displayed on event cards)
                        </label>
                        <textarea
                            id="summary"
                            required
                            rows={2}
                            maxLength={300}
                            value={summary}
                            onChange={(e) => setSummary(e.target.value)}
                            placeholder="Briefly describe what members will learn or experience..."
                            className="w-full rounded-xl border border-white/10 bg-black-raised px-4 py-3 text-sm text-ink placeholder-ink/40 focus:border-gold focus:outline-none"
                        />
                    </div>

                    <div>
                        <label htmlFor="description" className="block text-xs uppercase tracking-wide text-ink/60 mb-1">
                            Full Description *
                        </label>
                        <textarea
                            id="description"
                            required
                            rows={6}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Provide full details, curriculum, prerequisites, or preparation notes..."
                            className="w-full rounded-xl border border-white/10 bg-black-raised px-4 py-3 text-sm text-ink placeholder-ink/40 focus:border-gold focus:outline-none"
                        />
                    </div>
                </section>

                {/* Date & Location */}
                <section className="space-y-4 rounded-2xl border border-mist bg-black-raised/40 p-6">
                    <h2 className="font-serif text-lg text-ink">2. Timing & Format</h2>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label htmlFor="startsAt" className="block text-xs uppercase tracking-wide text-ink/60 mb-1">
                                Starts At *
                            </label>
                            <input
                                id="startsAt"
                                type="datetime-local"
                                required
                                value={startsAt}
                                onChange={(e) => setStartsAt(e.target.value)}
                                className="w-full rounded-xl border border-white/10 bg-black-raised px-4 py-3 text-sm text-ink focus:border-gold focus:outline-none"
                            />
                        </div>

                        <div>
                            <label htmlFor="endsAt" className="block text-xs uppercase tracking-wide text-ink/60 mb-1">
                                Ends At *
                            </label>
                            <input
                                id="endsAt"
                                type="datetime-local"
                                required
                                value={endsAt}
                                onChange={(e) => setEndsAt(e.target.value)}
                                className="w-full rounded-xl border border-white/10 bg-black-raised px-4 py-3 text-sm text-ink focus:border-gold focus:outline-none"
                            />
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label htmlFor="timezone" className="block text-xs uppercase tracking-wide text-ink/60 mb-1">
                                Timezone
                            </label>
                            <select
                                id="timezone"
                                value={timezone}
                                onChange={(e) => setTimezone(e.target.value)}
                                className="w-full rounded-xl border border-white/10 bg-black-raised px-4 py-3 text-sm text-ink focus:border-gold focus:outline-none"
                            >
                                <option value="America/New_York">Eastern Time (ET)</option>
                                <option value="America/Los_Angeles">Pacific Time (PT)</option>
                                <option value="UTC">UTC</option>
                                <option value="Asia/Kolkata">India Standard Time (IST)</option>
                                <option value="Europe/London">London (GMT/BST)</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs uppercase tracking-wide text-ink/60 mb-1">
                                Event Format
                            </label>
                            <div className="flex gap-4 pt-2">
                                <label className="inline-flex items-center gap-2 text-sm text-ink cursor-pointer">
                                    <input
                                        type="radio"
                                        name="format"
                                        checked={isOnline}
                                        onChange={() => setIsOnline(true)}
                                        className="text-gold focus:ring-gold"
                                    />
                                    <Video className="h-4 w-4 text-cream" />
                                    Online Event
                                </label>
                                <label className="inline-flex items-center gap-2 text-sm text-ink cursor-pointer">
                                    <input
                                        type="radio"
                                        name="format"
                                        checked={!isOnline}
                                        onChange={() => setIsOnline(false)}
                                        className="text-gold focus:ring-gold"
                                    />
                                    <MapPin className="h-4 w-4 text-cream" />
                                    In Person
                                </label>
                            </div>
                        </div>
                    </div>

                    {isOnline ? (
                        <div>
                            <label htmlFor="meetingUrl" className="block text-xs uppercase tracking-wide text-ink/60 mb-1">
                                Zoom / Meeting Link (optional or provided later)
                            </label>
                            <input
                                id="meetingUrl"
                                type="url"
                                value={meetingUrl}
                                onChange={(e) => setMeetingUrl(e.target.value)}
                                placeholder="https://zoom.us/j/123456789"
                                className="w-full rounded-xl border border-white/10 bg-black-raised px-4 py-3 text-sm text-ink placeholder-ink/40 focus:border-gold focus:outline-none"
                            />
                        </div>
                    ) : (
                        <div>
                            <label htmlFor="location" className="block text-xs uppercase tracking-wide text-ink/60 mb-1">
                                Physical Address / Venue
                            </label>
                            <input
                                id="location"
                                type="text"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                placeholder="e.g. Online, or Brooklyn, NY"
                                className="w-full rounded-xl border border-white/10 bg-black-raised px-4 py-3 text-sm text-ink placeholder-ink/40 focus:border-gold focus:outline-none"
                            />
                        </div>
                    )}
                </section>

                {/* Capacity & Pricing */}
                <section className="space-y-4 rounded-2xl border border-mist bg-black-raised/40 p-6">
                    <h2 className="font-serif text-lg text-ink">3. Capacity & Pricing</h2>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label htmlFor="capacity" className="block text-xs uppercase tracking-wide text-ink/60 mb-1">
                                Seat Capacity (leave empty for unlimited)
                            </label>
                            <input
                                id="capacity"
                                type="number"
                                min="1"
                                value={capacity}
                                onChange={(e) => setCapacity(e.target.value)}
                                placeholder="e.g. 50"
                                className="w-full rounded-xl border border-white/10 bg-black-raised px-4 py-3 text-sm text-ink placeholder-ink/40 focus:border-gold focus:outline-none"
                            />
                        </div>

                        <div>
                            <label htmlFor="price" className="block text-xs uppercase tracking-wide text-ink/60 mb-1">
                                Ticket Price (USD) — 0 for free
                            </label>
                            <input
                                id="price"
                                type="number"
                                min="0"
                                step="0.01"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                placeholder="0.00"
                                className="w-full rounded-xl border border-white/10 bg-black-raised px-4 py-3 text-sm text-ink placeholder-ink/40 focus:border-gold focus:outline-none"
                            />
                        </div>
                    </div>
                </section>

                {error && (
                    <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
                        {error}
                    </div>
                )}

                <div className="flex justify-end gap-4 pt-4">
                    <Button href="/events" variant="secondary" size="md">
                        Cancel
                    </Button>
                    <button
                        type="submit"
                        disabled={submitting}
                        className="inline-flex items-center gap-2 rounded-xl bg-cream px-8 py-3.5 text-sm font-semibold text-[#0C0B0A] transition-colors hover:bg-cream/90 disabled:opacity-60"
                    >
                        {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                        {submitting ? "Submitting..." : isAdmin ? "Publish Event" : "Submit for Approval"}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default function CreateEventPage() {
    return (
        <Suspense fallback={
            <div className="flex min-h-[60vh] items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-gold" />
            </div>
        }>
            <CreateEventForm />
        </Suspense>
    );
}