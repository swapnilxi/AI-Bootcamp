import React from "react";
import { BRAND_OUTLINES } from "./brandPaths";

export interface LogoStackedProps {
  size?: number | string;
  className?: string;
  showTagline?: boolean;
  hasBackground?: boolean;
  decorative?: boolean;
  idPrefix?: string;
  outlined?: boolean;
  glow?: boolean | "subtle";
}

export function LogoStacked({
  size = 240,
  className = "",
  showTagline = true,
  hasBackground = false,
  decorative = false,
  idPrefix = "ms-stacked",
  outlined = true,
  glow = true,
}: LogoStackedProps) {
  const dotId = `${idPrefix}-dot`;
  const haloId = `${idPrefix}-halo`;
  const bloomId = `${idPrefix}-bloom`;
  const style = size !== undefined ? { width: size, height: "auto" } : undefined;

  const isSubtle = glow === "subtle";
  const hasGlow = Boolean(glow);

  const haloCenterOpacity = isSubtle ? 0.14 : 0.26;
  const haloMidOpacity = isSubtle ? 0.05 : 0.10;
  const bloomOpacity = isSubtle ? 0.25 : 0.50;

  return (
    <svg
      viewBox="0 0 360 380"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      className={`shrink-0 ${className}`}
      style={style}
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : "AI Bootcamp Logo"}
      aria-hidden={decorative ? true : undefined}
    >
      <defs>
        <circle id={dotId} cx="100" cy="42" r="7" fill="var(--gold, #FF7315)" />

        {hasGlow && (
          <>
            <radialGradient id={haloId} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="var(--gold, #FF7315)" stopOpacity={haloCenterOpacity} />
              <stop offset="45%" stopColor="var(--gold, #FF7315)" stopOpacity={haloMidOpacity} />
              <stop offset="100%" stopColor="var(--gold, #FF7315)" stopOpacity={0} />
            </radialGradient>

            <filter id={bloomId} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="6" result="blur" />
            </filter>
          </>
        )}
      </defs>

      {/* Optional dark rounded background */}
      {hasBackground && (
        <rect
          width="360"
          height="380"
          rx="16"
          fill="var(--black, #0B0B0D)"
        />
      )}

      {/* Centered Emblem (scale 0.7, center 180, 130) */}
      <g transform="translate(180, 130) scale(0.7) translate(-100, -100)">
        {/* 1. Ambient Halo */}
        {hasGlow && (
          <circle cx="100" cy="100" r="130" fill={`url(#${haloId})`} />
        )}

        {/* 2. Star Bloom */}
        {hasGlow && (
          <circle cx="100" cy="100" r="13"
            fill="var(--gold, #FF7315)"
            opacity={bloomOpacity}
            filter={`url(#${bloomId})`}
          />
        )}

        {/* 3. Rings & Dots (Stay crisp and unglowed) */}
        <circle
          cx="100"
          cy="100"
          r="92"
          stroke="var(--gold, #FF7315)"
          strokeWidth="1.8"
        />
        <circle
          cx="100"
          cy="100"
          r="76"
          stroke="var(--gold, #FF7315)"
          strokeWidth="1.0"
          opacity="0.6"
        />
        <use href={`#${dotId}`} xlinkHref={`#${dotId}`} />
        <use href={`#${dotId}`} xlinkHref={`#${dotId}`} transform="rotate(60 100 100)" />
        <use href={`#${dotId}`} xlinkHref={`#${dotId}`} transform="rotate(120 100 100)" />
        <use href={`#${dotId}`} xlinkHref={`#${dotId}`} transform="rotate(180 100 100)" />
        <use href={`#${dotId}`} xlinkHref={`#${dotId}`} transform="rotate(240 100 100)" />
        <use href={`#${dotId}`} xlinkHref={`#${dotId}`} transform="rotate(300 100 100)" />

        {/* 4. Secondary Star */}
        <polygon points="100,42 150.2,71 150.2,129 100,158 49.8,129 49.8,71" opacity={0.45} stroke="var(--gold, #FF7315)"
          strokeWidth="1.6"
          strokeLinejoin="round" fill="none" />
          <path d="M100 85L100 50M113 92.5L143.3 75M113 107.5L143.3 125M100 115L100 150M87 107.5L56.7 125M87 92.5L56.7 75" stroke="var(--gold, #FF7315)"
          strokeWidth="1.6"
          strokeLinejoin="round" strokeLinecap="round" />

        {/* 5. Main Star */}
        <circle cx="100" cy="100" r="13"
          fill="var(--gold, #FF7315)"
        />

        {/* 6. Center Gem */}
        <circle cx="100" cy="100" r="5.5" fill="var(--black, #0B0B0D)" />
      </g>

      {/* Wordmark Section (Crisp and untouched by glow) */}
      <g id={`${idPrefix}-wordmark`}>
        {/* Flanked THE */}
        <line
          x1="118"
          y1="224"
          x2="152"
          y2="224"
          stroke="var(--gold, #FF7315)"
          strokeWidth="1"
        />
        {outlined ? (
          <path d={BRAND_OUTLINES.stacked.the} fill="var(--gold, #FF7315)" />
        ) : (
          <text
            x="180"
            y="229"
            textAnchor="middle"
            fill="var(--gold, #FF7315)"
            style={{
              fontFamily: "var(--font-cormorant), Cormorant Garamond, serif",
              fontSize: "15px",
              fontWeight: 600,
              letterSpacing: "0.24em",
            }}
          >
            AI
          </text>
        )}
        <line
          x1="208"
          y1="224"
          x2="242"
          y2="224"
          stroke="var(--gold, #FF7315)"
          strokeWidth="1"
        />

        {/* BOOTCAMP */}
        {outlined ? (
          <path d={BRAND_OUTLINES.stacked.ms} fill="var(--gold, #FF7315)" />
        ) : (
          <text
            x="180"
            y="269"
            textAnchor="middle"
            fill="var(--gold, #FF7315)"
            style={{
              fontFamily: "var(--font-cormorant), Cormorant Garamond, serif",
              fontSize: "28px",
              fontWeight: 600,
              letterSpacing: "0.15em",
            }}
          >
            BOOTCAMP
          </text>
        )}

        {/* Optional Tagline Group */}
        {showTagline && (
          <g id={`${idPrefix}-tagline-group`}>
            <line
              x1="90"
              y1="291"
              x2="270"
              y2="291"
              stroke="var(--gold, #FF7315)"
              strokeWidth="0.8"
              opacity="0.6"
            />
            <polygon
              points="180,288.5 182.5,291 180,293.5 177.5,291"
              fill="var(--gold, #FF7315)"
            />
            {outlined ? (
              <path d={BRAND_OUTLINES.stacked.tag} fill="var(--text-muted, #A8A399)" />
            ) : (
              <text
                x="180"
                y="311"
                textAnchor="middle"
                fill="var(--text-muted, #A8A399)"
                style={{
                  fontFamily: "var(--font-inter), Inter, sans-serif",
                  fontSize: "10.5px",
                  fontWeight: 400,
                  letterSpacing: "0.26em",
                }}
              >
                LEARN · BUILD · SHIP AI
              </text>
            )}
          </g>
        )}
      </g>
    </svg>
  );
}
