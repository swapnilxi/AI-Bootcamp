"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { AiSetupNotice } from "@/components/ai/AiSetupNotice";
import { AI_NOT_CONFIGURED_CODE } from "@/lib/ai/constants";

const PLACEHOLDER = `<!doctype html>
<html>
  <body style="font: 14px system-ui; color: #888; padding: 2rem;">
    Paste your HTML here, or ask AI for a starter scaffold.
  </body>
</html>`;

/** Build stage: an editable HTML source paired with a live sandboxed preview. */
export function BuildPreview({ projectSlug }: { projectSlug: string }) {
  const [html, setHtml] = useState("");
  const [notes, setNotes] = useState<string | null>(null);
  const [instruction, setInstruction] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsSetup, setNeedsSetup] = useState(false);

  async function askAi() {
    setLoading(true);
    setError(null);
    setNeedsSetup(false);
    try {
      const res = await fetch("/api/ai/project-build", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: projectSlug, instruction: instruction.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data?.code === AI_NOT_CONFIGURED_CODE) setNeedsSetup(true);
        throw new Error(data.error || "Couldn't generate a scaffold");
      }
      setHtml(data.html);
      setNotes(data.notes);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="card-premium glow-l space-y-5 rounded-3xl p-6 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-serif text-xl text-text">Build preview</h2>
          <p className="mt-1 text-xs text-text-muted">
            Write or paste HTML on the left, see it render on the right. Nothing here is saved.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            placeholder="What should the starter focus on? (optional)"
            className="hidden w-64 rounded-xl border border-white/10 bg-black/60 px-3.5 py-2 text-xs text-ink focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold sm:block"
          />
          <button
            onClick={askAi}
            disabled={loading}
            className="inline-flex min-h-0 shrink-0 items-center gap-1.5 rounded-full bg-cream px-4 py-2 text-xs font-semibold text-[#0C0B0A] transition-colors hover:bg-cream/90 disabled:opacity-50"
          >
            <Sparkles className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Scaffolding…" : "Ask AI for a starter"}
          </button>
        </div>
      </div>

      {needsSetup ? (
        <AiSetupNotice />
      ) : (
        error && <p className="text-xs text-text-muted">{error}</p>
      )}
      {notes && <p className="rounded-xl border border-gold/20 bg-gold/[0.05] p-3 text-xs text-text-muted">{notes}</p>}

      <div className="grid gap-4 lg:grid-cols-2">
        <textarea
          value={html}
          onChange={(e) => setHtml(e.target.value)}
          spellCheck={false}
          placeholder={PLACEHOLDER}
          className="h-[420px] w-full resize-none rounded-xl border border-white/10 bg-black/60 p-4 font-mono text-xs leading-relaxed text-ink focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
        />
        <iframe
          title="Build preview"
          srcDoc={html.trim() || PLACEHOLDER}
          sandbox="allow-scripts"
          className="h-[420px] w-full rounded-xl border border-white/10 bg-white"
        />
      </div>
    </section>
  );
}
