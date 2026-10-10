"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUp, ArrowDown } from "lucide-react";

export interface CustomModuleItem {
  id: string;
  slug: string;
  title: string;
  description: string;
}

/** Renders a project's instructor-added modules, with up/down reordering when the viewer can manage the project. */
export function CustomModulesGrid({
  projectSlug,
  initialModules,
  isInstructor,
  startIndex,
}: {
  projectSlug: string;
  initialModules: CustomModuleItem[];
  isInstructor: boolean;
  startIndex: number;
}) {
  const [modules, setModules] = useState(initialModules);
  const [busy, setBusy] = useState(false);

  async function move(index: number, delta: -1 | 1) {
    const target = index + delta;
    if (target < 0 || target >= modules.length) return;
    const next = [...modules];
    [next[index], next[target]] = [next[target], next[index]];
    setModules(next);
    setBusy(true);
    try {
      const res = await fetch(`/api/projects/${projectSlug}/custom-modules/reorder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moduleIds: next.map((m) => m.id) }),
      });
      if (!res.ok) setModules(initialModules);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {modules.map((module, idx) => (
        <li key={module.id} className="relative">
          <Link
            href={`/projects/${projectSlug}/${module.slug}`}
            className="editorial-card glow-tl block h-full space-y-2 rounded-2xl p-5 transition-colors"
          >
            <span className="text-[11px] font-semibold uppercase tracking-widest text-gold">Module {startIndex + idx}</span>
            <p className="text-sm font-semibold text-text">{module.title}</p>
            <p className="text-xs leading-relaxed text-text-muted">{module.description}</p>
          </Link>
          {isInstructor && (
            <div className="absolute right-3 top-3 flex items-center gap-0.5 rounded-full border border-white/10 bg-black/60 p-0.5">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  move(idx, -1);
                }}
                disabled={idx === 0 || busy}
                className="rounded-full p-1.5 text-text-muted transition-colors hover:text-gold disabled:opacity-30"
                aria-label="Move up"
              >
                <ArrowUp className="h-3 w-3" />
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  move(idx, 1);
                }}
                disabled={idx === modules.length - 1 || busy}
                className="rounded-full p-1.5 text-text-muted transition-colors hover:text-gold disabled:opacity-30"
                aria-label="Move down"
              >
                <ArrowDown className="h-3 w-3" />
              </button>
            </div>
          )}
        </li>
      ))}
    </>
  );
}
