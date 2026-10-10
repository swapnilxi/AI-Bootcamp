"use client";

import { useEffect, useState } from "react";
import { Sparkles, Pencil, X } from "lucide-react";

const fieldClass =
  "w-full px-4 py-2.5 rounded-xl border border-white/10 focus:border-gold focus:ring-1 focus:ring-gold text-ink text-sm bg-black/60";

/** Lets an instructor/admin steer AI lesson generation for this course with standing guidance. */
export function CourseAiContextCard({ courseId }: { courseId: string }) {
  const [aiContext, setAiContext] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/courses/${courseId}`)
      .then((r) => r.json())
      .then((data) => {
        setAiContext(data.course?.aiContext ?? "");
        setDraft(data.course?.aiContext ?? "");
      })
      .finally(() => setLoading(false));
  }, [courseId]);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/courses/${courseId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aiContext: draft }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't save AI context");
      setAiContext(draft);
      setEditing(false);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return null;

  return (
    <div className="space-y-3 rounded-2xl border border-cream/15 bg-cream/5 p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 font-serif text-lg text-ink">
          <Sparkles className="h-4 w-4" /> AI directives &amp; context
        </h3>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="inline-flex min-h-0 items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold text-text-muted transition-colors hover:text-gold"
          >
            <Pencil className="h-3.5 w-3.5" /> Edit AI context
          </button>
        )}
      </div>

      {editing ? (
        <div className="space-y-3">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={3}
            placeholder="e.g. Focus on cloud-native patterns, Kubernetes, Terraform/IaC, serverless vs container tradeoffs…"
            className={`${fieldClass} leading-relaxed`}
          />
          {error && <p className="text-xs text-text-muted">{error}</p>}
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setDraft(aiContext ?? "");
                setEditing(false);
              }}
              className="inline-flex min-h-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-text-muted hover:text-text"
            >
              <X className="h-3.5 w-3.5" /> Cancel
            </button>
            <button
              onClick={save}
              disabled={saving}
              className="inline-flex min-h-0 items-center gap-1.5 rounded-full bg-cream px-4 py-2 text-xs font-semibold text-[#0C0B0A] transition-colors hover:bg-cream/90 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      ) : (
        <p className="text-sm leading-relaxed text-text-muted">
          {aiContext || "No AI context set yet — generated lessons use only the class and lesson content."}
        </p>
      )}
    </div>
  );
}
