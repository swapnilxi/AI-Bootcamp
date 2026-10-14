"use client";

import { useMemo, useRef, useState, type ReactNode } from "react";
import {
  BookOpen,
  FileText,
  Sparkles,
  GalleryHorizontal,
  Telescope,
  ListTree,
  RotateCw,
  Download,
  Upload,
  Pencil,
  Maximize2,
  Minimize2,
  Trash2,
} from "lucide-react";
import { AiSetupNotice } from "@/components/ai/AiSetupNotice";
import { AI_NOT_CONFIGURED_CODE } from "@/lib/ai/constants";
import {
  wrapLessonFragment,
  DEFAULT_INTERACTIVITY,
  INTERACTIVE_ELEMENTS,
  type InteractivityOptions,
  type LessonVariants,
} from "@/lib/lessons/shared";
import { InteractivityPicker } from "./InteractivityPicker";
import { SwipeDeck } from "./SwipeDeck";

type TabKey = "read" | "easyRead" | "visualize" | "swipe" | "deeper" | "breakdown" | "update";

const TABS: { key: TabKey; label: string; icon: typeof BookOpen }[] = [
  { key: "read", label: "Read", icon: BookOpen },
  { key: "easyRead", label: "Easy Read", icon: FileText },
  { key: "visualize", label: "Visualize", icon: Sparkles },
  { key: "swipe", label: "Swipe", icon: GalleryHorizontal },
  { key: "deeper", label: "Explain Deeper", icon: Telescope },
  { key: "breakdown", label: "Breakdown", icon: ListTree },
  { key: "update", label: "Update", icon: Pencil },
];

const UPDATE_SUGGESTIONS = [
  "Add more code examples",
  "Explain the core idea with a simpler analogy",
  "Add a section on common mistakes",
  "Add two more quiz questions",
];

/** One-click "make it more interactive" instructions, built from the element catalog. */
const INTERACTIVE_UPGRADES = INTERACTIVE_ELEMENTS.map((e) => ({
  label: `Add: ${e.label}`,
  instruction: `Make this lesson more interactive: add ${e.label.toLowerCase()} — ${e.hint}. Place it where it best reinforces the concept, give instant feedback, and update the progress bar if there is one.`,
}));

export interface LessonViewerEndpoints {
  generate: string;
  easyRead: string;
  deeper: string;
  breakdown: string;
  visualize: string;
  revise: string;
}

export interface LessonViewerProps {
  breadcrumb: string[];
  title: string;
  positionLabel?: string;
  badges?: string[];
  readTimeMinutes?: number;
  authorName?: string | null;
  showAuthor?: boolean;
  initialGeneratedHtml: string | null;
  initialVariants: LessonVariants | null;
  /** Options the Read view was last generated with; seeds the regenerate settings. */
  initialInteractivity?: InteractivityOptions;
  endpoints: LessonViewerEndpoints;
  canManage: boolean;
  /** DELETE this URL to clear the generated preview. Omit to hide the delete button. */
  clearEndpoint?: string;
  deleteLabel?: string;
  downloadFilename: string;
}

async function postJson(url: string, body?: unknown) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || "Something went wrong") as Error & { code?: string };
    err.code = data.code;
    throw err;
  }
  return data;
}

function download(filename: string, html: string) {
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function LessonViewer({
  breadcrumb,
  title,
  positionLabel,
  badges = [],
  readTimeMinutes,
  authorName,
  showAuthor = true,
  initialGeneratedHtml,
  initialVariants,
  initialInteractivity,
  endpoints,
  canManage,
  clearEndpoint,
  deleteLabel = "Clear generated preview",
  downloadFilename,
}: LessonViewerProps) {
  const [tab, setTab] = useState<TabKey>("read");
  const [generatedHtml, setGeneratedHtml] = useState(initialGeneratedHtml);
  const [variants, setVariants] = useState<LessonVariants | null>(initialVariants);
  const [loadingTab, setLoadingTab] = useState<TabKey | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const [updating, setUpdating] = useState(false);
  const [instruction, setInstruction] = useState("");
  const [pendingPrevious, setPendingPrevious] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const [interactivity, setInteractivity] = useState<InteractivityOptions>(initialInteractivity ?? DEFAULT_INTERACTIVITY);

  const hasRead = !!generatedHtml;

  async function runGenerate() {
    setLoadingTab("read");
    setError(null);
    setNeedsSetup(false);
    try {
      const data = await postJson(endpoints.generate, { interactivity });
      setGeneratedHtml(data.generatedHtml);
    } catch (err) {
      const e = err as Error & { code?: string };
      if (e.code === AI_NOT_CONFIGURED_CODE) setNeedsSetup(true);
      setError(e.message);
    } finally {
      setLoadingTab(null);
    }
  }

  async function runVariant(key: Exclude<TabKey, "read" | "swipe" | "update">, endpoint: string) {
    setLoadingTab(key);
    setError(null);
    setNeedsSetup(false);
    try {
      const data = await postJson(endpoint);
      setVariants(data.variants);
    } catch (err) {
      const e = err as Error & { code?: string };
      if (e.code === AI_NOT_CONFIGURED_CODE) setNeedsSetup(true);
      setError(e.message);
    } finally {
      setLoadingTab(null);
    }
  }

  /** Both "Regenerate" and "Update existing" land here — the previous Read HTML is kept so the result can be discarded. */
  async function applyChange(kind: "regenerate" | "update") {
    if (kind === "update" && !instruction.trim()) return;
    setUpdating(true);
    setError(null);
    setNeedsSetup(false);
    const previous = generatedHtml;
    try {
      const data =
        kind === "regenerate" ? await postJson(endpoints.generate, { interactivity }) : await postJson(endpoints.revise, { instruction: instruction.trim() });
      setGeneratedHtml(data.generatedHtml);
      if (previous) setPendingPrevious(previous);
      setInstruction("");
      setTab("read");
    } catch (err) {
      const e = err as Error & { code?: string };
      if (e.code === AI_NOT_CONFIGURED_CODE) setNeedsSetup(true);
      setError(e.message);
    } finally {
      setUpdating(false);
    }
  }

  function keepPending() {
    setPendingPrevious(null);
  }

  async function discardPending() {
    if (!pendingPrevious) return;
    setUpdating(true);
    try {
      const data = await postJson(endpoints.revise, { html: pendingPrevious });
      setGeneratedHtml(data.generatedHtml);
    } finally {
      setPendingPrevious(null);
      setUpdating(false);
    }
  }

  async function saveEdit() {
    setUpdating(true);
    setError(null);
    try {
      const data = await postJson(endpoints.revise, { html: editValue });
      setGeneratedHtml(data.generatedHtml);
      setEditing(false);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUpdating(false);
    }
  }

  async function handleUploadHtml(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    setNeedsSetup(false);
    try {
      const previous = generatedHtml;
      const text = await file.text();
      const data = await postJson(endpoints.revise, { html: text });
      setGeneratedHtml(data.generatedHtml);
      if (previous) setPendingPrevious(previous);
      setTab("read");
      setEditing(false);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUploading(false);
      if (uploadInputRef.current) uploadInputRef.current.value = "";
    }
  }

  async function handleDelete() {
    if (!clearEndpoint) return;
    if (!window.confirm(`${deleteLabel}? This can't be undone.`)) return;
    setDeleting(true);
    try {
      await fetch(clearEndpoint, { method: "DELETE" });
      setGeneratedHtml(null);
      setVariants(null);
      setPendingPrevious(null);
      setTab("read");
      setEditing(false);
    } finally {
      setDeleting(false);
    }
  }

  const currentDoc = useMemo(() => {
    if (tab === "read") return generatedHtml;
    if (tab === "easyRead" && variants?.easyRead) return wrapLessonFragment(variants.easyRead.html, title);
    if (tab === "deeper" && variants?.deeper) return wrapLessonFragment(variants.deeper.html, title);
    if (tab === "breakdown" && variants?.breakdown) {
      const body = variants.breakdown.chunks.map((c) => `<h3>${c.title}</h3>${c.html}`).join("");
      return wrapLessonFragment(body, title);
    }
    if (tab === "visualize" && variants?.visual) {
      return wrapLessonFragment(`<p>${variants.visual.explanation}</p>${variants.visual.html}`, title);
    }
    return null;
  }, [tab, generatedHtml, variants, title]);

  function renderTabBody() {
    if (tab === "update") {
      return (
        <UpdatePanel
          instruction={instruction}
          setInstruction={setInstruction}
          onRegenerate={() => applyChange("regenerate")}
          onUpdate={() => applyChange("update")}
          updating={updating}
          interactivity={interactivity}
          setInteractivity={setInteractivity}
        />
      );
    }

    if (tab === "swipe") {
      if (!variants?.breakdown) {
        return (
          <GenerateCta
            label="Generate a breakdown to enable Swipe"
            loading={loadingTab === "breakdown"}
            disabled={!hasRead}
            disabledHint="Generate the Read view first"
            onClick={() => runVariant("breakdown", endpoints.breakdown)}
          />
        );
      }
      return <SwipeDeck chunks={variants.breakdown.chunks} lessonTitle={title} />;
    }

    if (tab === "read" && !generatedHtml) {
      return (
        <GenerateCta
          label="Generate interactive lesson"
          loading={loadingTab === "read"}
          onClick={runGenerate}
          extra={canManage ? <InteractivityPicker value={interactivity} onChange={setInteractivity} /> : undefined}
          secondary={
            canManage ? (
              <label className="inline-flex min-h-0 cursor-pointer items-center gap-1.5 text-xs text-text-muted transition-colors hover:text-gold">
                <Upload className="h-3.5 w-3.5" /> or upload an HTML file
                <input type="file" accept=".html,.htm" disabled={uploading} onChange={handleUploadHtml} className="hidden" />
              </label>
            ) : undefined
          }
        />
      );
    }
    if (tab !== "read" && !currentDoc) {
      const labels: Record<string, string> = {
        easyRead: "Generate Easy Read",
        deeper: "Generate deeper dive",
        breakdown: "Generate breakdown",
        visualize: "Generate visual",
      };
      const endpointMap: Record<string, string> = {
        easyRead: endpoints.easyRead,
        deeper: endpoints.deeper,
        breakdown: endpoints.breakdown,
        visualize: endpoints.visualize,
      };
      return (
        <GenerateCta
          label={labels[tab]}
          loading={loadingTab === tab}
          disabled={!hasRead}
          disabledHint="Generate the Read view first"
          onClick={() => runVariant(tab as Exclude<TabKey, "read" | "swipe" | "update">, endpointMap[tab])}
        />
      );
    }

    if (editing && tab === "read") {
      return (
        <div className="flex h-full flex-col gap-3 p-4">
          <textarea
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            spellCheck={false}
            className="h-full min-h-[320px] flex-1 resize-none rounded-xl border border-white/10 bg-black/60 p-4 font-mono text-xs leading-relaxed text-ink focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setEditing(false)}
              className="rounded-full border border-white/10 px-4 py-2 text-xs text-text-muted hover:text-text"
            >
              Cancel
            </button>
            <button
              onClick={saveEdit}
              disabled={updating}
              className="rounded-full bg-cream px-4 py-2 text-xs font-semibold text-[#0C0B0A] hover:bg-cream/90 disabled:opacity-50"
            >
              {updating ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      );
    }

    return <iframe title={title} srcDoc={currentDoc ?? ""} sandbox="allow-scripts" className="h-full w-full bg-white" />;
  }

  return (
    <section
      className={`editorial-card glow-l flex flex-col overflow-hidden rounded-2xl ${
        fullscreen ? "fixed inset-2 z-50 sm:inset-6" : "relative"
      }`}
    >
      {/* Header */}
      <div className="shrink-0 space-y-3 border-b border-white/[0.07] px-5 pt-5 sm:px-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <nav className="flex min-w-0 flex-wrap items-center gap-1.5 text-[11px] text-text-muted">
            {breadcrumb.map((crumb, i) => (
              <span key={i} className="flex items-center gap-1.5">
                {i > 0 && <span className="opacity-40">›</span>}
                <span className="truncate max-w-[14rem]">{crumb}</span>
              </span>
            ))}
          </nav>
          {positionLabel && (
            <span className="shrink-0 rounded-full border border-cream/25 bg-cream/[0.08] px-3 py-1 text-[11px] font-semibold text-text">
              {positionLabel}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0 space-y-2">
            <h2 className="truncate font-serif text-2xl text-text">{title}</h2>
            {showAuthor && authorName && <p className="text-xs text-text-muted">By {authorName}</p>}
            {(badges.length > 0 || readTimeMinutes) && (
              <div className="flex flex-wrap items-center gap-2">
                {badges.map((b) => (
                  <span
                    key={b}
                    className="rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-text-muted"
                  >
                    {b}
                  </span>
                ))}
                {readTimeMinutes && (
                  <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-0.5 text-[10px] text-text-muted">
                    {readTimeMinutes} min read
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <button
              onClick={() => currentDoc && download(downloadFilename, currentDoc)}
              disabled={!currentDoc}
              className="inline-flex min-h-0 items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-xs text-text-muted transition-colors hover:text-gold disabled:opacity-30"
            >
              <Download className="h-3.5 w-3.5" /> Download
            </button>
            {canManage && (
              <label
                className={`inline-flex min-h-0 cursor-pointer items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-xs text-text-muted transition-colors hover:text-gold ${
                  uploading ? "opacity-50" : ""
                }`}
              >
                <Upload className={`h-3.5 w-3.5 ${uploading ? "animate-pulse" : ""}`} /> Upload HTML
                <input
                  ref={uploadInputRef}
                  type="file"
                  accept=".html,.htm"
                  disabled={uploading}
                  onChange={handleUploadHtml}
                  className="hidden"
                />
              </label>
            )}
            {canManage && (
              <button
                onClick={() => {
                  if (!editing) setEditValue(generatedHtml ?? "");
                  setEditing((v) => !v);
                  setTab("read");
                }}
                disabled={!hasRead}
                className={`inline-flex min-h-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors disabled:opacity-30 ${
                  editing ? "border-gold/40 text-gold" : "border-white/10 text-text-muted hover:text-gold"
                }`}
              >
                <Pencil className="h-3.5 w-3.5" /> Edit
              </button>
            )}
            <button
              onClick={() => setFullscreen((v) => !v)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-text-muted transition-colors hover:text-gold"
              aria-label={fullscreen ? "Exit fullscreen" : "Fullscreen"}
            >
              {fullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            </button>
            {canManage && clearEndpoint && (
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-text-muted transition-colors hover:border-red-400/40 hover:text-red-400 disabled:opacity-30"
                aria-label={deleteLabel}
                title={deleteLabel}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap items-center gap-1 pt-1">
          {TABS.map(({ key, label, icon: Icon }) => {
            const disabled = key === "update" && !hasRead;
            return (
              <button
                key={key}
                onClick={() => {
                  if (disabled) return;
                  setTab(key);
                  setEditing(false);
                }}
                disabled={disabled}
                title={disabled ? "Generate the Read view first" : undefined}
                className={`inline-flex min-h-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors disabled:opacity-30 ${
                  tab === key ? "bg-gold text-[#0C0B0A]" : "text-text-muted hover:text-gold"
                }`}
              >
                <Icon className="h-3.5 w-3.5" /> {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Body */}
      <div className="flex min-h-[420px] flex-1 flex-col">
        {needsSetup ? (
          <div className="p-6">
            <AiSetupNotice />
          </div>
        ) : error ? (
          <p className="p-6 text-xs text-text-muted">{error}</p>
        ) : null}

        {pendingPrevious !== null && tab === "read" && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gold/20 bg-gold/[0.06] px-5 py-2.5 text-xs text-text-muted">
            <span>Previewing the new version — nothing is final until you keep it.</span>
            <div className="flex items-center gap-2">
              <button
                onClick={discardPending}
                disabled={updating}
                className="rounded-full border border-white/10 px-3 py-1 text-text-muted transition-colors hover:text-text disabled:opacity-50"
              >
                Discard
              </button>
              <button
                onClick={keepPending}
                className="rounded-full bg-cream px-3 py-1 font-semibold text-[#0C0B0A] transition-colors hover:bg-cream/90"
              >
                Keep this version
              </button>
            </div>
          </div>
        )}

        <div className="min-h-[420px] flex-1">{renderTabBody()}</div>
      </div>
    </section>
  );
}

function GenerateCta({
  label,
  loading,
  onClick,
  disabled,
  disabledHint,
  secondary,
  extra,
}: {
  label: string;
  loading: boolean;
  onClick: () => void;
  disabled?: boolean;
  disabledHint?: string;
  secondary?: ReactNode;
  extra?: ReactNode;
}) {
  return (
    <div className="flex h-full min-h-[320px] flex-col items-center justify-center gap-3 p-8 text-center">
      <p className="text-sm text-text-muted">{disabled ? disabledHint : "Not generated yet."}</p>
      {extra && !disabled && <div className="w-full max-w-3xl">{extra}</div>}
      <button
        onClick={onClick}
        disabled={loading || disabled}
        className="inline-flex min-h-0 items-center gap-1.5 rounded-full bg-cream px-5 py-2.5 text-xs font-semibold text-[#0C0B0A] transition-colors hover:bg-cream/90 disabled:opacity-50"
      >
        <Sparkles className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
        {loading ? "Generating…" : label}
      </button>
      {secondary}
    </div>
  );
}

function UpdatePanel({
  instruction,
  setInstruction,
  onRegenerate,
  onUpdate,
  updating,
  interactivity,
  setInteractivity,
}: {
  instruction: string;
  setInstruction: (v: string) => void;
  onRegenerate: () => void;
  onUpdate: () => void;
  updating: boolean;
  interactivity: InteractivityOptions;
  setInteractivity: (v: InteractivityOptions) => void;
}) {
  const [showRegen, setShowRegen] = useState(false);
  return (
    <div className="h-full overflow-y-auto p-5 sm:p-7">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gold/25 bg-gold/[0.08] text-gold">
          <Pencil className="h-4 w-4" />
        </div>
        <div>
          <h3 className="font-serif text-lg text-text">Update Lesson</h3>
          <p className="mt-0.5 text-xs text-text-muted">
            Update edits this lesson in place; Regenerate rebuilds it from its source. You preview the result before anything is replaced.
          </p>
        </div>
      </div>

      <textarea
        value={instruction}
        onChange={(e) => setInstruction(e.target.value)}
        placeholder="e.g. Add a section on rate limiting, and make the quiz harder."
        rows={5}
        className="mt-4 w-full resize-none rounded-xl border border-white/10 bg-black/60 p-4 text-sm text-ink focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
      />

      <div className="mt-3">
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-text-muted">Make it more interactive</p>
        <div className="flex flex-wrap gap-2">
          {INTERACTIVE_UPGRADES.map((u) => (
            <button
              key={u.label}
              onClick={() => setInstruction(u.instruction)}
              className="rounded-full border border-gold/25 px-3 py-1.5 text-xs text-gold/90 transition-colors hover:bg-gold/[0.08]"
            >
              {u.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {UPDATE_SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => setInstruction(s)}
            className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-text-muted transition-colors hover:border-gold/40 hover:text-gold"
          >
            {s}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={onRegenerate}
            disabled={updating}
            className="inline-flex min-h-0 items-center gap-1.5 rounded-full border border-white/10 px-4 py-2 text-xs font-semibold text-text-muted transition-colors hover:text-gold disabled:opacity-50"
          >
            <RotateCw className={`h-3.5 w-3.5 ${updating ? "animate-spin" : ""}`} /> Regenerate
          </button>
          <button
            onClick={() => setShowRegen((v) => !v)}
            className="min-h-0 text-xs text-text-muted underline-offset-2 hover:text-gold hover:underline"
          >
            {showRegen ? "Hide" : "Regenerate options"}
          </button>
          <button
            onClick={onUpdate}
            disabled={updating || !instruction.trim()}
            className="inline-flex min-h-0 items-center gap-1.5 rounded-full bg-gold px-4 py-2 text-xs font-semibold text-[#0C0B0A] transition-colors hover:bg-gold/90 disabled:opacity-50"
          >
            <Sparkles className={`h-3.5 w-3.5 ${updating ? "animate-spin" : ""}`} /> Update existing
          </button>
        </div>
      </div>

      {showRegen && (
        <div className="mt-4 rounded-xl border border-white/10 p-4">
          <p className="mb-3 text-xs text-text-muted">Regenerate rebuilds the lesson from its source using these settings.</p>
          <InteractivityPicker value={interactivity} onChange={setInteractivity} compact />
        </div>
      )}
    </div>
  );
}
