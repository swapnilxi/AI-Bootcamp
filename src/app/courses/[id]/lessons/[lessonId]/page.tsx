"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Circle,
  Clock,
  ExternalLink,
  Lock,
  PlayCircle,
  Settings2,
  Sparkles,
} from "lucide-react";
import { parseVideoUrl } from "@/lib/video";
import { LessonAiPanel } from "@/components/ai/LessonAiPanel";

interface OutlineItem {
  id: string;
  title: string;
  isPreview: boolean;
  durationMinutes?: number | null;
  isAccessible: boolean;
  isCompleted: boolean;
}

interface LessonResponse {
  lesson: {
    id: string;
    title: string;
    summary?: string | null;
    content: string;
    videoUrl?: string | null;
    durationMinutes?: number | null;
    isPreview: boolean;
    position: number;
    isCompleted: boolean;
  };
  course: {
    id: string;
    title: string;
    canManage: boolean;
    canViewContent: boolean;
    isEnrolled: boolean;
  };
  outline: OutlineItem[];
  prevId: string | null;
  nextId: string | null;
}

export default function LessonPage() {
  const params = useParams();
  const courseId = params?.id as string;
  const lessonId = params?.lessonId as string;
  const router = useRouter();
  const { data: session } = useSession();

  const [data, setData] = useState<LessonResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [locked, setLocked] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLocked(false);
    setNotFound(false);
    try {
      const res = await fetch(`/api/courses/${courseId}/lessons/${lessonId}`);
      if (res.status === 403) setLocked(true);
      else if (!res.ok) setNotFound(true);
      else setData(await res.json());
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [courseId, lessonId]);

  useEffect(() => {
    if (courseId && lessonId) load();
  }, [courseId, lessonId, load]);

  async function toggleComplete(then?: "next" | "finish") {
    if (!data) return;
    if (!session) {
      router.push(`/login?callbackUrl=/classes/${courseId}/lessons/${lessonId}`);
      return;
    }
    setSaving(true);
    setActionError(null);
    const completing = !data.lesson.isCompleted;
    try {
      const res = await fetch(`/api/courses/${courseId}/lessons/${lessonId}/progress`, {
        method: completing ? "POST" : "DELETE",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setActionError(body.error || "Could not update progress");
        return;
      }
      if (completing && then === "next" && data.nextId) {
        router.push(`/courses/${courseId}/lessons/${data.nextId}`);
        return;
      }
      if (completing && then === "finish") {
        router.push(`/courses/${courseId}`);
        return;
      }
      setData({
        ...data,
        lesson: { ...data.lesson, isCompleted: completing },
        outline: data.outline.map((o) => (o.id === lessonId ? { ...o, isCompleted: completing } : o)),
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-24 text-center">
        <Sparkles className="w-8 h-8 text-gold animate-spin mx-auto mb-4" />
        <p className="text-base text-text-muted">Opening lesson...</p>
      </div>
    );
  }

  if (locked || notFound || !data) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 rounded-2xl bg-black-raised/80 backdrop-blur-sm border border-white/[0.07] text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-cream/10 border border-cream/20 flex items-center justify-center text-cream mx-auto">
          <Lock className="w-6 h-6" />
        </div>
        <h2 className="font-serif text-2xl text-ink">
          {locked ? "This lesson is locked" : "Lesson not found"}
        </h2>
        <p className="text-sm text-text-muted">
          {locked
            ? "Enroll in the class to unlock every lesson in the curriculum."
            : "It may have been moved or removed by the instructor."}
        </p>
        <Link
          href={`/courses/${courseId}`}
          className="inline-block px-5 py-2.5 rounded-xl bg-cream text-black text-sm font-semibold hover:bg-cream/90 transition-colors"
        >
          {locked ? "View class & enroll" : "Back to class"}
        </Link>
      </div>
    );
  }

  const { lesson, outline, prevId, nextId } = data;
  const video = lesson.videoUrl ? parseVideoUrl(lesson.videoUrl) : null;
  const completedCount = outline.filter((o) => o.isCompleted).length;
  const pct = outline.length ? Math.round((completedCount / outline.length) * 100) : 0;
  const canTrack = !!session && (data.course.canViewContent || lesson.isPreview);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Course outline */}
      <aside className="lg:col-span-4 xl:col-span-3 order-2 lg:order-1">
        <div className="lg:sticky lg:top-28 rounded-2xl bg-black-raised/80 backdrop-blur-sm border border-white/[0.07] p-5 space-y-4">
          <Link
            href={`/courses/${courseId}`}
            className="inline-flex items-center gap-2 text-xs text-text-muted hover:text-gold transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="truncate">{data.course.title}</span>
          </Link>

          {session && data.course.isEnrolled && (
            <div>
              <div className="flex justify-between text-[11px] text-text-muted mb-1.5">
                <span>
                  {completedCount}/{outline.length} complete
                </span>
                <span className="text-cream font-semibold">{pct}%</span>
              </div>
              <div className="h-1 rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,#F0E6D4,#FFFFFF)] transition-[width] duration-700"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )}

          <ol className="space-y-1 max-h-[60vh] overflow-y-auto pr-1" data-lenis-prevent>
            {outline.map((item, idx) => {
              const active = item.id === lesson.id;
              const content = (
                <span
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                    active
                      ? "bg-cream/10 text-cream border border-cream/25"
                      : item.isAccessible
                      ? "text-text hover:bg-white/[0.04] border border-transparent"
                      : "text-text-muted/60 border border-transparent"
                  }`}
                >
                  {item.isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-300" />
                  ) : item.isAccessible ? (
                    <Circle className="w-4 h-4 shrink-0 opacity-50" />
                  ) : (
                    <Lock className="w-4 h-4 shrink-0" />
                  )}
                  <span className="truncate flex-1">
                    {idx + 1}. {item.title}
                  </span>
                </span>
              );
              return (
                <li key={item.id}>
                  {item.isAccessible ? (
                    <Link href={`/courses/${courseId}/lessons/${item.id}`}>{content}</Link>
                  ) : (
                    content
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      </aside>

      {/* Lesson body */}
      <article className="lg:col-span-8 xl:col-span-9 order-1 lg:order-2 space-y-6">
        <header className="space-y-3">
          <div className="flex flex-wrap items-center gap-3 text-xs text-text-muted">
            <span className="uppercase tracking-[0.18em] text-cream font-semibold">
              Lesson {lesson.position} of {outline.length}
            </span>
            {lesson.durationMinutes ? (
              <span className="inline-flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> {lesson.durationMinutes} min
              </span>
            ) : null}
            {lesson.isPreview && !data.course.canViewContent && (
              <span className="px-2 py-0.5 rounded-full border border-cream/25 text-cream">Free preview</span>
            )}
            {data.course.canManage && (
              <Link
                href={`/courses/${courseId}/edit#lessons`}
                className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-cream/25 text-cream hover:bg-gold/10 transition-colors"
              >
                <Settings2 className="w-3.5 h-3.5" /> Edit lessons
              </Link>
            )}
          </div>
          <h1 className="font-serif text-3xl sm:text-5xl text-ink leading-tight">{lesson.title}</h1>
          {lesson.summary && <p className="text-text-muted text-base sm:text-lg">{lesson.summary}</p>}
        </header>

        {video && (
          <div className="rounded-2xl overflow-hidden border border-white/[0.07] bg-black">
            {video.kind === "embed" ? (
              <div className="aspect-video">
                <iframe
                  src={video.src}
                  title={lesson.title}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : video.kind === "file" ? (
              <video src={video.src} controls className="w-full aspect-video" />
            ) : (
              <a
                href={video.src}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-10 text-cream hover:text-[#FED7AA] transition-colors"
              >
                <PlayCircle className="w-6 h-6" />
                <span className="font-medium">Open lesson video</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
        )}

        <div className="rounded-2xl bg-black-raised/80 backdrop-blur-sm border border-white/[0.07] p-6 sm:p-10">
          <div className="text-text text-base leading-relaxed whitespace-pre-wrap">{lesson.content}</div>
        </div>

        {session && <LessonAiPanel key={lesson.id} courseId={courseId} lessonId={lesson.id} lessonTitle={lesson.title} />}

        {actionError && <p className="text-sm text-text">{actionError}</p>}

        {/* Progress + navigation */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
          {prevId ? (
            <Link
              href={`/courses/${courseId}/lessons/${prevId}`}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-white/10 text-sm text-text-muted hover:text-gold hover:border-gold/40 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Previous
            </Link>
          ) : (
            <span className="hidden sm:block" />
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            {canTrack && (
              <button
                onClick={() => toggleComplete()}
                disabled={saving}
                className={`inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold border transition-colors disabled:opacity-50 ${
                  lesson.isCompleted
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/15"
                    : "border-white/10 text-text hover:border-gold/40 hover:text-gold"
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                {lesson.isCompleted ? "Completed" : "Mark complete"}
              </button>
            )}
            {nextId ? (
              <button
                onClick={() =>
                  canTrack && !lesson.isCompleted
                    ? toggleComplete("next")
                    : router.push(`/courses/${courseId}/lessons/${nextId}`)
                }
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-cream hover:bg-cream/90 text-black text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {canTrack && !lesson.isCompleted ? "Complete & continue" : "Next lesson"}
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : canTrack && !lesson.isCompleted ? (
              <button
                onClick={() => toggleComplete("finish")}
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-cream hover:bg-cream/90 text-black text-sm font-semibold transition-colors disabled:opacity-50"
              >
                Complete course
              </button>
            ) : (
              <Link
                href={`/courses/${courseId}`}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-cream hover:bg-cream/90 text-black text-sm font-semibold transition-colors"
              >
                Return to course
              </Link>
            )}
          </div>
        </div>
      </article>
    </div>
  );
}
