import Anthropic from "@anthropic-ai/sdk";
import { getServerCredential } from "./credentials";
import { describeProviderError } from "./providers";

/** True when at least one provider has a server-wide (`.env`) credential configured. */
export function isAiConfigured(): boolean {
  return !!getServerCredential();
}

export class AiUnavailableError extends Error {
  constructor() {
    super("AI features are not configured on this server.");
  }
}

/** Map any AI-related error (any provider, or a legacy Anthropic SDK error) to a safe, user-facing message + HTTP status. */
export function describeAiError(error: unknown): { message: string; status: number } {
  if (error instanceof AiUnavailableError) {
    return { message: error.message, status: 503 };
  }
  if (error instanceof Anthropic.RateLimitError) {
    return { message: "The AI assistant is busy right now. Please try again in a moment.", status: 429 };
  }
  if (error instanceof Anthropic.AuthenticationError) {
    console.error("Anthropic authentication failed — check the configured key");
    return { message: "That AI key was rejected. Check it in Settings.", status: 401 };
  }
  if (error instanceof Anthropic.BadRequestError) {
    console.error("Anthropic bad request:", error.message);
    return { message: "The AI request could not be processed.", status: 400 };
  }
  if (error instanceof Anthropic.APIError) {
    console.error(`Anthropic API error ${error.status}:`, error.message);
    return { message: "The AI service had a problem. Please try again.", status: 502 };
  }
  return describeProviderError(error);
}
