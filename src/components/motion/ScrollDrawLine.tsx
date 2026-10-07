"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { prefersReducedMotion } from "@/lib/motion";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/** A gold hairline that draws itself left-to-right as its section scrolls into view. */
export function ScrollDrawLine({ className = "" }: { className?: string }) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      gsap.fromTo(
        ".draw-fill",
        { scaleX: 0 },
        {
          scaleX: 1,
          ease: "none",
          scrollTrigger: { trigger: root.current, start: "top 85%", end: "top 35%", scrub: 0.8 },
        }
      );
      gsap.fromTo(
        ".draw-spark",
        { left: "0%", opacity: 0 },
        {
          left: "100%",
          opacity: 1,
          ease: "none",
          scrollTrigger: { trigger: root.current, start: "top 85%", end: "top 35%", scrub: 0.8 },
        }
      );
    },
    { scope: root }
  );

  return (
    <div ref={root} className={`relative h-px ${className}`} aria-hidden="true">
      <div className="absolute inset-0 bg-white/[0.06]" />
      <div className="draw-fill absolute inset-0 origin-left bg-gradient-to-r from-gold/10 via-gold/70 to-gold/10" />
      <span className="draw-spark absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#FFEDD5] shadow-[0_0_12px_3px_rgba(249, 115, 22,0.6)]" />
    </div>
  );
}
