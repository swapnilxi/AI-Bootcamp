"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Sparkles,
  ArrowLeft,
  Calendar,
  Clock,
  DollarSign,
  Lock,
  Star,
  AlertCircle,
  Save,
  CheckCircle2,
  Eye,
  Globe,
  Wand2,
  Loader2,
  Tag,
  X,
  BookOpen,
  Settings2,
  Layers,
} from "lucide-react";
import { isAdminRole } from "@/lib/roles";
import { InstructorSelect, LessonManager } from "@/features/courses";

/* ─── Design tokens ────────────────────────────────────────────────── */
const fieldClass =
  "w-full px-4 py-3 rounded-xl border border-white/10 focus:border-gold focus:ring-1 focus:ring-gold/50 text-ink text-sm bg-black/50 outline-none transition-all placeholder:text-ink/30";
const labelClass =
  "block text-[11px] font-semibold text-ink/50 uppercase tracking-widest mb-1.5";

type Tab = "details" | "lessons" | "settings";

export default function EditClassPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState<Tab>(
    searchParams.get("created") === "1" ? "lessons" : "details"
  );

  /* ── Form fields ── */
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [schedule, setSchedule] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [price, setPrice] = useState(0);
  const [isSubscriberOnly, setIsSubscriberOnly] = useState(false);
  const [isPasswordProtected, setIsPasswordProtected] = useState(false);
  const [password, setPassword] = useState("");
  const [instructorId, setInstructorId] = useState("");
  const [originalInstructorId, setOriginalInstructorId] = useState("");
  const [canManage, setCanManage] = useState(false);
  const [reviewStatus, setReviewStatus] = useState<string>("APPROVED");
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);

  /* ── AI helpers ── */
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiField, setAiField] = useState<"description" | "content" | null>(null);

  /* ── UI state ── */
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const justCreated = searchParams.get("created") === "1";

  useEffect(() => {
    if (id) fetchClass();
  }, [id]);

  async function fetchClass() {
    try {
      const res = await fetch(`/api/courses/${id}`);
      if (!res.ok) throw new Error("Failed to load class");
      const data = await res.json();
      const c = data.course;
      setTitle(c.title);
      setDescription(c.description);
      setContent(c.content || "");
      if (c.schedule) {
        const d = new Date(c.schedule);
        const pad = (n: number) => n.toString().padStart(2, "0");
        const formatted = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
        setSchedule(formatted);
      }
      setDurationMinutes(c.durationMinutes);
      setPrice(c.price);
      setIsSubscriberOnly(c.isSubscriberOnly);
      setIsPasswordProtected(c.isPasswordProtected);
      setCanManage(!!c.canManage);
      setReviewStatus(c.approvalStatus || "APPROVED");
      setRejectionReason(c.rejectionReason || null);
      setInstructorId(c.instructorId || "");
      setOriginalInstructorId(c.instructorId || "");
    } catch {
      setErrorMsg("Failed to load class data");
    } finally {
      setLoading(false);
    }
  }

  /* ── Loading skeleton ── */
  if (status === "loading" || loading) {
    return (
      <div className="max-w-5xl mx-auto py-32 text-center">
        <div className="w-10 h-10 rounded-full border-2 border-gold border-t-transparent animate-spin mx-auto mb-3" />
        <p className="text-ink/40 text-sm">Loading class editor…</p>
      </div>
    );
  }

  const isAdmin = isAdminRole(session?.user?.role);

  if (!canManage) {
    return (
      <div className="max-w-xl mx-auto my-20 p-10 rounded-3xl bg-black-raised/80 backdrop-blur-sm border border-white/[0.07] text-center space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8 text-red-400" />
        </div>
        <h2 className="font-serif text-2xl font-bold text-ink">Access Denied</h2>
        <p className="text-sm text-ink/60">Only this class&apos;s instructor or an admin can edit it.</p>
        <Link
          href={`/courses/${id}`}
          className="inline-block px-6 py-3 rounded-xl bg-orange text-white text-sm font-semibold hover:bg-orange-600 transition-colors"
        >
          Back to Class
        </Link>
      </div>
    );
  }

  /* ── AI draft helpers ── */
  async function generateWithAi(field: "description" | "content") {
    setAiGenerating(true);
    setAiField(field);
    try {
      const res = await fetch("/api/ai/lesson-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: id,
          title,
          brief:
            field === "description"
              ? "Write a compelling 2-3 sentence course overview."
              : "Write a detailed course syllabus with weekly modules.",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "AI generation failed");
      if (field === "description") setDescription(data.draft?.summary || description);
      if (field === "content") setContent(data.draft?.content || content);
    } catch {
      /* silent */
    } finally {
      setAiGenerating(false);
      setAiField(null);
    }
  }

  /* ── Save ── */
  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/courses/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          content,
          schedule: new Date(schedule).toISOString(),
          durationMinutes: Number(durationMinutes),
          price: Number(price),
          isSubscriberOnly,
          isPasswordProtected,
          password: isPasswordProtected && password ? password : undefined,
          ...(isAdmin && instructorId && instructorId !== originalInstructorId && { instructorId }),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Failed to update class");
        setSaving(false);
        return;
      }
      setSaving(false);
      setOriginalInstructorId(instructorId);
      if (reviewStatus === "REJECTED" && !isAdmin) {
        setReviewStatus("PENDING");
        setRejectionReason(null);
      }
      setSavedMsg("Class details saved successfully.");
      setTimeout(() => setSavedMsg(null), 3500);
    } catch {
      setErrorMsg("Failed to update class");
      setSaving(false);
    }
  }

  /* ─── Render ────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-black to-black-raised/50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-7">

        {/* ── Top nav ── */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="space-y-1">
            <Link
              href={`/courses/${id}`}
              className="inline-flex items-center gap-1.5 text-xs text-ink/50 hover:text-gold transition-colors font-medium group"
            >
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
              View Class
            </Link>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink line-clamp-1">{title || "Edit Class"}</h1>
          </div>

          {/* Approval badge */}
          {reviewStatus === "PENDING" && (
            <span className="px-3 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs font-semibold">
              Under Review
            </span>
          )}
          {reviewStatus === "REJECTED" && (
            <span className="px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold">
              Declined
            </span>
          )}
          {reviewStatus === "APPROVED" && (
            <span className="px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> Published
            </span>
          )}
        </div>

        {/* ── Status banners ── */}
        {justCreated && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            Class created! Now build the curriculum by adding lessons below.
          </div>
        )}
        {reviewStatus === "REJECTED" && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            This class was declined{rejectionReason ? `: ${rejectionReason}` : "."}
            {" "}Saving your changes resubmits it for review.
          </div>
        )}
        {reviewStatus === "PENDING" && !justCreated && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-300 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            This class is under review and not yet visible to learners. You can keep editing.
          </div>
        )}
        {savedMsg && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            {savedMsg}
          </div>
        )}
        {errorMsg && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {errorMsg}
          </div>
        )}

        {/* ── Tab bar ── */}
        <div className="flex gap-1 p-1 rounded-2xl bg-white/[0.03] border border-white/[0.07] w-fit">
          {(
            [
              { id: "details" as Tab, label: "Details", icon: Settings2 },
              { id: "lessons" as Tab, label: "Curriculum", icon: Layers },
            ] as const
          ).map(({ id: tabId, label, icon: Icon }) => (
            <button
              key={tabId}
              type="button"
              onClick={() => setActiveTab(tabId)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all
                ${activeTab === tabId
                  ? "bg-orange text-white shadow-lg shadow-orange/20"
                  : "text-ink/50 hover:text-ink/80 hover:bg-white/5"
                }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* ════════════════════════════════════════════════════════════
            TAB: Details
        ════════════════════════════════════════════════════════════ */}
        {activeTab === "details" && (
          <form onSubmit={handleUpdate} className="space-y-6">
            {/* ── Core info card ── */}
            <div className="p-7 sm:p-9 rounded-3xl bg-black-raised/80 backdrop-blur-sm border border-white/[0.07] space-y-6 shadow-xl shadow-black/30">
              <div className="flex items-center gap-3 pb-1 border-b border-white/[0.05]">
                <BookOpen className="w-4 h-4 text-orange" />
                <h2 className="font-serif text-lg text-ink">Core Information</h2>
              </div>

              {/* Title */}
              <div>
                <label className={labelClass}>Class Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={fieldClass}
                />
              </div>

              {/* Description */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className={`${labelClass} mb-0`}>Short Description</label>
                  <button
                    type="button"
                    onClick={() => generateWithAi("description")}
                    disabled={aiGenerating || title.length < 3}
                    className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-ink/40 hover:text-orange transition-colors disabled:opacity-30 uppercase tracking-wider"
                  >
                    {aiGenerating && aiField === "description" ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Wand2 className="w-3 h-3" />
                    )}
                    AI Rewrite
                  </button>
                </div>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={`${fieldClass} resize-none`}
                />
              </div>

              {/* Syllabus */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className={`${labelClass} mb-0`}>
                    Syllabus & Materials
                    <span className="ml-2 text-ink/25 normal-case tracking-normal font-normal">optional</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => generateWithAi("content")}
                    disabled={aiGenerating || title.length < 3}
                    className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-ink/40 hover:text-orange transition-colors disabled:opacity-30 uppercase tracking-wider"
                  >
                    {aiGenerating && aiField === "content" ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Sparkles className="w-3 h-3" />
                    )}
                    Generate Syllabus
                  </button>
                </div>
                <textarea
                  rows={7}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className={`${fieldClass} font-mono text-[13px] resize-none leading-relaxed`}
                  placeholder="Week-by-week plan, reading lists, resource links…"
                />
                <p className="text-[11px] text-ink/30 mt-1.5">Protected — shown only to enrolled students.</p>
              </div>

              {/* Admin instructor */}
              {isAdmin && (
                <div className="p-4 rounded-2xl bg-orange/[0.04] border border-orange/15">
                  <label className={labelClass}>Teaching Instructor</label>
                  <InstructorSelect value={instructorId} onChange={setInstructorId} />
                </div>
              )}
            </div>

            {/* ── Schedule card ── */}
            <div className="p-7 sm:p-9 rounded-3xl bg-black-raised/80 backdrop-blur-sm border border-white/[0.07] space-y-5 shadow-xl shadow-black/30">
              <div className="flex items-center gap-3 pb-1 border-b border-white/[0.05]">
                <Calendar className="w-4 h-4 text-orange" />
                <h2 className="font-serif text-lg text-ink">Schedule & Pricing</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Date */}
                <div>
                  <label className={labelClass}>Date & Time</label>
                  <div className="relative">
                    <input
                      type="datetime-local"
                      required
                      value={schedule}
                      onChange={(e) => setSchedule(e.target.value)}
                      className={`${fieldClass} pl-11`}
                    />
                    <Calendar className="absolute left-3.5 top-3.5 w-4 h-4 text-ink/30 pointer-events-none" />
                  </div>
                </div>

                {/* Duration */}
                <div>
                  <label className={labelClass}>Duration (min)</label>
                  <div className="relative">
                    <input
                      type="number"
                      min={15}
                      max={360}
                      value={durationMinutes}
                      onChange={(e) => setDurationMinutes(Number(e.target.value))}
                      className={`${fieldClass} pl-11`}
                    />
                    <Clock className="absolute left-3.5 top-3.5 w-4 h-4 text-ink/30 pointer-events-none" />
                  </div>
                </div>

                {/* Price */}
                <div>
                  <label className={labelClass}>Price (USD)</label>
                  <div className="relative">
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={price}
                      onChange={(e) => setPrice(Number(e.target.value))}
                      className={`${fieldClass} pl-11`}
                    />
                    <DollarSign className="absolute left-3.5 top-3.5 w-4 h-4 text-ink/30 pointer-events-none" />
                  </div>
                  {price === 0 && (
                    <p className="text-[11px] text-emerald-400/70 mt-1">Free class</p>
                  )}
                </div>
              </div>
            </div>

            {/* ── Access controls card ── */}
            <div className="p-7 sm:p-9 rounded-3xl bg-black-raised/80 backdrop-blur-sm border border-white/[0.07] space-y-4 shadow-xl shadow-black/30">
              <div className="flex items-center gap-3 pb-1 border-b border-white/[0.05]">
                <Lock className="w-4 h-4 text-orange" />
                <h2 className="font-serif text-lg text-ink">Access Controls</h2>
              </div>

              {/* Subscriber only */}
              <div
                onClick={() => setIsSubscriberOnly(!isSubscriberOnly)}
                className={`flex items-center justify-between p-5 rounded-2xl border cursor-pointer transition-all
                  ${isSubscriberOnly ? "border-orange/30 bg-orange/[0.04]" : "border-white/[0.07] bg-white/[0.02] hover:border-white/15"}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors
                    ${isSubscriberOnly ? "bg-orange/10 text-orange" : "bg-white/5 text-ink/30"}`}>
                    <Star className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-ink">Subscriber Only</p>
                    <p className="text-xs text-ink/50 mt-0.5">Restricted to Subscriber and Admin tiers</p>
                  </div>
                </div>
                <div className={`w-11 h-6 rounded-full relative transition-colors ${isSubscriberOnly ? "bg-orange" : "bg-white/10"}`}>
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${isSubscriberOnly ? "translate-x-6" : "translate-x-1"}`} />
                </div>
              </div>

              {/* Password protected */}
              <div className={`rounded-2xl border transition-all ${isPasswordProtected ? "border-orange/30 bg-orange/[0.04]" : "border-white/[0.07] bg-white/[0.02]"}`}>
                <div
                  onClick={() => setIsPasswordProtected(!isPasswordProtected)}
                  className="flex items-center justify-between p-5 cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors
                      ${isPasswordProtected ? "bg-orange/10 text-orange" : "bg-white/5 text-ink/30"}`}>
                      <Lock className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-ink">Password Protection</p>
                      <p className="text-xs text-ink/50 mt-0.5">Require a secret key to enroll</p>
                    </div>
                  </div>
                  <div className={`w-11 h-6 rounded-full relative transition-colors ${isPasswordProtected ? "bg-orange" : "bg-white/10"}`}>
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${isPasswordProtected ? "translate-x-6" : "translate-x-1"}`} />
                  </div>
                </div>
                {isPasswordProtected && (
                  <div className="px-5 pb-5">
                    <label className={labelClass}>Update Password (leave blank to keep current)</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="New password (optional)…"
                      className={`${fieldClass} border-orange/20`}
                    />
                  </div>
                )}
              </div>

              {/* Access description */}
              <div className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                <Globe className="w-4 h-4 text-ink/30 shrink-0" />
                <p className="text-xs text-ink/50 leading-relaxed">
                  {isSubscriberOnly && isPasswordProtected
                    ? "Maximum restriction — subscriber + password required."
                    : isSubscriberOnly
                    ? "Subscribers and admins only."
                    : isPasswordProtected
                    ? "Anyone with the access key can enroll."
                    : "Publicly enrollable — open to all registered users."}
                </p>
              </div>
            </div>

            {/* ── Save bar ── */}
            <div className="flex gap-3">
              <Link
                href={`/courses/${id}`}
                className="px-6 py-3 rounded-xl border border-white/10 text-sm font-medium text-ink/50 hover:bg-white/5 hover:text-ink transition-colors"
              >
                View Class
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2.5 py-3 rounded-xl bg-orange hover:bg-orange-600 text-white font-bold text-sm transition-all disabled:opacity-50 shadow-lg shadow-orange/20"
              >
                {saving ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
                ) : (
                  <><Save className="w-4 h-4" /> Save Class Details</>
                )}
              </button>
            </div>
          </form>
        )}

        {/* ════════════════════════════════════════════════════════════
            TAB: Curriculum (Lessons)
        ════════════════════════════════════════════════════════════ */}
        {activeTab === "lessons" && <LessonManager courseId={id} />}
      </div>
    </div>
  );
}
