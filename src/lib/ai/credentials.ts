import type { AiProvider } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { decryptSecret, encryptSecret, maskSecret } from "./crypto";

export interface ResolvedCredential {
  provider: AiProvider;
  apiKey: string | null;
  baseUrl: string | null;
  /** Model override, e.g. an Ollama tag like "llama3.1". Null means "use the provider's default". */
  model: string | null;
  /** Whose key is actually being used — shown nowhere sensitive, just for logs/telemetry. */
  source: "user" | "server";
}

/** Providers tried in order when a user hasn't picked one and the server falls back. */
const PROVIDER_PRIORITY: AiProvider[] = ["ANTHROPIC", "GEMINI", "DEEPSEEK", "OLLAMA"];

/** A key configured by the admin/dev in `.env`, shared by everyone who has no key of their own. */
export function getServerCredential(provider?: AiProvider): ResolvedCredential | null {
  const candidates = provider ? [provider] : PROVIDER_PRIORITY;
  for (const p of candidates) {
    const cred = readServerEnvFor(p);
    if (cred) return cred;
  }
  return null;
}

function readServerEnvFor(provider: AiProvider): ResolvedCredential | null {
  switch (provider) {
    case "ANTHROPIC": {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      return apiKey ? { provider, apiKey, baseUrl: null, model: null, source: "server" } : null;
    }
    case "GEMINI": {
      const apiKey = process.env.GEMINI_API_KEY;
      return apiKey
        ? { provider, apiKey, baseUrl: null, model: process.env.GEMINI_MODEL || null, source: "server" }
        : null;
    }
    case "DEEPSEEK": {
      const apiKey = process.env.DEEPSEEK_API_KEY;
      return apiKey
        ? { provider, apiKey, baseUrl: null, model: process.env.DEEPSEEK_MODEL || null, source: "server" }
        : null;
    }
    case "OLLAMA": {
      const baseUrl = process.env.OLLAMA_BASE_URL;
      if (!baseUrl) return null;
      return {
        provider,
        apiKey: process.env.OLLAMA_API_KEY || null,
        baseUrl,
        model: process.env.OLLAMA_MODEL || null,
        source: "server",
      };
    }
  }
}

/** This user's own saved credential for the provider they've made active (or their only one). */
export async function getUserCredential(userId: string): Promise<ResolvedCredential | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { activeAiProvider: true, aiCredentials: true },
  });
  if (!user) return null;

  const pick = user.activeAiProvider
    ? user.aiCredentials.find((c) => c.provider === user.activeAiProvider)
    : user.aiCredentials[0];
  if (!pick) return null;

  return {
    provider: pick.provider,
    apiKey: pick.apiKey ? decryptSecret(pick.apiKey) : null,
    baseUrl: pick.baseUrl,
    model: pick.model,
    source: "user",
  };
}

/**
 * The credential an AI call should actually use: the signed-in user's own key
 * first, then the server's `.env` key, in that order. Returns null when
 * neither is configured, so the caller can point the user at Settings.
 */
export async function resolveAiCredential(userId?: string | null): Promise<ResolvedCredential | null> {
  if (userId) {
    const own = await getUserCredential(userId);
    if (own && (own.apiKey || own.baseUrl)) return own;
  }
  return getServerCredential();
}

export interface CredentialSummary {
  provider: AiProvider;
  configured: boolean;
  maskedKey: string | null;
  baseUrl: string | null;
  model: string | null;
  isActive: boolean;
}

/** Everything the Settings page needs to render: what's saved, masked, and which one is active. */
export async function listUserCredentials(userId: string): Promise<{
  activeProvider: AiProvider | null;
  credentials: CredentialSummary[];
  serverConfiguredProviders: AiProvider[];
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { activeAiProvider: true, aiCredentials: true },
  });

  const byProvider = new Map(user?.aiCredentials.map((c) => [c.provider, c]));
  const credentials: CredentialSummary[] = PROVIDER_PRIORITY.map((provider) => {
    const saved = byProvider.get(provider);
    return {
      provider,
      configured: !!saved,
      maskedKey: saved?.apiKey ? maskSecret(decryptSecret(saved.apiKey)) : null,
      baseUrl: saved?.baseUrl ?? null,
      model: saved?.model ?? null,
      isActive: user?.activeAiProvider === provider,
    };
  });

  const serverConfiguredProviders = PROVIDER_PRIORITY.filter((p) => getServerCredential(p));

  return { activeProvider: user?.activeAiProvider ?? null, credentials, serverConfiguredProviders };
}

export async function upsertUserCredential(
  userId: string,
  provider: AiProvider,
  input: { apiKey?: string | null; baseUrl?: string | null; model?: string | null }
): Promise<void> {
  const apiKey = input.apiKey?.trim();
  const baseUrl = input.baseUrl?.trim();
  const model = input.model?.trim();

  await prisma.aiCredential.upsert({
    where: { userId_provider: { userId, provider } },
    create: {
      userId,
      provider,
      apiKey: apiKey ? encryptSecret(apiKey) : null,
      baseUrl: baseUrl || null,
      model: model || null,
    },
    update: {
      apiKey: apiKey ? encryptSecret(apiKey) : apiKey === "" ? null : undefined,
      baseUrl: baseUrl !== undefined ? baseUrl || null : undefined,
      model: model !== undefined ? model || null : undefined,
    },
  });

  // First key a user saves becomes their active provider automatically.
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { activeAiProvider: true } });
  if (!user?.activeAiProvider) {
    await prisma.user.update({ where: { id: userId }, data: { activeAiProvider: provider } });
  }
}

export async function deleteUserCredential(userId: string, provider: AiProvider): Promise<void> {
  await prisma.aiCredential.deleteMany({ where: { userId, provider } });
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { activeAiProvider: true } });
  if (user?.activeAiProvider === provider) {
    const next = await prisma.aiCredential.findFirst({ where: { userId } });
    await prisma.user.update({ where: { id: userId }, data: { activeAiProvider: next?.provider ?? null } });
  }
}

export async function setActiveProvider(userId: string, provider: AiProvider): Promise<void> {
  const exists = await prisma.aiCredential.findUnique({ where: { userId_provider: { userId, provider } } });
  if (!exists) throw new Error("Save a key for this provider before making it active.");
  await prisma.user.update({ where: { id: userId }, data: { activeAiProvider: provider } });
}
