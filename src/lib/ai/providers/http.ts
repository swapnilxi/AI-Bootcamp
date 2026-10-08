import { ProviderError } from "./types";
import type { ChatStream } from "./types";

/** Reads an SSE (`data: {...}\n\n`) or NDJSON (`{...}\n`) stream, yielding parsed JSON objects. */
export async function* readJsonStream(
  response: Response,
  framing: "sse" | "ndjson"
): AsyncGenerator<any, void, unknown> {
  if (!response.body) return;
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;
      const payload = framing === "sse" ? (line.startsWith("data:") ? line.slice(5).trim() : null) : line;
      if (!payload || payload === "[DONE]") continue;
      try {
        yield JSON.parse(payload);
      } catch {
        // partial or non-JSON line (e.g. an SSE comment/keep-alive) — ignore
      }
    }
  }
}

export async function providerErrorFrom(res: Response, label: string): Promise<ProviderError> {
  const text = await res.text().catch(() => "");
  const status = res.status === 401 || res.status === 403 ? 401 : res.status === 429 ? 429 : 502;
  return new ProviderError(`${label} request failed (${res.status}): ${text.slice(0, 300) || res.statusText}`, status);
}

/** Drains a streaming adapter into a single string — shared by every provider's `chatOnce`. */
export async function collectStream(stream: ChatStream): Promise<string> {
  let acc = "";
  for await (const chunk of stream) acc += chunk;
  return acc;
}
