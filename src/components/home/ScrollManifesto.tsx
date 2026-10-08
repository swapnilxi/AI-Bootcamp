"use client";

import React, { useRef } from "react";
import dynamic from "next/dynamic";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { MANIFESTO, MANIFESTO_TAGLINE } from "@/content/home";
import { prefersReducedMotion } from "@/lib/motion";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const OrbitField = dynamic(() => import("@/components/three/OrbitField"), { ssr: false });

/**
 * Statement section: each word brightens as it scrolls through the viewport,
 * over a slowly turning orbit field rendered in Three.js.
 */
export function ScrollManifesto() {
  const root = useRef<HTMLElement>(null);

    useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      const words = gsap.utils.toArray<HTMLElement>(".mf-word");

      gsap.fromTo(
        words,
        { opacity: 0.32 },
        {
          opacity: 1,
          ease: "none",
          stagger: 0.12,
          scrollTrigger: {
            trigger: ".mf-text",
            start: "top 78%",
            end: "bottom 52%",
            scrub: 0.6,
          },
        }
      );

      gsap.fromTo(
        ".mf-orbit",
        { opacity: 0, scale: 0.92 },
        {
          opacity: 1,
          scale: 1,
          ease: "power2.out",
          scrollTrigger: { trigger: root.current, start: "top 85%", end: "top 25%", scrub: 1 },
        }
      );
    },
    { scope: root }
  );

  const words = MANIFESTO.split(" ");

  return (
    <section ref={root} className="relative py-28 sm:py-40 overflow-hidden" aria-label="Our approach">
      <div
        className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[560px] sm:h-[760px] opacity-35 dark:opacity-60 pointer-events-none"
        data-speed="-0.28"
      >
        <div className="mf-orbit absolute inset-0">
          <OrbitField />
        </div>
      </div>
      {/* Soft center feather so the orbit lines don't distract from the headline */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 65% 55% at 50% 50%, var(--black), transparent 75%)" }}
        aria-hidden="true"
      />

      <div className="relative max-w-4xl mx-auto px-5 sm:px-8 text-center">
        <span className="reveal inline-flex items-center gap-3 text-xs font-medium tracking-[0.22em] uppercase text-text-muted mb-8">
          <span className="eyebrow-line from-right w-8 h-px bg-gradient-to-r from-transparent to-orange/40" aria-hidden="true" />
          The Ethos
          <span className="eyebrow-line from-left w-8 h-px bg-gradient-to-l from-transparent to-orange/40" aria-hidden="true" />
        </span>

        <p className="mf-text font-serif text-[1.85rem] leading-[1.3] sm:text-5xl sm:leading-[1.22] text-text text-balance">
          {words.map((word, i) => {
            const accent = word.startsWith("*");
            const clean = word.replace(/\*/g, "");
            return (
              <React.Fragment key={i}>
                <span className={`mf-word inline-block transition-colors duration-300 ${accent ? "italic text-orange font-medium pr-[0.06em]" : ""}`}>
                  {clean}
                </span>{" "}
              </React.Fragment>
            );
          })}
        </p>

        <div className="reveal mt-12 flex items-center justify-center gap-4 text-[10px] sm:text-[11px] uppercase tracking-[0.18em] sm:tracking-[0.24em] text-text-muted whitespace-nowrap">
          <span className="hidden sm:block w-10 h-px bg-orange/30" aria-hidden="true" />
          {MANIFESTO_TAGLINE}
          <span className="hidden sm:block w-10 h-px bg-orange/30" aria-hidden="true" />
        </div>
      </div>
    </section>
  );
}
