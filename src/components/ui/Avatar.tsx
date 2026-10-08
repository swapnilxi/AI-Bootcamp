import Image from "next/image";
import { InstructorIllustration } from "./InstructorIllustration";

/**
 * One avatar treatment for every mentor/user in the app — renders
 * bespoke engineering vector illustrations for instructors, next/image
 * for photo avatars, and rich deterministic gradient monograms as fallback.
 */

export type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";

const SIZE_CLASS: Record<AvatarSize, string> = {
  xs: "w-5 h-5 text-[9px]",
  sm: "w-10 h-10 text-sm",
  md: "w-14 h-14 text-lg",
  lg: "w-20 h-20 text-2xl",
  xl: "w-28 h-28 sm:w-36 sm:h-36 text-4xl sm:text-5xl",
};

const SIZE_PX: Record<AvatarSize, number> = { xs: 20, sm: 40, md: 56, lg: 80, xl: 144 };

const RADIUS_CLASS = {
  xl: "rounded-xl",
  "2xl": "rounded-2xl",
  "3xl": "rounded-3xl",
  full: "rounded-full",
} as const;

export function Avatar({
  src,
  name,
  size = "md",
  radius = "2xl",
  glow = false,
  className = "",
}: {
  src?: string | null;
  name?: string | null;
  size?: AvatarSize;
  radius?: keyof typeof RADIUS_CLASS;
  /** Adds the premium orange bloom used on hero/profile-grade avatars. */
  glow?: boolean;
  className?: string;
}) {
  const initial = name?.trim()?.charAt(0)?.toUpperCase() || "•";
  const lowerName = (name || "").toLowerCase();
  const lowerSrc = (src || "").toLowerCase();

  const isIllustration =
    lowerName.includes("arun") ||
    lowerName.includes("swapnil") ||
    lowerName.includes("shresth") ||
    lowerSrc.includes("arun") ||
    lowerSrc.includes("swapnil") ||
    lowerSrc.includes("shresth");

  const illustrationType =
    lowerName.includes("arun") || lowerSrc.includes("arun")
      ? "arun"
      : lowerName.includes("swapnil") || lowerSrc.includes("swapnil")
      ? "swapnil"
      : "shresth";

  // Deterministic aesthetic gradient palette for initials fallback
  const charCode = (name || "mentor").split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const gradients = [
    "from-orange-500/20 via-amber-500/10 to-transparent text-orange-600 dark:text-orange-300 border-orange-500/30",
    "from-purple-500/20 via-indigo-500/10 to-transparent text-purple-600 dark:text-purple-300 border-purple-500/30",
    "from-emerald-500/20 via-teal-500/10 to-transparent text-emerald-600 dark:text-emerald-300 border-emerald-500/30",
    "from-blue-500/20 via-cyan-500/10 to-transparent text-blue-600 dark:text-blue-300 border-blue-500/30",
    "from-rose-500/20 via-amber-500/10 to-transparent text-rose-600 dark:text-rose-300 border-rose-500/30",
  ];
  const activeGradient = gradients[charCode % gradients.length];

  return (
    <div
      className={`relative shrink-0 overflow-hidden border border-black/10 dark:border-cream/20 bg-black/[0.02] dark:bg-[#16161c] shadow-sm transition-all duration-300 ${
        SIZE_CLASS[size]
      } ${RADIUS_CLASS[radius]} ${
        glow ? "shadow-[0_8px_30px_-6px_rgba(249,115,22,0.35)] ring-2 ring-orange-500/30" : ""
      } ${className}`}
    >
      {isIllustration ? (
        <InstructorIllustration type={illustrationType} />
      ) : src ? (
        <Image
          src={src}
          alt={name || "Avatar"}
          fill
          unoptimized
          sizes={`${SIZE_PX[size]}px`}
          className="object-cover"
        />
      ) : (
        <div className={`flex h-full w-full items-center justify-center font-serif font-semibold bg-gradient-to-br ${activeGradient} backdrop-blur-sm select-none`}>
          {initial}
        </div>
      )}
    </div>
  );
}
