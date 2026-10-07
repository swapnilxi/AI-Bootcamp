import Anthropic from "@anthropic-ai/sdk";

/** Single model for every AI feature in the app. */
export const AI_MODEL = "claude-opus-5-5";

/**
 * Server-side refusal fallback: if a request is declined by a safety classifier,
 * the API re-routes it to a suitable fallback model inside the same call.
 */
export const FALLBACK_BETA = "server-side-fallback-2026-07-01" as const;

let client: Anthropic | null = null;

/** AI features are enabled when an Anthropic credential is configured. */
export function isAiConfigured(): boolean {
  return !!(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
}

export function getAnthropic(): Anthropic {
  if (!client) client = new Anthropic();
  return client;
}

export class AiUnavailableError extends Error {
  constructor() {
    super("AI features are not configured on this server.");
  }
}

/** Map SDK errors to a safe, user-facing message and HTTP status. */
export function describeAiError(error: unknown): { message: string; status: number } {
  if (error instanceof AiUnavailableError) {
    return { message: error.message, status: 503 };
  }
  if (error instanceof Anthropic.RateLimitError) {
    return { message: "The AI assistant is busy right now. Please try again in a moment.", status: 429 };
  }
  if (error instanceof Anthropic.AuthenticationError) {
    console.error("Anthropic authentication failed - check ANTHROPIC_API_KEY");
    return { message: "AI features are temporarily unavailable.", status: 503 };
  }
  if (error instanceof Anthropic.BadRequestError) {
    console.error("Anthropic bad request:", error.message);
    return { message: "The AI request could not be processed.", status: 400 };
  }
  if (error instanceof Anthropic.APIError) {
    console.error(`Anthropic API error ${error.status}:`, error.message);
    return { message: "The AI service had a problem. Please try again.", status: 502 };
  }
  console.error("AI error:", error);
  return { message: "Something went wrong with the AI request.", status: 500 };
}
