"use client";

import { TutorWidget } from "./TutorWidget";

/**
 * Kept as a named alias so older imports keep resolving; the concierge is now
 * the AI Tutor.
 */
export function ConciergeChat() {
  return <TutorWidget />;
}

export { TutorWidget };
