import type { z } from "zod/v4";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { AI_MODEL, FALLBACK_BETA, getAnthropic } from "./client";

export class AiRefusalError extends Error {
  constructor() {
    super("The AI declined this request.");
  }
}

/** Ask Claude for JSON matching `schema`; returns the validated object. */
export async function generateStructured<Schema extends z.ZodType>(opts: {
  schema: Schema;
  system: string;
  prompt: string;
  maxTokens?: number;
  effort?: "low" | "medium" | "high";
}): Promise<z.infer<Schema>> {
  const response = await getAnthropic().beta.messages.parse({
    model: AI_MODEL,
    max_tokens: opts.maxTokens ?? 16000,
    betas: [FALLBACK_BETA],
    fallbacks: "default",
    output_config: { effort: opts.effort ?? "medium", format: betaZodOutputFormat(opts.schema) },
    system: opts.system,
    messages: [{ role: "user", content: opts.prompt }],
  });

  if (response.stop_reason === "refusal") throw new AiRefusalError();
  if (!response.parsed_output) {
    throw new Error(`Structured output could not be parsed (stop_reason: ${response.stop_reason})`);
  }
  return response.parsed_output as z.infer<Schema>;
}
