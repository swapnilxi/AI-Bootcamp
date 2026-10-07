"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { ArrowLeft, Lightbulb, Users, Calendar, Sparkles, CheckCircle2, XCircle, Loader2, AlertCircle, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EVENT_CATEGORIES, EVENT_ROUTES, type EventRequestSummary } from "@/features/events";
import { canCreateClasses, isAdminRole } from "@/lib/roles";

interface TagOption {
    id: string;
    name: string | null;
    email: string;
    role: string;
    mentorType?: string | null;
}

export default function RequestEventPage() {
    const router = useRouter();
    const { data: session, status: authStatus } = useSession();

    const [activeTab, setActiveTab] = useState<"request" | "queue">("request");
    const [hosts, setHosts] = useState<TagOption[]>([]);

    // Request form fields
    const [title, setTitle] = useState("");
    const [details, setDetails] = useState("");
    const [category, setCategory] = useState("Workshop");
    const [proposedDate, setProposedDate] = useState("");
    const [taggedUserId, setTaggedUserId] = useState("");

    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    // Queue of requests
    const [requests, setRequests] = useState<EventRequestSummary[]>([]);
    const [loadingQueue, setLoadingQueue] = useState(false);

    const userRole = session?.user?.role;
    const isStaff = canCreateClasses(userRole);
    const isAdmin = isAdminRole(userRole);

    // Load available hosts to tag
    useEffect(() => {
        fetch("/api/instructors")
            .then((res) => res.json())
            .then((data) => {
                if (Array.isArray(data.instructors)) {
                    setHosts(data.instructors);
                }
            })
            .catch(() => {});
    }, []);

    // Load request queue
    const loadRequests = React.useCallback(async () => {
        setLoadingQueue(true);
        try {
            const scope = isStaff ? "all" : "mine";
            const res = await fetch(`${EVENT_ROUTES.requests}?scope=${scope}`);
            const data = await res.json().catch(() => ({}));
            if (res.ok && Array.isArray(data.requests)) {
                setRequests(data.requests);
            }
        } catch {
        } finally {
            setLoadingQueue(false);
        }
    }, [isStaff]);

    useEffect(() => {
        if (session?.user) {
            loadRequests();
        }
    }, [session, loadRequests]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setSuccessMsg(null);

        if (!session?.user) {
            router.push(`/login?callbackUrl=/events/request`);
            return;
        }

        if (!title.trim() || title.length < 3) {
            setError("Title must be at least 3 characters");
            return;
        }
        if (!details.trim() || details.length < 20) {
            setError("Details must be at least 20 characters");
            return;
        }

        setSubmitting(true);

        try {
            const res = await fetch(EVENT_ROUTES.requests, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: title.trim(),
                    details: details.trim(),
                    category,
                    proposedDate: proposedDate ? new Date(proposedDate).toISOString() : null,
                    taggedUserId: taggedUserId || null,
                }),
            });

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                setError(data.error || "Could not submit request");
                return;
            }

            setSuccessMsg("Your request has been submitted! Our faculty will review it.");
            setTitle("");
            setDetails("");
            setProposedDate("");
            setTaggedUserId("");
            loadRequests();
            setActiveTab("queue");
        } catch {
            setError("An unexpected error occurred");
        } finally {
            setSubmitting(false);
        }
    }

    async function handleDecline(reqId: string) {
        const notes = prompt("Provide a brief reason for declining (sent to requester):");
        if (notes === null) return;

        try {
            const res = await fetch(EVENT_ROUTES.request(reqId), {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    status: "DECLINED",
                    adminNotes: notes || "Not feasible at this time.",
                }),
            });

            if (res.ok) {
                loadRequests();
            }
        } catch {}
    }

    return (
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
            <Link
                href="/events"
                className="mb-8 inline-flex items-center gap-2 text-sm text-ink/60 transition-colors hover:text-gold"
            >
                <ArrowLeft className="h-4 w-4" />
                Back to events
            </Link>

            {/* Header */}
            <div className="mb-8 border-b border-mist pb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
                <div>
                    <span className="mb-2 inline-block rounded-full border border-mist bg-mist/60 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-cream">
                        Community Voice
                    </span>
                    <h1 className="font-serif text-3xl font-normal text-ink sm:text-4xl">Request an Event</h1>
                    <p className="mt-2 text-sm text-ink/75">
                        Suggest a topic, ceremony, or workshop you would love our faculty to host.
                    </p>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => setActiveTab("request")}
                        className={`rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                            activeTab === "request"
                                ? "bg-cream text-black shadow-sm"
                                : "border border-white/10 bg-black-raised text-ink hover:border-gold"
                        }`}
                    >
                        <Lightbulb className="mr-1.5 inline-block h-4 w-4" />
                        New Suggestion
                    </button>
                    {session?.user && (
                        <button
                            onClick={() => setActiveTab("queue")}
                            className={`rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                                activeTab === "queue"
                                    ? "bg-cream text-black shadow-sm"
                                    : "border border-white/10 bg-black-raised text-ink hover:border-gold"
                            }`}
                        >
                            <Users className="mr-1.5 inline-block h-4 w-4" />
                            {isStaff ? "Request Queue" : "My Requests"} ({requests.length})
                        </button>
                    )}
                </div>
            </div>

            {activeTab === "request" ? (
                <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-mist bg-black-raised/40 p-6 sm:p-8">
                    {successMsg && (
                        <div className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-300">
                            <CheckCircle2 className="h-5 w-5 shrink-0" />
                            <span>{successMsg}</span>
                        </div>
                    )}

                    {error && (
                        <div className="flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
                            <AlertCircle className="h-5 w-5 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <div>
                        <label htmlFor="title" className="block text-xs uppercase tracking-wide text-ink/60 mb-1">
                            Event Title or Topic *
                        </label>
                        <input
                            id="title"
                            type="text"
                            required
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. Advanced Retrieval Evaluation Workshop"
                            className="w-full rounded-xl border border-white/10 bg-black-raised px-4 py-3 text-sm text-ink placeholder-ink/40 focus:border-gold focus:outline-none"
                        />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label htmlFor="category" className="block text-xs uppercase tracking-wide text-ink/60 mb-1">
                                Preferred Category
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

                        <div>
                            <label htmlFor="taggedUserId" className="block text-xs uppercase tracking-wide text-ink/60 mb-1">
                                Tag Faculty / Instructor (Optional)
                            </label>
                            <select
                                id="taggedUserId"
                                value={taggedUserId}
                                onChange={(e) => setTaggedUserId(e.target.value)}
                                className="w-full rounded-xl border border-white/10 bg-black-raised px-4 py-3 text-sm text-ink focus:border-gold focus:outline-none"
                            >
                                <option value="">Open to any faculty member</option>
                                {hosts.map((h) => (
                                    <option key={h.id} value={h.id}>
                                        {h.name || h.email} {h.mentorType ? `(${h.mentorType})` : ""}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="proposedDate" className="block text-xs uppercase tracking-wide text-ink/60 mb-1">
                            Preferred Date or Season (Optional)
                        </label>
                        <input
                            id="proposedDate"
                            type="date"
                            value={proposedDate}
                            onChange={(e) => setProposedDate(e.target.value)}
                            className="w-full rounded-xl border border-white/10 bg-black-raised px-4 py-3 text-sm text-ink focus:border-gold focus:outline-none"
                        />
                    </div>

                    <div>
                        <label htmlFor="details" className="block text-xs uppercase tracking-wide text-ink/60 mb-1">
                            Details & What You&apos;d Like Covered *
                        </label>
                        <textarea
                            id="details"
                            required
                            rows={5}
                            value={details}
                            onChange={(e) => setDetails(e.target.value)}
                            placeholder="Explain what specific topics, practices, or guidance you would love to experience in this gathering..."
                            className="w-full rounded-xl border border-white/10 bg-black-raised px-4 py-3 text-sm text-ink placeholder-ink/40 focus:border-gold focus:outline-none"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="submit"
                            disabled={submitting}
                            className="inline-flex items-center gap-2 rounded-xl bg-cream px-8 py-3.5 text-sm font-semibold text-black transition-colors hover:bg-[#FFB073] disabled:opacity-60"
                        >
                            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                            {submitting ? "Submitting..." : "Submit Request"}
                        </button>
                    </div>
                </form>
            ) : (
                <div className="space-y-4">
                    {loadingQueue ? (
                        <div className="flex items-center justify-center py-16">
                            <Loader2 className="h-6 w-6 animate-spin text-gold" />
                        </div>
                    ) : requests.length === 0 ? (
                        <div className="rounded-2xl border border-mist bg-black-raised/40 p-12 text-center text-ink/70">
                            No requests found. Be the first to suggest a gathering!
                        </div>
                    ) : (
                        requests.map((req) => (
                            <div key={req.id} className="rounded-2xl border border-mist bg-black-raised/40 p-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                                <div className="space-y-2">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="rounded-full border border-cream/20 bg-cream/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase text-cream">
                                            {req.category}
                                        </span>
                                        <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase ${
                                            req.status === "PLANNED"
                                                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                                                : req.status === "DECLINED"
                                                ? "border-red-500/30 bg-red-500/10 text-red-300"
                                                : "border-cream/20 bg-cream/10 text-cream"
                                        }`}>
                                            {req.status}
                                        </span>
                                    </div>
                                    <h3 className="font-serif text-lg font-medium text-ink">{req.title}</h3>
                                    <p className="text-xs leading-relaxed text-ink/70 line-clamp-2">{req.details}</p>
                                    <div className="flex flex-wrap gap-4 text-xs text-ink/50 pt-1">
                                        <span>Requested by: {req.requester?.name || "Member"}</span>
                                        {req.taggedUser && <span>Tagged: {req.taggedUser.name}</span>}
                                    </div>
                                </div>

                                {isStaff && req.status === "OPEN" && (
                                    <div className="flex shrink-0 gap-2">
                                        <Link
                                            href={`/events/new?requestId=${req.id}`}
                                            className="inline-flex items-center gap-1.5 rounded-xl bg-cream px-4 py-2 text-xs font-semibold text-black hover:bg-[#FFB073]"
                                        >
                                            <PlusCircle className="h-3.5 w-3.5" />
                                            Plan Event
                                        </Link>
                                        <button
                                            onClick={() => handleDecline(req.id)}
                                            className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-2 text-xs font-medium text-ink hover:border-red-400"
                                        >
                                            <XCircle className="h-3.5 w-3.5" />
                                            Decline
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}