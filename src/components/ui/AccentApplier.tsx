"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { ACCENT_STORAGE_KEY, DEFAULT_ACCENT, isAccentColor, type AccentColor } from "@/lib/accent";

export function applyAccent(accent: AccentColor) {
  if (accent === DEFAULT_ACCENT) {
    document.documentElement.removeAttribute("data-accent");
  } else {
    document.documentElement.setAttribute("data-accent", accent);
  }
}

/**
 * Applies the accent color to <html> as early as possible: first from
 * localStorage (instant, no flash, works signed-out), then reconciled
 * against the signed-in user's saved preference once the session resolves.
 */
export function AccentApplier() {
  const { data: session, status } = useSession();

  useEffect(() => {
    const saved = localStorage.getItem(ACCENT_STORAGE_KEY);
    if (isAccentColor(saved)) applyAccent(saved);
  }, []);

  useEffect(() => {
    if (status !== "authenticated" || !session?.user) return;
    let cancelled = false;
    fetch("/api/settings/appearance")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !isAccentColor(data?.accentColor)) return;
        applyAccent(data.accentColor);
        localStorage.setItem(ACCENT_STORAGE_KEY, data.accentColor);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [status, session?.user]);

  return null;
}
