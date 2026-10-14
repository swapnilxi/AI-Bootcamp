"use client";

import {
  INTERACTIVE_ELEMENTS,
  INTERACTIVE_STYLES,
  type InteractiveElementKey,
  type InteractivityOptions,
} from "@/lib/lessons/shared";

/** Lets a creator choose how interactive a generated lesson should be: overall format plus specific activity types. */
export function InteractivityPicker({
  value,
  onChange,
  compact = false,
}: {
  value: InteractivityOptions;
  onChange: (next: InteractivityOptions) => void;
  compact?: boolean;
}) {
  function toggle(key: InteractiveElementKey) {
    const has = value.elements.includes(key);
    onChange({ ...value, elements: has ? value.elements.filter((k) => k !== key) : [...value.elements, key] });
  }

  return (
    <div className="space-y-4 text-left">
      <div>
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-text-muted">Lesson format</p>
        <div className={`grid gap-2 ${compact ? "sm:grid-cols-2" : "sm:grid-cols-4"}`}>
          {INTERACTIVE_STYLES.map((s) => (
            <button
              key={s.key}
              type="button"
              aria-pressed={value.style === s.key}
              onClick={() => onChange({ ...value, style: s.key })}
              className={`min-h-0 rounded-xl border p-3 text-left transition-colors ${
                value.style === s.key ? "border-gold/50 bg-gold/[0.08]" : "border-white/10 hover:border-gold/30"
              }`}
            >
              <span className="block text-xs font-semibold text-text">{s.label}</span>
              <span className="mt-0.5 block text-[11px] leading-snug text-text-muted">{s.hint}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-text-muted">Interactive elements</p>
        <div className="flex flex-wrap gap-2">
          {INTERACTIVE_ELEMENTS.map((e) => {
            const on = value.elements.includes(e.key);
            return (
              <button
                key={e.key}
                type="button"
                aria-pressed={on}
                title={e.hint}
                onClick={() => toggle(e.key)}
                className={`min-h-0 rounded-full border px-3 py-1.5 text-xs transition-colors ${
                  on ? "border-gold/50 bg-gold/[0.12] text-gold" : "border-white/10 text-text-muted hover:border-gold/30 hover:text-text"
                }`}
              >
                {on ? "✓ " : "+ "}
                {e.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-text-muted" htmlFor="interactivity-notes">
          Anything specific? (optional)
        </label>
        <input
          id="interactivity-notes"
          value={value.notes ?? ""}
          maxLength={500}
          onChange={(e) => onChange({ ...value, notes: e.target.value })}
          placeholder="e.g. Use a customer-support chatbot as the running example"
          className="w-full rounded-xl border border-white/10 bg-black/60 px-4 py-2.5 text-sm text-ink focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
        />
      </div>
    </div>
  );
}
