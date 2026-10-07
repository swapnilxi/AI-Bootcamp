import { NextResponse } from "next/server";
import { isAiConfigured } from "@/lib/ai/client";

/** Lets the UI hide AI features when no Anthropic credential is configured. */
export async function GET() {
  return NextResponse.json({ enabled: true, provider: isAiConfigured() ? "anthropic" : "instructor-engine" });
}
