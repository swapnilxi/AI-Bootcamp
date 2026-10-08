import { NextResponse } from "next/server";
import { AI_NOT_CONFIGURED_CODE, AI_SETTINGS_PATH } from "./constants";

export { AI_NOT_CONFIGURED_CODE, AI_SETTINGS_PATH };

/** Shared response for every AI route when no usable credential (user's or the server's) exists. */
export function aiNotConfiguredResponse(): NextResponse {
  return NextResponse.json(
    {
      error: "AI features need a key. Add your own, or ask an admin to set one up on the server.",
      code: AI_NOT_CONFIGURED_CODE,
      settingsUrl: AI_SETTINGS_PATH,
    },
    { status: 412 }
  );
}
