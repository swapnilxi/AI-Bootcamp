"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
    Plus,
    Lightbulb,
    Loader2,
    CheckCircle2,
    XCircle,
    CalendarPlus,
    AlertCircle,
    ExternalLink,
    Hourglass,
} from "lucide-react";
import { useEvents, useEventRequests, EVENT_ROUTES, formatEventDate } from "../index";
import { Button } from "@/components/ui/Button";

type Tab = "hosting" | "pending" | "requests";

const TABS: { value: Tab; label: string }[] = [
    { value: "hosting", label: "My Events" },
    { value: "pending", label: "Awaiting Approval" },
    { value: "requests", label: "Member Requests" },
];

/**
 * Staff workspace for events. Instructors see their own events and the requests
 * tagged to them; admins additionally see the whole review queue.
 */
export function EventDashboardPanel() {
    const router = useRouter();
    const { data: session } = useSession();
    const [tab, setTab] = useState<Tab>("hosting");
    const isAdmin = session?.user?.role === "ADMIN" || session?.user?.role === "SUPER_ADMIN";

    const hosting = useEvents("hosting");
    const pending = useEvents("pending");
    const requests = useEventRequests(isAdmin ? "all" : "tagged");

    const active = tab === "hosting" ? hosting : tab === "pending" ? pending : null;

    return (
        <section className="rounded-2xl border border-mist bg-black-raised/30 p-6 sm:p-8">
            <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <h2 className="font-serif text-2xl text-ink">Events</h2>
                    <p className="mt-1 text-sm text-ink/60">
                        {isAdmin
                            ? "Review submissions and plan what members have been asking for."
                            : "Host gatherings and pick up requests from members."}
                    </p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <Button href="/events/new" variant="primary" size="sm">
                        <Plus className="mr-1 h-4 w-4" />
                        <span>Host an Event</span>
                    </Button>
                </div>
            </div>

            {/* Tabs */}
            <div className="mb-6 flex flex-wrap gap-2">
                {TABS.filter((t) => isAdmin || t.value !== "pending").map((t) => (
                    <button
                        key={t.value}
                        onClick={() => setTab(t.value)}
                        className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${tab === t.value
                                ? "bg-gold text-black shadow-sm"
                                : "border border-white/[0.07] bg-black-raised/80 text-ink hover:border-gold"
                            }`}
                    >
                        {t.label}
                        {t.value === "pending" && pending.events.length > 0 && (
                            <span className="ml-2 rounded-full bg-black/20 px-2 py-0.5 text-[10px]">
                                {pending.events.length}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Requests tab */}
            {tab === "requests" ? (
                <RequestList
                    requests={requests.requests}
                    loading={requests.loading}
                    error={requests.error}
                    canPlan
                    onChanged={requests.refetch}
                />
            ) : active?.loading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-5 w-5 animate-spin text-text-muted" />
                </div>
            ) : active?.error ? (
                <p className="py-8 text-center text-sm text-red-300">{active.error}</p>
            ) : active?.events.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-12 text-center">
                    <AlertCircle className="h-6 w-6 text-ink/40" />
                    <p className="text-sm text-ink/60">
                        {tab === "pending"
                            ? "Nothing waiting for approval."
                            : "You are not hosting any upcoming events."}
                    </p>
                </div>
            ) : (
                <ul className="space-y-3">
                    {active?.events.map((event) => (
                        <EventRow key={event.id} event={event} isAdmin={!!isAdmin} />
                    ))}
                </ul>
            )}
        </section>
    );
}

function EventRow({
    event,
    isAdmin,
}: {
    event: {
        id: string;
        title: string;
        category: string;
        startsAt: string | Date;
        approvalStatus: string;
        interestCount: number;
        host?: { name?: string | null } | null;
    };
    isAdmin: boolean;
}) {
    const router = useRouter();
    const [busy, setBusy] = useState<null | "approve" | "reject">(null);
    const [error, setError] = useState<string | null>(null);

    async function decide(status: "APPROVED" | "REJECTED") {
        setBusy(status === "APPROVED" ? "approve" : "reject");
        setError(null);
        try {
            const res = await fetch(EVENT_ROUTES.approval(event.id), {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    approvalStatus: status,
                    rejectionReason: status === "REJECTED" ? "Please refine the event details and resubmit." : null,
                }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                setError(data.error || "Could not update");
                return;
            }
            router.refresh();
        } catch {
            setError("An unexpected error occurred");
        } finally {
            setBusy(null);
        }
    }

    const isPending = event.approvalStatus === "PENDING";

    return (
        <li className="rounded-xl border border-white/[0.06] bg-black/20 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                    <Link
                        href={`/events/${event.id}`}
                        className="block truncate font-medium text-ink transition-colors hover:text-gold"
                    >
                        {event.title}
                    </Link>
                    <p className="mt-1 text-xs text-ink/50">
                        {event.category} · {formatEventDate(event.startsAt)} · {event.interestCount} interested
                        {isPending && " · not visible to members yet"}
                    </p>
                    {error && <p className="mt-1 text-xs text-red-300">{error}</p>}
                </div>

                <div className="flex shrink-0 gap-2">
                    {isAdmin && isPending && (
                        <>
                            <button
                                onClick={() => decide("APPROVED")}
                                disabled={busy !== null}
                                aria-label={`Approve ${event.title}`}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-cream px-3 py-2 text-xs font-semibold text-black transition-colors hover:bg-cream/90 disabled:opacity-60"
                            >
                                {busy === "approve" ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                )}
                                Approve
                            </button>
                            <button
                                onClick={() => decide("REJECTED")}
                                disabled={busy !== null}
                                aria-label={`Reject ${event.title}`}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-ink transition-colors hover:border-red-400/60 disabled:opacity-60"
                            >
                                {busy === "reject" ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                    <XCircle className="h-3.5 w-3.5" />
                                )}
                                Reject
                            </button>
                        </>
                    )}
                    {isPending && !isAdmin && (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-cream/20 bg-cream/8 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-text">
                            <Hourglass className="h-3 w-3" /> Awaiting approval
                        </span>
                    )}
                    <Link
                        href={`/events/${event.id}`}
                        aria-label={`Open ${event.title}`}
                        className="inline-flex items-center rounded-lg border border-white/10 px-3 py-2 text-ink transition-colors hover:border-gold/60"
                    >
                        <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                </div>
            </div>
        </li>
    );
}

/** Community requests assigned to this member of staff, with a "plan it" action. */
function RequestList({
    requests,
    loading,
    error,
    canPlan,
    onChanged,
}: {
    requests: import("../types").EventRequestSummary[];
    loading: boolean;
    error: string | null;
    canPlan: boolean;
    onChanged: () => void;
}) {
    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-5 w-5 animate-spin text-text-muted" />
            </div>
        );
    }
    if (error) return <p className="py-8 text-center text-sm text-red-300">{error}</p>;
    if (requests.length === 0) {
        return (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
                <Lightbulb className="h-6 w-6 text-ink/40" />
                <p className="text-sm text-ink/60">No open requests assigned to you.</p>
            </div>
        );
    }

    return (
        <ul className="space-y-3">
            {requests.map((request) => (
                <li key={request.id} className="rounded-xl border border-white/[0.06] bg-black/20 p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                            <p className="font-medium text-ink">{request.title}</p>
                            <p className="mt-1.5 line-clamp-2 text-sm text-ink/60">{request.details}</p>
                            <p className="mt-2 text-xs text-ink/45">
                                From {request.requester?.name || "a member"}
                                {request.proposedDate ? ` · suggested ${formatEventDate(request.proposedDate)}` : ""}
                            </p>
                            {request.eventId && (
                                <Link
                                    href={`/events/${request.eventId}`}
                                    className="mt-2 inline-flex items-center gap-1 text-xs text-text hover:underline"
                                >
                                    Event planned <ExternalLink className="h-3 w-3" />
                                </Link>
                            )}
                        </div>

                        <div className="flex shrink-0 items-center gap-2">
                            <span
                                className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${request.status === "OPEN"
                                        ? "border-cream/20 bg-cream/8 text-text"
                                        : request.status === "PLANNED"
                                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                                            : "border-white/10 bg-white/[0.04] text-ink/50"
                                    }`}
                            >
                                {request.status === "OPEN" ? "Open" : request.status === "PLANNED" ? "Planned" : "Declined"}
                            </span>

                            {canPlan && request.status === "OPEN" && !request.eventId && (
                                <Link
                                    href={`/events/new?requestId=${request.id}`}
                                    className="inline-flex items-center gap-1.5 rounded-lg bg-cream px-3 py-2 text-xs font-semibold text-black transition-colors hover:bg-cream/90"
                                >
                                    <CalendarPlus className="h-3.5 w-3.5" />
                                    Plan it
                                </Link>
                            )}
                        </div>
                    </div>
                </li>
            ))}
        </ul>
    );
}