"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowDown,
  ArrowUp,
  Eye,
  EyeOff,
  ExternalLink,
  Pencil,
  Plus,
  PlayCircle,
  Save,
  Sparkles,
  Trash2,
  Upload,
  X,
  Link2,
  FileText,
  Video,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  GripVertical,
  BookOpen,
  Wand2,
  RefreshCw,
} from "lucide-react";
import { useAiEnabled } from "@/components/ai/useAi";
import { AiSetupNotice } from "@/components/ai/AiSetupNotice";
import { AI_NOT_CONFIGURED_CODE } from "@/lib/ai/constants";
import { CourseAiContextCard } from "./CourseAiContextCard";

const MAX_DOCUMENT_CHARS = 20_000;

interface Lesson {
  id: string;
  title: string;
  summary: string | null;
  content: string | null;
  videoUrl: string | null;
  durationMinutes: number | null;
  isPreview: boolean;
  order: number;
  approvalStatus?: string;
  rejectionReason?: string | null;
  authorId?: string | null;
  authorName?: string | null;
  showAuthor?: boolean;
  canClaimAuthorship?: boolean;
}

interface Draft {
  title: string;
  summary: string;
  content: string;
  videoUrl: string;
  durationMinutes: string;
  isPreview: boolean;
  showAuthor: boolean;
  /** Additional resource links the instructor pastes */
  resourceLinks: ResourceLink[];
}

interface ResourceLink {
  label: string;
  url: string;
}

const EMPTY_DRAFT: Draft = {
  title: "",
  summary: "",
  content: "",
  videoUrl: "",
  durationMinutes: "",
  isPreview: false,
  showAuthor: true,
  resourceLinks: [],
};

/* ── Design tokens ─────────────────────────────────────────────────── */
const fieldClass =
  "w-full px-4 py-3 rounded-xl border border-white/10 focus:border-gold focus:ring-1 focus:ring-gold/50 text-ink text-sm bg-black/50 outline-none transition-all placeholder:text-ink/30";
const labelClass =
  "block text-[11px] font-semibold text-ink/50 uppercase tracking-widest mb-1.5";

/* ── Tabs for the lesson editor ──────────────────────────────────────  */
type EditorTab = "content" | "video" | "resources";

/* ─────────────────────────────────────────────────────────────────────
   Main component
─────────────────────────────────────────────────────────────────────── */
export function LessonManager({ courseId }: { courseId: string }) {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | "new" | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drafting, setDrafting] = useState(false);
  const [editorTab, setEditorTab] = useState<EditorTab>("content");
  const aiEnabled = useAiEnabled();

  /* ── AI generator state ── */
  const [genTopic, setGenTopic] = useState("");
  const [genFileName, setGenFileName] = useState<string | null>(null);
  const [genDocText, setGenDocText] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [genNeedsSetup, setGenNeedsSetup] = useState(false);
  const [justCreatedId, setJustCreatedId] = useState<string | null>(null);
  const [genShowAuthor, setGenShowAuthor] = useState(true);
  const [showAiPanel, setShowAiPanel] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [claimAuthorship, setClaimAuthorship] = useState(false);

  /* ── Load ────────────────────────────────────────────────────────── */
  const load = useCallback(async () => {
    const res = await fetch(`/api/courses/${courseId}/lessons`);
    if (res.ok) {
      const data = await res.json();
      setLessons(data.lessons || []);
    } else {
      setError("Failed to load lessons");
    }
    setLoading(false);
  }, [courseId]);

  useEffect(() => {
    load();
  }, [load]);

  /* ── File upload for AI context ─────────────────────────────────── */
  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "").slice(0, MAX_DOCUMENT_CHARS);
      setGenDocText(text);
      setGenFileName(file.name);
    };
    reader.readAsText(file);
  }

  /* ── AI generate whole lesson ───────────────────────────────────── */
  async function generateLesson() {
    if (!genTopic.trim()) return;
    setGenerating(true);
    setGenError(null);
    setGenNeedsSetup(false);
    setJustCreatedId(null);
    try {
      const res = await fetch(`/api/courses/${courseId}/lessons/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: genTopic.trim(),
          documentText: genDocText || undefined,
          showAuthor: genShowAuthor,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data?.code === AI_NOT_CONFIGURED_CODE) setGenNeedsSetup(true);
        throw new Error(data.error || "Couldn't generate a lesson");
      }
      setGenTopic("");
      setGenDocText(null);
      setGenFileName(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setJustCreatedId(data.lesson.id);
      load();
    } catch (err) {
      setGenError((err as Error).message);
    } finally {
      setGenerating(false);
    }
  }

  /* ── AI draft notes for manual lesson ──────────────────────────── */
  async function draftWithAi() {
    if (draft.title.trim().length < 3) {
      setError("Enter a lesson title first (min 3 characters).");
      return;
    }
    if (draft.content.trim() && !confirm("Replace the current notes with an AI draft?")) return;
    setDrafting(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/lesson-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId, title: draft.title, brief: draft.summary || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "The lesson writer failed");
      setDraft((d) => ({
        ...d,
        summary: data.draft.summary,
        content: data.draft.content,
        durationMinutes: d.durationMinutes || String(data.draft.durationMinutes),
      }));
      setEditorTab("content");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setDrafting(false);
    }
  }

  /* ── CRUD ────────────────────────────────────────────────────────── */
  function startNew() {
    setDraft(EMPTY_DRAFT);
    setEditingId("new");
    setEditingLesson(null);
    setClaimAuthorship(false);
    setEditorTab("content");
    setError(null);
  }

  function startEdit(lesson: Lesson) {
    setDraft({
      title: lesson.title,
      summary: lesson.summary || "",
      content: lesson.content || "",
      videoUrl: lesson.videoUrl || "",
      durationMinutes: lesson.durationMinutes ? String(lesson.durationMinutes) : "",
      isPreview: lesson.isPreview,
      showAuthor: lesson.showAuthor ?? true,
      resourceLinks: [],
    });
    setEditingId(lesson.id);
    setEditingLesson(lesson);
    setClaimAuthorship(false);
    setEditorTab("content");
    setError(null);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const payload: Record<string, unknown> = {
      title: draft.title,
      summary: draft.summary,
      content: draft.content,
      videoUrl: draft.videoUrl,
      durationMinutes: draft.durationMinutes ? Number(draft.durationMinutes) : null,
      isPreview: draft.isPreview,
      showAuthor: draft.showAuthor,
    };
    if (claimAuthorship) payload.claimAuthorship = true;
    const isNew = editingId === "new";
    const res = await fetch(
      isNew ? `/api/courses/${courseId}/lessons` : `/api/courses/${courseId}/lessons/${editingId}`,
      {
        method: isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(data.error || "Failed to save lesson");
      return;
    }
    setEditingId(null);
    setEditingLesson(null);
    setClaimAuthorship(false);
    load();
  }

  async function remove(lesson: Lesson) {
    if (!confirm(`Delete "${lesson.title}"? Student progress will be removed.`)) return;
    setBusy(true);
    const res = await fetch(`/api/courses/${courseId}/lessons/${lesson.id}`, { method: "DELETE" });
    setBusy(false);
    if (!res.ok) {
      setError("Failed to delete lesson");
      return;
    }
    if (editingId === lesson.id) setEditingId(null);
    load();
  }

  async function move(index: number, delta: -1 | 1) {
    const target = index + delta;
    if (target < 0 || target >= lessons.length) return;
    const next = [...lessons];
    [next[index], next[target]] = [next[target], next[index]];
    setLessons(next);
    const res = await fetch(`/api/courses/${courseId}/lessons/reorder`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lessonIds: next.map((l) => l.id) }),
    });
    if (!res.ok) {
      setError("Failed to save the new order");
      load();
    }
  }

  /* ── Resource links helper ──────────────────────────────────────── */
  function addResourceLink() {
    setDraft((d) => ({
      ...d,
      resourceLinks: [...d.resourceLinks, { label: "", url: "" }],
    }));
  }

  function updateResourceLink(i: number, field: "label" | "url", value: string) {
    setDraft((d) => {
      const links = [...d.resourceLinks];
      links[i] = { ...links[i], [field]: value };
      return { ...d, resourceLinks: links };
    });
  }

  function removeResourceLink(i: number) {
    setDraft((d) => ({
      ...d,
      resourceLinks: d.resourceLinks.filter((_, idx) => idx !== i),
    }));
  }

  /* ─────────────────────────────────────────────────────────────────
     Lesson editor form
  ───────────────────────────────────────────────────────────────────  */
  const editorForm = (
    <form
      onSubmit={save}
      className="rounded-2xl border border-orange/20 bg-gradient-to-b from-orange/[0.04] to-transparent overflow-hidden shadow-xl"
    >
      {/* Editor header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-orange/10 flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-orange" />
          </div>
          <h3 className="font-serif text-lg text-ink">
            {editingId === "new" ? "New Lesson" : "Edit Lesson"}
          </h3>
        </div>
        <button
          type="button"
          onClick={() => setEditingId(null)}
          className="p-1.5 rounded-lg text-ink/40 hover:text-ink hover:bg-white/5 transition-colors"
          aria-label="Cancel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-5 sm:p-6 space-y-5">
        {/* Title + AI draft */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className={`${labelClass} mb-0`}>Lesson Title *</label>
            {aiEnabled && (
              <button
                type="button"
                onClick={draftWithAi}
                disabled={drafting}
                className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-ink/50 hover:text-orange transition-colors disabled:opacity-40 uppercase tracking-wider"
              >
                {drafting ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Wand2 className="w-3 h-3" />
                )}
                {drafting ? "Drafting…" : "AI Draft Notes"}
              </button>
            )}
          </div>
          <input
            required
            minLength={3}
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            className={fieldClass}
            placeholder="e.g. Building a Hybrid Retrieval Pipeline"
          />
        </div>

        {/* Summary */}
        <div>
          <label className={labelClass}>One-line Summary</label>
          <input
            value={draft.summary}
            onChange={(e) => setDraft({ ...draft, summary: e.target.value })}
            className={fieldClass}
            maxLength={300}
            placeholder="Brief description shown in the lesson list…"
          />
        </div>

        {/* Duration */}
        <div>
          <label className={labelClass}>
            <Clock className="inline w-3 h-3 mr-1 -mt-0.5" />
            Duration (min)
          </label>
          <div className="flex items-center gap-3">
            {[10, 20, 30, 45, 60].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDraft({ ...draft, durationMinutes: String(d) })}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all
                  ${String(d) === draft.durationMinutes
                    ? "bg-orange/10 border-orange/30 text-orange"
                    : "border-white/10 text-ink/40 hover:border-white/20 hover:text-ink/70"
                  }`}
              >
                {d}m
              </button>
            ))}
            <input
              type="number"
              min={1}
              max={600}
              value={draft.durationMinutes}
              onChange={(e) => setDraft({ ...draft, durationMinutes: e.target.value })}
              className="w-20 px-3 py-1.5 rounded-lg border border-white/10 text-xs text-ink bg-black/50 outline-none focus:border-gold/40"
              placeholder="Custom"
            />
          </div>
        </div>

        {/* Tabbed editor */}
        <div>
          <div className="flex gap-1 mb-3 p-1 rounded-xl bg-white/[0.03] border border-white/[0.07] w-fit">
            {(
              [
                { id: "content" as EditorTab, label: "Notes", icon: FileText },
                { id: "video" as EditorTab, label: "Video", icon: Video },
                { id: "resources" as EditorTab, label: "Links", icon: Link2 },
              ] as const
            ).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setEditorTab(id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all
                  ${editorTab === id
                    ? "bg-orange/15 text-orange border border-orange/20 shadow-sm"
                    : "text-ink/40 hover:text-ink/70"
                  }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>

          {/* Notes tab */}
          {editorTab === "content" && (
            <div className="space-y-2">
              <textarea
                required
                minLength={10}
                rows={9}
                value={draft.content}
                onChange={(e) => setDraft({ ...draft, content: e.target.value })}
                className={`${fieldClass} leading-relaxed font-mono text-[13px]`}
                placeholder={"Teaching notes, readings, exercises, code snippets…\n\nMarkdown is supported."}
              />
              <p className="text-[11px] text-ink/30">{draft.content.length} characters · Markdown supported</p>
            </div>
          )}

          {/* Video tab */}
          {editorTab === "video" && (
            <div className="space-y-3">
              <div>
                <label className={labelClass}>Video URL</label>
                <div className="relative">
                  <input
                    type="url"
                    value={draft.videoUrl}
                    onChange={(e) => setDraft({ ...draft, videoUrl: e.target.value })}
                    className={`${fieldClass} pl-10`}
                    placeholder="https://youtube.com/watch?v=… or Vimeo, Loom, direct file…"
                  />
                  <Video className="absolute left-3.5 top-3.5 w-4 h-4 text-ink/30 pointer-events-none" />
                </div>
              </div>
              {draft.videoUrl && (
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.07] flex items-center gap-3">
                  <PlayCircle className="w-5 h-5 text-orange shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-ink/60">Video linked</p>
                    <a
                      href={draft.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-orange hover:underline truncate block"
                    >
                      {draft.videoUrl}
                    </a>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDraft({ ...draft, videoUrl: "" })}
                    className="ml-auto p-1.5 rounded-lg text-ink/30 hover:text-ink/60 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                <p className="text-xs text-ink/40 font-semibold uppercase tracking-wide mb-2">Supported platforms</p>
                <div className="flex flex-wrap gap-2">
                  {["YouTube", "Vimeo", "Loom", "Wistia", "Direct MP4"].map((p) => (
                    <span key={p} className="px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.06] text-[10px] text-ink/40">{p}</span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Resources / links tab */}
          {editorTab === "resources" && (
            <div className="space-y-3">
              {draft.resourceLinks.length === 0 ? (
                <div className="text-center py-8 rounded-xl border border-dashed border-white/10 text-ink/30 text-sm">
                  <Link2 className="w-6 h-6 mx-auto mb-2 opacity-40" />
                  No resource links yet
                </div>
              ) : (
                <div className="space-y-2">
                  {draft.resourceLinks.map((link, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        value={link.label}
                        onChange={(e) => updateResourceLink(i, "label", e.target.value)}
                        className="w-32 px-3 py-2.5 rounded-xl border border-white/10 text-sm text-ink bg-black/50 outline-none focus:border-gold/40"
                        placeholder="Label"
                      />
                      <input
                        type="url"
                        value={link.url}
                        onChange={(e) => updateResourceLink(i, "url", e.target.value)}
                        className="flex-1 px-3 py-2.5 rounded-xl border border-white/10 text-sm text-ink bg-black/50 outline-none focus:border-gold/40"
                        placeholder="https://…"
                      />
                      <button
                        type="button"
                        onClick={() => removeResourceLink(i)}
                        className="p-2.5 rounded-xl text-ink/30 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <button
                type="button"
                onClick={addResourceLink}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-dashed border-white/15 text-xs text-ink/50 hover:text-orange hover:border-orange/30 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add resource link
              </button>
            </div>
          )}
        </div>

        {/* Checkboxes */}
        <div className="flex flex-wrap gap-4 pt-1">
          <label
            className={`flex items-center gap-2.5 text-sm cursor-pointer select-none transition-colors rounded-lg
              ${draft.isPreview ? "text-orange" : "text-ink/60 hover:text-ink/80"}`}
          >
            <div
              onClick={() => setDraft({ ...draft, isPreview: !draft.isPreview })}
              className={`w-5 h-5 rounded flex items-center justify-center border transition-colors shrink-0
                ${draft.isPreview ? "bg-orange border-orange" : "border-white/20 bg-black/40"}`}
            >
              {draft.isPreview && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
            </div>
            <Eye className="w-3.5 h-3.5" />
            Free preview (visible without enrollment)
          </label>

          <label
            className={`flex items-center gap-2.5 text-sm cursor-pointer select-none transition-colors rounded-lg
              ${draft.showAuthor ? "text-ink/80" : "text-ink/40 hover:text-ink/60"}`}
          >
            <div
              onClick={() => setDraft({ ...draft, showAuthor: !draft.showAuthor })}
              className={`w-5 h-5 rounded flex items-center justify-center border transition-colors shrink-0
                ${draft.showAuthor ? "bg-orange border-orange" : "border-white/20 bg-black/40"}`}
            >
              {draft.showAuthor && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
            </div>
            Show my name as author
          </label>
        </div>

        {editingLesson?.canClaimAuthorship && (
          <label className="flex items-center gap-2.5 text-sm text-ink/60 cursor-pointer select-none hover:text-ink/80 transition-colors">
            <div
              onClick={() => setClaimAuthorship(!claimAuthorship)}
              className={`w-5 h-5 rounded flex items-center justify-center border transition-colors shrink-0
                ${claimAuthorship ? "bg-orange border-orange" : "border-white/20 bg-black/40"}`}
            >
              {claimAuthorship && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
            </div>
            Credit me as the author instead of {editingLesson.authorName || "the current author"}
          </label>
        )}

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-1">
          <button
            type="button"
            onClick={() => setEditingId(null)}
            className="px-5 py-2.5 rounded-xl border border-white/10 text-sm text-ink/50 hover:text-ink hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-orange hover:bg-orange-600 text-white text-sm font-semibold transition-colors disabled:opacity-50 shadow-lg shadow-orange/20"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {busy ? "Saving…" : editingId === "new" ? "Add Lesson" : "Save Changes"}
          </button>
        </div>
      </div>
    </form>
  );

  /* ─────────────────────────────────────────────────────────────────
     Main render
  ───────────────────────────────────────────────────────────────────  */
  return (
    <section id="lessons" className="space-y-6 scroll-mt-28">

      {/* ── AI generate panel ──────────────────────────────────────── */}
      <div className="rounded-3xl bg-black-raised/80 backdrop-blur-sm border border-white/[0.07] overflow-hidden shadow-xl shadow-black/30">
        {/* AI panel header (collapsible) */}
        <button
          type="button"
          onClick={() => setShowAiPanel(!showAiPanel)}
          className="w-full flex items-center justify-between p-5 sm:p-6 hover:bg-white/[0.02] transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange/10 border border-orange/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-orange" />
            </div>
            <div className="text-left">
              <h3 className="font-serif text-lg text-ink">AI Lesson Generator</h3>
              <p className="text-xs text-ink/40 mt-0.5">Type a topic or paste notes → AI creates a full lesson</p>
            </div>
          </div>
          {showAiPanel ? (
            <ChevronUp className="w-4 h-4 text-ink/30 group-hover:text-ink/60 transition-colors" />
          ) : (
            <ChevronDown className="w-4 h-4 text-ink/30 group-hover:text-ink/60 transition-colors" />
          )}
        </button>

        {showAiPanel && (
          <div className="px-5 sm:px-6 pb-6 space-y-4 border-t border-white/[0.05]">
            <CourseAiContextCard courseId={courseId} />

            {/* Topic textarea */}
            <div className="mt-4">
              <label className={labelClass}>Topic or Paste Notes</label>
              <textarea
                value={genTopic}
                onChange={(e) => setGenTopic(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.metaKey || e.ctrlKey) && e.key === "Enter") generateLesson();
                }}
                rows={4}
                placeholder={`Type a topic, outline, or paste raw notes to generate a full lesson…\n\n"Retrieval-Augmented Generation — dense vs sparse retrieval, reranking with cross-encoders"`}
                className={`${fieldClass} leading-relaxed`}
              />
            </div>

            {/* Attached doc */}
            {genFileName ? (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.07]">
                <FileText className="w-4 h-4 text-orange shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-ink font-medium truncate">{genFileName}</p>
                  <p className="text-[10px] text-ink/40">{genDocText?.length.toLocaleString()} chars attached</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setGenFileName(null);
                    setGenDocText(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="p-1.5 rounded-lg text-ink/30 hover:text-ink/60 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : null}

            {/* Controls row */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {/* Upload doc button */}
                <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-xs font-semibold text-ink/50 hover:text-orange hover:border-orange/20 transition-colors">
                  <Upload className="w-3.5 h-3.5" />
                  Attach Document
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".txt,.md,.markdown,.mdx,.pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>

                {/* Show author toggle */}
                <label className="inline-flex items-center gap-2 text-[11px] text-ink/40 cursor-pointer select-none hover:text-ink/60 transition-colors">
                  <div
                    onClick={() => setGenShowAuthor(!genShowAuthor)}
                    className={`w-8 h-4.5 rounded-full relative transition-colors ${genShowAuthor ? "bg-orange" : "bg-white/10"}`}
                    style={{ height: "18px" }}
                  >
                    <div className={`absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white shadow transition-transform ${genShowAuthor ? "translate-x-4" : "translate-x-0.5"}`} />
                  </div>
                  Credit me as author
                </label>

                <span className="hidden sm:inline text-[10px] text-ink/30">⌘/Ctrl + Enter to generate</span>
              </div>

              {/* Generate button */}
              <button
                type="button"
                onClick={generateLesson}
                disabled={generating || !genTopic.trim()}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-orange hover:bg-orange-600 text-white text-sm font-semibold transition-colors disabled:opacity-40 shadow-lg shadow-orange/20"
              >
                {generating ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</>
                ) : (
                  <><Sparkles className="w-4 h-4" /> Generate Lesson</>
                )}
              </button>
            </div>

            {/* Status messages */}
            {genNeedsSetup ? (
              <AiSetupNotice />
            ) : genError ? (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {genError}
              </div>
            ) : justCreatedId ? (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                Lesson created!{" "}
                <Link href={`/courses/${courseId}/lessons/${justCreatedId}`} className="text-emerald-400 hover:underline font-semibold">
                  View it →
                </Link>
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* ── Lessons list panel ─────────────────────────────────────── */}
      <div className="p-6 sm:p-8 rounded-3xl bg-black-raised/80 backdrop-blur-sm border border-white/[0.07] space-y-5 shadow-xl shadow-black/30">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-serif text-2xl text-ink">Curriculum</h2>
            <p className="text-xs text-ink/40 mt-0.5">
              {lessons.length === 0
                ? "No lessons yet — add your first below"
                : `${lessons.length} lesson${lessons.length > 1 ? "s" : ""} · drag to reorder`}
            </p>
          </div>
          {editingId !== "new" && (
            <button
              onClick={startNew}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange hover:bg-orange-600 text-white text-sm font-semibold transition-colors shadow-lg shadow-orange/20"
            >
              <Plus className="w-4 h-4" />
              Add Lesson
            </button>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            {error}
          </div>
        )}

        {/* New lesson form inline */}
        {editingId === "new" && editorForm}

        {/* Lessons */}
        {loading ? (
          <div className="py-10 text-center text-ink/40 text-sm flex flex-col items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin" />
            Loading lessons…
          </div>
        ) : lessons.length === 0 && editingId !== "new" ? (
          <div className="py-16 text-center rounded-2xl border-2 border-dashed border-white/[0.06]">
            <BookOpen className="w-10 h-10 text-ink/20 mx-auto mb-3" />
            <p className="text-sm text-ink/40 font-medium mb-1">No lessons yet</p>
            <p className="text-xs text-ink/30">Use the AI generator above or add a lesson manually.</p>
          </div>
        ) : (
          <ol className="space-y-2">
            {lessons.map((lesson, idx) =>
              editingId === lesson.id ? (
                <li key={lesson.id}>{editorForm}</li>
              ) : (
                <li
                  key={lesson.id}
                  className={`group flex items-center gap-3 p-4 rounded-2xl border transition-all
                    ${justCreatedId === lesson.id
                      ? "border-orange/30 bg-orange/[0.04]"
                      : "border-white/[0.06] bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.03]"
                    }`}
                >
                  {/* Drag handle + number */}
                  <div className="flex items-center gap-1 shrink-0">
                    <GripVertical className="w-4 h-4 text-ink/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span className="w-7 h-7 rounded-full border border-white/10 text-ink/40 text-xs font-semibold flex items-center justify-center bg-white/[0.03]">
                      {idx + 1}
                    </span>
                  </div>

                  {/* Lesson info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm text-ink font-medium truncate">{lesson.title}</p>
                      {justCreatedId === lesson.id && (
                        <span className="px-2 py-0.5 rounded-full bg-orange/10 border border-orange/20 text-orange text-[10px] font-semibold">New</span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 mt-1 text-[11px] text-ink/40">
                      {lesson.durationMinutes && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {lesson.durationMinutes} min
                        </span>
                      )}
                      {lesson.videoUrl && (
                        <span className="flex items-center gap-1 text-orange/70">
                          <PlayCircle className="w-3 h-3" />
                          Video
                        </span>
                      )}
                      {lesson.isPreview && (
                        <span className="flex items-center gap-1 text-emerald-400/70">
                          <Eye className="w-3 h-3" />
                          Free preview
                        </span>
                      )}
                      {lesson.approvalStatus === "PENDING" && (
                        <span className="flex items-center gap-1 text-yellow-400/70">
                          <AlertCircle className="w-3 h-3" />
                          Under review
                        </span>
                      )}
                      {lesson.approvalStatus === "REJECTED" && (
                        <span className="flex items-center gap-1 text-red-400/70">
                          <AlertCircle className="w-3 h-3" />
                          Declined{lesson.rejectionReason ? `: ${lesson.rejectionReason}` : ""}
                        </span>
                      )}
                      {lesson.showAuthor && lesson.authorName && (
                        <span>by {lesson.authorName}</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => move(idx, -1)}
                      disabled={idx === 0 || busy}
                      className="p-1.5 rounded-lg text-ink/30 hover:text-orange hover:bg-orange/10 disabled:opacity-20 transition-colors"
                      aria-label="Move up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => move(idx, 1)}
                      disabled={idx === lessons.length - 1 || busy}
                      className="p-1.5 rounded-lg text-ink/30 hover:text-orange hover:bg-orange/10 disabled:opacity-20 transition-colors"
                      aria-label="Move down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <Link
                      href={`/courses/${courseId}/lessons/${lesson.id}`}
                      className="p-1.5 rounded-lg text-ink/30 hover:text-orange hover:bg-orange/10 transition-colors"
                      aria-label="View lesson"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                    <button
                      onClick={() => startEdit(lesson)}
                      className="p-1.5 rounded-lg text-ink/30 hover:text-orange hover:bg-orange/10 transition-colors"
                      aria-label="Edit lesson"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => remove(lesson)}
                      disabled={busy}
                      className="p-1.5 rounded-lg text-ink/30 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                      aria-label="Delete lesson"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </li>
              )
            )}
          </ol>
        )}
      </div>
    </section>
  );
}
