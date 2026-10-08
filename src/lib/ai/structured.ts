import Anthropic from "@anthropic-ai/sdk";
import type { z } from "zod/v4";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import type { ResolvedCredential } from "./credentials";
import { ANTHROPIC_MODEL } from "./providers/anthropic";
import { generateStructuredGeneric } from "./providers";

const FALLBACK_BETA = "server-side-fallback-2026-07-01" as const;

export class AiRefusalError extends Error {
  constructor() {
    super("The AI declined this request.");
  }
}

/**
 * Ask the AI for JSON matching `schema`. Anthropic gets its native structured
 * output (schema-enforced); every other provider gets a JSON-mode prompt that's
 * parsed and zod-validated (see `generateStructuredGeneric`), since they don't
 * expose an equivalent schema-enforcement API.
 */
export async function generateStructured<Schema extends z.ZodType>(opts: {
  credential: ResolvedCredential;
  schema: Schema;
  system: string;
  prompt: string;
  maxTokens?: number;
  effort?: "low" | "medium" | "high";
}): Promise<z.infer<Schema>> {
  const { credential } = opts;
  if (credential.provider !== "ANTHROPIC") {
    return generateStructuredGeneric(credential, opts);
  }

  const client = new Anthropic(credential.apiKey ? { apiKey: credential.apiKey } : undefined);
  const model = credential.model || ANTHROPIC_MODEL;
  const response =
    credential.source === "server"
      ? await client.beta.messages.parse({
          model,
          max_tokens: opts.maxTokens ?? 16000,
          betas: [FALLBACK_BETA],
          fallbacks: "default",
          output_config: { effort: opts.effort ?? "medium", format: betaZodOutputFormat(opts.schema) },
          system: opts.system,
          messages: [{ role: "user", content: opts.prompt }],
        })
      : await client.beta.messages.parse({
          model,
          max_tokens: opts.maxTokens ?? 16000,
          output_config: { format: betaZodOutputFormat(opts.schema) },
          system: opts.system,
          messages: [{ role: "user", content: opts.prompt }],
        });

  if (response.stop_reason === "refusal") throw new AiRefusalError();
  if (!response.parsed_output) {
    throw new Error(`Structured output could not be parsed (stop_reason: ${response.stop_reason})`);
  }
  return response.parsed_output as z.infer<Schema>;
}
