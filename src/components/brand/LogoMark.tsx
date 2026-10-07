import React from "react";

export interface LogoMarkProps {
  size?: number | string;
  className?: string;
  decorative?: boolean;
  strokeMultiplier?: number;
  idPrefix?: string;
  glow?: boolean | "subtle";
}

export function LogoMark({
  size = 40,
  className = "",
  decorative = false,
  strokeMultiplier = 1,
  idPrefix = "ms-mark",
  glow = false,
}: LogoMarkProps) {
  const dotId = `${idPrefix}-dot`;
  const haloId = `${idPrefix}-halo`;
  const bloomId = `${idPrefix}-bloom`;
  const style = size !== undefined ? { width: size, height: size } : undefined;

  const isSubtle = glow === "subtle";
  const hasGlow = Boolean(glow);

  const haloCenterOpacity = isSubtle ? 0.14 : 0.26;
  const haloMidOpacity = isSubtle ? 0.05 : 0.10;
  const bloomOpacity = isSubtle ? 0.25 : 0.50;

  return (
    <svg
      viewBox={hasGlow ? "-50 -50 300 300" : "0 0 200 200"}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      className={`shrink-0 ${className}`}
      style={style}
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : "AI Bootcamp Mark"}
      aria-hidden={decorative ? true : undefined}
    >
      <defs>
        <circle id={dotId} cx="100" cy="42" r={7 * strokeMultiplier} fill="var(--gold, #F97316)" />

        {hasGlow && (
          <>
            {/* Ambient Halo Radial Gradient */}
            <radialGradient id={haloId} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="var(--gold, #F97316)" stopOpacity={haloCenterOpacity} />
              <stop offset="45%" stopColor="var(--gold, #F97316)" stopOpacity={haloMidOpacity} />
              <stop offset="100%" stopColor="var(--gold, #F97316)" stopOpacity={0} />
            </radialGradient>

            {/* Star Bloom Gaussian Blur Filter */}
            <filter id={bloomId} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="6" result="blur" />
            </filter>
          </>
        )}
      </defs>

      {/* Layer 1: Ambient Halo (Back) */}
      {hasGlow && (
        <circle cx="100" cy="100" r="130" fill={`url(#${haloId})`} />
      )}

      {/* Layer 2: Star Bloom (Blurred gold star directly behind solid star) */}
      {hasGlow && (
        <circle cx="100" cy="100" r="13"
          fill="var(--gold, #F97316)"
          opacity={bloomOpacity}
          filter={`url(#${bloomId})`}
        />
      )}

      {/* Layer 3: Rings and 12 dots (Stay crisp and unglowed) */}
      <circle
        cx="100"
        cy="100"
        r="92"
        stroke="var(--gold, #F97316)"
        strokeWidth={1.8 * strokeMultiplier}
      />
      <circle
        cx="100"
        cy="100"
        r="76"
        stroke="var(--gold, #F97316)"
        strokeWidth={1.0 * strokeMultiplier}
        opacity="0.6"
      />

      <use href={`#${dotId}`} xlinkHref={`#${dotId}`} />
      <use href={`#${dotId}`} xlinkHref={`#${dotId}`} transform="rotate(60 100 100)" />
      <use href={`#${dotId}`} xlinkHref={`#${dotId}`} transform="rotate(120 100 100)" />
      <use href={`#${dotId}`} xlinkHref={`#${dotId}`} transform="rotate(180 100 100)" />
      <use href={`#${dotId}`} xlinkHref={`#${dotId}`} transform="rotate(240 100 100)" />
      <use href={`#${dotId}`} xlinkHref={`#${dotId}`} transform="rotate(300 100 100)" />

      {/* Layer 4: Secondary star (line only, rotated 45 deg) */}
      <polygon points="100,42 150.2,71 150.2,129 100,158 49.8,129 49.8,71" opacity={0.45} stroke="var(--gold, #F97316)"
        strokeWidth={1.6 * strokeMultiplier}
        strokeLinejoin="round" fill="none" />
          <path d="M100 85L100 50M113 92.5L143.3 75M113 107.5L143.3 125M100 115L100 150M87 107.5L56.7 125M87 92.5L56.7 75" stroke="var(--gold, #F97316)"
        strokeWidth={1.6 * strokeMultiplier}
        strokeLinejoin="round" strokeLinecap="round" />

      {/* Layer 5: Main star (Solid Gold) */}
      <circle cx="100" cy="100" r="13"
        fill="var(--gold, #F97316)"
      />

      {/* Layer 6: hub core */}
      <circle cx="100" cy="100" r="5.5" fill="var(--black, #0C0B0A)" />
    </svg>
  );
}
