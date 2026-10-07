import React from "react";
import Link from "next/link";
import { LOGO_STAR_PATH } from "./logo-star";

interface LogoMarkProps {
  className?: string;
  size?: number;
}

export function LogoMark({ className = "w-10 h-10 text-cream", size }: LogoMarkProps) {
  const style = size ? { width: size, height: size } : undefined;

  return (
    <svg
      viewBox="0 0 100 100"
      className={`shrink-0 ${className}`}
      style={style}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Outer coordinate ring */}
      <circle cx="50" cy="50" r="47" stroke="currentColor" strokeWidth="1.4" />
      {/* Inner coordinate ring */}
      <circle cx="50" cy="50" r="41" stroke="currentColor" strokeWidth="0.9" />

      {/* 12 Coordinate Dots on outer perimeter */}
      <circle cx="94.0" cy="50.0" r="1.3" fill="currentColor" />
      <circle cx="88.1" cy="72.0" r="1.3" fill="currentColor" />
      <circle cx="72.0" cy="88.1" r="1.3" fill="currentColor" />
      <circle cx="50.0" cy="94.0" r="1.3" fill="currentColor" />
      <circle cx="28.0" cy="88.1" r="1.3" fill="currentColor" />
      <circle cx="11.9" cy="72.0" r="1.3" fill="currentColor" />
      <circle cx="6.0" cy="50.0" r="1.3" fill="currentColor" />
      <circle cx="11.9" cy="28.0" r="1.3" fill="currentColor" />
      <circle cx="28.0" cy="11.9" r="1.3" fill="currentColor" />
      <circle cx="50.0" cy="6.0" r="1.3" fill="currentColor" />
      <circle cx="72.0" cy="11.9" r="1.3" fill="currentColor" />
      <circle cx="88.1" cy="28.0" r="1.3" fill="currentColor" />

      {/* Fine crosshairs */}
      <line x1="50" y1="5" x2="50" y2="95" stroke="currentColor" strokeWidth="0.75" opacity="0.45" />
      <line x1="5" y1="50" x2="95" y2="50" stroke="currentColor" strokeWidth="0.75" opacity="0.45" />

      {/* 4 Diagonal rays */}
      <g fill="currentColor">
        <polygon points="50,50 48,39 50,23 52,39" transform="rotate(45 50 50)" />
        <polygon points="50,50 48,39 50,23 52,39" transform="rotate(135 50 50)" />
        <polygon points="50,50 48,39 50,23 52,39" transform="rotate(225 50 50)" />
        <polygon points="50,50 48,39 50,23 52,39" transform="rotate(315 50 50)" />
      </g>

      {/* Primary 4-point elongated star with curvature */}
      <path d={LOGO_STAR_PATH} fill="currentColor" />

      {/* Center pivot dot (counter-punched) */}
      <circle cx="50" cy="50" r="2.8" fill="#0B0B0D" />
    </svg>
  );
}

interface LogoProps {
  className?: string;
  showText?: boolean;
}

export function Logo({ className = "", showText = true }: LogoProps) {
  return (
    <Link
      href="/"
      className={`inline-flex items-center gap-2.5 sm:gap-3 group focus-visible:outline-2 focus-visible:outline-gold focus-visible:outline-offset-4 rounded-sm ${className}`}
      aria-label="AI Bootcamp"
    >
      {/* Astrolabe Mark */}
      <LogoMark className="w-9 h-9 sm:w-11 sm:h-11 text-cream transition-transform duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:rotate-[45deg]" />

      {/* Horizontal Wordmark: Switches to mark-only below 360px */}
      {showText && (
        <div className="hidden min-[360px]:flex flex-col text-left justify-center select-none whitespace-nowrap">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="w-4 sm:w-5 h-[1px] bg-cream opacity-80" />
            <span className="font-serif text-[10px] sm:text-[11px] font-semibold tracking-[0.24em] text-cream uppercase leading-none">
              AI
            </span>
          </div>
          <span className="font-serif text-[1.15rem] sm:text-[1.4rem] font-semibold tracking-[0.06em] text-gold-metal uppercase leading-none">
            BOOTCAMP
          </span>
        </div>
      )}
    </Link>
  );
}
