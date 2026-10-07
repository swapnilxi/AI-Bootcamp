"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Clock,
  Lock,
  Sparkles,
  CheckCircle2,
  User,
  ChevronRight,
  BookOpen,
  Settings2,
  CreditCard,
} from "lucide-react";
import { isSubscriberRole } from "@/lib/roles";
import { PasswordUnlockModal } from "./PasswordUnlockModal";
import { CLASS_ROUTES } from "../routes";

export interface ClassItem {
  id: string;
  title: string;
  slug: string;
  description: string;
  schedule: string | Date;
  durationMinutes: number;
  price: number;
  isSubscriberOnly: boolean;
  isPasswordProtected: boolean;
  instructor?: {
    id: string;
    name?: string | null;
    avatarUrl?: string | null;
  } | null;
  enrollmentCount?: number;
  isEnrolled?: boolean;
  lessonCount?: number;
  completedLessons?: number;
  canManage?: boolean;
}

interface ClassCardProps {
  classItem: ClassItem;
  userRole?: string | null;
}

export function ClassCard({ classItem, userRole }: ClassCardProps) {
  const router = useRouter();
  const [unlockModalOpen, setUnlockModalOpen] = useState(false);
  const [busy, setBusy] = useState<null | "enrolling" | "checkout">(null);
  const [enrolled, setEnrolled] = useState(classItem.isEnrolled || false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const formattedDate = new Date(classItem.schedule).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const isFree = classItem.price === 0;
  const isSubscriber = isSubscriberRole(userRole);
  const lessonCount = classItem.lessonCount ?? 0;
  const progressPct =
    lessonCount > 0 ? Math.round(((classItem.completedLessons ?? 0) / lessonCount) * 100) : 0;

  /** Send the buyer to Stripe Checkout; the webhook grants access on payment. */
  async function startCheckout() {
    setBusy("checkout");
    setErrorMsg(null);
    try {
      const res = await fetch(CLASS_ROUTES.checkout(classItem.id), { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) {
        router.push(`/login?callbackUrl=/classes/${classItem.id}`);
        return;
      }
      if (!res.ok || !data.checkoutUrl) {
        setErrorMsg(data.error || "Could not start checkout");
        return;
      }
      window.location.href = data.checkoutUrl;
    } catch {
      setErrorMsg("An unexpected error occurred");
    } finally {
      setBusy(null);
    }
  }

  async function handleDirectEnroll() {
    if (classItem.isPasswordProtected) {
      setUnlockModalOpen(true);
      return;
    }

    setBusy("enrolling");
    setErrorMsg(null);

    try {
      const res = await fetch(CLASS_ROUTES.enroll(classItem.id), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (res.status === 401) {
          router.push(`/login?callbackUrl=/classes/${classItem.id}`);
          return;
        }
        // 402: the seat needs paying for first.
        if (res.status === 402 || data.requiresPayment) {
          await startCheckout();
          return;
        }
        setErrorMsg(data.error || "Enrollment failed");
        return;
      }

      setEnrolled(true);
      router.refresh();
    } catch {
      setErrorMsg("An unexpected error occurred");
    } finally {
      setBusy(null);
    }
  }

  const priceLabel = `$${classItem.price.toFixed(classItem.price % 1 === 0 ? 0 : 2)}`;

  const ctaBase =
    "flex-1 inline-flex items-center justify-center gap-1.5 h-11 px-4 rounded-xl text-sm font-semibold " +
    "transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 " +
    "focus-visible:ring-gold/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black-raised " +
    "disabled:opacity-60 disabled:cursor-not-allowed";
  const ctaPrimary = `${ctaBase} bg-cream text-black hover:bg-cream/90`;
  const ctaGhost =
    `${ctaBase} border border-white/10 bg-white/[0.02] text-ink font-medium hover:border-gold/60 hover:bg-white/[0.04]`;

  return (
    <>
      <article
        onClick={(e) => {
          const target = e.target as HTMLElement;
          if (target.closest("button") || target.closest("a")) return;
          router.push(`/courses/${classItem.id}`);
        }}
        className="editorial-card group relative flex h-full cursor-pointer flex-col rounded-2xl p-6 sm:p-8 transition-all duration-300 hover:border-gold/50"
      >
        {/* Badges */}
        <div className="mb-5 flex flex-wrap items-center gap-2">
          {classItem.isSubscriberOnly && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-cream/15 bg-cream/8 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-text">
              <Sparkles className="h-3 w-3 text-text-muted" />
              Course
            </span>
          )}

          {classItem.isPasswordProtected && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-cream/20 bg-cream/8 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-text">
              <Lock className="h-3 w-3" />
              Secret Key
            </span>
          )}

          {isFree ? (
            <span className="inline-flex items-center rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-300">
              Free
            </span>
          ) : (
            <span className="inline-flex items-baseline gap-1 rounded-full border border-cream/15 bg-cream/6 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-text">
              {priceLabel}
              <span className="text-[9px] text-text-muted">USD</span>
            </span>
          )}

          {enrolled && (
            <span className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-300">
              <CheckCircle2 className="h-3.5 w-3.5" /> Enrolled
            </span>
          )}
        </div>

        {/* Title */}
        <Link href={`/courses/${classItem.id}`} className="block">
          <h3 className="mb-3 line-clamp-2 font-serif text-[1.6rem] font-medium leading-snug text-ink transition-colors group-hover:text-gold">
            {classItem.title}
          </h3>
        </Link>

        {/* Description */}
        <p className="mb-6 line-clamp-3 text-sm leading-relaxed text-ink/70">
          {classItem.description}
        </p>

        {errorMsg && (
          <p
            role="alert"
            className="mb-5 rounded-lg border border-cream/15 bg-cream/8 px-3 py-2 text-xs text-text"
          >
            {errorMsg}
          </p>
        )}

        {/* Metadata — pushed to the bottom so cards of different text lengths align */}
        <div className="mt-auto space-y-3 border-t border-white/[0.07] pt-5 text-xs text-ink/65">
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 shrink-0 text-text-muted" />
              <span className="truncate">{formattedDate}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 shrink-0 text-text-muted" />
              <span>{classItem.durationMinutes} mins</span>
            </div>
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 shrink-0 text-text-muted" />
              <span>
                {lessonCount} {lessonCount === 1 ? "lesson" : "lessons"}
              </span>
            </div>
            {classItem.instructor && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 shrink-0 text-text-muted" />
                <span className="truncate text-ink/80">
                  {classItem.instructor.name || "Master Instructor"}
                </span>
              </div>
            )}
          </div>

          {enrolled && lessonCount > 0 && (
            <div className="pt-1">
              <div className="mb-2 flex items-center justify-between text-[11px]">
                <span className="text-text-muted">Your progress</span>
                <span className="font-semibold text-text">{progressPct}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,#F0E6D4,#FFFFFF)] transition-[width] duration-700"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-6 flex items-center gap-3">
          <Link href={`/courses/${classItem.id}`} className={ctaGhost}>
            <span>Syllabus</span>
            <ChevronRight className="h-4 w-4 text-ink/50" />
          </Link>

          {classItem.canManage ? (
            <Link
              href={`/courses/${classItem.id}/edit`}
              className={`${ctaBase} border border-cream/20 bg-cream/8 text-text hover:bg-cream/15`}
            >
              <Settings2 className="h-4 w-4" />
              <span>Manage</span>
            </Link>
          ) : enrolled ? (
            <Link href={`/courses/${classItem.id}`} className={ctaPrimary}>
              {progressPct > 0 ? "Continue" : "Enter Classroom"}
            </Link>
          ) : classItem.isPasswordProtected ? (
            <button onClick={() => setUnlockModalOpen(true)} className={ctaPrimary}>
              <Lock className="h-3.5 w-3.5" />
              <span>Unlock Key</span>
            </button>
          ) : classItem.isSubscriberOnly && !isSubscriber ? (
            <Link href="/dashboard/subscriber" className={ctaPrimary}>
              <Sparkles className="h-3.5 w-3.5" />
              <span>Subscribers Only</span>
            </Link>
          ) : isFree ? (
            <button onClick={handleDirectEnroll} disabled={busy !== null} className={ctaPrimary}>
              {busy === "enrolling" ? "Enrolling…" : "Enroll Free"}
            </button>
          ) : (
            <button onClick={startCheckout} disabled={busy !== null} className={ctaPrimary}>
              <CreditCard className="h-4 w-4" />
              <span>{busy === "checkout" ? "Opening…" : `Enroll · ${priceLabel}`}</span>
            </button>
          )}
        </div>
      </article>

      <PasswordUnlockModal
        isOpen={unlockModalOpen}
        onClose={() => setUnlockModalOpen(false)}
        courseId={classItem.id}
        classTitle={classItem.title}
        onUnlocked={() => {
          setEnrolled(true);
          router.push(`/courses/${classItem.id}`);
        }}
      />
    </>
  );
}
