"use client";

import { useState } from "react";
import { ExternalLink, KeyRound, Check, Trash2, Loader2, Sparkles } from "lucide-react";
import { MetaPill } from "@/components/learning/primitives";

type Provider = "ANTHROPIC" | "GEMINI" | "DEEPSEEK" | "OLLAMA";

export interface CredentialSummary {
  provider: Provider;
  configured: boolean;
  maskedKey: string | null;
  baseUrl: string | null;
  model: string | null;
  isActive: boolean;
}

export interface AiSettingsData {
  activeProvider: Provider | null;
  credentials: CredentialSummary[];
  serverConfiguredProviders: Provider[];
}

const PROVIDER_META: Record<
  Provider,
  {
    label: string;
    blurb: string;
    keyUrl: string;
    keyUrlLabel: string;
    keyPlaceholder: string;
    needsKey: boolean;
    needsBaseUrl: boolean;
    baseUrlRequired: boolean;
    baseUrlPlaceholder: string;
    models: { value: string; label: string }[];
    /** Ollama models are whatever's been pulled locally — free text with suggestions, not a fixed list. */
    freeformModel: boolean;
    modelPlaceholder: string;
    howTo: string;
  }
> = {
  ANTHROPIC: {
    label: "Anthropic (Claude)",
    blurb: "The model this app uses by default for the AI Tutor and study tools.",
    keyUrl: "https://console.anthropic.com/settings/keys",
    keyUrlLabel: "console.anthropic.com",
    keyPlaceholder: "sk-ant-…",
    needsKey: true,
    needsBaseUrl: false,
    baseUrlRequired: false,
    baseUrlPlaceholder: "",
    freeformModel: false,
    models: [
      { value: "claude-opus-5-5", label: "Claude Opus 5.5 (default — most capable)" },
      { value: "claude-sonnet-5-5", label: "Claude Sonnet 5.5 (balanced)" },
      { value: "claude-haiku-4-5-20251001", label: "Claude Haiku 4.5 (fastest, cheapest)" },
    ],
    modelPlaceholder: "",
    howTo: "Sign in to the Anthropic Console, open Settings → API Keys, and create a new key.",
  },
  GEMINI: {
    label: "Google Gemini",
    blurb: "Google's models, via Google AI Studio.",
    keyUrl: "https://aistudio.google.com/apikey",
    keyUrlLabel: "aistudio.google.com",
    keyPlaceholder: "AIza…",
    needsKey: true,
    needsBaseUrl: false,
    baseUrlRequired: false,
    baseUrlPlaceholder: "",
    freeformModel: false,
    models: [
      { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash (default — fast)" },
      { value: "gemini-2.5-pro", label: "Gemini 2.5 Pro (most capable)" },
      { value: "gemini-2.0-flash", label: "Gemini 2.0 Flash" },
    ],
    modelPlaceholder: "",
    howTo: "Open Google AI Studio, click \"Get API key\", and create one for a Google Cloud project (free tier available).",
  },
  DEEPSEEK: {
    label: "DeepSeek",
    blurb: "DeepSeek's models, via their OpenAI-compatible API.",
    keyUrl: "https://platform.deepseek.com/api_keys",
    keyUrlLabel: "platform.deepseek.com",
    keyPlaceholder: "sk-…",
    needsKey: true,
    needsBaseUrl: true,
    baseUrlRequired: false,
    baseUrlPlaceholder: "default: https://api.deepseek.com",
    freeformModel: false,
    models: [
      { value: "deepseek-chat", label: "DeepSeek Chat (default — DeepSeek-V3)" },
      { value: "deepseek-reasoner", label: "DeepSeek Reasoner (DeepSeek-R1, shows its reasoning)" },
    ],
    modelPlaceholder: "",
    howTo: "Create a DeepSeek platform account, open API Keys, and generate one. Add funds — there's no free tier.",
  },
  OLLAMA: {
    label: "Ollama (local / self-hosted)",
    blurb: "Run a model yourself — free, private, no API key needed.",
    keyUrl: "https://ollama.com/download",
    keyUrlLabel: "ollama.com",
    keyPlaceholder: "only needed for a protected remote Ollama server",
    needsKey: false,
    needsBaseUrl: true,
    baseUrlRequired: true,
    baseUrlPlaceholder: "http://localhost:11434",
    freeformModel: true,
    models: [
      { value: "llama3.1", label: "llama3.1" },
      { value: "qwen2.5", label: "qwen2.5" },
      { value: "mistral", label: "mistral" },
      { value: "phi3", label: "phi3" },
    ],
    modelPlaceholder: "e.g. llama3.1 — must be a model you've already pulled",
    howTo: 'Install Ollama, run "ollama pull llama3.1", then leave it running (ollama serve) while you use this.',
  },
};

const PROVIDERS: Provider[] = ["ANTHROPIC", "GEMINI", "DEEPSEEK", "OLLAMA"];

async function callApi(method: "PUT" | "DELETE" | "PATCH", body: unknown): Promise<AiSettingsData> {
  const res = await fetch("/api/settings/ai", {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Something went wrong.");
  return data;
}

function ProviderCard({
  provider,
  summary,
  serverHasKey,
  onChange,
}: {
  provider: Provider;
  summary: CredentialSummary;
  serverHasKey: boolean;
  onChange: (data: AiSettingsData) => void;
}) {
  const meta = PROVIDER_META[provider];
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState(summary.baseUrl || "");
  const [model, setModel] = useState(summary.model || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const data = await callApi("PUT", { provider, apiKey: apiKey || undefined, baseUrl, model });
      onChange(data);
      setApiKey("");
      setNotice("Saved.");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function handleMakeActive() {
    setSaving(true);
    setError(null);
    try {
      onChange(await callApi("PATCH", { provider }));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove() {
    setSaving(true);
    setError(null);
    try {
      onChange(await callApi("DELETE", { provider }));
      setBaseUrl("");
      setModel("");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      data-no-reveal
      className={`editorial-card rounded-2xl p-6 space-y-4 ${summary.isActive ? "border-gold/40" : ""}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-serif text-lg text-text">{meta.label}</h3>
            {summary.isActive && (
              <MetaPill className="!border-gold/40 !bg-gold/10 !text-gold">
                <Check className="w-3 h-3" /> Active
              </MetaPill>
            )}
            {!summary.configured && serverHasKey && <MetaPill>Server key available</MetaPill>}
          </div>
          <p className="mt-1 text-xs text-text-muted leading-relaxed">{meta.blurb}</p>
        </div>
        <a
          href={meta.keyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold text-gold hover:underline"
        >
          Get a key at {meta.keyUrlLabel} <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      <p className="text-xs text-text-muted leading-relaxed border-l-2 border-white/10 pl-3">{meta.howTo}</p>

      <div className="grid gap-3 sm:grid-cols-2">
        {meta.needsKey && (
          <div className="sm:col-span-2">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-text-muted mb-1.5">
              API key {summary.configured && <span className="normal-case font-normal">(saved: {summary.maskedKey})</span>}
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={meta.keyPlaceholder}
              autoComplete="off"
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-sm text-text focus:outline-none focus:border-gold/60"
            />
          </div>
        )}
        {meta.needsBaseUrl && (
          <div className={meta.needsKey ? "" : "sm:col-span-2"}>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-text-muted mb-1.5">
              Base URL {meta.baseUrlRequired ? "" : "(optional)"}
            </label>
            <input
              type="text"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder={meta.baseUrlPlaceholder}
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-sm text-text focus:outline-none focus:border-gold/60"
            />
          </div>
        )}
        <div className={meta.needsKey && meta.needsBaseUrl ? "sm:col-span-2" : ""}>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-text-muted mb-1.5">
            Model {meta.freeformModel ? "(optional)" : ""}
          </label>
          {meta.freeformModel ? (
            <>
              <input
                type="text"
                list={`${provider}-models`}
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder={meta.modelPlaceholder}
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-sm text-text focus:outline-none focus:border-gold/60"
              />
              <datalist id={`${provider}-models`}>
                {meta.models.map((m) => (
                  <option key={m.value} value={m.value} />
                ))}
              </datalist>
            </>
          ) : (
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-sm text-text focus:outline-none focus:border-gold/60"
            >
              <option value="">Default ({meta.models[0]?.value})</option>
              {meta.models.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {error && <p className="text-xs text-cream">{error}</p>}
      {notice && !error && <p className="text-xs text-emerald-300">{notice}</p>}

      <div className="flex flex-wrap items-center gap-2.5 pt-1">
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cream hover:bg-cream/90 text-[#0C0B0A] text-xs font-semibold transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <KeyRound className="w-3.5 h-3.5" />}
          Save
        </button>
        {summary.configured && !summary.isActive && (
          <button
            onClick={handleMakeActive}
            disabled={saving}
            className="px-4 py-2 rounded-xl border border-white/15 text-xs font-semibold text-text hover:border-gold/40 hover:text-gold transition-colors disabled:opacity-50"
          >
            Make active
          </button>
        )}
        {summary.configured && (
          <button
            onClick={handleRemove}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs text-text-muted hover:text-cream transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" /> Remove
          </button>
        )}
      </div>
    </div>
  );
}

export function AiSettingsForm({ initialData, redirected }: { initialData: AiSettingsData; redirected: boolean }) {
  const [data, setData] = useState(initialData);

  return (
    <div className="space-y-6">
      {redirected && (
        <div className="flex items-start gap-3 rounded-2xl border border-gold/30 bg-gold/[0.06] p-4 text-sm text-text">
          <Sparkles className="w-4 h-4 shrink-0 mt-0.5 text-gold" />
          <p>
            You tried to use an AI feature and no key was available. Add your own below — it only takes a minute —
            or ask an admin to configure one on the server.
          </p>
        </div>
      )}

      <div className="grid gap-5">
        {PROVIDERS.map((provider) => {
          const summary = data.credentials.find((c) => c.provider === provider)!;
          return (
            <ProviderCard
              key={provider}
              provider={provider}
              summary={summary}
              serverHasKey={data.serverConfiguredProviders.includes(provider)}
              onChange={setData}
            />
          );
        })}
      </div>
    </div>
  );
}
