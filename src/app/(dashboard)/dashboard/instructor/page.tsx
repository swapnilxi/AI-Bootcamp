"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  BookOpen,
  ExternalLink,
  GraduationCap,
  Plus,
  Settings2,
  Users,
  Bell,
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  Sparkles,
  Phone,
  Mail,
  Video,
  LayoutGrid,
} from "lucide-react";
import type { ClassItem } from "@/features/courses";
import { EventDashboardPanel } from "@/features/events";
import { ProfileSectionsEditor } from "@/components/profile/ProfileSectionsEditor";
import type { ProfileSection } from "@/types/profileSections";

interface BookingItem {
  id: string;
  referenceCode: string;
  serviceTitle: string;
  scheduledAt: string;
  durationMinutes: number;
  status: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientNotes: string | null;
  meetingLink: string | null;
  instructorId?: string | null;
}

export default function InstructorDashboardPage() {
  const { data: session } = useSession();
  const [classes, setClasses] = useState<any[]>([]);
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [nudging, setNudging] = useState(false);
  const [nudgeMessage, setNudgeMessage] = useState<string | null>(null);
  const [nudgesRemaining, setNudgesRemaining] = useState<number | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [classRes, bookRes, profRes] = await Promise.all([
        fetch("/api/courses?filter=teaching"),
        fetch("/api/bookings"),
        fetch("/api/profile"),
      ]);

      if (classRes.ok) {
        const cData = await classRes.json();
        setClasses(cData.classes || []);
      }
      if (bookRes.ok) {
        const bData = await bookRes.json();
        setBookings(bData.bookings || []);
      }
      if (profRes.ok) {
        const pData = await profRes.json();
        setProfile(pData.user || null);
        if (pData.user?.approvalNudgesCount !== undefined) {
          setNudgesRemaining(Math.max(0, 3 - (pData.user.approvalNudgesCount || 0)));
        }
      }
    } catch (err) {
      console.error("Failed to load dashboard data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const [bookingBusy, setBookingBusy] = useState<string | null>(null);

  // Mentors act on the bookings assigned to them: confirm, decline or mark complete
  const actOnBooking = async (b: BookingItem, action: "approve" | "decline" | "complete") => {
    const body: Record<string, unknown> = { action };
    if (action === "approve") {
      const link = window.prompt("Meeting link for this session (optional):", b.meetingLink || "");
      if (link === null) return;
      if (link.trim()) body.meetingLink = link.trim();
      body.channels = ["EMAIL"];
    } else if (action === "decline") {
      const reason = window.prompt("Reason for declining (shared with the client, optional):");
      if (reason === null) return;
      if (reason.trim()) body.reason = reason.trim();
      body.channels = ["EMAIL"];
    }
    setBookingBusy(b.id);
    try {
      const res = await fetch(`/api/bookings/${b.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) alert(data.error || "Could not update the booking");
      else await loadData();
    } finally {
      setBookingBusy(null);
    }
  };

  const handleNudgeAdmin = async () => {
    setNudging(true);
    setNudgeMessage(null);
    try {
      const res = await fetch("/api/instructors/nudge-approval", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setNudgeMessage(data.message || "Notification sent to academy administration.");
        setNudgesRemaining(data.nudgesRemaining);
      } else {
        alert(data.error || "Failed to notify admin");
      }
    } catch (err: any) {
      alert(err.message || "Network error");
    } finally {
      setNudging(false);
    }
  };

  const totalStudents = classes.reduce((sum, c) => sum + (c.enrollmentCount || 0), 0);
  const totalLessons = classes.reduce((sum, c) => sum + (c.lessonCount || 0), 0);
  const isPending = profile?.approvalStatus === "PENDING";
  const isApproved = profile?.approvalStatus === "APPROVED";
  const isRejected = profile?.approvalStatus === "REJECTED";

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      {/* Top Welcome Banner */}
      <div className="p-8 sm:p-10 rounded-3xl bg-[linear-gradient(135deg,#21140f_0%,#141417_55%,#0f0f12_100%)] border border-cream/25 flex flex-col md:flex-row md:items-end justify-between gap-6 shadow-2xl">
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-text-muted font-semibold">
              <GraduationCap className="w-4 h-4" /> Teaching & Healing Studio
            </span>

            {isApproved && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Profile Active
              </span>
            )}
            {isPending && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-cream/15 text-cream border border-cream/30 flex items-center gap-1">
                <Clock className="w-3 h-3" /> Under Review
              </span>
            )}
            {isRejected && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-red-500/15 text-red-300 border border-red-500/30 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Revision Needed
              </span>
            )}
          </div>

          <h1 className="font-serif text-3xl sm:text-5xl text-ink">
            Welcome, {session?.user?.name?.split(" ")[0] || "Mentor"}
          </h1>
          <p className="text-text-muted max-w-xl text-sm sm:text-base">
            Author classes, review enrolled learners, and manage your private 1:1 session sessions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <Link
            href="/courses/new"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-cream hover:bg-cream/90 text-black text-xs font-semibold uppercase tracking-wider transition-colors shadow-md"
          >
            <Plus className="w-4 h-4" /> Create Class
          </Link>
          <a
            href="#profile-sections"
            className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-black-raised hover:border-cream/40 border border-cream/30 text-cream text-xs font-semibold uppercase tracking-wider transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Profile Sections
          </a>
          <Link
            href="/profile"
            className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-black-raised hover:border-gold/40 border border-white/10 text-ink text-xs font-semibold uppercase tracking-wider transition-colors"
          >
            <Settings2 className="w-4 h-4" /> Edit Profile
          </Link>
        </div>
      </div>

      {/* Expedited Review Alert Banner for Pending Instructors */}
      {isPending && (
        <div className="p-6 rounded-2xl bg-cream/10 border border-cream/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-cream text-sm font-semibold">
              <Clock className="w-4 h-4 shrink-0" />
              <span>Mentor Profile Under Administration Review</span>
            </div>
            <p className="text-xs text-text-muted max-w-xl">
              Your profile and credentials are being reviewed by academy administration before public listing.
              You can notify administration up to 3 times per day to request expedited review.
            </p>
            {nudgeMessage && (
              <p className="text-xs text-emerald-400 font-medium pt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{nudgeMessage}</span>
              </p>
            )}
          </div>

          <button
            onClick={handleNudgeAdmin}
            disabled={nudging || (nudgesRemaining !== null && nudgesRemaining <= 0)}
            className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black text-xs font-semibold shadow-md transition-colors flex items-center gap-2 shrink-0 disabled:opacity-50"
          >
            <Bell className="w-4 h-4" />
            <span>
              {nudging
                ? "Notifying Admin…"
                : nudgesRemaining !== null && nudgesRemaining <= 0
                  ? "Daily Alert Limit Reached (3/3)"
                  : `Notify Admin for Faster Review (${nudgesRemaining ?? 3} left today)`}
            </span>
          </button>
        </div>
      )}

      {/* Rejection Notice if any */}
      {isRejected && (
        <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/30 space-y-2 text-xs text-red-300">
          <div className="flex items-center gap-2 font-semibold text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Application Update: Profile Modification Requested</span>
          </div>
          <p>
            Administration requested revisions: {profile?.rejectionReason || "Please verify your bio and credentials."}
          </p>
          <Link
            href="/profile"
            className="inline-block text-cream hover:underline font-semibold pt-1"
          >
            Update Profile & Resubmit →
          </Link>
        </div>
      )}

      {/* Studio KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Classes Taught", value: classes.length, icon: BookOpen },
          { label: "Curriculum Lessons", value: totalLessons, icon: GraduationCap },
          { label: "Private 1:1 Sessions", value: bookings.length, icon: Users },
        ].map(({ label, value, icon: StatIcon }) => (
          <div key={label} className="p-6 rounded-2xl bg-black-raised/80 backdrop-blur-sm border border-white/[0.07]">
            <StatIcon className="w-5 h-5 text-cream mb-3" />
            <div className="font-serif text-3xl text-ink">{loading ? "–" : value}</div>
            <div className="text-xs uppercase tracking-wider text-text-muted mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* SECTION 1: Assigned Private 1:1 Sessions */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-white/[0.07] pb-3">
          <div>
            <h2 className="font-serif text-2xl text-ink">Assigned Private Sessions ({bookings.length})</h2>
            <p className="text-xs text-text-muted">
              Learners who have booked 1:1 sessions directly with you
            </p>
          </div>
        </div>

        {loading ? (
          <p className="text-xs text-text-muted">Loading your schedule…</p>
        ) : bookings.length === 0 ? (
          <div className="p-8 rounded-2xl border border-dashed border-white/10 text-center space-y-2">
            <Calendar className="w-8 h-8 text-cream/40 mx-auto" />
            <p className="text-sm text-text-muted">No private sessions booked yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-white/[0.07] bg-black-raised/80 backdrop-blur-sm">
            <table className="w-full text-xs">
              <thead className="text-left uppercase tracking-wider text-text-muted border-b border-white/[0.07]">
                <tr>
                  <th className="py-3 px-5">Client</th>
                  <th className="py-3 px-5">Service</th>
                  <th className="py-3 px-5">Date & Time</th>
                  <th className="py-3 px-5">Status</th>
                  <th className="py-3 px-5 text-right">Connect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 px-5">
                      <p className="font-medium text-ink text-sm">{b.clientName}</p>
                      <p className="text-[11px] text-text-muted flex items-center gap-2 pt-0.5">
                        <span>{b.clientEmail}</span>
                        <span>•</span>
                        <span>{b.clientPhone}</span>
                      </p>
                    </td>
                    <td className="py-4 px-5">
                      <p className="text-ink">{b.serviceTitle}</p>
                      <p className="font-mono text-cream/80 text-[10px]">{b.referenceCode}</p>
                    </td>
                    <td className="py-4 px-5 text-text-muted">
                      {new Date(b.scheduledAt).toLocaleString(undefined, {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="py-4 px-5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${b.status === "CONFIRMED"
                            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                            : b.status === "PENDING"
                              ? "bg-cream/15 text-cream border border-cream/30"
                              : "bg-white/5 text-text-muted"
                          }`}
                      >
                        {b.status}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-right space-y-2">
                      {b.instructorId === session?.user?.id && (
                        <div className="flex items-center justify-end gap-2">
                          {b.status === "PENDING" && (
                            <>
                              <button
                                onClick={() => actOnBooking(b, "approve")}
                                disabled={bookingBusy === b.id}
                                className="px-3 py-1.5 min-h-0 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[11px] font-semibold hover:bg-emerald-500/25 disabled:opacity-50"
                              >
                                Confirm
                              </button>
                              <button
                                onClick={() => actOnBooking(b, "decline")}
                                disabled={bookingBusy === b.id}
                                className="px-3 py-1.5 min-h-0 rounded-full bg-red-500/10 text-red-300 border border-red-500/30 text-[11px] font-semibold hover:bg-red-500/20 disabled:opacity-50"
                              >
                                Decline
                              </button>
                            </>
                          )}
                          {(b.status === "CONFIRMED" || b.status === "RESCHEDULED") && (
                            <button
                              onClick={() => actOnBooking(b, "complete")}
                              disabled={bookingBusy === b.id}
                              className="px-3 py-1.5 min-h-0 rounded-full bg-cream/10 text-cream border border-cream/30 text-[11px] font-semibold hover:bg-cream/20 disabled:opacity-50"
                            >
                              Mark Complete
                            </button>
                          )}
                        </div>
                      )}
                      {b.meetingLink ? (
                        <a
                          href={b.meetingLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cream/10 hover:bg-cream/20 text-cream text-xs font-medium border border-cream/30 transition-colors"
                        >
                          <Video className="w-3.5 h-3.5" />
                          <span>Join Room</span>
                        </a>
                      ) : (
                        <span className="text-[11px] text-text-muted">Pending Link</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* SECTION 2: Classes Created by Instructor */}
      <section className="space-y-4">
        <h2 className="font-serif text-2xl text-ink">Your Classes & Curricula</h2>
        {loading ? (
          <p className="text-sm text-text-muted">Loading your classes…</p>
        ) : classes.length === 0 ? (
          <div className="p-10 rounded-2xl border border-dashed border-white/10 text-center space-y-3">
            <p className="text-sm text-text-muted">You aren&apos;t teaching any classes yet.</p>
            <Link
              href="/courses/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cream hover:bg-cream/90 text-black text-xs font-semibold transition-colors"
            >
              <Plus className="w-4 h-4" /> Create your first class
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-white/[0.07] bg-black-raised/80 backdrop-blur-sm">
            <table className="w-full text-sm">
              <thead className="text-left text-[11px] uppercase tracking-wider text-text-muted border-b border-white/[0.07]">
                <tr>
                  <th className="py-3 px-5">Class</th>
                  <th className="py-3 px-5">Lessons</th>
                  <th className="py-3 px-5">Review Status</th>
                  <th className="py-3 px-5">Students</th>
                  <th className="py-3 px-5">Schedule</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {classes.map((c) => (
                  <tr key={c.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 px-5 font-medium text-ink">{c.title}</td>
                    <td className="py-4 px-5 text-text-muted">
                      {c.lessonCount ? c.lessonCount : <span className="text-text-muted text-xs">No lessons</span>}
                    </td>
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {c.approvalStatus === "APPROVED" ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            Approved
                          </span>
                        ) : c.approvalStatus === "REJECTED" ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-500/15 text-red-300 border border-red-500/30">
                            Declined
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cream/15 text-cream border border-cream/30">
                            Under Review
                          </span>
                        )}

                        {c.isPublished && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cream/15 text-cream border border-cream/30">
                            Published
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-5 text-text-muted">{c.enrollmentCount || 0}</td>
                    <td className="py-4 px-5 text-text-muted text-xs">
                      {new Date(c.schedule).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-5">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/courses/${c.id}`}
                          className="p-2 min-h-0 rounded-lg text-text-muted hover:text-cream transition-colors"
                          title="View class"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                        <Link
                          href={`/courses/${c.id}/edit#lessons`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-0 rounded-full border border-cream/30 text-cream text-xs font-semibold hover:bg-cream/10 transition-colors"
                        >
                          <Settings2 className="w-3.5 h-3.5" /> Manage
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* SECTION 3: Events & Community Requests */}
      <EventDashboardPanel />

      {/* SECTION 4: Profile Sections Editor */}
      {profile && (
        <section id="profile-sections" className="space-y-4 pt-2 scroll-mt-24">
          <div className="p-6 sm:p-8 rounded-3xl bg-[linear-gradient(135deg,#0e0e12_0%,#141417_100%)] border border-cream/15">
            <ProfileSectionsEditor
              instructorId={profile.id}
              initialSections={(() => {
                try {
                  return JSON.parse(profile.profileSections || "[]") as ProfileSection[];
                } catch {
                  return [];
                }
              })()}
              onSaved={(sections) => {
                setProfile((prev: any) => prev ? { ...prev, profileSections: JSON.stringify(sections) } : prev);
              }}
            />
          </div>
        </section>
      )}
    </div>
  );
}
