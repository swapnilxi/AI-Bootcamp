import Link from "next/link";
import { KeyRound } from "lucide-react";
import { AI_SETTINGS_PATH } from "@/lib/ai/constants";

/** Shown wherever an AI feature has no usable key — points at Settings instead of just failing silently. */
export function AiSetupNotice({ className = "" }: { className?: string }) {
  return (
    <div
      className={`flex items-center gap-2.5 rounded-2xl border border-gold/25 bg-gold/[0.06] px-4 py-3 text-xs text-text-muted ${className}`}
    >
      <KeyRound className="w-4 h-4 shrink-0 text-gold" />
      <span className="leading-normal">
        This needs an AI key — yours, or one an admin has set up.{" "}
        <Link
          href={`${AI_SETTINGS_PATH}?missing=1`}
          className="inline font-semibold text-gold hover:underline whitespace-nowrap ml-1"
        >
          Set up AI access &rarr;
        </Link>
      </span>
    </div>
  );
}


