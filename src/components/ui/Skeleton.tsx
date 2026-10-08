import React from "react";

/**
 * Skeleton loaders shaped like the real cards they stand in for, so a route
 * transition reads as "the content is arriving" rather than "Loading…" text.
 * A single cream glint sweeps every block at a gentle, staggered offset.
 */

export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`relative overflow-hidden rounded-xl bg-white/[0.04] ${className}`}
      aria-hidden="true"
    >
      <div className="skeleton-sweep" />
    </div>
  );
}

/** Mirrors `CatalogueCard` / `editorial-card`: eyebrow-less title, two text lines, a pill row. */
export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div className={`editorial-card rounded-2xl p-6 h-full space-y-4 ${className}`} aria-hidden="true">
      <Skeleton className="h-5 w-3/5" />
      <div className="space-y-2">
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-4/5" />
      </div>
      <div className="flex gap-2 pt-2">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
    </div>
  );
}

/** Mirrors a mentor/instructor card: avatar tile beside two lines of identity. */
export function SkeletonAvatarCard({ className = "" }: { className?: string }) {
  return (
    <div className={`editorial-card rounded-2xl p-6 h-full space-y-5 ${className}`} aria-hidden="true">
      <div className="flex items-start gap-4">
        <Skeleton className="h-20 w-20 rounded-2xl shrink-0" />
        <div className="flex-1 space-y-2.5 pt-1">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-3 w-5/6" />
        </div>
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-9 flex-1 rounded-xl" />
        <Skeleton className="h-9 flex-1 rounded-xl" />
      </div>
    </div>
  );
}

/** Mirrors `StatTile`. */
export function SkeletonStat({ className = "" }: { className?: string }) {
  return (
    <div className={`editorial-card rounded-2xl p-5 space-y-3 ${className}`} aria-hidden="true">
      <Skeleton className="h-7 w-14" />
      <Skeleton className="h-2.5 w-20" />
    </div>
  );
}

/** A grid of `SkeletonCard`s, for a catalogue page's loading state. */
export function SkeletonGrid({
  count = 6,
  columns = "md:grid-cols-2 lg:grid-cols-3",
  variant = "card",
}: {
  count?: number;
  columns?: string;
  variant?: "card" | "avatar";
}) {
  const Item = variant === "avatar" ? SkeletonAvatarCard : SkeletonCard;
  return (
    <div className={`grid grid-cols-1 ${columns} gap-6`}>
      {Array.from({ length: count }).map((_, i) => (
        <Item key={i} />
      ))}
    </div>
  );
}
