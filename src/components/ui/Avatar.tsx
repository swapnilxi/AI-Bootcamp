import Image from "next/image";

/**
 * One avatar treatment for every mentor/user photo in the app — a premium
 * ivory initial tile when there's no photo, next/image with a cream rim and
 * optional orange glow when there is. Centralises a pattern that used to be
 * hand-rolled (raw <img> + initials fallback) at seven call sites.
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

  return (
    <div
      className={`relative shrink-0 overflow-hidden border border-cream/30 bg-black-raised shadow-inner transition-[box-shadow,border-color] duration-300 ${
        SIZE_CLASS[size]
      } ${RADIUS_CLASS[radius]} ${
        glow ? "shadow-[0_0_28px_-10px_rgba(249,115,22,0.5)] group-hover:border-orange/50" : ""
      } ${className}`}
    >
      {src ? (
        <Image
          src={src}
          alt={name || "Avatar"}
          fill
          unoptimized
          sizes={`${SIZE_PX[size]}px`}
          className="object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center font-serif font-bold text-cream">
          {initial}
        </div>
      )}
    </div>
  );
}
