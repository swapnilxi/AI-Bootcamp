import Link from "next/link";
import { PROJECT_MODULES, moduleHref } from "./modules";

export function ModuleStepper({ projectSlug, activeSlug }: { projectSlug: string; activeSlug: string }) {
  const activeIndex = PROJECT_MODULES.findIndex((m) => m.slug === activeSlug);

  return (
    <nav aria-label="Project modules" className="overflow-x-auto">
      <ol className="flex min-w-max items-center gap-2">
        {PROJECT_MODULES.map((module, idx) => {
          const isActive = idx === activeIndex;
          const isDone = idx < activeIndex;
          return (
            <li key={module.slug || "overview"} className="flex items-center gap-2">
              {idx > 0 && <span className="h-px w-5 shrink-0 bg-white/10" aria-hidden="true" />}
              <Link
                href={moduleHref(projectSlug, module.slug)}
                aria-current={isActive ? "step" : undefined}
                className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
                  isActive
                    ? "border-gold/50 bg-gold/10 text-gold"
                    : isDone
                    ? "border-white/15 text-text-muted hover:border-gold/30 hover:text-gold"
                    : "border-white/[0.07] text-text-muted/70 hover:border-gold/30 hover:text-gold"
                }`}
              >
                <span
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ${
                    isActive ? "bg-gold text-[#0C0B0A]" : "bg-white/10 text-text-muted"
                  }`}
                >
                  {idx + 1}
                </span>
                {module.shortTitle}
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function ModulePager({ projectSlug, activeSlug }: { projectSlug: string; activeSlug: string }) {
  const activeIndex = PROJECT_MODULES.findIndex((m) => m.slug === activeSlug);
  const prev = activeIndex > 0 ? PROJECT_MODULES[activeIndex - 1] : undefined;
  const next = activeIndex < PROJECT_MODULES.length - 1 ? PROJECT_MODULES[activeIndex + 1] : undefined;

  return (
    <div className="flex items-center justify-between gap-3 border-t border-black-line pt-6">
      {prev ? (
        <Link
          href={moduleHref(projectSlug, prev.slug)}
          className="inline-flex items-center gap-2 text-sm text-text-muted transition-colors hover:text-gold"
        >
          ← {prev.title}
        </Link>
      ) : (
        <span />
      )}
      {next ? (
        <Link
          href={moduleHref(projectSlug, next.slug)}
          className="inline-flex items-center gap-2 rounded-xl bg-gold px-5 py-2.5 text-sm font-semibold text-[#0C0B0A] transition-opacity hover:opacity-90"
        >
          {next.title} →
        </Link>
      ) : (
        <Link
          href="/projects"
          className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-5 py-2.5 text-sm font-semibold text-text transition-colors hover:border-gold/40 hover:text-gold"
        >
          Back to all projects
        </Link>
      )}
    </div>
  );
}
