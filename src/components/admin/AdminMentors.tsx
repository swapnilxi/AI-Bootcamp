"use client";

import React, { useState, useEffect } from "react";
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Sparkles,
  Search,
  Bell,
  UserCheck,
  UserX,
  Tag,
  Shield,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";

interface Mentor {
  id: string;
  name: string | null;
  email?: string;
  role: string;
  avatarUrl: string | null;
  bio: string | null;
  birthPlace: string | null;
  mentorType?: string | null;
  specialties?: string | null;
  sessionPrice: number;
  sessionDuration?: number | null;
  approvalStatus: string;
  rejectionReason: string | null;
  approvalNudgesCount: number;
  lastNudgedAt: string | null;
  createdAt: string;
  _count?: {
    createdCourses: number;
    assignedBookings: number;
  };
}

export function AdminMentors() {
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejectingMentor, setRejectingMentor] = useState<Mentor | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const loadMentors = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/instructors?status=${statusFilter}&type=${typeFilter}`);
      if (res.ok) {
        const data = await res.json();
        setMentors(data.mentors || []);
      }
    } catch (err) {
      console.error("Failed to load mentors", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMentors();
  }, [statusFilter, typeFilter]);

  const handleApproval = async (id: string, status: "APPROVED" | "REJECTED" | "PENDING", reason?: string) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/instructors/${id}/approval`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          rejectionReason: reason || undefined,
        }),
      });

      if (res.ok) {
        setToastMsg(`Mentor profile set to ${status}`);
        setTimeout(() => setToastMsg(null), 4000);
        setRejectingMentor(null);
        setRejectionReason("");
        await loadMentors();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to update mentor status");
      }
    } catch (e: any) {
      alert(e.message || "Failed to update mentor status");
    } finally {
      setBusyId(null);
    }
  };

  const filtered = mentors.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (p.name && p.name.toLowerCase().includes(q)) ||
      (p.email && p.email.toLowerCase().includes(q)) ||
      (p.specialties && p.specialties.toLowerCase().includes(q))
    );
  });

  const pendingCount = mentors.filter((p) => p.approvalStatus === "PENDING").length;

  return (
    <div className="space-y-6">
      {toastMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl text-ink">
            Instructors Roster ({mentors.length})
          </h2>
          <p className="text-xs text-text-muted">
            Manage verification, private booking rates, and mentor approval status
          </p>
        </div>

        {/* Filter Badges */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex p-1 rounded-xl bg-black/60 border border-white/10 text-xs">
            <button
              onClick={() => setStatusFilter("ALL")}
              className={`px-3 py-1.5 rounded-full transition-all ${
                statusFilter === "ALL" ? "bg-gold text-black font-semibold" : "text-text-muted hover:text-white"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter("PENDING")}
              className={`px-3 py-1.5 rounded-full transition-all flex items-center gap-1.5 ${
                statusFilter === "PENDING"
                  ? "bg-amber-400 text-black font-semibold"
                  : "text-text-muted hover:text-white"
              }`}
            >
              <span>Pending Review</span>
              {pendingCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-black text-amber-300 text-[10px] flex items-center justify-center font-bold">
                  {pendingCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setStatusFilter("APPROVED")}
              className={`px-3 py-1.5 rounded-full transition-all ${
                statusFilter === "APPROVED" ? "bg-emerald-400 text-black font-semibold" : "text-text-muted hover:text-white"
              }`}
            >
              Approved
            </button>
            <button
              onClick={() => setStatusFilter("REJECTED")}
              className={`px-3 py-1.5 rounded-full transition-all ${
                statusFilter === "REJECTED" ? "bg-red-400 text-black font-semibold" : "text-text-muted hover:text-white"
              }`}
            >
              Declined
            </button>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Filter by mentor name, email, or specialty..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-ink placeholder:text-text-muted focus:border-gold focus:outline-none"
        />
      </div>

      {/* Mentors List */}
      {loading ? (
        <div className="py-16 text-center space-y-3">
          <Sparkles className="w-8 h-8 text-gold animate-spin mx-auto" />
          <p className="text-xs text-text-muted">Loading faculty applications and profiles…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-white/10 space-y-2">
          <Shield className="w-8 h-8 text-gold/40 mx-auto" />
          <p className="text-sm text-text-muted">No instructors or mentors match the selected criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filtered.map((p) => {
            const isPending = p.approvalStatus === "PENDING";
            const isApproved = p.approvalStatus === "APPROVED";
            const isRejected = p.approvalStatus === "REJECTED";

            return (
              <div
                key={p.id}
                className="p-5 sm:p-6 rounded-2xl bg-black-raised/80 border border-white/[0.08] hover:border-gold/30 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-6"
              >
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  {p.avatarUrl ? (
                    <img
                      src={p.avatarUrl}
                      alt={p.name || "Mentor"}
                      className="w-16 h-16 rounded-2xl object-cover border border-gold/30 shrink-0 shadow-md"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-gold/10 border border-gold/30 text-gold flex items-center justify-center font-serif text-2xl font-bold shrink-0">
                      {p.name?.charAt(0) || "P"}
                    </div>
                  )}

                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-serif text-lg text-ink font-medium truncate">
                        {p.name || "Unnamed Mentor"}
                      </h3>

                      {/* Status badge */}
                      {isPending && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Pending Review
                        </span>
                      )}
                      {isApproved && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Approved & Public
                        </span>
                      )}
                      {isRejected && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-red-500/15 text-red-300 border border-red-500/30 flex items-center gap-1">
                          <XCircle className="w-3 h-3" /> Declined
                        </span>
                      )}

                      {/* Mentor type */}
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/5 text-text-muted border border-white/10">
                        {p.mentorType === "MENTOR"
                          ? "Energy Mentor"
                          : p.mentorType === "BOTH"
                          ? "Instructor & Mentor"
                          : "AI Engineering Instructor"}
                      </span>

                      {/* Expedited Review Nudges Indicator */}
                      {p.approvalNudgesCount > 0 && isPending && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/40 flex items-center gap-1 animate-pulse">
                          <Bell className="w-3 h-3" /> {p.approvalNudgesCount}x Nudge Requested
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-text-muted">
                      {p.email} • Session Rate: <strong className="text-gold">${p.sessionPrice} USD</strong> (
                      {p.sessionDuration || 60}m)
                    </p>

                    {p.specialties && (
                      <p className="text-xs text-ink/80 flex items-center gap-1.5 flex-wrap">
                        <Tag className="w-3 h-3 text-gold/70 shrink-0" />
                        <span>{p.specialties}</span>
                      </p>
                    )}

                    {isRejected && p.rejectionReason && (
                      <p className="text-xs text-red-300 bg-red-950/30 p-2 rounded-lg border border-red-800/30">
                        Rejection Note: {p.rejectionReason}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <Link
                    href={`/instructors/${p.id}`}
                    target="_blank"
                    className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-text-muted hover:text-white border border-white/10 transition-colors"
                    title="View public profile"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Link>

                  {isPending && (
                    <>
                      <button
                        onClick={() => handleApproval(p.id, "APPROVED")}
                        disabled={busyId === p.id}
                        className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-semibold shadow-md transition-colors flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <UserCheck className="w-4 h-4" />
                        <span>Approve Profile</span>
                      </button>

                      <button
                        onClick={() => setRejectingMentor(p)}
                        disabled={busyId === p.id}
                        className="px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-semibold transition-colors flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <UserX className="w-4 h-4" />
                        <span>Decline</span>
                      </button>
                    </>
                  )}

                  {isApproved && (
                    <button
                      onClick={() => setRejectingMentor(p)}
                      disabled={busyId === p.id}
                      className="px-3 py-2 rounded-xl bg-white/5 hover:bg-red-500/10 text-text-muted hover:text-red-400 border border-white/10 text-xs transition-colors"
                    >
                      Revoke Approval
                    </button>
                  )}

                  {isRejected && (
                    <button
                      onClick={() => handleApproval(p.id, "APPROVED")}
                      disabled={busyId === p.id}
                      className="px-4 py-2 rounded-xl bg-gold hover:bg-[#FFB073] text-black text-xs font-semibold transition-colors flex items-center gap-1.5"
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>Reinstate & Approve</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reject Modal with Reason */}
      {rejectingMentor && (
        <div data-lenis-prevent className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-[#141418] border border-white/10 rounded-2xl p-6 space-y-4 text-ink shadow-2xl">
            <h3 className="font-serif text-xl text-ink">
              Decline Application for {rejectingMentor.name}
            </h3>
            <p className="text-xs text-text-muted">
              Provide feedback or instructions explaining why this instructor/mentor profile was declined.
              This message will be dispatched to the applicant.
            </p>

            <textarea
              rows={4}
              required
              placeholder="e.g. Please provide additional lineage certificates or detailed bio before re-applying..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-ink focus:border-red-400 focus:outline-none resize-none"
            />

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  setRejectingMentor(null);
                  setRejectionReason("");
                }}
                className="px-4 py-2 rounded-xl border border-white/10 text-xs text-text-muted hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => handleApproval(rejectingMentor.id, "REJECTED", rejectionReason)}
                disabled={busyId === rejectingMentor.id}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold transition-colors shadow-md disabled:opacity-50"
              >
                Confirm Decline
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
