import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { resolveAiCredential } from "@/lib/ai/credentials";
import { AI_SETTINGS_PATH } from "@/lib/ai/errors";

/** Lets the UI know whether AI features will actually work for the current visitor. */
export async function GET() {
  const session = await getServerSession(authOptions);
  const credential = await resolveAiCredential(session?.user?.id);
  return NextResponse.json({
    enabled: true,
    ready: !!credential,
    settingsUrl: AI_SETTINGS_PATH,
  });
}
