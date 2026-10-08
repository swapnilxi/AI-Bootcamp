import type { AiProvider } from "@prisma/client";
import type { z } from "zod/v4";
import type { ResolvedCredential } from "../credentials";
import type { ChatMessage, ChatStream, ProviderAdapter } from "./types";
import { ProviderError } from "./types";
import { anthropicAdapter } from "./anthropic";
import { geminiAdapter } from "./gemini";
import { deepseekAdapter } from "./deepseek";
import { ollamaAdapter } from "./ollama";

export type { ChatMessage, ChatStream } from "./types";
export { ProviderError } from "./types";

const ADAPTERS: Record<AiProvider, ProviderAdapter> = {
  ANTHROPIC: anthropicAdapter,
  GEMINI: geminiAdapter,
  DEEPSEEK: deepseekAdapter,
  OLLAMA: ollamaAdapter,
};

export function adapterFor(provider: AiProvider): ProviderAdapter {
  return ADAPTERS[provider];
}

export function streamProviderChat(
  credential: ResolvedCredential,
  opts: { system: string; messages: ChatMessage[]; maxTokens?: number; effort?: "low" | "medium" | "high" }
): ChatStream {
  return adapterFor(credential.provider).streamChat({ credential, ...opts });
}

export async function chatProviderOnce(
  credential: ResolvedCredential,
  opts: { system: string; messages: ChatMessage[]; maxTokens?: number; effort?: "low" | "medium" | "high" }
): Promise<string> {
  return adapterFor(credential.provider).chatOnce({ credential, ...opts });
}

export class StructuredOutputError extends Error {
  constructor(message = "The AI's reply wasn't valid JSON for this request.") {
    super(message);
  }
}

function stripCodeFence(text: string): string {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenced ? fenced[1] : trimmed;
}

/**
 * Non-Anthropic structured output: ask the provider's JSON mode for an object
 * matching `schema`, parse, validate, and retry once with the validation error
 * fed back in if it doesn't match. There's no schema-level enforcement from
 * these providers (unlike Anthropic's native structured output), so this is a
 * best-effort path good enough for quizzes/drafts, not a hard guarantee.
 */
export async function generateStructuredGeneric<Schema extends z.ZodType>(
  credential: ResolvedCredential,
  opts: { schema: Schema; system: string; prompt: string; maxTokens?: number }
): Promise<z.infer<Schema>> {
  const adapter = adapterFor(credential.provider);
  const jsonHint = "Respond with ONLY a single valid JSON object. No markdown code fences, no commentary before or after it.";
  const messages: ChatMessage[] = [{ role: "user", content: opts.prompt }];

  const attempt = async (extra?: string): Promise<z.infer<Schema>> => {
    const raw = await adapter.jsonOnce({
      credential,
      system: opts.system,
      messages: extra ? [...messages, { role: "assistant", content: extra }] : messages,
      maxTokens: opts.maxTokens,
      jsonHint,
    });
    let parsed: unknown;
    try {
      parsed = JSON.parse(stripCodeFence(raw));
    } catch {
      throw new StructuredOutputError("The AI didn't return valid JSON.");
    }
    const result = opts.schema.safeParse(parsed);
    if (!result.success) throw new StructuredOutputError(result.error.issues[0]?.message || "The AI's JSON didn't match the expected shape.");
    return result.data;
  };

  try {
    return await attempt();
  } catch (firstError) {
    try {
      return await attempt(
        `That didn't parse. ${firstError instanceof Error ? firstError.message : ""} Return ONLY the corrected JSON object.`
      );
    } catch {
      throw firstError;
    }
  }
}

/** Maps a provider error (or anything else) to a safe, user-facing message and HTTP status. */
export function describeProviderError(error: unknown): { message: string; status: number } {
  if (error instanceof StructuredOutputError) {
    return { message: "The AI couldn't produce a usable answer for this. Please try again.", status: 422 };
  }
  if (error instanceof ProviderError) {
    if (error.status === 401) return { message: "That AI key was rejected. Check it in Settings.", status: 401 };
    if (error.status === 429) return { message: "The AI provider is rate-limiting this key. Try again shortly.", status: 429 };
    console.error("AI provider error:", error.message);
    return { message: "The AI service had a problem. Please try again.", status: 502 };
  }
  console.error("AI error:", error);
  return { message: "Something went wrong with the AI request.", status: 500 };
}
