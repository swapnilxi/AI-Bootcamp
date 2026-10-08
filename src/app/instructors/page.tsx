"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  GraduationCap,
  Sparkles,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  Star,
  User,
  Compass,
  Calendar,
  HeartHandshake,
  Tag,
} from "lucide-react";
import { MentorBookingModal } from "@/features/booking";
import { InstructorAiChatModal } from "@/components/ai/InstructorAiChatModal";
import { Avatar } from "@/components/ui/Avatar";
import { SkeletonGrid } from "@/components/ui/Skeleton";

interface InstructorItem {
  id: string;
  name: string | null;
  role: string;
  avatarUrl: string | null;
  bio: string | null;
  mentorType?: string | null;
  specialties?: string | null;
  sessionPrice?: number | null;
  sessionDuration?: number | null;
  aiChatEnabled?: boolean;
  aiSystemPrompt?: string | null;
  aiChatStyle?: string | null;
  aiGreeting?: string | null;
  aiSampleQuestions?: string | null;
  _count: {
    createdCourses: number;
    assignedBookings?: number;
  };
  createdCourses: Array<{
    id: string;
    title: string;
    slug: string;
    price: number | string;
    durationMinutes: number;
  }>;
}

export default function InstructorsPage() {
  const { data: session } = useSession();
  const [instructors, setInstructors] = useState<InstructorItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<"ALL" | "INSTRUCTOR" | "MENTOR">("ALL");
  const [selectedMentor, setSelectedMentor] = useState<InstructorItem | null>(null);
  const [selectedAiInstructor, setSelectedAiInstructor] = useState<InstructorItem | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/instructors?type=${activeFilter}`)
      .then((res) => (res.ok ? res.json() : { instructors: [] }))
      .then((data) => setInstructors(data.instructors || []))
      .catch((err) => {
        console.error("Failed to load instructors", err);
        setInstructors([]);
      })
      .finally(() => setLoading(false));
  }, [activeFilter]);

  const getRoleTitle = (role: string, type?: string | null) => {
    if (type === "MENTOR") return "AI Engineering Mentor";
    if (type === "BOTH") return "Instructor & Mentor";
    switch (role) {
      case "SUPER_ADMIN":
        return "Master Instructor & Academy Head";
      case "ADMIN":
        return "Senior Faculty Instructor";
      case "INSTRUCTOR":
      default:
        return "Academy Faculty Instructor";
    }
  };

  const getBadgeColor = (type?: string | null) => {
    if (type === "MENTOR") {
      return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30";
    }
    if (type === "BOTH") {
      return "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30";
    }
    return "bg-orange-500/10 text-orange-700 dark:text-cream border-orange-500/30 dark:border-cream/20";
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 space-y-16">
      {/* Hero Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-500/10 dark:bg-cream/10 border border-orange-500/20 dark:border-cream/20 text-orange-600 dark:text-cream text-xs uppercase tracking-[0.2em] font-semibold">
          <GraduationCap className="w-4 h-4" />
          <span>Instructors & Mentors</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-5xl md:text-6xl text-ink font-normal tracking-tight">
          Guided by Authentic Instructors & Mentors
        </h1>
        <p className="text-text-muted text-base sm:text-lg leading-relaxed font-sans">
          Staff AI engineers and practitioners who build production systems, author our curriculum, and offer dedicated 1:1 mentorship sessions.
        </p>
      </div>

      {/* Become an Instructor or Mentor Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-500/5 via-amber-500/5 to-transparent dark:from-orange-950/30 dark:via-black-raised dark:to-black-raised border border-orange-500/20 dark:border-cream/20 p-8 sm:p-10 shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gold/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <span className="text-xs uppercase tracking-[0.2em] text-orange-600 dark:text-cream font-semibold flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> Join The Engineering Faculty & Mentorship Network
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl text-ink">
              Are You a Practicing Instructor or Mentor?
            </h2>
            <p className="text-text-muted text-sm sm:text-base leading-relaxed">
              Publish a course, mentor learners 1-on-1 and review capstone projects. Apply or activate your instructor profile at any time.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {session ? (
              session.user?.role === "INSTRUCTOR" || session.user?.role === "ADMIN" || session.user?.role === "SUPER_ADMIN" ? (
                <Link
                  href="/dashboard/instructor"
                  className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold text-sm transition-all shadow-md shadow-orange-500/20 flex items-center gap-2"
                >
                  <GraduationCap className="w-4 h-4" />
                  <span>Open Teaching Studio</span>
                </Link>
              ) : (
                <Link
                  href="/profile#instructor-activation"
                  className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold text-sm transition-all shadow-md shadow-orange-500/20 flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Activate Mentor Profile</span>
                </Link>
              )
            ) : (
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/register?role=instructor"
                  className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold text-sm transition-all shadow-md shadow-orange-500/20 flex items-center gap-2"
                >
                  <span>Register as Instructor / Mentor</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/login?role=instructor"
                  className="px-5 py-3.5 rounded-xl bg-black/[0.04] dark:bg-black-raised hover:border-gold/50 border border-black/10 dark:border-white/10 text-ink text-sm font-medium transition-colors"
                >
                  <span>Faculty Sign In</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Instructors & Mentors Directory */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.07] pb-4">
          <div>
            <h2 className="font-serif text-2xl text-ink">
              Mentor Directory ({instructors.length})
            </h2>
            <p className="text-xs text-text-muted mt-0.5">
              Verified Instructors & Mentors
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="inline-flex p-1 rounded-xl bg-black/5 dark:bg-black/60 border border-black/10 dark:border-white/10">
            <button
              onClick={() => setActiveFilter("ALL")}
              className={`px-3.5 py-1.5 rounded-full text-xs transition-all ${
                activeFilter === "ALL"
                  ? "bg-orange text-white shadow-md shadow-orange/20 font-semibold"
                  : "text-text-muted hover:text-ink"
              }`}
            >
              All Masters
            </button>
            <button
              onClick={() => setActiveFilter("INSTRUCTOR")}
              className={`px-3.5 py-1.5 rounded-full text-xs transition-all ${
                activeFilter === "INSTRUCTOR"
                  ? "bg-orange text-white shadow-md shadow-orange/20 font-semibold"
                  : "text-text-muted hover:text-ink"
              }`}
            >
              AI Engineering Instructors
            </button>
            <button
              onClick={() => setActiveFilter("MENTOR")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                activeFilter === "MENTOR"
                  ? "bg-emerald-600 dark:bg-emerald-500 text-white shadow-md font-semibold"
                  : "text-text-muted hover:text-ink"
              }`}
            >
              Mentors
            </button>
          </div>
        </div>

        {loading ? (
          <SkeletonGrid count={6} columns="md:grid-cols-2" variant="avatar" />
        ) : instructors.length === 0 ? (
          <div className="py-16 text-center rounded-2xl border border-dashed border-white/10 p-8 space-y-3">
            <Compass className="w-10 h-10 text-cream/60 mx-auto" />
            <h3 className="font-serif text-xl text-ink">No mentors in this category</h3>
            <p className="text-sm text-text-muted">
              Try switching your filter tab above to view all verified faculty.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
            {instructors.map((inst) => {
              const specialtiesList = inst.specialties
                ? inst.specialties.split(",").map((s) => s.trim())
                : [];

              return (
                <div
                  key={inst.id}
                  className="editorial-card rounded-2xl p-6 sm:p-7 flex flex-col justify-between border border-white/[0.08] hover:border-gold/50 transition-all duration-300 group relative overflow-hidden"
                >
                  {/* Stretched link: makes the whole card a real, middle-click/open-in-new-tab-able
                      link, without nesting it around the buttons below (invalid HTML). */}
                  <Link
                    href={`/instructors/${inst.id}`}
                    aria-label={`View ${inst.name || "mentor"}'s profile`}
                    className="absolute inset-0 z-0 focus:outline-none focus-visible:ring-1 focus-visible:ring-gold/40"
                  />

                  {/* Top-Right Pill: Chat with AI version */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedAiInstructor(inst);
                    }}
                    className="group/ai absolute top-4 right-4 px-3 py-1.5 rounded-full bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/25 hover:border-purple-400 text-purple-700 dark:text-purple-300 hover:text-purple-900 dark:hover:text-white transition-all shadow-sm z-10 flex items-center gap-1.5"
                    aria-label="Chat with AI version"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-300 group-hover/ai:rotate-12 transition-transform animate-pulse" />
                    <span className="text-[11px] font-semibold text-purple-700 dark:text-purple-200 hidden sm:inline">AI Twin</span>
                    {/* Tooltip on hover */}
                    <span className="absolute -bottom-8 right-0 px-2.5 py-1 rounded-full bg-black/95 border border-purple-500/40 text-[10px] text-purple-200 font-medium whitespace-nowrap opacity-0 group-hover/ai:opacity-100 transition-opacity pointer-events-none shadow-xl z-30">
                      Chat with AI version ✨
                    </span>
                  </button>

                  <div className="space-y-5">
                    {/* Top Identity Row */}
                    <div className="flex items-start gap-4">
                      <div className="relative shrink-0 group/avatar">
                        <Avatar
                          src={inst.avatarUrl}
                          name={inst.name}
                          size="lg"
                          glow
                          className="shadow-md group-hover:scale-105 group-hover:border-gold transition-transform duration-300"
                        />
                        {/* Redesigned spacious, perfectly circular AI Twin badge */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedAiInstructor(inst);
                          }}
                          className="absolute -bottom-1 -right-1 z-10 w-7 h-7 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 text-white ring-2 ring-white dark:ring-[#141418] shadow-md shadow-purple-500/25 hover:shadow-purple-500/50 hover:scale-115 active:scale-95 transition-all flex items-center justify-center group/ai-btn"
                          title="Chat with AI version ✨"
                          aria-label="Chat with AI version"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-white group-hover/ai-btn:rotate-12 transition-transform" />
                        </button>
                      </div>

                      <div className="space-y-1 min-w-0 flex-1 pr-16 sm:pr-20">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-serif text-xl sm:text-2xl text-ink font-medium truncate group-hover:text-gold transition-colors">
                            {inst.name || "AI Engineering Mentor"}
                          </h3>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap pt-0.5">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border ${getBadgeColor(
                              inst.mentorType
                            )}`}
                          >
                            {getRoleTitle(inst.role, inst.mentorType)}
                          </span>
                        </div>

                        {/* Price & Duration */}
                        <p className="text-xs text-text-muted font-medium pt-1">
                          Private 1:1 Session:{" "}
                          <strong className="text-ink font-semibold">
                            ${inst.sessionPrice || 150} USD
                          </strong>{" "}
                          ({inst.sessionDuration || 60} mins)
                        </p>
                      </div>
                    </div>

                    {/* Bio */}
                    <p className="text-xs sm:text-sm text-text-muted line-clamp-3 leading-relaxed">
                      {inst.bio ||
                        "Dedicated mentor of classical AI engineering and energy healing, synthesizing traditional doctrine with contemporary clarity."}
                    </p>

                    {/* Specialties Pills */}
                    {specialtiesList.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {specialtiesList.slice(0, 3).map((spec, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 text-[10px] text-text-muted bg-black/[0.03] dark:bg-white/[0.04] hover:bg-orange-500/10 dark:hover:bg-gold/10 px-2 py-1 rounded-full border border-black/[0.08] dark:border-white/5 transition-colors"
                          >
                            <Tag className="w-2.5 h-2.5 text-orange-600 dark:text-cream/60" />
                            <span>{spec}</span>
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Classes summary */}
                    {inst._count.createdCourses > 0 && (
                      <div className="relative z-10 pt-2 border-t border-black/[0.06] dark:border-white/[0.06] space-y-1.5">
                        <div className="flex items-center justify-between text-xs text-text-muted">
                          <span className="flex items-center gap-1.5">
                            <BookOpen className="w-3.5 h-3.5 text-orange-600 dark:text-cream" />
                            <span>Curriculum & Workshops</span>
                          </span>
                          <span className="font-semibold text-ink">
                            {inst._count.createdCourses} course(s)
                          </span>
                        </div>

                        {inst.createdCourses && inst.createdCourses.length > 0 && (
                          <div className="space-y-1">
                            {inst.createdCourses.slice(0, 2).map((cls) => (
                              <Link
                                key={cls.id}
                                href={`/courses/${cls.id}`}
                                onClick={(e) => e.stopPropagation()}
                                className="block text-[11px] text-ink/70 hover:text-gold truncate transition-colors py-0.5"
                              >
                                • {cls.title} ({Number(cls.price) === 0 ? "Free" : `$${Number(cls.price)}`})
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="relative z-10 pt-5 mt-4 border-t border-white/[0.06] flex items-center justify-between gap-2.5 flex-wrap">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedMentor(inst);
                        }}
                        className="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-semibold shadow-md shadow-orange-500/25 transition-all flex items-center gap-1.5 shrink-0 active:scale-95"
                      >
                        <Calendar className="w-3.5 h-3.5 text-white" />
                        <span>Book Session</span>
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedAiInstructor(inst);
                        }}
                        className="px-3 py-2.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-700 dark:text-purple-200 text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5 group/ai relative shrink-0"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-300 group-hover/ai:rotate-12 transition-transform" />
                        <span>Chat AI</span>
                        <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-full bg-black/95 border border-purple-500/40 text-[10px] text-purple-200 font-medium whitespace-nowrap opacity-0 group-hover/ai:opacity-100 transition-opacity pointer-events-none shadow-xl z-30">
                          Chat with AI version ✨
                        </span>
                      </button>
                    </div>

                    <Link
                      href={`/instructors/${inst.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs font-semibold uppercase tracking-wider text-text-muted hover:text-gold flex items-center gap-1 transition-colors"
                    >
                      <span>View profile</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Booking Modal */}
      <MentorBookingModal
        isOpen={!!selectedMentor}
        onClose={() => setSelectedMentor(null)}
        mentor={selectedMentor}
      />

      {/* AI Twin Session Modal */}
      <InstructorAiChatModal
        isOpen={!!selectedAiInstructor}
        onClose={() => setSelectedAiInstructor(null)}
        instructor={selectedAiInstructor}
        onOpenBooking={(inst) => setSelectedMentor(inst as any)}
      />
    </div>
  );
}
