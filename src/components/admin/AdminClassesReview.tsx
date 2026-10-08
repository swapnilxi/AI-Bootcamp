"use client";

import React, { useState, useEffect } from "react";
import {
  BookOpen,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp,
  GraduationCap,
  Eye,
  EyeOff,
  AlertTriangle,
  ExternalLink,
  ShieldAlert,
} from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/ui/Toast";

interface LessonReview {
  id: string;
  title: string;
  summary: string | null;
  order: number;
  durationMinutes: number | null;
  isPreview: boolean;
  approvalStatus: string;
  rejectionReason: string | null;
}

interface ClassReview {
  id: string;
  title: string;
  slug: string;
  description: string;
  schedule: string;
  durationMinutes: number;
  price: number;
  isSubscriberOnly: boolean;
  isPasswordProtected: boolean;
  approvalStatus: string;
  isPublished: boolean;
  rejectionReason: string | null;
  instructor: {
    id: string;
    name: string | null;
    email?: string;
    avatarUrl: string | null;
    mentorType?: string | null;
    role: string;
  };
  lessons: LessonReview[];
  _count: {
    enrollments: number;
    lessons: number;
  };
}

export function AdminClassesReview() {
  const [classes, setClasses] = useState<ClassReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedClassId, setExpandedClassId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const toast = useToast();

  // Rejecting module state
  const [rejectingModule, setRejectingModule] = useState<{
    courseId: string;
    lessonId: string;
    lessonTitle: string;
  } | null>(null);
  const [moduleRejectionReason, setModuleRejectionReason] = useState("");

  const loadClasses = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/classes");
      if (res.ok) {
        const data = await res.json();
        setClasses(data.classes || []);
      }
    } catch (err) {
      console.error("Failed to load classes for review", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClasses();
  }, []);

  const updateClassApproval = async (
    courseId: string,
    params: {
      approvalStatus?: "APPROVED" | "REJECTED" | "PENDING";
      isPublished?: boolean;
      rejectionReason?: string | null;
      modules?: Array<{ id: string; approvalStatus: "APPROVED" | "REJECTED" | "PENDING"; rejectionReason?: string | null }>;
    }
  ) => {
    setBusyId(courseId);
    try {
      const res = await fetch(`/api/admin/classes/${courseId}/approval`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });

      if (res.ok) {
        toast.success("Curriculum review status updated successfully");
        await loadClasses();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to update review status");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to update review status");
    } finally {
      setBusyId(null);
    }
  };

  const handleModuleAction = async (
    courseId: string,
    lessonId: string,
    approvalStatus: "APPROVED" | "REJECTED",
    reason?: string
  ) => {
    await updateClassApproval(courseId, {
      modules: [
        {
          id: lessonId,
          approvalStatus,
          rejectionReason: reason || (approvalStatus === "REJECTED" ? "Module standards not met" : null),
        },
      ],
    });
    setRejectingModule(null);
    setModuleRejectionReason("");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl text-ink">
            Curriculum & Class Review ({classes.length})
          </h2>
          <p className="text-xs text-text-muted">
            Approve submitted courses, toggle academy publication, or selectively reject individual modules
          </p>
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center space-y-3">
          <Sparkles className="w-8 h-8 text-gold animate-spin mx-auto" />
          <p className="text-xs text-text-muted">Loading curriculum submissions…</p>
        </div>
      ) : classes.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-white/10 space-y-2">
          <BookOpen className="w-8 h-8 text-cream/30 mx-auto" />
          <p className="text-sm text-text-muted">No classes submitted for review yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {classes.map((cls) => {
            const isExpanded = expandedClassId === cls.id;
            const isPending = cls.approvalStatus === "PENDING";
            const isApproved = cls.approvalStatus === "APPROVED";
            const isRejected = cls.approvalStatus === "REJECTED";

            const pendingLessonsCount = cls.lessons.filter((l) => l.approvalStatus === "PENDING").length;
            const rejectedLessonsCount = cls.lessons.filter((l) => l.approvalStatus === "REJECTED").length;

            return (
              <div
                key={cls.id}
                className="rounded-2xl bg-black-raised/80 border border-white/[0.08] hover:border-gold/30 transition-all overflow-hidden"
              >
                {/* Class Main Banner */}
                <div className="p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-serif text-xl text-ink font-medium">
                        {cls.title}
                      </h3>

                      {/* Class Status Badges */}
                      {isPending && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-cream/15 text-cream border border-cream/30 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Class Pending Approval
                        </span>
                      )}
                      {isApproved && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Approved
                        </span>
                      )}
                      {isRejected && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-red-500/15 text-red-300 border border-red-500/30 flex items-center gap-1">
                          <XCircle className="w-3 h-3" /> Declined
                        </span>
                      )}

                      {/* Published State Badge */}
                      {cls.isPublished ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-cream/15 text-cream border border-cream/30 flex items-center gap-1">
                          <Eye className="w-3 h-3" /> Published in Academy
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-white/5 text-text-muted border border-white/10 flex items-center gap-1">
                          <EyeOff className="w-3 h-3" /> Unpublished / Draft
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-xs text-text-muted flex-wrap">
                      <span className="flex items-center gap-1.5 text-text-muted">
                        <GraduationCap className="w-3.5 h-3.5" />
                        <span>Instructor: {cls.instructor.name || "Mentor"}</span>
                      </span>
                      <span>•</span>
                      <span>Price: {cls.price === 0 ? "Free" : `$${cls.price} USD`}</span>
                      <span>•</span>
                      <span>{cls.lessons.length} Modules</span>
                      {pendingLessonsCount > 0 && (
                        <span className="text-cream font-medium">
                          ({pendingLessonsCount} module(s) pending review)
                        </span>
                      )}
                      {rejectedLessonsCount > 0 && (
                        <span className="text-red-400 font-medium">
                          ({rejectedLessonsCount} module(s) rejected)
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-text-muted line-clamp-2">{cls.description}</p>
                  </div>

                  {/* Actions for Class */}
                  <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                    <Link
                      href={`/courses/${cls.id}`}
                      target="_blank"
                      className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-text-muted hover:text-white border border-white/10 transition-colors"
                      title="Preview Course"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Link>

                    {/* Publish / Unpublish Toggle */}
                    <button
                      onClick={() =>
                        updateClassApproval(cls.id, {
                          isPublished: !cls.isPublished,
                        })
                      }
                      disabled={busyId === cls.id}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-colors flex items-center gap-1.5 ${
                        cls.isPublished
                          ? "bg-cream/10 text-cream border-cream/30 hover:bg-cream/20"
                          : "bg-cream/15 text-cream border-cream/30 hover:bg-cream/25"
                      }`}
                    >
                      {cls.isPublished ? (
                        <>
                          <EyeOff className="w-3.5 h-3.5" />
                          <span>Unpublish</span>
                        </>
                      ) : (
                        <>
                          <Eye className="w-3.5 h-3.5" />
                          <span>Publish to Academy</span>
                        </>
                      )}
                    </button>

                    {/* Overall Class Approval */}
                    {!isApproved && (
                      <button
                        onClick={() =>
                          updateClassApproval(cls.id, {
                            approvalStatus: "APPROVED",
                            isPublished: true,
                          })
                        }
                        disabled={busyId === cls.id}
                        className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#0C0B0A] text-xs font-semibold shadow-md transition-colors flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Approve Class</span>
                      </button>
                    )}

                    {/* Expand Curriculum Modules */}
                    <button
                      onClick={() => setExpandedClassId(isExpanded ? null : cls.id)}
                      className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-text-muted hover:text-white transition-colors flex items-center gap-1.5"
                    >
                      <span>Modules ({cls.lessons.length})</span>
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Modules Review Table */}
                {isExpanded && (
                  <div className="border-t border-white/[0.08] bg-black/40 p-5 sm:p-6 space-y-4 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs uppercase tracking-widest text-text-muted font-semibold">
                        Curriculum Modules & Lesson Approvals
                      </h4>
                      <p className="text-[11px] text-text-muted">
                        Publish the entire class while selectively approving or rejecting specific modules
                      </p>
                    </div>

                    {cls.lessons.length === 0 ? (
                      <p className="text-xs text-text-muted italic">No lessons in this class yet.</p>
                    ) : (
                      <div className="divide-y divide-white/[0.05] border border-white/10 rounded-xl overflow-hidden bg-black/30">
                        {cls.lessons.map((lesson, idx) => {
                          const isModApproved = lesson.approvalStatus === "APPROVED";
                          const isModRejected = lesson.approvalStatus === "REJECTED";
                          const isModPending = lesson.approvalStatus === "PENDING";

                          return (
                            <div
                              key={lesson.id}
                              className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors"
                            >
                              <div className="space-y-1 min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-mono text-[11px] text-text-muted">
                                    Module {idx + 1}:
                                  </span>
                                  <span className="font-medium text-ink text-sm">
                                    {lesson.title}
                                  </span>

                                  {lesson.isPreview && (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                      Free Preview
                                    </span>
                                  )}

                                  {/* Module Status Badge */}
                                  {isModApproved && (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                                      <CheckCircle2 className="w-3 h-3" /> Approved
                                    </span>
                                  )}
                                  {isModPending && (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cream/15 text-cream border border-cream/30 flex items-center gap-1">
                                      <Clock className="w-3 h-3" /> Pending Review
                                    </span>
                                  )}
                                  {isModRejected && (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-500/15 text-red-300 border border-red-500/30 flex items-center gap-1">
                                      <XCircle className="w-3 h-3" /> Rejected / Hidden
                                    </span>
                                  )}
                                </div>

                                {lesson.summary && (
                                  <p className="text-xs text-text-muted">{lesson.summary}</p>
                                )}

                                {isModRejected && lesson.rejectionReason && (
                                  <p className="text-xs text-red-400 bg-red-950/30 px-2.5 py-1 rounded-full border border-red-900/30 mt-1">
                                    Rejection Feedback: {lesson.rejectionReason}
                                  </p>
                                )}
                              </div>

                              {/* Per-module Action Buttons */}
                              <div className="flex items-center gap-2 shrink-0">
                                {!isModApproved && (
                                  <button
                                    onClick={() => handleModuleAction(cls.id, lesson.id, "APPROVED")}
                                    className="px-3 py-1.5 rounded-full bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-[#0C0B0A] border border-emerald-500/30 text-xs font-medium transition-all"
                                  >
                                    Approve Module
                                  </button>
                                )}

                                {!isModRejected && (
                                  <button
                                    onClick={() =>
                                      setRejectingModule({
                                        courseId: cls.id,
                                        lessonId: lesson.id,
                                        lessonTitle: lesson.title,
                                      })
                                    }
                                    className="px-3 py-1.5 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-medium transition-all"
                                  >
                                    Reject Module
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Reject Module Modal */}
      {rejectingModule && (
        <div data-lenis-prevent className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-[#141418] border border-white/10 rounded-2xl p-6 space-y-4 text-ink shadow-2xl">
            <h3 className="font-serif text-xl text-ink">
              Reject Module: {rejectingModule.lessonTitle}
            </h3>
            <p className="text-xs text-text-muted">
              Rejecting this module hides it from public students while keeping the rest of the course active.
              Provide feedback for the instructor so they can revise and resubmit this module.
            </p>

            <textarea
              rows={3}
              required
              placeholder="e.g. Video resolution is low; please update with clear audio and re-upload..."
              value={moduleRejectionReason}
              onChange={(e) => setModuleRejectionReason(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-ink focus:border-red-400 focus:outline-none resize-none"
            />

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  setRejectingModule(null);
                  setModuleRejectionReason("");
                }}
                className="px-4 py-2 rounded-xl border border-white/10 text-xs text-text-muted hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  handleModuleAction(
                    rejectingModule.courseId,
                    rejectingModule.lessonId,
                    "REJECTED",
                    moduleRejectionReason
                  )
                }
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold transition-colors shadow-md"
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
