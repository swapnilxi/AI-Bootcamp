import type { ResolvedCredential } from "../credentials";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatOptions {
  credential: ResolvedCredential;
  system: string;
  messages: ChatMessage[];
  maxTokens?: number;
  /** Anthropic-only reasoning-effort knob; other providers ignore it. */
  effort?: "low" | "medium" | "high";
}

/** A provider's streaming reply, as plain UTF-8 text chunks (already unwrapped from SSE/NDJSON). */
export type ChatStream = AsyncGenerator<string, void, unknown>;

export interface ProviderAdapter {
  /** Stream the assistant's reply as plain text chunks. */
  streamChat(opts: ChatOptions): ChatStream;
  /** One-shot reply, collected from the stream. Used where streaming isn't wired up client-side. */
  chatOnce(opts: ChatOptions): Promise<string>;
  /**
   * Ask for a single JSON object back (no schema enforcement from the provider
   * itself — the caller validates with zod and retries once on a parse/validation
   * failure). Anthropic has a stronger native path for this; see structured.ts.
   */
  jsonOnce(opts: ChatOptions & { jsonHint: string }): Promise<string>;
}

export class ProviderError extends Error {
  status: number;
  constructor(message: string, status = 502) {
    super(message);
    this.status = status;
  }
}
