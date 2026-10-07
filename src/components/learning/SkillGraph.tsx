import React from "react";
import Link from "next/link";
import { Lock, Check, CircleDot, Circle } from "lucide-react";
import type { SkillNode } from "@/lib/learning/progress";

/**
 * The skill graph, drawn as dependency tiers rather than a free-form network.
 *
 * A force-directed graph looks impressive and answers none of the learner's
 * questions. Tiers do: everything in a row can be learned now, and a row only
 * opens once the row behind it is solid — which is the thing the learner is
 * actually trying to read off the page.
 */

const STATE_STYLE: Record<string, { card: string; chip: string; icon: React.ReactNode; label: string }> = {
  MASTERED: {
    card: "border-emerald-500/30 bg-emerald-500/[0.06]",
    chip: "text-emerald-300",
    icon: <Check className="h-3.5 w-3.5" />,
    label: "Mastered",
  },
  IN_PROGRESS: {
    card: "border-gold/40 bg-gold/[0.07]",
    chip: "text-gold",
    icon: <CircleDot className="h-3.5 w-3.5" />,
    label: "In progress",
  },
  AVAILABLE: {
    card: "border-white/[0.1] bg-white/[0.02]",
    chip: "text-text-muted",
    icon: <Circle className="h-3.5 w-3.5" />,
    label: "Available",
  },
  LOCKED: {
    card: "border-white/[0.05] bg-white/[0.01] opacity-55",
    chip: "text-text-muted/70",
    icon: <Lock className="h-3.5 w-3.5" />,
    label: "Locked",
  },
};

/**
 * Assigns each skill to a tier: one past the deepest tier of its prerequisites.
 * The input is already in dependency order, so a single pass is enough.
 */
function toTiers(skills: SkillNode[]): SkillNode[][] {
  const depth = new Map<string, number>();
  for (const skill of skills) {
    const parents = skill.requires.map((slug) => depth.get(slug) ?? 0);
    depth.set(skill.slug, parents.length ? Math.max(...parents) + 1 : 0);
  }

  const tiers: SkillNode[][] = [];
  for (const skill of skills) {
    const d = depth.get(skill.slug) ?? 0;
    (tiers[d] ??= []).push(skill);
  }
  return tiers.filter(Boolean);
}

export function SkillGraph({ skills }: { skills: SkillNode[] }) {
  const tiers = toTiers(skills);

  return (
    <div className="space-y-4">
      {tiers.map((tier, i) => (
        <div key={i} className="relative">
          {i > 0 && (
            <div
              className="absolute -top-4 left-1/2 h-4 w-px -translate-x-1/2 bg-gradient-to-b from-transparent to-gold/30"
              aria-hidden="true"
            />
          )}
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {tier.map((skill) => {
              const style = STATE_STYLE[skill.state] ?? STATE_STYLE.LOCKED;
              const interactive = skill.state !== "LOCKED";

              const inner = (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-sm font-semibold leading-snug text-text">{skill.name}</h3>
                    <span className={`shrink-0 ${style.chip}`} title={style.label} aria-label={style.label}>
                      {style.icon}
                    </span>
                  </div>
                  <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-text-muted">
                    {skill.description}
                  </p>
                  {skill.masteryPct > 0 && (
                    <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/[0.07]">
                      <div
                        className="h-full rounded-full bg-[linear-gradient(90deg,#DC4C00,#FF7315_55%,#FFB073)]"
                        style={{ width: `${skill.masteryPct}%` }}
                      />
                    </div>
                  )}
                </>
              );

              return (
                <li key={skill.slug}>
                  {interactive ? (
                    <Link
                      href={`/practice?skill=${skill.slug}`}
                      className={`block h-full rounded-2xl border p-4 transition-colors hover:border-gold/60 ${style.card}`}
                    >
                      {inner}
                    </Link>
                  ) : (
                    <div className={`h-full rounded-2xl border p-4 ${style.card}`}>{inner}</div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
