import type { ChatOptions, ChatStream, ProviderAdapter } from "./types";
import { ProviderError } from "./types";
import { collectStream, providerErrorFrom, readJsonStream } from "./http";

const DEFAULT_MODEL = "gemini-2.5-flash";
const BASE = "https://generativelanguage.googleapis.com/v1beta";

function toContents(messages: ChatOptions["messages"]) {
  return messages.map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] }));
}

async function* streamChat({ credential, system, messages, maxTokens = 2048 }: ChatOptions): ChatStream {
  if (!credential.apiKey) throw new ProviderError("Gemini requires an API key.", 401);
  const model = credential.model || DEFAULT_MODEL;

  const res = await fetch(`${BASE}/models/${model}:streamGenerateContent?alt=sse&key=${encodeURIComponent(credential.apiKey)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: toContents(messages),
      generationConfig: { maxOutputTokens: maxTokens },
    }),
  });
  if (!res.ok) throw await providerErrorFrom(res, "Gemini");

  for await (const event of readJsonStream(res, "sse")) {
    const candidate = event?.candidates?.[0];
    const text = candidate?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("") ?? "";
    if (text) yield text;
    if (candidate?.finishReason === "SAFETY" || candidate?.finishReason === "RECITATION") {
      yield "\n\n[The response was blocked by the provider's safety filters.]";
    }
  }
}

async function jsonOnce({ credential, system, messages, maxTokens = 4096, jsonHint }: ChatOptions & { jsonHint: string }): Promise<string> {
  if (!credential.apiKey) throw new ProviderError("Gemini requires an API key.", 401);
  const model = credential.model || DEFAULT_MODEL;

  const res = await fetch(`${BASE}/models/${model}:generateContent?key=${encodeURIComponent(credential.apiKey)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: `${system}\n\n${jsonHint}` }] },
      contents: toContents(messages),
      generationConfig: { maxOutputTokens: maxTokens, responseMimeType: "application/json" },
    }),
  });
  if (!res.ok) throw await providerErrorFrom(res, "Gemini");

  const data = await res.json();
  const candidate = data?.candidates?.[0];
  return candidate?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("") ?? "";
}

export const geminiAdapter: ProviderAdapter = {
  streamChat,
  chatOnce: (opts) => collectStream(streamChat(opts)),
  jsonOnce,
};
