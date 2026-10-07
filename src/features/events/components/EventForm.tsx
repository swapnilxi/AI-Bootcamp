"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Loader2, CalendarPlus, Info } from "lucide-react";
import { EVENT_PATHS, EVENT_ROUTES, EVENT_CATEGORIES, useEventRequests } from "../index";
import { Button } from "@/components/ui/Button";

const inputClass =
    "w-full rounded-xl border border-white/[0.07] bg-black-raised/80 px-4 py-3 text-sm text-ink " +
    "placeholder-ink/40 focus:border-gold focus:outline-none";
const labelClass = "mb-2 block text-xs font-semibold uppercase tracking-wide text-ink/60";

/** Convert a local `datetime-local` value into an ISO string for the API. */
const toIso = (local: string) => (local ? new Date(local).toISOString() : "");

/**
 * Create an event. Instructors' submissions land in the approval queue and are
 * badged "Awaiting Approval" until an admin publishes them.
 *
 * When opened with `?requestId=…` the form is prefilled from that community
 * request and the resulting event credits the member who asked for it.
 */
export function EventForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { data: session } = useSession();
    const requestId = searchParams.get("requestId") ?? undefined;

    const isAdmin = session?.user?.role === "ADMIN" || session?.user?.role === "SUPER_ADMIN";
    const { requests } = useEventRequests(isAdmin ? "all" : "tagged");

    const [form, setForm] = useState({
        title: "",
        summary: "",
        description: "",
        category: "Workshop",
        location: "",
        isOnline: false,
        meetingUrl: "",
        startsAt: "",
        endsAt: "",
        capacity: "",
        price: "0",
        requestId: requestId ?? "",
    });
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const openRequests = requests.filter((r) => r.status === "OPEN" && !r.eventId);
    const selectedRequest = openRequests.find((r) => r.id === form.requestId);

    /** Prefill the form from the chosen community request. */
    function pickRequest(id: string) {
        const request = openRequests.find((r) => r.id === id);
        if (!request) {
            setForm((f) => ({ ...f, requestId: "" }));
            return;
        }
        setForm((f) => ({
            ...f,
            requestId: id,
            title: f.title || request.title,
            summary: f.summary || request.details.slice(0, 280),
            description: f.description || request.details,
            category: request.category || f.category,
        }));
    }

    function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
        setForm((f) => ({ ...f, [key]: value }));
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);

        if (!form.startsAt || !form.endsAt) {
            setError("Please set when the event starts and ends.");
            return;
        }

        setBusy(true);
        try {
            const res = await fetch(EVENT_ROUTES.base, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: form.title,
                    summary: form.summary,
                    description: form.description,
                    category: form.category,
                    location: form.isOnline ? null : form.location || null,
                    isOnline: form.isOnline,
                    meetingUrl: form.isOnline ? form.meetingUrl || null : null,
                    startsAt: toIso(form.startsAt),
                    endsAt: toIso(form.endsAt),
                    capacity: form.capacity ? Number(form.capacity) : null,
                    price: form.price ? Number(form.price) : 0,
                    requestId: form.requestId || undefined,
                }),
            });

            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                setError(data.error || "Could not create the event");
                return;
            }
            router.push(EVENT_PATHS.detail(data.event.id));
        } catch {
            setError("An unexpected error occurred");
        } finally {
            setBusy(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            {/* Plan from a request */}
            {openRequests.length > 0 && (
                <section className="rounded-2xl border border-cream/15 bg-cream/6 p-6">
                    <div className="mb-4 flex items-center gap-2.5">
                        <CalendarPlus className="h-5 w-5 text-text-muted" />
                        <h2 className="font-serif text-lg text-ink">Plan from a member request</h2>
                    </div>
                    <p className="mb-4 text-sm text-ink/65">
                        Building this event from a request credits the member who suggested it — they are notified
                        automatically when you approve it.
                    </p>
                    <select
                        value={form.requestId}
                        onChange={(e) => pickRequest(e.target.value)}
                        className={inputClass}
                        aria-label="Choose a member request"
                    >
                        <option value="">Not from a request — original event</option>
                        {openRequests.map((r) => (
                            <option key={r.id} value={r.id}>
                                {r.title} — {r.requester?.name || "a member"}
                            </option>
                        ))}
                    </select>
                    {selectedRequest && (
                        <p className="mt-3 text-sm text-ink/60">
                            Requested by <span className="text-ink">{selectedRequest.requester?.name || "a member"}</span>
                            {selectedRequest.taggedUser ? ` · assigned to ${selectedRequest.taggedUser.name}` : ""}
                        </p>
                    )}
                </section>
            )}

            {/* Basics */}
            <section className="space-y-5">
                <div>
                    <label htmlFor="title" className={labelClass}>
                        Title
                    </label>
                    <input
                        id="title"
                        required
                        minLength={3}
                        value={form.title}
                        onChange={(e) => update("title", e.target.value)}
                        placeholder="e.g. Reading Your Birth Chart with Confidence"
                        className={inputClass}
                    />
                </div>

                <div>
                    <label htmlFor="summary" className={labelClass}>
                        Short summary
                    </label>
                    <textarea
                        id="summary"
                        required
                        minLength={10}
                        maxLength={300}
                        rows={2}
                        value={form.summary}
                        onChange={(e) => update("summary", e.target.value)}
                        placeholder="One or two sentences shown on the event card."
                        className={inputClass}
                    />
                </div>

                <div>
                    <label htmlFor="description" className={labelClass}>
                        Full description
                    </label>
                    <textarea
                        id="description"
                        required
                        minLength={20}
                        rows={8}
                        value={form.description}
                        onChange={(e) => update("description", e.target.value)}
                        placeholder="What will attendees experience? What will they take away?"
                        className={inputClass}
                    />
                </div>
            </section>

            {/* Category and format */}
            <section className="grid gap-5 sm:grid-cols-2">
                <div>
                    <label htmlFor="category" className={labelClass}>
                        Category
                    </label>
                    <select
                        id="category"
                        value={form.category}
                        onChange={(e) => update("category", e.target.value)}
                        className={inputClass}
                    >
                        {EVENT_CATEGORIES.map((c) => (
                            <option key={c} value={c}>
                                {c}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label htmlFor="format" className={labelClass}>
                        Format
                    </label>
                    <select
                        id="format"
                        value={form.isOnline ? "online" : "in-person"}
                        onChange={(e) => update("isOnline", e.target.value === "online")}
                        className={inputClass}
                    >
                        <option value="in-person">In person</option>
                        <option value="online">Online</option>
                    </select>
                </div>
            </section>

            {/* When */}
            <section className="grid gap-5 sm:grid-cols-2">
                <div>
                    <label htmlFor="startsAt" className={labelClass}>
                        Starts
                    </label>
                    <input
                        id="startsAt"
                        type="datetime-local"
                        required
                        value={form.startsAt}
                        onChange={(e) => update("startsAt", e.target.value)}
                        className={inputClass}
                    />
                </div>
                <div>
                    <label htmlFor="endsAt" className={labelClass}>
                        Ends
                    </label>
                    <input
                        id="endsAt"
                        type="datetime-local"
                        required
                        value={form.endsAt}
                        onChange={(e) => update("endsAt", e.target.value)}
                        className={inputClass}
                    />
                </div>
            </section>

            {/* Where */}
            <section className="space-y-5">
                {form.isOnline ? (
                    <div>
                        <label htmlFor="meetingUrl" className={labelClass}>
                            Meeting link
                        </label>
                        <input
                            id="meetingUrl"
                            type="url"
                            value={form.meetingUrl}
                            onChange={(e) => update("meetingUrl", e.target.value)}
                            placeholder="https://meet.google.com/…"
                            className={inputClass}
                        />
                        <p className="mt-2 flex items-start gap-2 text-xs text-ink/50">
                            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                            Only members who show interest can see this link.
                        </p>
                    </div>
                ) : (
                    <div>
                        <label htmlFor="location" className={labelClass}>
                            Location
                        </label>
                        <input
                            id="location"
                            value={form.location}
                            onChange={(e) => update("location", e.target.value)}
                            placeholder="e.g. 1200 Grace Street, Suite 4"
                            className={inputClass}
                        />
                    </div>
                )}
            </section>

            {/* Numbers */}
            <section className="grid gap-5 sm:grid-cols-2">
                <div>
                    <label htmlFor="capacity" className={labelClass}>
                        Capacity <span className="normal-case text-ink/40">(optional)</span>
                    </label>
                    <input
                        id="capacity"
                        type="number"
                        min={1}
                        value={form.capacity}
                        onChange={(e) => update("capacity", e.target.value)}
                        placeholder="Unlimited"
                        className={inputClass}
                    />
                </div>
                <div>
                    <label htmlFor="price" className={labelClass}>
                        Price (USD)
                    </label>
                    <input
                        id="price"
                        type="number"
                        min={0}
                        step="0.01"
                        value={form.price}
                        onChange={(e) => update("price", e.target.value)}
                        className={inputClass}
                    />
                </div>
            </section>

            {error && (
                <p role="alert" className="rounded-xl border border-red-500/30 bg-red-500/[0.07] p-4 text-sm text-red-300">
                    {error}
                </p>
            )}

            {!isAdmin && (
                <p className="flex items-start gap-2 rounded-xl border border-cream/15 bg-cream/6 p-4 text-sm text-ink/70">
                    <Info className="mt-0.5 h-4 w-4 shrink-0 text-text-muted" />
                    Your event will be submitted for review. It stays out of sight until an administrator approves
                    it, and you will be notified once that happens.
                </p>
            )}

            <div className="flex flex-wrap gap-3">
                <Button type="submit" variant="primary" size="md" disabled={busy}>
                    {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {isAdmin ? "Create & Publish" : "Submit for Approval"}
                </Button>
                <Button type="button" variant="secondary" size="md" onClick={() => router.back()}>
                    Cancel
                </Button>
            </div>
        </form>
    );
}