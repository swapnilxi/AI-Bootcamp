"use client";

import React, { useState } from "react";
import { CheckCircle2, XCircle, Loader2, ShieldCheck } from "lucide-react";
import { EVENT_ROUTES } from "../routes";
import type { EventDetail } from "../types";

interface EventApprovalPanelProps {
    event: EventDetail;
    onUpdated: () => void | Promise<void>;
}

/**
 * Admin controls for gating an event. Approving publishes it to members and
 * triggers notifications to the host and, when relevant, the member who
 * requested the event.
 */
export function EventApprovalPanel({ event, onUpdated }: EventApprovalPanelProps) {
    const [busy, setBusy] = useState<null | "approve" | "reject">(null);
    const [reason, setReason] = useState("");
    const [showReject, setShowReject] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    async function decide(approvalStatus: "APPROVED" | "REJECTED") {
        if (approvalStatus === "REJECTED" && !reason.trim()) {
            setError("Please give a reason so the host knows what to change.");
            return;
        }
        setError(null);
        setMessage(null);
        setBusy(approvalStatus === "APPROVED" ? "approve" : "reject");

        try {
            const res = await fetch(EVENT_ROUTES.approval(event.id), {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    approvalStatus,
                    rejectionReason: approvalStatus === "REJECTED" ? reason.trim() : null,
                }),
            });
            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                setError(data.error || "Could not update the event");
                return;
            }
            setMessage(
                approvalStatus === "APPROVED"
                    ? "Approved — the event is now visible to members and the host has been notified."
                    : "Rejected — the host has been notified with your reason."
            );
            setShowReject(false);
            setReason("");
            await onUpdated();
        } catch {
            setError("An unexpected error occurred");
        } finally {
            setBusy(null);
        }
    }

    return (
        <section className="rounded-2xl border border-cream/15 bg-cream/5 p-6">
            <div className="mb-4 flex items-center gap-2.5">
                <ShieldCheck className="h-5 w-5 text-text-muted" />
                <h2 className="font-serif text-lg text-ink">Review queue</h2>
            </div>

            <p className="mb-5 text-sm text-ink/65">
                Members only see an event once it has been approved. Approving also notifies the host
                {event.originRequestId ? " and the member who requested it" : ""}.
            </p>

            <div className="mb-5 rounded-xl border border-white/[0.07] bg-black/20 p-4">
                <p className="text-xs uppercase tracking-wide text-ink/50">Current status</p>
                <p className="mt-1.5 font-semibold text-ink">
                    {event.approvalStatus === "APPROVED" ? "Approved & published" : "Awaiting approval"}
                </p>
                {event.rejectionReason && event.approvalStatus === "REJECTED" && (
                    <p className="mt-2 text-sm text-ink/60">Reason: {event.rejectionReason}</p>
                )}
            </div>

            {error && (
                <p role="alert" className="mb-4 text-sm text-red-300">
                    {error}
                </p>
            )}
            {message && <p className="mb-4 text-sm text-emerald-300">{message}</p>}

            {!showReject ? (
                <div className="flex flex-wrap gap-3">
                    <button
                        type="button"
                        onClick={() => decide("APPROVED")}
                        disabled={busy !== null}
                        className="inline-flex items-center gap-2 rounded-xl bg-cream px-6 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-cream/90 disabled:opacity-60"
                    >
                        {busy === "approve" ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <CheckCircle2 className="h-4 w-4" />
                        )}
                        Approve & Publish
                    </button>

                    {event.approvalStatus !== "REJECTED" && (
                        <button
                            type="button"
                            onClick={() => setShowReject(true)}
                            disabled={busy !== null}
                            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-6 py-2.5 text-sm font-medium text-ink transition-colors hover:border-red-400/60 disabled:opacity-60"
                        >
                            <XCircle className="h-4 w-4" />
                            Reject
                        </button>
                    )}
                </div>
            ) : (
                <div className="space-y-3">
                    <label htmlFor="reject-reason" className="block text-sm text-ink/70">
                        Reason for rejection (shared with the host)
                    </label>
                    <textarea
                        id="reject-reason"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        rows={3}
                        maxLength={1000}
                        placeholder="e.g. Please add a clear description of what attendees will experience."
                        className="w-full rounded-xl border border-white/10 bg-black-raised px-4 py-3 text-sm text-ink placeholder-ink/40 focus:border-gold focus:outline-none"
                    />
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={() => decide("REJECTED")}
                            disabled={busy !== null}
                            className="inline-flex items-center gap-2 rounded-xl bg-red-500/90 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-500 disabled:opacity-60"
                        >
                            {busy === "reject" && <Loader2 className="h-4 w-4 animate-spin" />}
                            Confirm rejection
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setShowReject(false);
                                setReason("");
                                setError(null);
                            }}
                            className="rounded-xl border border-white/10 px-6 py-2.5 text-sm font-medium text-ink transition-colors hover:border-gold/60"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </section>
    );
}