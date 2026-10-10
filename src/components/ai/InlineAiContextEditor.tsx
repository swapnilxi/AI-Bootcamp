"use client";

import { useEffect, useState } from "react";
import { Pencil, X } from "lucide-react";

const fieldClass =
  "w-full px-4 py-2.5 rounded-xl border border-white/10 focus:border-gold focus:ring-1 focus:ring-gold text-ink text-sm bg-black/60";

/** A generic "Edit AI context" affordance for an entity fetched from `getUrl` / saved via PATCH to `patchUrl`. */
export function InlineAiContextEditor({
  label,
  getUrl,
  patchUrl,
  unwrapKey,
  method = "PATCH",
}: {
  label: string;
  getUrl: string;
  patchUrl: string;
  unwrapKey: string;
  method?: "PATCH" | "PUT";
}) {
  const [aiContext, setAiContext] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setAiContext(null);
    setOpen(false);
  }, [getUrl]);

  async function startEdit() {
    setOpen(true);
    if (aiContext === null) {
      const res = await fetch(getUrl);
      const data = await res.json().catch(() => ({}));
      const current = data?.[unwrapKey]?.aiContext ?? "";
      setAiContext(current);
      setDraft(current);
    } else {
      setDraft(aiContext);
    }
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(patchUrl, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aiContext: draft }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't save AI context");
      setAiContext(draft);
      setOpen(false);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={startEdit}
        className="min-h-0 inline-flex items-center gap-1 text-[11px] font-semibold text-gold hover:underline"
      >
        <Pencil className="w-3 h-3" /> Edit AI context
      </button>
    );
  }

  return (
    <div className="p-4 rounded-2xl border border-cream/15 bg-cream/5 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-text uppercase tracking-wider">{label}: AI context</p>
        <button onClick={() => setOpen(false)} className="text-text-muted hover:text-gold" aria-label="Close">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        rows={3}
        placeholder="Guidance for AI-generated lessons under this…"
        className={fieldClass}
      />
      {error && <p className="text-xs text-text-muted">{error}</p>}
      <button
        onClick={save}
        disabled={saving}
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cream hover:bg-cream/90 text-[#0C0B0A] text-xs font-semibold transition-colors disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save"}
      </button>
    </div>
  );
}
