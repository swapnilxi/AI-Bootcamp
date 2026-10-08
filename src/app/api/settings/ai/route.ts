import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { z } from "zod";
import type { AiProvider } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import {
  deleteUserCredential,
  listUserCredentials,
  setActiveProvider,
  upsertUserCredential,
} from "@/lib/ai/credentials";

const PROVIDERS = ["ANTHROPIC", "GEMINI", "DEEPSEEK", "OLLAMA"] as const;

async function requireUserId(): Promise<string | NextResponse> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Please log in." }, { status: 401 });
  return session.user.id;
}

/** Everyone's own saved providers, masked keys, and which one is active — the Settings page's data. */
export async function GET() {
  const userId = await requireUserId();
  if (typeof userId !== "string") return userId;

  const data = await listUserCredentials(userId);
  return NextResponse.json(data);
}

const putSchema = z.object({
  provider: z.enum(PROVIDERS),
  apiKey: z.string().trim().max(500).optional(),
  baseUrl: z.string().trim().max(500).optional(),
  model: z.string().trim().max(200).optional(),
  makeActive: z.boolean().optional(),
});

/** Save (or update) one provider's key/base URL/model for the signed-in user. */
export async function PUT(req: Request) {
  const userId = await requireUserId();
  if (typeof userId !== "string") return userId;

  const parsed = putSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid request" }, { status: 400 });
  }
  const { provider, apiKey, baseUrl, model, makeActive } = parsed.data;

  if (provider === "OLLAMA" && !baseUrl) {
    return NextResponse.json({ error: "Ollama needs a base URL, e.g. http://localhost:11434" }, { status: 400 });
  }
  if (provider !== "OLLAMA" && !apiKey) {
    return NextResponse.json({ error: "An API key is required for this provider." }, { status: 400 });
  }

  await upsertUserCredential(userId, provider as AiProvider, { apiKey, baseUrl, model });
  if (makeActive) await setActiveProvider(userId, provider as AiProvider);

  const data = await listUserCredentials(userId);
  return NextResponse.json(data);
}

const deleteSchema = z.object({ provider: z.enum(PROVIDERS) });

/** Remove a saved provider credential. */
export async function DELETE(req: Request) {
  const userId = await requireUserId();
  if (typeof userId !== "string") return userId;

  const parsed = deleteSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  await deleteUserCredential(userId, parsed.data.provider as AiProvider);
  const data = await listUserCredentials(userId);
  return NextResponse.json(data);
}

const activeSchema = z.object({ provider: z.enum(PROVIDERS) });

/** Switch which saved provider AI features should use. */
export async function PATCH(req: Request) {
  const userId = await requireUserId();
  if (typeof userId !== "string") return userId;

  const parsed = activeSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    await setActiveProvider(userId, parsed.data.provider as AiProvider);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }

  const data = await listUserCredentials(userId);
  return NextResponse.json(data);
}
