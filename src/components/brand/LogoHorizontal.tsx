import React from "react";
import { BRAND_OUTLINES } from "./brandPaths";

export interface LogoHorizontalProps {
  height?: number | string;
  className?: string;
  showTagline?: boolean;
  decorative?: boolean;
  idPrefix?: string;
  outlined?: boolean;
  glow?: boolean | "subtle";
}

export function LogoHorizontal({
  height = 40,
  className = "",
  showTagline = false,
  decorative = false,
  idPrefix = "ms-horiz",
  outlined = true,
  glow = false,
}: LogoHorizontalProps) {
  const dotId = `${idPrefix}-dot`;
  const haloId = `${idPrefix}-halo`;
  const bloomId = `${idPrefix}-bloom`;
  const style = height !== undefined ? { height, width: "auto" } : undefined;

  const isSubtle = glow === "subtle";
  const hasGlow = Boolean(glow);

  const haloCenterOpacity = isSubtle ? 0.14 : 0.26;
  const haloMidOpacity = isSubtle ? 0.05 : 0.10;
  const bloomOpacity = isSubtle ? 0.25 : 0.50;

  return (
    <svg
      viewBox="0 0 500 120"
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
        <circle id={dotId} cx="65" cy="31" r="3.5" fill="var(--gold, #FF7315)" />

        {hasGlow && (
          <>
            {/* Halo confined to mark bounds (r=58 at 65,60 stays within 120px height) */}
            <radialGradient id={haloId} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="var(--gold, #FF7315)" stopOpacity={haloCenterOpacity} />
              <stop offset="45%" stopColor="var(--gold, #FF7315)" stopOpacity={haloMidOpacity} />
              <stop offset="100%" stopColor="var(--gold, #FF7315)" stopOpacity={0} />
            </radialGradient>

            {/* Bloom filter for mark bloom (stdDeviation 3 at 0.5 scale) */}
            <filter id={bloomId} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="blur" />
            </filter>
          </>
        )}
      </defs>

      {/* Mark on the left (center 65,60) */}
      <g id={`${idPrefix}-mark`}>
        {/* 1. Ambient Halo (behind mark only) */}
        {hasGlow && (
          <circle cx="65" cy="60" r="58" fill={`url(#${haloId})`} />
        )}

        {/* 2. Star Bloom (behind solid star only) */}
        {hasGlow && (
          <g transform="translate(65, 60) scale(0.5) translate(-100, -100)">
            <circle cx="100" cy="100" r="13"
              fill="var(--gold, #FF7315)"
              opacity={bloomOpacity}
              filter={`url(#${bloomId})`}
            />
          </g>
        )}

        {/* 3. Rings & 12 dots (crisp and unglowed) */}
        <circle
          cx="65"
          cy="60"
          r="46"
          stroke="var(--gold, #FF7315)"
          strokeWidth="2.4"
        />
        <circle
          cx="65"
          cy="60"
          r="38"
          stroke="var(--gold, #FF7315)"
          strokeWidth="1.4"
          opacity="0.6"
        />
        <use href={`#${dotId}`} xlinkHref={`#${dotId}`} />
        <use href={`#${dotId}`} xlinkHref={`#${dotId}`} transform="rotate(60 65 60)" />
        <use href={`#${dotId}`} xlinkHref={`#${dotId}`} transform="rotate(120 65 60)" />
        <use href={`#${dotId}`} xlinkHref={`#${dotId}`} transform="rotate(180 65 60)" />
        <use href={`#${dotId}`} xlinkHref={`#${dotId}`} transform="rotate(240 65 60)" />
        <use href={`#${dotId}`} xlinkHref={`#${dotId}`} transform="rotate(300 65 60)" />

        {/* 4. Secondary star */}
        <g transform="translate(65, 60) scale(0.5) translate(-100, -100)">
          <polygon points="100,42 150.2,71 150.2,129 100,158 49.8,129 49.8,71" opacity={0.45} stroke="var(--gold, #FF7315)"
            strokeWidth="3.2"
            strokeLinejoin="round" fill="none" />
          <path d="M100 85L100 50M113 92.5L143.3 75M113 107.5L143.3 125M100 115L100 150M87 107.5L56.7 125M87 92.5L56.7 75" stroke="var(--gold, #FF7315)"
            strokeWidth="3.2"
            strokeLinejoin="round" strokeLinecap="round" />
          <circle cx="100" cy="100" r="13"
            fill="var(--gold, #FF7315)"
          />
          <circle cx="100" cy="100" r="5.5" fill="var(--black, #0B0B0D)" />
        </g>
      </g>

      {/* Wordmark on the right (Text stays crisp and completely unglowed) */}
      <g id={`${idPrefix}-wordmark`}>
        {/* Flanked THE */}
        <line
          x1="255"
          y1="31.5"
          x2="290"
          y2="31.5"
          stroke="var(--gold, #FF7315)"
          strokeWidth="1"
        />
        {outlined ? (
          <path d={BRAND_OUTLINES.horizontal.the} fill="var(--gold, #FF7315)" />
        ) : (
          <text
            x="315"
            y="36"
            textAnchor="middle"
            fill="var(--gold, #FF7315)"
            style={{
              fontFamily: "var(--font-cormorant), Cormorant Garamond, serif",
              fontSize: "14px",
              fontWeight: 600,
              letterSpacing: "0.22em",
            }}
          >
            AI
          </text>
        )}
        <line
          x1="340"
          y1="31.5"
          x2="375"
          y2="31.5"
          stroke="var(--gold, #FF7315)"
          strokeWidth="1"
        />

        {/* BOOTCAMP */}
        {outlined ? (
          <path d={BRAND_OUTLINES.horizontal.ms} fill="var(--gold, #FF7315)" />
        ) : (
          <text
            x="315"
            y="67"
            textAnchor="middle"
            fill="var(--gold, #FF7315)"
            style={{
              fontFamily: "var(--font-cormorant), Cormorant Garamond, serif",
              fontSize: "27px",
              fontWeight: 600,
              letterSpacing: "0.14em",
            }}
          >
            BOOTCAMP
          </text>
        )}

        {/* Optional Tagline Group */}
        {showTagline && (
          <g id={`${idPrefix}-tagline-group`}>
            <line
              x1="230"
              y1="82"
              x2="400"
              y2="82"
              stroke="var(--gold, #FF7315)"
              strokeWidth="0.8"
              opacity="0.6"
            />
            <polygon
              points="315,79.5 317.5,82 315,84.5 312.5,82"
              fill="var(--gold, #FF7315)"
            />
            {outlined ? (
              <path d={BRAND_OUTLINES.horizontal.tag} fill="var(--text-muted, #A8A399)" />
            ) : (
              <text
                x="315"
                y="99"
                textAnchor="middle"
                fill="var(--text-muted, #A8A399)"
                style={{
                  fontFamily: "var(--font-inter), Inter, sans-serif",
                  fontSize: "10px",
                  fontWeight: 400,
                  letterSpacing: "0.25em",
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
