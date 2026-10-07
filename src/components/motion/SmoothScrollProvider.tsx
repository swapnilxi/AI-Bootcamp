"use client";

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const HEADER_OFFSET = -88;

interface SmoothScrollContextType {
  lenis: Lenis | null;
  pause: () => void;
  resume: () => void;
  scrollTo: (target: string | HTMLElement | number, offset?: number) => void;
}

const SmoothScrollContext = createContext<SmoothScrollContextType>({
  lenis: null,
  pause: () => {},
  resume: () => {},
  scrollTo: () => {},
});

export function useSmoothScroll() {
  return useContext(SmoothScrollContext);
}

/**
 * Lenis smooth scrolling driven by the GSAP ticker, so ScrollTrigger animations
 * and the smoothed scroll position never drift apart.
 */
export function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);
  const [lenis, setLenis] = useState<Lenis | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    // Respect user choice: no smooth scrolling with reduced motion
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const instance = new Lenis({
      lerp: 0.09, // buttery inertia; lower = smoother/heavier
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      touchMultiplier: 1, // Do NOT hijack native touch scrolling on phones
      wheelMultiplier: 1,
    });

    lenisRef.current = instance;
    setLenis(instance);

    instance.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => instance.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    // Anchor links glide to their target with the header offset
    function handleAnchorClick(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
      const link = (e.target as HTMLElement).closest("a");
      const href = link?.getAttribute("href");
      if (!href || !href.startsWith("#") || href.length < 2) return;
      const elem = document.querySelector(href);
      if (elem) {
        e.preventDefault();
        instance.scrollTo(elem as HTMLElement, { offset: HEADER_OFFSET });
      }
    }
    document.addEventListener("click", handleAnchorClick);

    return () => {
      gsap.ticker.remove(tick);
      document.removeEventListener("click", handleAnchorClick);
      instance.destroy();
      lenisRef.current = null;
      setLenis(null);
    };
  }, []);

  // New route: start at the top (unless a hash is targeted) and re-measure triggers
  useEffect(() => {
    if (!window.location.hash) lenisRef.current?.scrollTo(0, { immediate: true, force: true });
    const id = window.setTimeout(() => ScrollTrigger.refresh(), 350);
    return () => window.clearTimeout(id);
  }, [pathname]);

  const pause = useCallback(() => lenisRef.current?.stop(), []);
  const resume = useCallback(() => lenisRef.current?.start(), []);
  const scrollTo = useCallback(
    (target: string | HTMLElement | number, offset: number = HEADER_OFFSET) => {
      if (lenisRef.current) {
        lenisRef.current.scrollTo(target, { offset });
      } else if (typeof target === "number") {
        window.scrollTo({ top: target });
      } else {
        const el = typeof target === "string" ? document.querySelector(target) : target;
        el?.scrollIntoView();
      }
    },
    []
  );

  return (
    <SmoothScrollContext.Provider value={{ lenis, pause, resume, scrollTo }}>
      {children}
    </SmoothScrollContext.Provider>
  );
}
