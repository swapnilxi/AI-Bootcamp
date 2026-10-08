"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AI_NOT_CONFIGURED_CODE, AI_SETTINGS_PATH } from "@/lib/ai/constants";

export { AI_SETTINGS_PATH };

let statusPromise: Promise<boolean> | null = null;

/** Whether AI features are enabled on the server (fetched once per page load). */
export function useAiEnabled(): boolean | null {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  useEffect(() => {
    statusPromise ??= fetch("/api/ai/status")
      .then((r) => (r.ok ? r.json() : { enabled: false }))
      .then((d) => !!d.enabled)
      .catch(() => false);
    statusPromise.then(setEnabled);
  }, []);
  return enabled;
}

/** True once the AI route tells us there's no usable key (the caller's own, or the server's). */
function isNotConfigured(body: unknown): boolean {
  return !!body && typeof body === "object" && (body as { code?: string }).code === AI_NOT_CONFIGURED_CODE;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

/**
 * Minimal streaming chat state: POSTs the transcript to `endpoint` and appends
 * the plain-text stream to the last assistant message as it arrives.
 */
export function useStreamingChat(endpoint: string, extraBody?: Record<string, unknown>) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsSetup, setNeedsSetup] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const send = useCallback(
    async (text: string) => {
      const content = text.trim();
      if (!content || streaming) return;
      const history: ChatMessage[] = [...messages, { role: "user", content }];
      setMessages([...history, { role: "assistant", content: "" }]);
      setStreaming(true);
      setError(null);
      setNeedsSetup(false);

      const controller = new AbortController();
      abortRef.current = controller;
      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: history, ...extraBody }),
          signal: controller.signal,
        });
        if (!res.ok || !res.body) {
          const body = await res.json().catch(() => ({}));
          if (isNotConfigured(body)) setNeedsSetup(true);
          throw new Error(body.error || "The assistant is unavailable right now.");
        }
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let acc = "";
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          acc += decoder.decode(value, { stream: true });
          setMessages([...history, { role: "assistant", content: acc }]);
        }
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setError((err as Error).message);
          setMessages(history); // drop the empty reply, keep the user's question visible
        }
      } finally {
        setStreaming(false);
        abortRef.current = null;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [endpoint, messages, streaming, JSON.stringify(extraBody ?? null)]
  );

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setMessages([]);
    setError(null);
    setNeedsSetup(false);
  }, []);

  useEffect(() => () => abortRef.current?.abort(), []);

  return { messages, streaming, error, needsSetup, send, reset };
}

/** One-shot streamed text (e.g. the chart insight). */
export async function streamText(
  endpoint: string,
  body: unknown,
  onText: (text: string) => void
): Promise<void> {
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok || !res.body) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "The AI request failed.");
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let acc = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    acc += decoder.decode(value, { stream: true });
    onText(acc);
  }
}
