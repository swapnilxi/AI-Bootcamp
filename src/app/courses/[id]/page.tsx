"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Sparkles,
  Calendar,
  Clock,
  User,
  Lock,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  KeyRound,
  Edit,
  Trash2,
  BookOpen,
  PlayCircle,
  Eye,
  ListChecks,
  ExternalLink,
} from "lucide-react";
import { PasswordUnlockModal } from "@/features/courses";
import { isSubscriberRole } from "@/lib/roles";

interface LessonOutline {
  id: string;
  title: string;
  summary?: string | null;
  durationMinutes?: number | null;
  isPreview: boolean;
  hasVideo: boolean;
  isAccessible: boolean;
  isCompleted: boolean;
}

interface ClassDetail {
  id: string;
  title: string;
  slug: string;
  description: string;
  syllabus?: string | null;
  content?: string | null;
  schedule: string;
  durationMinutes: number;
  price: number;
  isSubscriberOnly: boolean;
  isPasswordProtected: boolean;
  instructor?: {
    id: string;
    name?: string | null;
    avatarUrl?: string | null;
    bio?: string | null;
    role?: string | null;
  } | null;
  enrollmentCount: number;
  isEnrolled: boolean;
  unlockedWithPassword: boolean;
  canViewContent: boolean;
  canManage: boolean;
  lessons: LessonOutline[];
  completedLessons: number;
}

export default function ClassDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const { data: session } = useSession();

  const [classData, setClassData] = useState<ClassDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [unlockModalOpen, setUnlockModalOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const userRole = session?.user?.role;
  const isSubscriber = isSubscriberRole(userRole);

  useEffect(() => {
    if (id) {
      fetchClass();
    }
  }, [id]);

  async function fetchClass() {
    setLoading(true);
    try {
      const res = await fetch(`/api/courses/${id}`);
      if (!res.ok) {
        throw new Error("Class not found");
      }
      const data = await res.json();
      setClassData(data.course);
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to load class details");
    } finally {
      setLoading(false);
    }
  }

  async function handleEnroll() {
    if (!session) {
      router.push(`/login?callbackUrl=/classes/${id}`);
      return;
    }

    if (classData?.isPasswordProtected && !classData.unlockedWithPassword) {
      setUnlockModalOpen(true);
      return;
    }

    setEnrolling(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/courses/${id}/enroll`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "Enrollment failed");
        return;
      }

      setSuccessMsg("Enrolled successfully!");
      fetchClass();
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to enroll");
    } finally {
      setEnrolling(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this AI engineering class? This cannot be undone.")) {
      return;
    }

    try {
      const res = await fetch(`/api/courses/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to delete");
        return;
      }

      router.push("/courses");
    } catch (err) {
      console.error(err);
      alert("Error deleting class");
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-24 text-center">
        <Sparkles className="w-8 h-8 text-gold animate-spin mx-auto mb-4" />
        <p className="text-base text-ink/60">Loading course details...</p>
      </div>
    );
  }

  if (!classData) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 rounded-2xl bg-black-raised/80 backdrop-blur-sm border border-white/[0.07] text-center space-y-4 shadow-sm">
        <AlertCircle className="w-10 h-10 text-clay mx-auto" />
        <h2 className="font-serif text-2xl font-bold text-ink">Class Not Found</h2>
        <Link href="/courses" className="inline-block px-5 py-2.5 rounded-xl bg-gold text-black text-sm font-medium hover:bg-[#FFB073] transition-colors">
          Return to Classes Catalog
        </Link>
      </div>
    );
  }

  const lessons = classData.lessons || [];
  const progressPct =
    lessons.length > 0 ? Math.round((classData.completedLessons / lessons.length) * 100) : 0;
  // Resume at the first accessible lesson not yet completed
  const resumeLesson =
    lessons.find((l) => l.isAccessible && !l.isCompleted) || lessons.find((l) => l.isAccessible);

  const formattedDate = new Date(classData.schedule).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* Back Link & Admin Actions */}
      <div className="flex items-center justify-between">
        <Link
          href="/courses"
          className="inline-flex items-center gap-2 text-sm text-ink/60 hover:text-gold transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Classes Catalog</span>
        </Link>

        {classData.canManage && (
          <div className="flex items-center gap-2">
            <Link
              href={`/courses/${id}/edit`}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-mist/60 hover:bg-mist text-xs font-semibold text-ink border border-mist transition-colors"
            >
              <Edit className="w-3.5 h-3.5 text-gold" />
              <span>Edit Class & Lessons</span>
            </Link>
            <button
              onClick={handleDelete}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-clay/10 hover:bg-clay/20 text-xs font-semibold text-clay border border-clay/30 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          </div>
        )}
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-clay/10 border border-clay/30 text-clay text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main Hero Card */}
      <div className="p-8 sm:p-12 rounded-3xl bg-black-raised/80 backdrop-blur-sm border border-white/[0.07] shadow-sm relative overflow-hidden space-y-6">
        <div className="flex flex-wrap items-center gap-2.5">
          {classData.isSubscriberOnly && (
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo/10 text-indigo border border-indigo/20">
              Subscriber Only
            </span>
          )}
          {classData.isPasswordProtected && (
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gold/10 text-gold border border-gold/30 flex items-center gap-1">
              <Lock className="w-3.5 h-3.5" />
              Private Key Protected
            </span>
          )}
          <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-mist text-ink">
            {classData.price === 0 ? "Free Enrollment" : `$${classData.price.toFixed(2)}`}
          </span>

          {classData.isEnrolled && (
            <span className="ml-auto inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-300 bg-emerald-500/10 px-3.5 py-1 rounded-full border border-emerald-500/25">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" /> Enrolled Student
            </span>
          )}
        </div>

        <h1 className="font-serif text-3xl sm:text-5xl font-bold text-ink tracking-tight leading-tight">
          {classData.title}
        </h1>

        <p className="text-ink/80 text-lg leading-relaxed max-w-3xl">
          {classData.description}
        </p>

        {/* Schedule & Info Meta Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t border-mist text-sm text-ink/70">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-mist/60 flex items-center justify-center text-indigo">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <p className="text-ink/50 uppercase text-[10px] font-bold tracking-wider">Scheduled Date</p>
              <p className="font-medium text-ink text-xs sm:text-sm">{formattedDate}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-mist/60 flex items-center justify-center text-indigo">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <p className="text-ink/50 uppercase text-[10px] font-bold tracking-wider">Session Length</p>
              <p className="font-medium text-ink text-xs sm:text-sm">{classData.durationMinutes} Minutes</p>
            </div>
          </div>

          {classData.instructor?.id ? (
            <Link
              href={`/instructors/${classData.instructor.id}`}
              className="flex items-center gap-3 p-1.5 -m-1.5 rounded-xl hover:bg-white/[0.04] transition-colors group"
              title="View instructor profile"
            >
              <div className="w-9 h-9 rounded-lg bg-mist/60 flex items-center justify-center text-gold group-hover:bg-gold/20 transition-colors">
                <User className="w-4 h-4" />
              </div>
              <div>
                <p className="text-ink/50 uppercase text-[10px] font-bold tracking-wider">Instructor</p>
                <p className="font-medium text-ink text-xs sm:text-sm group-hover:text-gold transition-colors flex items-center gap-1">
                  <span>{classData.instructor?.name || "Master Instructor"}</span>
                  <ExternalLink className="w-3 h-3 text-gold/70 opacity-0 group-hover:opacity-100 transition-opacity" />
                </p>
              </div>
            </Link>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-mist/60 flex items-center justify-center text-gold">
                <User className="w-4 h-4" />
              </div>
              <div>
                <p className="text-ink/50 uppercase text-[10px] font-bold tracking-wider">Instructor</p>
                <p className="font-medium text-ink text-xs sm:text-sm">
                  {classData.instructor?.name || "Master Instructor"}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Start / continue learning */}
        {classData.canViewContent && resumeLesson && (
          <div className="pt-4 flex flex-wrap items-center gap-5">
            <Link
              href={`/courses/${classData.id}/lessons/${resumeLesson.id}`}
              className="px-8 py-3.5 rounded-xl bg-gold hover:bg-[#FFB073] text-black font-semibold text-sm shadow-md flex items-center gap-2 transition-all"
            >
              <PlayCircle className="w-4 h-4" />
              <span>
                {classData.completedLessons === 0
                  ? "Start Course"
                  : progressPct === 100
                  ? "Review Course"
                  : "Continue Learning"}
              </span>
            </Link>
            {classData.isEnrolled && lessons.length > 0 && (
              <div className="min-w-[200px] flex-1 max-w-xs">
                <div className="flex justify-between text-xs text-text-muted mb-1.5">
                  <span>
                    {classData.completedLessons} of {lessons.length} lessons complete
                  </span>
                  <span className="text-gold font-semibold">{progressPct}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[linear-gradient(90deg,#DC4C00,#FFD2A8)] transition-[width] duration-700"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Enrollment / Unlock CTAs */}
        {!classData.isEnrolled && !classData.canManage && (
          <div className="pt-4 flex flex-wrap gap-4 items-center">
            {classData.isPasswordProtected ? (
              <button
                onClick={() => setUnlockModalOpen(true)}
                className="px-8 py-3.5 rounded-xl bg-gold hover:bg-[#FFB073] text-black font-semibold text-sm shadow-md flex items-center gap-2 transition-all"
              >
                <KeyRound className="w-4 h-4" />
                <span>Enter Class Access Key to Enroll</span>
              </button>
            ) : classData.isSubscriberOnly && !isSubscriber ? (
              <Link
                href="/dashboard/subscriber"
                className="px-8 py-3.5 rounded-xl bg-gold hover:bg-[#FFB073] text-black font-semibold text-sm shadow-md flex items-center gap-2 transition-all"
              >
                <Sparkles className="w-4 h-4" />
                <span>Join Subscriber Tier to Access</span>
              </Link>
            ) : (
              <button
                onClick={handleEnroll}
                disabled={enrolling}
                className="px-8 py-3.5 rounded-xl bg-gold hover:bg-[#FFB073] text-black font-semibold text-sm shadow-md flex items-center gap-2 transition-all disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{enrolling ? "Enrolling..." : "Enroll in Course"}</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Academic Syllabus & Study Plan (Visible so learners understand learning outcomes & modules) */}
      {classData.syllabus && (
        <div className="p-8 sm:p-12 rounded-3xl bg-black-raised/80 backdrop-blur-sm border border-white/[0.07] shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-white/[0.07] pb-4">
            <h2 className="font-serif text-2xl font-bold text-ink flex items-center gap-2.5">
              <BookOpen className="w-5 h-5 text-gold" />
              <span>Academic Syllabus & Curriculum Overview</span>
            </h2>
            <span className="text-xs px-3 py-1 rounded-full bg-gold/10 text-gold border border-gold/25 font-semibold">
              Official Syllabus
            </span>
          </div>

          <div className="prose max-w-none text-ink/90 text-sm sm:text-base whitespace-pre-wrap font-sans leading-relaxed bg-black/40 p-6 sm:p-8 rounded-2xl border border-white/[0.06]">
            {classData.syllabus}
          </div>
        </div>
      )}

      {/* Course Curriculum: lesson outline (always visible), lessons open per access */}
      <div className="p-8 sm:p-12 rounded-3xl bg-black-raised/80 backdrop-blur-sm border border-white/[0.07] shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-white/[0.07] pb-4">
          <h2 className="font-serif text-2xl font-bold text-ink flex items-center gap-2.5">
            <ListChecks className="w-5 h-5 text-gold" />
            <span>Course Curriculum</span>
          </h2>
          <span className="text-xs text-text-muted">
            {lessons.length} {lessons.length === 1 ? "lesson" : "lessons"}
            {lessons.some((l) => l.durationMinutes) &&
              ` · ${lessons.reduce((sum, l) => sum + (l.durationMinutes || 0), 0)} min`}
          </span>
        </div>

        {lessons.length === 0 ? (
          <div className="text-center py-10 text-sm text-text-muted space-y-3">
            <p>No lessons have been published for this class yet.</p>
            {classData.canManage && (
              <Link
                href={`/courses/${classData.id}/edit#lessons`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gold hover:bg-[#FFB073] text-black font-semibold text-xs transition-colors"
              >
                Add the first lesson
              </Link>
            )}
          </div>
        ) : (
          <ol className="divide-y divide-white/[0.06]">
            {lessons.map((lesson, idx) => {
              const row = (
                <div className="flex items-center gap-4 py-4">
                  <span
                    className={`w-9 h-9 shrink-0 rounded-full border flex items-center justify-center text-xs font-semibold ${
                      lesson.isCompleted
                        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                        : lesson.isAccessible
                        ? "border-gold/40 text-gold"
                        : "border-white/10 text-text-muted"
                    }`}
                  >
                    {lesson.isCompleted ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p
                      className={`font-medium text-sm sm:text-base truncate ${
                        lesson.isAccessible ? "text-ink group-hover:text-gold transition-colors" : "text-text-muted"
                      }`}
                    >
                      {lesson.title}
                    </p>
                    {lesson.summary && (
                      <p className="text-xs text-text-muted truncate mt-0.5">{lesson.summary}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0 text-xs text-text-muted">
                    {lesson.isPreview && !classData.canViewContent && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-gold/30 text-gold">
                        <Eye className="w-3 h-3" /> Preview
                      </span>
                    )}
                    {lesson.hasVideo && <PlayCircle className="w-4 h-4 text-gold/70" />}
                    {lesson.durationMinutes ? <span>{lesson.durationMinutes} min</span> : null}
                    {!lesson.isAccessible && <Lock className="w-4 h-4" />}
                  </div>
                </div>
              );
              return (
                <li key={lesson.id}>
                  {lesson.isAccessible ? (
                    <Link href={`/courses/${classData.id}/lessons/${lesson.id}`} className="group block">
                      {row}
                    </Link>
                  ) : (
                    <button
                      onClick={handleEnroll}
                      className="group block w-full text-left cursor-pointer opacity-75 hover:opacity-100 transition-opacity"
                      title="Enroll to unlock full course access"
                    >
                      {row}
                    </button>
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </div>

      {/* Classroom Materials / Protected Content Section */}
      <div className="p-8 sm:p-12 rounded-3xl bg-black-raised/80 backdrop-blur-sm border border-white/[0.07] shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-mist pb-4">
          <h2 className="font-serif text-2xl font-bold text-ink flex items-center gap-2.5">
            <BookOpen className="w-5 h-5 text-indigo" />
            <span>Course Overview & Materials</span>
          </h2>
          {classData.canViewContent && (
            <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/25 font-semibold">
              Unlocked & Verified
            </span>
          )}
        </div>

        {classData.canViewContent && !classData.content ? (
          <p className="text-sm text-text-muted">No additional materials for this class.</p>
        ) : classData.canViewContent ? (
          <div className="prose max-w-none text-ink text-base whitespace-pre-wrap font-sans leading-relaxed bg-black/40 p-6 sm:p-8 rounded-2xl border border-white/[0.06]">
            {classData.content}
          </div>
        ) : (
          <div className="text-center py-12 px-4 rounded-2xl bg-black/40 border border-white/[0.06] space-y-4">
            <div className="w-12 h-12 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center text-gold mx-auto">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-xl font-bold text-ink">Course Materials Are Protected</h3>
            <p className="text-sm text-ink/70 max-w-md mx-auto leading-relaxed">
              {classData.isPasswordProtected
                ? "This curriculum requires entering the secret class access key before syllabus notes and meeting links are revealed."
                : classData.isSubscriberOnly
                ? "This course is reserved for active Subscribers. Please join the membership to unveil full materials."
                : "Enroll in this class above to immediately view study notes and live video links."}
            </p>

            {classData.isPasswordProtected && (
              <button
                onClick={() => setUnlockModalOpen(true)}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gold hover:bg-[#FFB073] text-black font-semibold text-sm transition-colors shadow-sm"
              >
                <KeyRound className="w-4 h-4" />
                <span>Unlock Classroom</span>
              </button>
            )}
          </div>
        )}
      </div>

      <PasswordUnlockModal
        isOpen={unlockModalOpen}
        onClose={() => setUnlockModalOpen(false)}
        courseId={classData.id}
        classTitle={classData.title}
        onUnlocked={() => {
          fetchClass();
        }}
      />
    </div>
  );
}
