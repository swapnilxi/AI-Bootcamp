import type { ResolvedCredential } from "./credentials";
import { describeProviderError, streamProviderChat, type ChatMessage } from "./providers";

interface StreamTextOptions {
  credential: ResolvedCredential;
  system: string;
  messages: ChatMessage[];
  maxTokens?: number;
  effort?: "low" | "medium" | "high";
}

/**
 * Stream the assistant's reply to the browser as plain UTF-8 chunks, from
 * whichever provider `credential` points at.
 */
export function streamTextResponse({ credential, system, messages, maxTokens = 4096, effort = "low" }: StreamTextOptions): Response {
  const encoder = new TextEncoder();

  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const chunk of streamProviderChat(credential, { system, messages, maxTokens, effort })) {
          controller.enqueue(encoder.encode(chunk));
        }
      } catch (error) {
        const { message } = describeProviderError(error);
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
