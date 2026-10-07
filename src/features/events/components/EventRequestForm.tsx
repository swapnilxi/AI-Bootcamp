"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Lightbulb, CheckCircle2 } from "lucide-react";
import { EVENT_CATEGORIES, EVENT_PATHS, EVENT_ROUTES } from "../index";
import { Button } from "@/components/ui/Button";

const inputClass =
    "w-full rounded-xl border border-white/[0.07] bg-black-raised/80 px-4 py-3 text-sm text-ink " +
    "placeholder-ink/40 focus:border-gold focus:outline-none";
const labelClass = "mb-2 block text-xs font-semibold uppercase tracking-wide text-ink/60";

interface HostOption {
    id: string;
    name: string | null;
    avatarUrl: string | null;
    mentorType: string | null;
}

/**
 * Ask the practice to host an event. Members may tag an admin or instructor to
 * take responsibility for planning it; that person is notified immediately.
 */
export function EventRequestForm() {
    const router = useRouter();
    const [hosts, setHosts] = useState<HostOption[]>([]);
    const [form, setForm] = useState({
        title: "",
        details: "",
        category: "Workshop",
        proposedDate: "",
        taggedUserId: "",
    });
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [submitted, setSubmitted] = useState(false);

    // Instructors are the people a member can meaningfully tag.
    useEffect(() => {
        fetch("/api/instructors", { cache: "no-store" })
            .then(async (res) => {
                if (!res.ok) throw new Error("Could not load faculty");
                return res.json();
            })
            .then((data) => {
                const list = Array.isArray(data.instructors) ? data.instructors : [];
                setHosts(
                    list.map((i: { id: string; name?: string | null; avatarUrl?: string | null; mentorType?: string | null }) => ({
                        id: i.id,
                        name: i.name ?? null,
                        avatarUrl: i.avatarUrl ?? null,
                        mentorType: i.mentorType ?? null,
                    }))
                );
            })
            .catch(() => setHosts([]));
    }, []);

    function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
        setForm((f) => ({ ...f, [key]: value }));
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setBusy(true);

        try {
            const res = await fetch(EVENT_ROUTES.requests, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: form.title,
                    details: form.details,
                    category: form.category,
                    proposedDate: form.proposedDate ? new Date(form.proposedDate).toISOString() : null,
                    taggedUserId: form.taggedUserId || null,
                }),
            });

            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                setError(data.error || "Could not submit your request");
                return;
            }
            setSubmitted(true);
        } catch {
            setError("An unexpected error occurred");
        } finally {
            setBusy(false);
        }
    }

    if (submitted) {
        return (
            <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.06] p-10 text-center">
                <CheckCircle2 className="mx-auto mb-4 h-10 w-10 text-emerald-300" />
                <h2 className="font-serif text-2xl text-ink">Thank you — we have your request</h2>
                <p className="mx-auto mt-3 max-w-md text-ink/70">
                    {form.taggedUserId
                        ? "The faculty member you tagged has been notified and will take it forward. We will let you know as soon as it is approved."
                        : "Our faculty will review it and get back to you. We will notify you once a date is confirmed."}
                </p>
                <div className="mt-6 flex justify-center gap-3">
                    <Button href={EVENT_PATHS.list} variant="primary" size="md">
                        Browse events
                    </Button>
                    <Button
                        variant="secondary"
                        size="md"
                        onClick={() => {
                            setSubmitted(false);
                            setForm({ title: "", details: "", category: "Workshop", proposedDate: "", taggedUserId: "" });
                        }}
                    >
                        Make another request
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            <div className="flex items-start gap-3 rounded-2xl border border-indigo/25 bg-indigo/[0.06] p-6">
                <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-indigo" />
                <p className="text-sm text-ink/70">
                    Tell us what you would like to see. If you already know who should run it, tag them below and
                    they will be notified straight away. Once a member of faculty plans it and an administrator
                    approves it, you will hear back from us.
                </p>
            </div>

            <div className="space-y-5">
                <div>
                    <label htmlFor="request-title" className={labelClass}>
                        What kind of event?
                    </label>
                    <input
                        id="request-title"
                        required
                        minLength={3}
                        maxLength={140}
                        value={form.title}
                        onChange={(e) => update("title", e.target.value)}
                        placeholder="e.g. A beginner's introduction to reading a birth chart"
                        className={inputClass}
                    />
                </div>

                <div>
                    <label htmlFor="request-details" className={labelClass}>
                        Tell us more
                    </label>
                    <textarea
                        id="request-details"
                        required
                        minLength={20}
                        rows={7}
                        value={form.details}
                        onChange={(e) => update("details", e.target.value)}
                        placeholder="Who is it for? What would you like to learn or experience? Online or in person?"
                        className={inputClass}
                    />
                </div>
            </div>

            <section className="grid gap-5 sm:grid-cols-2">
                <div>
                    <label htmlFor="request-category" className={labelClass}>
                        Category
                    </label>
                    <select
                        id="request-category"
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
                    <label htmlFor="request-date" className={labelClass}>
                        Ideal date <span className="normal-case text-ink/40">(optional)</span>
                    </label>
                    <input
                        id="request-date"
                        type="date"
                        value={form.proposedDate}
                        onChange={(e) => update("proposedDate", e.target.value)}
                        className={inputClass}
                    />
                </div>
            </section>

            <div>
                <label htmlFor="tagged-host" className={labelClass}>
                    Who should plan it? <span className="normal-case text-ink/40">(optional)</span>
                </label>
                <select
                    id="tagged-host"
                    value={form.taggedUserId}
                    onChange={(e) => update("taggedUserId", e.target.value)}
                    className={inputClass}
                >
                    <option value="">Anyone from our faculty</option>
                    {hosts.map((h) => (
                        <option key={h.id} value={h.id}>
                            {h.name || "Faculty member"}
                            {h.mentorType ? ` — ${h.mentorType.toLowerCase()}` : ""}
                        </option>
                    ))}
                </select>
            </div>

            {error && (
                <p role="alert" className="rounded-xl border border-red-500/30 bg-red-500/[0.07] p-4 text-sm text-red-300">
                    {error}
                </p>
            )}

            <div className="flex flex-wrap gap-3">
                <Button type="submit" variant="primary" size="md" disabled={busy}>
                    {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Send Request
                </Button>
                <Button type="button" variant="secondary" size="md" onClick={() => router.push(EVENT_PATHS.list)}>
                    Cancel
                </Button>
            </div>
        </form>
    );
}