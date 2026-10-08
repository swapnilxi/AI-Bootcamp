import { NextResponse } from "next/server";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { resolveAiCredential, type ResolvedCredential } from "./credentials";
import { aiNotConfiguredResponse } from "./errors";

export type Preflight = { ok: true; credential: ResolvedCredential } | { ok: false; response: NextResponse };

/**
 * Shared preflight for AI endpoints: resolves which credential to use (the
 * caller's own, else the server's), feature-gates on it, and rate-limits.
 * `identity` should be the session user id where available — it's both the
 * rate-limit key and who we look up a personal credential for.
 */
export async function aiPreflight(
  req: Request,
  feature: string,
  identity: string | undefined,
  limit = 20,
  windowMs = 10 * 60 * 1000
): Promise<Preflight> {
  const credential = await resolveAiCredential(identity);
  if (!credential) {
    return { ok: false, response: aiNotConfiguredResponse() };
  }

  const key = `ai:${feature}:${identity || getClientIp(req)}`;
  const limiter = await rateLimit(key, { limit, windowMs });
  if (!limiter.success) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "You've reached the AI usage limit for now. Please try again in a few minutes." },
        { status: 429 }
      ),
    };
  }

  return { ok: true, credential };
}

/** Validate a chat transcript from the browser: alternating roles, bounded size. */
export function sanitizeChat(
  raw: unknown,
  maxTurns = 12,
  maxChars = 2000
): { role: "user" | "assistant"; content: string }[] | null {
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const msgs = raw
    .slice(-maxTurns)
    .map((m) => ({
      role: m?.role === "assistant" ? ("assistant" as const) : ("user" as const),
      content: typeof m?.content === "string" ? m.content.slice(0, maxChars).trim() : "",
    }))
    .filter((m) => m.content.length > 0);
  // Must start with a user turn and end with one
  while (msgs.length && msgs[0].role !== "user") msgs.shift();
  if (!msgs.length || msgs[msgs.length - 1].role !== "user") return null;
  return msgs;
}
