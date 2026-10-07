"use client";

import { useRef } from "react";
import { usePathname } from "next/navigation";
import { useScrollReveal } from "./effects/useScrollReveal";
import { usePointerEffects } from "./effects/usePointerEffects";
import { useCursorGlow } from "./effects/useCursorGlow";
import { useScrollEffects } from "./effects/useScrollEffects";
import { useParallax } from "./effects/useParallax";
import { StarJourney } from "./StarJourney";

/**
 * Site-wide motion wiring, mounted once in the root layout.
 * Each effect lives in its own hook under `./effects/`.
 */
export function MotionEffects() {
  const pathname = usePathname();
  const progressRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);

  useScrollReveal();
  usePointerEffects();
  useCursorGlow(glowRef);
  useScrollEffects(progressRef, railRef, pathname);
  useParallax(pathname);

  return (
    <>
      <div ref={progressRef} className="scroll-progress" aria-hidden="true" />
      <div ref={glowRef} className="cursor-glow" data-visible="false" aria-hidden="true" />
      <div ref={railRef} className="scroll-rail" data-visible="false" aria-hidden="true">
        <span className="scroll-spark" />
      </div>
      <StarJourney />
    </>
  );
}
