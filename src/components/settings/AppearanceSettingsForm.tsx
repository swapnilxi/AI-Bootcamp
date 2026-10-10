"use client";

import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { ACCENT_COLORS, ACCENT_META, ACCENT_STORAGE_KEY, type AccentColor } from "@/lib/accent";
import { applyAccent } from "@/components/ui/AccentApplier";

export function AppearanceSettingsForm({ initialAccent }: { initialAccent: AccentColor }) {
  const [accent, setAccent] = useState<AccentColor>(initialAccent);
  const [saving, setSaving] = useState<AccentColor | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function choose(next: AccentColor) {
    if (next === accent || saving) return;
    const previous = accent;
    setAccent(next);
    setSaving(next);
    setError(null);
    applyAccent(next);
    localStorage.setItem(ACCENT_STORAGE_KEY, next);

    try {
      const res = await fetch("/api/settings/appearance", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accentColor: next }),
      });
      if (!res.ok) throw new Error("Couldn't save that — try again.");
    } catch (err) {
      setAccent(previous);
      applyAccent(previous);
      localStorage.setItem(ACCENT_STORAGE_KEY, previous);
      setError((err as Error).message);
    } finally {
      setSaving(null);
    }
  }

  return (
    <section className="editorial-card glow-tl space-y-5 rounded-2xl p-6 sm:p-8">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {ACCENT_COLORS.map((key) => {
          const meta = ACCENT_META[key];
          const isActive = accent === key;
          return (
            <button
              key={key}
              onClick={() => choose(key)}
              disabled={saving !== null}
              aria-pressed={isActive}
              className={`flex flex-col items-center gap-2.5 rounded-2xl border p-4 transition-colors disabled:cursor-wait ${
                isActive ? "border-gold/50 bg-gold/[0.06]" : "border-white/10 hover:border-white/20"
              }`}
            >
              <span
                className="flex h-9 w-9 items-center justify-center rounded-full"
                style={{ backgroundColor: meta.swatch, boxShadow: `0 0 16px 2px ${meta.swatch}66` }}
              >
                {saving === key ? (
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                ) : (
                  isActive && <Check className="h-4 w-4 text-white" />
                )}
              </span>
              <span className="text-xs font-medium text-text">{meta.label}</span>
            </button>
          );
        })}
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
      <p className="text-xs leading-relaxed text-text-muted">
        Applies instantly across buttons, links, borders and glow effects — for you only, saved to your account.
      </p>
    </section>
  );
}
