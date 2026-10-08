"use client";

import { AlertCircle } from "lucide-react";
import { Skeleton, SkeletonCard, SkeletonStat } from "@/components/ui/Skeleton";

/**
 * Shared bodies for each route's `loading.tsx` / `error.tsx`. Every route
 * segment still needs its own thin file (Next.js requirement), but the look
 * — and the premium card/glow treatment — lives here once.
 */

export function RoutePageSkeleton({ cards = 3 }: { cards?: number }) {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="space-y-4">
        <Skeleton className="h-4 w-28 rounded-full" />
        <Skeleton className="h-9 w-72" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonStat key={i} />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {Array.from({ length: cards }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}

export function RouteError({
  reset,
  title = "Something didn't load",
  message = "An unexpected error occurred. You can try again.",
}: {
  reset: () => void;
  title?: string;
  message?: string;
}) {
  return (
    <div className="max-w-md mx-auto px-4 py-24">
      <div
        role="alert"
        className="editorial-card glow-tl rounded-2xl p-10 text-center space-y-4"
      >
        <AlertCircle className="w-10 h-10 text-orange mx-auto" />
        <h2 className="font-serif text-xl text-text">{title}</h2>
        <p className="text-sm text-text-muted">{message}</p>
        <button
          onClick={reset}
          className="btn-sheen inline-flex items-center justify-center rounded-full border border-cream/40 px-6 py-2.5 text-sm font-medium text-cream transition-colors hover:border-orange hover:shadow-[0_0_18px_-4px_rgba(249,115,22,0.45)]"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
