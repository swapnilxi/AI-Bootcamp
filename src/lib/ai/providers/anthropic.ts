import Anthropic from "@anthropic-ai/sdk";
import type { ChatOptions, ChatStream, ProviderAdapter } from "./types";
import { ProviderError } from "./types";
import { collectStream } from "./http";

export const ANTHROPIC_MODEL = "claude-opus-5-5";

/**
 * Server-side refusal fallback: if a request is declined by a safety classifier,
 * the API re-routes it to a suitable fallback model inside the same call. This
 * beta is provisioned on the app's own Anthropic account, so it's only used
 * with the server's `.env` key — a learner's personal key may not have it.
 */
const FALLBACK_BETA = "server-side-fallback-2026-07-01" as const;

async function* streamChat({ credential, system, messages, maxTokens = 2048, effort = "low" }: ChatOptions): ChatStream {
  const client = new Anthropic(credential.apiKey ? { apiKey: credential.apiKey } : undefined);
  const model = credential.model || ANTHROPIC_MODEL;
  try {
    const stream =
      credential.source === "server"
        ? client.beta.messages.stream({
            model,
            max_tokens: maxTokens,
            betas: [FALLBACK_BETA],
            fallbacks: "default",
            output_config: { effort },
            system,
            messages,
          })
        : client.messages.stream({ model, max_tokens: maxTokens, system, messages });

    for await (const event of stream) {
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
        yield event.delta.text;
      }
    }

    const final = await stream.finalMessage();
    if (final.stop_reason === "refusal") {
      yield "\n\nI'm not able to help with that request. Please try rephrasing your question.";
    } else if (final.stop_reason === "max_tokens") {
      yield "…";
    }
  } catch (error) {
    throw toProviderError(error);
  }
}

async function jsonOnce(opts: ChatOptions & { jsonHint: string }): Promise<string> {
  return collectStream(
    streamChat({
      ...opts,
      system: `${opts.system}\n\n${opts.jsonHint}`,
    })
  );
}

function toProviderError(error: unknown): ProviderError {
  if (error instanceof Anthropic.AuthenticationError) return new ProviderError("Anthropic authentication failed — check the API key.", 401);
  if (error instanceof Anthropic.RateLimitError) return new ProviderError("Anthropic is rate-limiting this key right now.", 429);
  if (error instanceof Anthropic.APIError) return new ProviderError(`Anthropic error: ${error.message}`, 502);
  return new ProviderError(error instanceof Error ? error.message : "Anthropic request failed", 502);
}

export const anthropicAdapter: ProviderAdapter = {
  streamChat,
  chatOnce: (opts) => collectStream(streamChat(opts)),
  jsonOnce,
};
