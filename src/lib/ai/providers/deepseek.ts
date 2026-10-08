import type { ChatOptions, ChatStream, ProviderAdapter } from "./types";
import { ProviderError } from "./types";
import { collectStream, providerErrorFrom, readJsonStream } from "./http";

const DEFAULT_MODEL = "deepseek-chat";
const DEFAULT_BASE_URL = "https://api.deepseek.com";

function toOpenAiMessages(system: string, messages: ChatOptions["messages"]) {
  return [{ role: "system", content: system }, ...messages];
}

async function* streamChat({ credential, system, messages, maxTokens = 2048 }: ChatOptions): ChatStream {
  if (!credential.apiKey) throw new ProviderError("DeepSeek requires an API key.", 401);
  const base = credential.baseUrl || DEFAULT_BASE_URL;

  const res = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${credential.apiKey}` },
    body: JSON.stringify({
      model: credential.model || DEFAULT_MODEL,
      max_tokens: maxTokens,
      stream: true,
      messages: toOpenAiMessages(system, messages),
    }),
  });
  if (!res.ok) throw await providerErrorFrom(res, "DeepSeek");

  for await (const event of readJsonStream(res, "sse")) {
    const delta = event?.choices?.[0]?.delta?.content;
    if (delta) yield delta;
  }
}

async function jsonOnce({ credential, system, messages, maxTokens = 4096, jsonHint }: ChatOptions & { jsonHint: string }): Promise<string> {
  if (!credential.apiKey) throw new ProviderError("DeepSeek requires an API key.", 401);
  const base = credential.baseUrl || DEFAULT_BASE_URL;

  const res = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${credential.apiKey}` },
    body: JSON.stringify({
      model: credential.model || DEFAULT_MODEL,
      max_tokens: maxTokens,
      response_format: { type: "json_object" },
      messages: toOpenAiMessages(`${system}\n\n${jsonHint}`, messages),
    }),
  });
  if (!res.ok) throw await providerErrorFrom(res, "DeepSeek");

  const data = await res.json();
  return data?.choices?.[0]?.message?.content ?? "";
}

export const deepseekAdapter: ProviderAdapter = {
  streamChat,
  chatOnce: (opts) => collectStream(streamChat(opts)),
  jsonOnce,
};
