"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowDown,
  ArrowUp,
  Eye,
  ExternalLink,
  Pencil,
  Plus,
  PlayCircle,
  Save,
  Sparkles,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useAiEnabled } from "@/components/ai/useAi";
import { AiSetupNotice } from "@/components/ai/AiSetupNotice";
import { AI_NOT_CONFIGURED_CODE } from "@/lib/ai/constants";

const MAX_DOCUMENT_CHARS = 20000;

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
}

const EMPTY_DRAFT: Draft = {
  title: "",
  summary: "",
  content: "",
  videoUrl: "",
  durationMinutes: "",
  isPreview: false,
  showAuthor: true,
};

const fieldClass =
  "w-full px-4 py-2.5 rounded-xl border border-white/10 focus:border-gold focus:ring-1 focus:ring-gold text-ink text-sm bg-black/60";
const labelClass = "block text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1.5";

/** Instructor/admin tool to add, edit, reorder and delete a class's lessons. */
export function LessonManager({ courseId }: { courseId: string }) {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | "new" | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drafting, setDrafting] = useState(false);
  const aiEnabled = useAiEnabled();

  const [genTopic, setGenTopic] = useState("");
  const [genFileName, setGenFileName] = useState<string | null>(null);
  const [genDocText, setGenDocText] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [genNeedsSetup, setGenNeedsSetup] = useState(false);
  const [justCreatedId, setJustCreatedId] = useState<string | null>(null);
  const [genShowAuthor, setGenShowAuthor] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [claimAuthorship, setClaimAuthorship] = useState(false);

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
        body: JSON.stringify({ topic: genTopic.trim(), documentText: genDocText || undefined, showAuthor: genShowAuthor }),
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

  async function draftWithAi() {
    if (draft.title.trim().length < 3) {
      setError("Enter a lesson title first, then draft with AI.");
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
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setDrafting(false);
    }
  }

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

  function startNew() {
    setDraft(EMPTY_DRAFT);
    setEditingId("new");
    setEditingLesson(null);
    setClaimAuthorship(false);
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
    });
    setEditingId(lesson.id);
    setEditingLesson(lesson);
    setClaimAuthorship(false);
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
    if (!confirm(`Delete the lesson "${lesson.title}"? Student progress for it will be removed.`)) return;
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
    setLessons(next); // optimistic
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

  const form = (
    <form onSubmit={save} className="p-5 sm:p-6 rounded-2xl border border-cream/15 bg-cream/5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-serif text-lg text-ink">{editingId === "new" ? "New lesson" : "Edit lesson"}</h3>
        <button
          type="button"
          onClick={() => setEditingId(null)}
          className="p-1.5 rounded-lg text-text-muted hover:text-gold transition-colors"
          aria-label="Cancel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div>
        <label className={labelClass}>Lesson title</label>
        <input
          required
          minLength={3}
          value={draft.title}
          onChange={(e) => setDraft({ ...draft, title: e.target.value })}
          className={fieldClass}
          placeholder="e.g. The Twelve Houses"
        />
      </div>
      <div>
        <label className={labelClass}>One-line summary (optional)</label>
        <input
          value={draft.summary}
          onChange={(e) => setDraft({ ...draft, summary: e.target.value })}
          className={fieldClass}
          maxLength={300}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sm:col-span-2">
          <label className={labelClass}>Video link (YouTube, Vimeo or file URL)</label>
          <input
            type="url"
            value={draft.videoUrl}
            onChange={(e) => setDraft({ ...draft, videoUrl: e.target.value })}
            className={fieldClass}
            placeholder="https://"
          />
        </div>
        <div>
          <label className={labelClass}>Duration (min)</label>
          <input
            type="number"
            min={1}
            max={600}
            value={draft.durationMinutes}
            onChange={(e) => setDraft({ ...draft, durationMinutes: e.target.value })}
            className={fieldClass}
          />
        </div>
      </div>
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className={`${labelClass} mb-0`}>Lesson notes</label>
          {aiEnabled && (
            <button
              type="button"
              onClick={draftWithAi}
              disabled={drafting}
              className="min-h-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-cream/20 bg-cream/6 text-text text-xs font-semibold hover:bg-cream/12 transition-colors disabled:opacity-50"
              title="Uses the title (and summary, as a brief) to draft notes you can edit"
            >
              <Sparkles className={`w-3.5 h-3.5 ${drafting ? "animate-spin" : ""}`} />
              {drafting ? "Drafting…" : "Draft with AI"}
            </button>
          )}
        </div>
        <textarea
          required
          minLength={10}
          rows={8}
          value={draft.content}
          onChange={(e) => setDraft({ ...draft, content: e.target.value })}
          className={`${fieldClass} leading-relaxed`}
          placeholder="Teaching notes, readings, exercises…"
        />
      </div>
      <label className="flex items-center gap-2.5 text-sm text-text cursor-pointer select-none">
        <input
          type="checkbox"
          checked={draft.isPreview}
          onChange={(e) => setDraft({ ...draft, isPreview: e.target.checked })}
          className="w-4 h-4 min-h-0 accent-[#F97316]"
        />
        Free preview: visible to everyone, even without enrollment
      </label>
      <label className="flex items-center gap-2.5 text-sm text-text cursor-pointer select-none">
        <input
          type="checkbox"
          checked={draft.showAuthor}
          onChange={(e) => setDraft({ ...draft, showAuthor: e.target.checked })}
          className="w-4 h-4 min-h-0 accent-[#F97316]"
        />
        Show my name as this lesson&apos;s author
      </label>
      {editingLesson?.canClaimAuthorship && (
        <label className="flex items-center gap-2.5 text-sm text-text cursor-pointer select-none">
          <input
            type="checkbox"
            checked={claimAuthorship}
            onChange={(e) => setClaimAuthorship(e.target.checked)}
            className="w-4 h-4 min-h-0 accent-[#F97316]"
          />
          Credit me as the author instead of {editingLesson.authorName || "the current author"}
        </label>
      )}
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => setEditingId(null)}
          className="px-5 py-2.5 rounded-xl border border-white/10 text-sm text-text-muted hover:text-text transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={busy}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cream hover:bg-cream/90 text-[#0C0B0A] text-sm font-semibold transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {busy ? "Saving…" : "Save lesson"}
        </button>
      </div>
    </form>
  );

  return (
    <section
      id="lessons"
      className="p-8 sm:p-10 rounded-3xl bg-black-raised/80 backdrop-blur-sm border border-white/[0.07] space-y-6 scroll-mt-28"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl text-ink">Lessons</h2>
          <p className="text-sm text-text-muted mt-1">
            Build the curriculum in order. Students unlock all lessons when they enroll.
          </p>
        </div>
        {editingId !== "new" && (
          <button
            onClick={startNew}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cream hover:bg-cream/90 text-[#0C0B0A] text-sm font-semibold transition-colors"
          >
            <Plus className="w-4 h-4" /> Add lesson
          </button>
        )}
      </div>

      <div className="p-5 sm:p-6 rounded-2xl border border-cream/15 bg-cream/5 space-y-4">
        <div>
          <h3 className="font-serif text-lg text-ink flex items-center gap-2">
            <Sparkles className="w-4 h-4" /> Generate lesson with AI
          </h3>
          <p className="text-xs text-text-muted mt-1">One text box for a topic or pasted notes — attach a document anytime.</p>
        </div>

        <textarea
          value={genTopic}
          onChange={(e) => setGenTopic(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") generateLesson();
          }}
          rows={5}
          placeholder={`Type a topic or paste notes to generate a lesson… (e.g. "Retrieval-Augmented Generation", or paste notes)`}
          className={`${fieldClass} leading-relaxed`}
        />
        {genFileName && (
          <p className="text-xs text-text-muted">
            Attached: {genFileName} ({genDocText?.length.toLocaleString()} chars)
            <button
              type="button"
              onClick={() => {
                setGenFileName(null);
                setGenDocText(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
              className="ml-2 min-h-0 text-text-muted hover:text-gold underline"
            >
              Remove
            </button>
          </p>
        )}

        <label className="flex items-center gap-2.5 text-xs text-text-muted cursor-pointer select-none">
          <input
            type="checkbox"
            checked={genShowAuthor}
            onChange={(e) => setGenShowAuthor(e.target.checked)}
            className="w-3.5 h-3.5 min-h-0 accent-[#F97316]"
          />
          Show my name as this lesson&apos;s author
        </label>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-white/10 px-4 py-2 text-xs font-semibold text-text-muted hover:text-gold transition-colors">
              <Upload className="w-3.5 h-3.5" /> Upload document
              <input ref={fileInputRef} type="file" accept=".txt,.md,.markdown,.mdx" onChange={handleFileUpload} className="hidden" />
            </label>
            <span className="hidden sm:inline text-[11px] text-text-muted">Plain text / Markdown · Press ⌘/Ctrl + Enter</span>
          </div>
          <button
            type="button"
            onClick={generateLesson}
            disabled={generating || !genTopic.trim()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cream hover:bg-cream/90 text-[#0C0B0A] text-sm font-semibold transition-colors disabled:opacity-50"
          >
            <Sparkles className={`w-4 h-4 ${generating ? "animate-spin" : ""}`} />
            {generating ? "Generating…" : "Generate lesson"}
          </button>
        </div>

        {genNeedsSetup ? (
          <AiSetupNotice />
        ) : genError ? (
          <p className="text-xs text-text-muted">{genError}</p>
        ) : justCreatedId ? (
          <p className="text-xs text-text-muted">
            Lesson created.{" "}
            <Link href={`/courses/${courseId}/lessons/${justCreatedId}`} className="text-gold hover:underline">
              View it →
            </Link>
          </p>
        ) : null}
      </div>

      {error && (
        <p className="p-3 rounded-xl bg-cream/8 border border-cream/15 text-text text-sm">{error}</p>
      )}

      {editingId === "new" && form}

      {loading ? (
        <p className="text-sm text-text-muted">Loading lessons…</p>
      ) : lessons.length === 0 && editingId !== "new" ? (
        <div className="text-center py-10 rounded-2xl border border-dashed border-white/10 text-sm text-text-muted">
          No lessons yet. Add the first lesson to open this class for learning.
        </div>
      ) : (
        <ol className="space-y-3">
          {lessons.map((lesson, idx) =>
            editingId === lesson.id ? (
              <li key={lesson.id}>{form}</li>
            ) : (
              <li
                key={lesson.id}
                className="flex items-center gap-4 p-4 rounded-2xl border border-white/[0.07] bg-black/30 hover:border-gold/25 transition-colors"
              >
                <span className="w-8 h-8 shrink-0 rounded-full border border-black-line text-text text-xs font-semibold flex items-center justify-center">
                  {idx + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm sm:text-base text-ink font-medium truncate">{lesson.title}</p>
                  <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-text-muted">
                    {lesson.durationMinutes ? <span>{lesson.durationMinutes} min</span> : null}
                    {lesson.videoUrl && (
                      <span className="inline-flex items-center gap-1">
                        <PlayCircle className="w-3 h-3" /> Video
                      </span>
                    )}
                    {lesson.approvalStatus === "PENDING" && (
                      <span className="text-text-muted">Under review: hidden from learners</span>
                    )}
                    {lesson.approvalStatus === "REJECTED" && (
                      <span className="text-text-muted">
                        Declined{lesson.rejectionReason ? `: ${lesson.rejectionReason}` : ""}. Edit and save to resubmit.
                      </span>
                    )}
                    {lesson.isPreview && (
                      <span className="inline-flex items-center gap-1 text-text-muted">
                        <Eye className="w-3 h-3" /> Free preview
                      </span>
                    )}
                    {lesson.showAuthor && lesson.authorName && <span>by {lesson.authorName}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => move(idx, -1)}
                    disabled={idx === 0 || busy}
                    className="p-2 min-h-0 rounded-lg text-text-muted hover:text-gold disabled:opacity-30 transition-colors"
                    aria-label="Move up"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => move(idx, 1)}
                    disabled={idx === lessons.length - 1 || busy}
                    className="p-2 min-h-0 rounded-lg text-text-muted hover:text-gold disabled:opacity-30 transition-colors"
                    aria-label="Move down"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                  <Link
                    href={`/courses/${courseId}/lessons/${lesson.id}`}
                    className="p-2 min-h-0 rounded-lg text-text-muted hover:text-gold transition-colors"
                    aria-label="View lesson"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => startEdit(lesson)}
                    className="p-2 min-h-0 rounded-lg text-text-muted hover:text-gold transition-colors"
                    aria-label="Edit lesson"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => remove(lesson)}
                    disabled={busy}
                    className="p-2 min-h-0 rounded-lg text-text-muted hover:text-clay transition-colors"
                    aria-label="Delete lesson"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </li>
            )
          )}
        </ol>
      )}
    </section>
  );
}
