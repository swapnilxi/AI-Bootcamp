"use client";

import React, { useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { DISCIPLINES } from "@/content/home";
import { prefersReducedMotion } from "@/lib/motion";

gsap.registerPlugin(ScrollTrigger, useGSAP);

function Sparkle() {
  return (
    <svg viewBox="0 0 20 20" className="w-3 h-3 shrink-0 text-gold/70" aria-hidden="true">
      <path d="M10 0 Q10 9 20 10 Q10 11 10 20 Q10 11 0 10 Q10 9 10 0Z" fill="currentColor" />
    </svg>
  );
}

/**
 * Endless band of classical disciplines. Drifts slowly on its own and
 * briefly picks up speed (and direction) with the reader's scroll.
 */
export function CredentialMarquee() {
  const root = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;

      const loop = gsap.to(track.current, {
        xPercent: -50,
        ease: "none",
        duration: 48,
        repeat: -1,
      });

      // Scroll velocity nudges the loop speed, then it eases back to cruising
      let decay: gsap.core.Tween | null = null;
      ScrollTrigger.create({
        trigger: root.current,
        start: "top bottom",
        end: "bottom top",
        onUpdate(self) {
          const boost = gsap.utils.clamp(-6, 6, self.getVelocity() / 260);
          decay?.kill();
          loop.timeScale(1 + Math.abs(boost));
          decay = gsap.to(loop, { timeScale: 1, duration: 1.4, ease: "power3.out" });
        },
      });
    },
    { scope: root }
  );

  const items = [...DISCIPLINES, ...DISCIPLINES];

  return (
    <div
      ref={root}
      className="relative py-7 sm:py-9 border-y border-white/[0.05] overflow-hidden select-none"
      aria-label="Classical disciplines practised"
    >
      {/* Edge fades */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-16 sm:w-40 z-10 bg-gradient-to-r from-black to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-16 sm:w-40 z-10 bg-gradient-to-l from-black to-transparent" />

      <div ref={track} className="flex w-max items-center will-change-transform">
        {items.map((label, i) => (
          <span
            key={i}
            aria-hidden={i >= DISCIPLINES.length}
            className="flex items-center gap-8 sm:gap-12 pr-8 sm:pr-12 whitespace-nowrap"
          >
            <span
              className={`font-serif text-2xl sm:text-[2.1rem] leading-none ${
                i % 2 === 0 ? "text-text/80" : "italic text-gold-metal"
              }`}
            >
              {label}
            </span>
            <Sparkle />
          </span>
        ))}
      </div>
    </div>
  );
}
