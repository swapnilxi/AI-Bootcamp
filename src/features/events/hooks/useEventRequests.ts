"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { EVENT_ROUTES } from "../routes";
import type { EventRequestSummary } from "../types";

export type RequestScope = "mine" | "tagged" | "all";

export interface UseEventRequestsResult {
    requests: EventRequestSummary[];
    loading: boolean;
    error: string | null;
    refetch: () => void;
}

/** Loads community event requests for a given audience. */
export function useEventRequests(scope: RequestScope = "mine"): UseEventRequestsResult {
    const [requests, setRequests] = useState<EventRequestSummary[]>([]);
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

        fetch(`${EVENT_ROUTES.requests}?scope=${scope}`, { signal: controller.signal })
            .then(async (res) => {
                const data = await res.json().catch(() => ({}));
                if (!res.ok) throw new Error(data?.error || "Could not load requests");
                return data;
            })
            .then((data) => {
                if (controller.signal.aborted) return;
                setRequests(Array.isArray(data.requests) ? data.requests : []);
            })
            .catch((err: unknown) => {
                if (controller.signal.aborted || (err as Error)?.name === "AbortError") return;
                setError(err instanceof Error ? err.message : "Could not load requests");
                setRequests([]);
            })
            .finally(() => {
                if (!controller.signal.aborted) setLoading(false);
            });

        return () => controller.abort();
    }, [scope, nonce]);

    return { requests, loading, error, refetch };
}