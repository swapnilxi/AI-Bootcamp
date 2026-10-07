"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CLASS_ROUTES } from "../routes";
import type { ClassFilter } from "../types";
import type { ClassItem } from "../components/ClassCard";

export interface UseClassesResult {
  classes: ClassItem[];
  loading: boolean;
  /** Set when the last fetch failed, so the caller can show a retry affordance. */
  error: string | null;
  refetch: () => void;
}

/**
 * Loads the class catalog for a filter. In-flight requests are aborted when the
 * filter changes or the component unmounts, so a slow earlier response can never
 * overwrite a newer one.
 */
export function useClasses(filter: ClassFilter = "all"): UseClassesResult {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  const refetch = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    fetch(CLASS_ROUTES.list(filter), { signal: controller.signal })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || "Could not load classes");
        return data;
      })
      .then((data) => {
        if (controller.signal.aborted) return;
        setClasses(Array.isArray(data.classes) ? data.classes : []);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted || (err as Error)?.name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Could not load classes");
        setClasses([]);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [filter, nonce]);

  return { classes, loading, error, refetch };
}
