import Link from "next/link";
import { KeyRound } from "lucide-react";
import { AI_SETTINGS_PATH } from "@/lib/ai/constants";

/** Shown wherever an AI feature has no usable key — points at Settings instead of just failing silently. */
export function AiSetupNotice({ className = "" }: { className?: string }) {
  return (
    <div
      className={`flex flex-wrap items-center gap-2.5 rounded-xl border border-gold/25 bg-gold/[0.06] px-3.5 py-2.5 text-xs text-text-muted ${className}`}
    >
      <KeyRound className="w-3.5 h-3.5 shrink-0 text-gold" />
      <span>This needs an AI key — yours, or one an admin has set up.</span>
      <Link href={`${AI_SETTINGS_PATH}?missing=1`} className="font-semibold text-gold hover:underline">
        Set up AI access →
      </Link>
    </div>
  );
}
