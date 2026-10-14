"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Sparkles,
  BookPlus,
  ArrowLeft,
  ArrowRight,
  Calendar,
  Clock,
  DollarSign,
  Lock,
  Star,
  AlertCircle,
  CheckCircle2,
  Image as ImageIcon,
  Tag,
  Upload,
  Wand2,
  Globe,
  Users,
  ChevronDown,
  X,
  Loader2,
} from "lucide-react";
import { canCreateClasses, isAdminRole } from "@/lib/roles";
import { InstructorSelect } from "@/features/courses";

/* ─── Design tokens ────────────────────────────────────────────────── */
const fieldClass =
  "w-full px-4 py-3 rounded-xl border border-white/10 focus:border-gold focus:ring-1 focus:ring-gold/50 text-ink text-sm bg-black/50 outline-none transition-all placeholder:text-ink/30";
const labelClass =
  "block text-[11px] font-semibold text-ink/60 uppercase tracking-widest mb-2";

/* ─── Step config ──────────────────────────────────────────────────── */
const STEPS = [
  { id: 1, label: "Basics", icon: BookPlus },
  { id: 2, label: "Schedule", icon: Calendar },
  { id: 3, label: "Access", icon: Lock },
];

const LEVEL_OPTIONS = ["Beginner", "Intermediate", "Advanced", "All levels"];
const TAG_SUGGESTIONS = [
  "AI",
  "LLM",
  "RAG",
  "Agents",
  "Vector DB",
  "Embeddings",
  "Prompt Engineering",
  "Fine-tuning",
  "MLOps",
  "Python",
  "LangChain",
  "OpenAI",
];

export default function NewClassPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [step, setStep] = useState(1);

  /* ── Core fields ── */
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

  /* ── New enrichment fields ── */
  const [level, setLevel] = useState("All levels");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ── AI helpers ── */
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiField, setAiField] = useState<"title" | "description" | "content" | null>(null);

  /* ── Form state ── */
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  /* ─── Auth guard ─────────────────────────────────────────────────── */
  if (status === "loading") {
    return (
      <div className="max-w-4xl mx-auto py-32 text-center">
        <div className="w-10 h-10 rounded-full border-2 border-gold border-t-transparent animate-spin mx-auto mb-3" />
        <p className="text-ink/50 text-sm">Verifying instructor access…</p>
      </div>
    );
  }

  const role = session?.user?.role;
  const isAdmin = isAdminRole(role);
  if (!canCreateClasses(role)) {
    return (
      <div className="max-w-xl mx-auto my-20 p-10 rounded-3xl bg-black-raised/80 backdrop-blur-sm border border-white/[0.07] text-center space-y-5 shadow-lg">
        <div className="w-16 h-16 rounded-2xl bg-orange/10 flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8 text-orange" />
        </div>
        <h2 className="font-serif text-2xl font-bold text-ink">Instructor Access Required</h2>
        <p className="text-sm text-ink/60">Only instructors and administrators can author new academy classes.</p>
        <Link
          href="/courses"
          className="inline-block px-6 py-3 rounded-xl bg-orange text-white text-sm font-semibold hover:bg-orange-600 transition-colors"
        >
          Browse Classes
        </Link>
      </div>
    );
  }

  /* ─── Helpers ────────────────────────────────────────────────────── */
  function addTag(tag: string) {
    const t = tag.trim();
    if (t && !tags.includes(t) && tags.length < 8) {
      setTags([...tags, t]);
    }
    setTagInput("");
  }

  function removeTag(t: string) {
    setTags(tags.filter((x) => x !== t));
  }

  function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  }

  async function generateWithAi(field: "title" | "description" | "content") {
    const topic = title || tagInput || tags.join(", ");
    if (!topic && field !== "title") return;
    setAiGenerating(true);
    setAiField(field);
    try {
      const res = await fetch("/api/ai/lesson-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: "new",
          title: field === "title" ? (tags.join(", ") || "AI Engineering Course") : title,
          brief:
            field === "description"
              ? `Write a compelling 2-3 sentence course overview. Tags: ${tags.join(", ")}. Level: ${level}.`
              : field === "content"
              ? `Write a detailed course syllabus with weekly modules for: ${title || tags.join(", ")}`
              : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "AI generation failed");
      if (field === "title") setTitle(data.draft?.summary || data.draft?.title || title);
      if (field === "description") setDescription(data.draft?.summary || description);
      if (field === "content") setContent(data.draft?.content || content);
    } catch {
      /* silently fallback */
    } finally {
      setAiGenerating(false);
      setAiField(null);
    }
  }

  /* ─── Step validation ─────────────────────────────────────────────── */
  function canProceed() {
    if (step === 1) return title.trim().length >= 3 && description.trim().length >= 10;
    if (step === 2) return !!schedule;
    return true;
  }

  /* ─── Submit ─────────────────────────────────────────────────────── */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/courses", {
        method: "POST",
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
          password: isPasswordProtected ? password : undefined,
          instructorId: isAdmin && instructorId ? instructorId : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Failed to create class");
        setLoading(false);
        return;
      }
      router.push(`/courses/${data.course.id}/edit?created=1#lessons`);
      router.refresh();
    } catch {
      setErrorMsg("An unexpected network error occurred.");
      setLoading(false);
    }
  }

  /* ─── Render ─────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-black to-black-raised/50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-8">

        {/* ── Back nav ── */}
        <Link
          href="/courses"
          className="inline-flex items-center gap-1.5 text-xs text-ink/50 hover:text-gold transition-colors font-medium group"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          Back to Classes
        </Link>

        {/* ── Hero header ── */}
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange/10 border border-orange/20 flex items-center justify-center">
              <BookPlus className="w-5 h-5 text-orange" />
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-ink">
              Create New Class
            </h1>
          </div>
          <p className="text-sm text-ink/50 pl-[52px]">Design your curriculum, configure access, and launch for students.</p>
        </div>

        {/* ── Step indicator ── */}
        <div className="flex items-center gap-0">
          {STEPS.map((s, i) => (
            <React.Fragment key={s.id}>
              <button
                type="button"
                onClick={() => step > s.id - 1 && setStep(s.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all
                  ${step === s.id
                    ? "bg-orange text-white shadow-lg shadow-orange/20"
                    : step > s.id
                    ? "text-orange cursor-pointer"
                    : "text-ink/30 cursor-default"
                  }`}
              >
                {step > s.id ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <s.icon className="w-4 h-4" />
                )}
                {s.label}
              </button>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-px mx-2 transition-colors ${step > s.id ? "bg-orange/40" : "bg-white/10"}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* ── Error banner ── */}
        {errorMsg && (
          <div className="flex items-center gap-2.5 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {errorMsg}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════
            STEP 1 — Basics
        ════════════════════════════════════════════════════════════ */}
        {step === 1 && (
          <div className="space-y-6 p-7 sm:p-9 rounded-3xl bg-black-raised/80 backdrop-blur-sm border border-white/[0.07] shadow-xl shadow-black/40">

            {/* Cover image */}
            <div>
              <label className={labelClass}>Cover Image (optional)</label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed cursor-pointer transition-all overflow-hidden
                  ${coverPreview ? "border-white/10 h-44" : "border-white/10 hover:border-orange/30 h-32 bg-white/[0.02] hover:bg-orange/5"}`}
              >
                {coverPreview ? (
                  <>
                    <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <span className="text-white text-xs font-semibold">Change cover</span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setCoverPreview(null); setCoverFile(null); }}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-ink/40">
                    <ImageIcon className="w-8 h-8" />
                    <span className="text-xs">Click to upload cover · 16:9 recommended</span>
                  </div>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
              </div>
            </div>

            {/* Title */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className={`${labelClass} mb-0`}>Class Title *</label>
                <button
                  type="button"
                  onClick={() => generateWithAi("title")}
                  disabled={aiGenerating}
                  className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-ink/50 hover:text-orange transition-colors disabled:opacity-40 uppercase tracking-wider"
                >
                  {aiGenerating && aiField === "title" ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Wand2 className="w-3 h-3" />
                  )}
                  AI Suggest
                </button>
              </div>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Advanced RAG Pipelines & Reranking Strategies"
                className={fieldClass}
              />
              <p className="text-[11px] text-ink/40 mt-1.5">{title.length}/120 characters</p>
            </div>

            {/* Description */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className={`${labelClass} mb-0`}>Short Description *</label>
                <button
                  type="button"
                  onClick={() => generateWithAi("description")}
                  disabled={aiGenerating || title.length < 3}
                  title={title.length < 3 ? "Add a title first" : ""}
                  className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-ink/50 hover:text-orange transition-colors disabled:opacity-40 uppercase tracking-wider"
                >
                  {aiGenerating && aiField === "description" ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Wand2 className="w-3 h-3" />
                  )}
                  AI Draft
                </button>
              </div>
              <textarea
                rows={3}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="A compelling 2-3 sentence overview of the class topics, outcomes, and target audience…"
                className={`${fieldClass} resize-none`}
              />
            </div>

            {/* Tags */}
            <div>
              <label className={labelClass}>
                <Tag className="inline w-3 h-3 mr-1 -mt-0.5" />
                Topics & Tags
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-orange/10 border border-orange/20 text-orange text-xs font-medium"
                  >
                    {t}
                    <button type="button" onClick={() => removeTag(t)} className="hover:text-orange-400">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                {tags.length < 8 && (
                  <input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === ",") {
                        e.preventDefault();
                        addTag(tagInput);
                      }
                    }}
                    placeholder="Add topic…"
                    className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-ink focus:border-orange/30 outline-none w-28"
                  />
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {TAG_SUGGESTIONS.filter((s) => !tags.includes(s)).slice(0, 8).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => addTag(s)}
                    className="px-2.5 py-1 rounded-full bg-white/[0.03] border border-white/10 text-[10px] text-ink/50 hover:text-orange hover:border-orange/30 transition-colors"
                  >
                    + {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Level */}
            <div>
              <label className={labelClass}>
                <Users className="inline w-3 h-3 mr-1 -mt-0.5" />
                Difficulty Level
              </label>
              <div className="grid grid-cols-4 gap-2">
                {LEVEL_OPTIONS.map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setLevel(l)}
                    className={`py-2 rounded-xl text-xs font-semibold border transition-all
                      ${level === l
                        ? "bg-orange/10 border-orange/40 text-orange"
                        : "border-white/10 text-ink/50 hover:border-white/20 hover:text-ink/80"
                      }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>

            {/* Syllabus / Course Materials */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className={`${labelClass} mb-0`}>
                  Syllabus & Course Materials
                  <span className="ml-2 text-ink/30 normal-case tracking-normal font-normal">optional</span>
                </label>
                <button
                  type="button"
                  onClick={() => generateWithAi("content")}
                  disabled={aiGenerating || title.length < 3}
                  className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-ink/50 hover:text-orange transition-colors disabled:opacity-40 uppercase tracking-wider"
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
                rows={6}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Week-by-week curriculum, learning resources, download links, supplementary reading…"
                className={`${fieldClass} font-mono text-[13px] resize-none leading-relaxed`}
              />
              <p className="text-[11px] text-ink/40 mt-1.5">
                Protected content — only shown to enrolled or authorized students.
              </p>
            </div>

            {/* Admin — instructor override */}
            {isAdmin && (
              <div className="p-4 rounded-2xl bg-orange/[0.04] border border-orange/15">
                <label className={labelClass}>Teaching Instructor</label>
                <InstructorSelect value={instructorId} onChange={setInstructorId} />
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════
            STEP 2 — Schedule & Duration & Price
        ════════════════════════════════════════════════════════════ */}
        {step === 2 && (
          <div className="space-y-6 p-7 sm:p-9 rounded-3xl bg-black-raised/80 backdrop-blur-sm border border-white/[0.07] shadow-xl shadow-black/40">
            <div>
              <h2 className="font-serif text-xl text-ink mb-1">Session Schedule</h2>
              <p className="text-xs text-ink/50">Set when this class meets. You can update this later.</p>
            </div>

            {/* Date & time */}
            <div>
              <label className={labelClass}>
                <Calendar className="inline w-3 h-3 mr-1 -mt-0.5" />
                Date & Start Time *
              </label>
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
              <label className={labelClass}>
                <Clock className="inline w-3 h-3 mr-1 -mt-0.5" />
                Session Duration
              </label>
              <div className="grid grid-cols-4 gap-3">
                {[30, 60, 90, 120].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDurationMinutes(d)}
                    className={`py-3 rounded-xl text-sm font-semibold border transition-all
                      ${durationMinutes === d
                        ? "bg-orange/10 border-orange/40 text-orange"
                        : "border-white/10 text-ink/50 hover:border-white/20 hover:text-ink/80"
                      }`}
                  >
                    {d < 60 ? `${d}m` : `${d / 60}h`}
                  </button>
                ))}
              </div>
              <div className="relative mt-3">
                <input
                  type="number"
                  min={15}
                  max={360}
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className={`${fieldClass} pl-11`}
                  placeholder="Custom minutes…"
                />
                <Clock className="absolute left-3.5 top-3.5 w-4 h-4 text-ink/30 pointer-events-none" />
                <span className="absolute right-3.5 top-3.5 text-xs text-ink/30">min</span>
              </div>
            </div>

            {/* Price */}
            <div className="p-5 rounded-2xl border border-white/[0.07] bg-white/[0.02] space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-ink">Pricing</p>
                  <p className="text-xs text-ink/50 mt-0.5">Set to 0 for a free class</p>
                </div>
                <span className={`text-xs px-3 py-1 rounded-full font-semibold ${price === 0 ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-orange/10 text-orange border border-orange/20"}`}>
                  {price === 0 ? "Free" : `$${price} USD`}
                </span>
              </div>
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
              <div className="flex gap-2">
                {[0, 29, 49, 99].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPrice(p)}
                    className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all
                      ${price === p
                        ? "bg-orange/10 border-orange/40 text-orange"
                        : "border-white/10 text-ink/40 hover:border-white/20 hover:text-ink/70"
                      }`}
                  >
                    {p === 0 ? "Free" : `$${p}`}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════
            STEP 3 — Access Controls & Review
        ════════════════════════════════════════════════════════════ */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="p-7 sm:p-9 rounded-3xl bg-black-raised/80 backdrop-blur-sm border border-white/[0.07] shadow-xl shadow-black/40 space-y-5">
              <div>
                <h2 className="font-serif text-xl text-ink mb-1">Access Controls</h2>
                <p className="text-xs text-ink/50">Decide who can see and enroll in this class.</p>
              </div>

              {/* Subscriber only */}
              <div
                onClick={() => setIsSubscriberOnly(!isSubscriberOnly)}
                className={`flex items-center justify-between p-5 rounded-2xl border cursor-pointer transition-all
                  ${isSubscriberOnly ? "border-orange/30 bg-orange/[0.05]" : "border-white/[0.07] bg-white/[0.02] hover:border-white/15"}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors
                    ${isSubscriberOnly ? "bg-orange/10 text-orange" : "bg-white/5 text-ink/40"}`}>
                    <Star className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-ink">Subscriber Only</p>
                    <p className="text-xs text-ink/50 mt-0.5">Restrict to users with Subscriber or Admin tiers</p>
                  </div>
                </div>
                <div className={`w-11 h-6 rounded-full relative transition-colors ${isSubscriberOnly ? "bg-orange" : "bg-white/10"}`}>
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${isSubscriberOnly ? "translate-x-6" : "translate-x-1"}`} />
                </div>
              </div>

              {/* Password protected */}
              <div className={`rounded-2xl border transition-all ${isPasswordProtected ? "border-orange/30 bg-orange/[0.05]" : "border-white/[0.07] bg-white/[0.02]"}`}>
                <div
                  onClick={() => setIsPasswordProtected(!isPasswordProtected)}
                  className="flex items-center justify-between p-5 cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors
                      ${isPasswordProtected ? "bg-orange/10 text-orange" : "bg-white/5 text-ink/40"}`}>
                      <Lock className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-ink">Password Protected</p>
                      <p className="text-xs text-ink/50 mt-0.5">Require a secret access key to enroll</p>
                    </div>
                  </div>
                  <div className={`w-11 h-6 rounded-full relative transition-colors ${isPasswordProtected ? "bg-orange" : "bg-white/10"}`}>
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${isPasswordProtected ? "translate-x-6" : "translate-x-1"}`} />
                  </div>
                </div>
                {isPasswordProtected && (
                  <div className="px-5 pb-5">
                    <label className={labelClass}>Secret Access Password</label>
                    <input
                      type="password"
                      required={isPasswordProtected}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Set secret class access password…"
                      className={`${fieldClass} border-orange/20`}
                    />
                    <p className="text-[11px] text-ink/40 mt-1.5">Securely stored with bcrypt — not reversible.</p>
                  </div>
                )}
              </div>

              {/* Visibility badge */}
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.07]">
                <Globe className="w-4 h-4 text-ink/40 shrink-0" />
                <p className="text-xs text-ink/60 leading-relaxed">
                  {isSubscriberOnly && isPasswordProtected
                    ? "This class is subscriber-only AND password-protected — maximum restriction."
                    : isSubscriberOnly
                    ? "Subscribers and admins only. Free users will see it but can't enroll."
                    : isPasswordProtected
                    ? "Anyone with the password key can enroll — useful for cohort invites."
                    : "Publicly enrollable — any registered user can join."}
                </p>
              </div>
            </div>

            {/* ── Summary review card ── */}
            <div className="p-6 rounded-2xl border border-white/[0.07] bg-white/[0.02] space-y-4">
              <h3 className="text-xs font-bold text-ink/50 uppercase tracking-widest">Review Summary</h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-ink/40 mb-0.5">Title</p>
                  <p className="text-ink font-medium truncate">{title || "—"}</p>
                </div>
                <div>
                  <p className="text-ink/40 mb-0.5">Schedule</p>
                  <p className="text-ink font-medium">{schedule ? new Date(schedule).toLocaleString() : "—"}</p>
                </div>
                <div>
                  <p className="text-ink/40 mb-0.5">Duration</p>
                  <p className="text-ink font-medium">{durationMinutes} min</p>
                </div>
                <div>
                  <p className="text-ink/40 mb-0.5">Price</p>
                  <p className="text-ink font-medium">{price === 0 ? "Free" : `$${price} USD`}</p>
                </div>
                {tags.length > 0 && (
                  <div className="col-span-2">
                    <p className="text-ink/40 mb-1">Tags</p>
                    <div className="flex flex-wrap gap-1.5">
                      {tags.map((t) => (
                        <span key={t} className="px-2 py-0.5 rounded-full bg-orange/10 border border-orange/20 text-orange text-[10px]">{t}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Navigation buttons ── */}
        <div className="flex items-center gap-3">
          {step > 1 && (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="px-6 py-3 rounded-xl border border-white/10 text-sm font-medium text-ink/60 hover:bg-white/5 hover:text-ink transition-colors"
            >
              Back
            </button>
          )}

          {step < STEPS.length ? (
            <button
              type="button"
              disabled={!canProceed()}
              onClick={() => setStep(step + 1)}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-orange hover:bg-orange-600 text-white font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-orange/20"
            >
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <form onSubmit={handleSubmit} className="flex-1">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl bg-orange hover:bg-orange-600 text-white font-bold text-sm transition-all disabled:opacity-50 shadow-lg shadow-orange/20"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Publishing…</>
                ) : (
                  <><Sparkles className="w-4 h-4" /> Publish Class & Add Lessons</>
                )}
              </button>
            </form>
          )}

          {step === 1 && (
            <Link
              href="/courses"
              className="px-5 py-3 rounded-xl border border-white/10 text-sm font-medium text-ink/50 hover:bg-white/5 transition-colors"
            >
              Cancel
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
