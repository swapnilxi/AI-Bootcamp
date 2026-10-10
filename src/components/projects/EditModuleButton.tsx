"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, X, Loader2 } from "lucide-react";

const fieldClass =
  "w-full px-4 py-2.5 rounded-xl border border-white/10 focus:border-gold focus:ring-1 focus:ring-gold text-ink text-sm bg-black/60";

/** Instructor/admin tool: renames a custom module or edits what it's about (its generated lesson content is untouched). */
export function EditModuleButton({
  projectSlug,
  moduleSlug,
  initialTitle,
  initialDescription,
}: {
  projectSlug: string;
  moduleSlug: string;
  initialTitle: string;
  initialDescription: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectSlug}/custom-modules/${moduleSlug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't save those changes");
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-xs text-text-muted transition-colors hover:text-gold"
      >
        <Pencil className="h-3.5 w-3.5" /> Edit module
      </button>
    );
  }

  return (
    <div className="editorial-card glow-tl space-y-3 rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-text">Edit module</p>
        <button onClick={() => setOpen(false)} className="text-text-muted hover:text-gold" aria-label="Close">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} className={fieldClass} />
      <textarea
        placeholder="What this module covers"
        rows={2}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className={fieldClass}
      />
      {error && <p className="text-xs text-text-muted">{error}</p>}
      <button
        onClick={save}
        disabled={busy || title.trim().length < 3 || description.trim().length < 10}
        className="inline-flex items-center gap-1.5 rounded-xl bg-cream px-4 py-2 text-xs font-semibold text-[#0C0B0A] transition-colors hover:bg-cream/90 disabled:opacity-50"
      >
        {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Save
      </button>
    </div>
  );
}
