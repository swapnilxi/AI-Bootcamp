import type { ChatOptions, ChatStream, ProviderAdapter } from "./types";
import { ProviderError } from "./types";
import { collectStream, providerErrorFrom, readJsonStream } from "./http";

const DEFAULT_MODEL = "llama3.1";

function toOllamaMessages(system: string, messages: ChatOptions["messages"]) {
  return [{ role: "system", content: system }, ...messages];
}

function headers(credential: ChatOptions["credential"]): HeadersInit {
  const h: HeadersInit = { "Content-Type": "application/json" };
  if (credential.apiKey) (h as Record<string, string>).Authorization = `Bearer ${credential.apiKey}`;
  return h;
}

async function* streamChat({ credential, system, messages, maxTokens = 2048 }: ChatOptions): ChatStream {
  if (!credential.baseUrl) throw new ProviderError("Ollama requires a base URL (e.g. http://localhost:11434).", 400);

  const res = await fetch(`${credential.baseUrl.replace(/\/$/, "")}/api/chat`, {
    method: "POST",
    headers: headers(credential),
    body: JSON.stringify({
      model: credential.model || DEFAULT_MODEL,
      stream: true,
      options: { num_predict: maxTokens },
      messages: toOllamaMessages(system, messages),
    }),
  });
  if (!res.ok) throw await providerErrorFrom(res, "Ollama");

  for await (const event of readJsonStream(res, "ndjson")) {
    const text = event?.message?.content;
    if (text) yield text;
  }
}

async function jsonOnce({ credential, system, messages, maxTokens = 4096, jsonHint }: ChatOptions & { jsonHint: string }): Promise<string> {
  if (!credential.baseUrl) throw new ProviderError("Ollama requires a base URL (e.g. http://localhost:11434).", 400);

  const res = await fetch(`${credential.baseUrl.replace(/\/$/, "")}/api/chat`, {
    method: "POST",
    headers: headers(credential),
    body: JSON.stringify({
      model: credential.model || DEFAULT_MODEL,
      stream: false,
      format: "json",
      options: { num_predict: maxTokens },
      messages: toOllamaMessages(`${system}\n\n${jsonHint}`, messages),
    }),
  });
  if (!res.ok) throw await providerErrorFrom(res, "Ollama");

  const data = await res.json();
  return data?.message?.content ?? "";
}

export const ollamaAdapter: ProviderAdapter = {
  streamChat,
  chatOnce: (opts) => collectStream(streamChat(opts)),
  jsonOnce,
};
