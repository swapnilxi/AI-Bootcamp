import type Anthropic from "@anthropic-ai/sdk";
import { AI_MODEL, FALLBACK_BETA, describeAiError, getAnthropic } from "./client";

interface StreamTextOptions {
  system: string;
  messages: Anthropic.Beta.BetaMessageParam[];
  maxTokens?: number;
  effort?: "low" | "medium" | "high";
}

/**
 * Stream Claude's text reply to the browser as plain UTF-8 chunks.
 * Thinking stays adaptive (default) but hidden; only text deltas are forwarded.
 */
export function streamTextResponse({
  system,
  messages,
  maxTokens = 4096,
  effort = "low",
}: StreamTextOptions): Response {
  const encoder = new TextEncoder();

  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const stream = getAnthropic().beta.messages.stream({
          model: AI_MODEL,
          max_tokens: maxTokens,
          betas: [FALLBACK_BETA],
          fallbacks: "default",
          output_config: { effort },
          system,
          messages,
        });

        for await (const event of stream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }

        const final = await stream.finalMessage();
        if (final.stop_reason === "refusal") {
          controller.enqueue(
            encoder.encode("\n\nI'm not able to help with that request. Please try rephrasing your question.")
          );
        } else if (final.stop_reason === "max_tokens") {
          controller.enqueue(encoder.encode("…"));
        }
      } catch (error) {
        const { message } = describeAiError(error);
        controller.enqueue(encoder.encode(`\n\n[${message}]`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
