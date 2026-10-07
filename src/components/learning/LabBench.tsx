"use client";

import { useState } from "react";
import { Check, RotateCcw } from "lucide-react";

/**
 * The interactive half of a lab.
 *
 * Labs declare their knobs as data (`Lab.parameters` in the schema) rather than
 * shipping a bespoke component each, so a new lab is a seed entry, not a new
 * React tree. The bench renders controls from that declaration, tracks which
 * guided step the learner is on, and keeps the current settings visible as a
 * run configuration they can reason about.
 */

export interface LabParameter {
  name: string;
  label: string;
  type: "slider" | "select" | "text";
  min?: number;
  max?: number;
  step?: number;
  options?: string[];
  default: string | number;
}

interface Step {
  title: string;
  detail: string;
}

export function LabBench({
  parameters,
  steps,
  labTitle,
}: {
  parameters: LabParameter[];
  steps: Step[];
  labTitle: string;
}) {
  const [values, setValues] = useState<Record<string, string | number>>(() =>
    Object.fromEntries(parameters.map((p) => [p.name, p.default]))
  );
  const [done, setDone] = useState<Set<number>>(new Set());

  const reset = () => {
    setValues(Object.fromEntries(parameters.map((p) => [p.name, p.default])));
    setDone(new Set());
  };

  const toggleStep = (i: number) =>
    setDone((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });

  const set = (name: string, value: string | number) =>
    setValues((prev) => ({ ...prev, [name]: value }));

  return (
    <div className="space-y-10">
      <section className="card-premium glow-tl space-y-6 rounded-3xl p-6 sm:p-8">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-serif text-xl text-text">Run configuration</h2>
          <button
            onClick={reset}
            className="inline-flex min-h-0 items-center gap-1.5 rounded-full border border-white/10 px-3.5 py-1.5 text-[11px] uppercase tracking-wider text-text-muted transition-colors hover:border-gold/40 hover:text-gold"
          >
            <RotateCcw className="h-3 w-3" />
            Reset
          </button>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {parameters.map((p) => (
            <div key={p.name} className="space-y-2">
              <label
                htmlFor={`lab-${p.name}`}
                className="flex items-baseline justify-between gap-3 text-xs font-semibold uppercase tracking-wider text-text-muted"
              >
                <span>{p.label}</span>
                {p.type === "slider" && (
                  <span className="tabular-nums text-sm font-normal text-text">{values[p.name]}</span>
                )}
              </label>

              {p.type === "slider" && (
                <input
                  id={`lab-${p.name}`}
                  type="range"
                  min={p.min}
                  max={p.max}
                  step={p.step}
                  value={values[p.name]}
                  onChange={(e) => set(p.name, Number(e.target.value))}
                  className="w-full accent-[#F97316]"
                />
              )}

              {p.type === "select" && (
                <select
                  id={`lab-${p.name}`}
                  value={values[p.name]}
                  onChange={(e) => set(p.name, e.target.value)}
                  className="w-full border border-white/10 bg-black/60 px-4 py-2.5 text-sm text-text focus:border-gold focus:outline-none"
                >
                  {p.options?.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              )}

              {p.type === "text" && (
                <textarea
                  id={`lab-${p.name}`}
                  rows={2}
                  value={values[p.name]}
                  onChange={(e) => set(p.name, e.target.value)}
                  className="w-full resize-none border border-white/10 bg-black/60 px-4 py-2.5 text-sm text-text focus:border-gold focus:outline-none"
                />
              )}
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-white/[0.07] bg-black/40 p-4">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
            Current settings
          </p>
          <pre className="overflow-x-auto text-xs leading-relaxed text-text">
{JSON.stringify(values, null, 2)}
          </pre>
        </div>

        <p className="text-xs leading-relaxed text-text-muted">
          These settings describe the run you are about to do. Change one at a time — a lab where two variables
          moved together tells you nothing about either.
        </p>
      </section>

      <section className="space-y-5">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="font-serif text-xl text-text">Walkthrough</h2>
          <span className="text-xs tabular-nums text-text-muted">
            {done.size} of {steps.length} done
          </span>
        </div>

        <ol className="space-y-3">
          {steps.map((step, i) => {
            const complete = done.has(i);
            return (
              <li key={step.title}>
                <button
                  onClick={() => toggleStep(i)}
                  aria-pressed={complete}
                  className={`editorial-card glow-l flex w-full items-start gap-4 rounded-2xl p-5 text-left transition-colors ${
                    complete ? "border-cream/25" : ""
                  }`}
                >
                  <span
                    className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold transition-colors ${
                      complete
                        ? "border-cream bg-cream text-[#0C0B0A]"
                        : "border-cream/30 text-text-muted"
                    }`}
                  >
                    {complete ? <Check className="h-3.5 w-3.5" /> : i + 1}
                  </span>
                  <span className="flex-1">
                    <span
                      className={`block text-sm font-semibold transition-colors ${
                        complete ? "text-text-muted line-through" : "text-text"
                      }`}
                    >
                      {step.title}
                    </span>
                    <span className="mt-1 block text-sm leading-relaxed text-text-muted">{step.detail}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>

        {done.size === steps.length && steps.length > 0 && (
          <p className="rounded-2xl border border-cream/20 bg-cream/[0.08] p-5 text-sm text-text">
            That is the whole of {labTitle}. The thing worth keeping is the intuition about which knob moved
            which number — take that into the next lab.
          </p>
        )}
      </section>
    </div>
  );
}
