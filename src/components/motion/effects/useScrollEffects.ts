"use client";

import { useEffect, type RefObject } from "react";
import { prefersReducedMotion } from "@/lib/motion";

/** The hero fade only runs where the hero is laid out side-by-side. */
const FADE_MIN_WIDTH = 1024;

/**
 * Scroll-linked effects:
 * - progress hairline at the top of the viewport
 * - `[data-scroll-fade]` layers fade out over the first ~¾ viewport
 * - the scroll companion spark descends its rail (--p)
 *
 * Parallax lives in `useParallax`, which drives it off ScrollTrigger so it shares
 * a scroll position with pinning and Lenis. Both used to exist here; they did not
 * need to.
 */
export function useScrollEffects(
  progressRef: RefObject<HTMLDivElement | null>,
  railRef: RefObject<HTMLDivElement | null>,
  routeKey: string | null
) {
  useEffect(() => {
    const reducedMotion = prefersReducedMotion();
    const fadeEls = Array.from(document.querySelectorAll<HTMLElement>("[data-scroll-fade]"));
    let ticking = false;

    const update = () => {
      ticking = false;
      const y = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const progress = max > 0 ? Math.min(y / max, 1) : 0;
      if (progressRef.current) {
        progressRef.current.style.transform = `scaleX(${progress})`;
      }
      // Before the reduced-motion return: the spark is scroll-linked, not motion
      // of its own, so it stays useful either way.
      if (railRef.current) {
        railRef.current.style.setProperty("--p", progress.toFixed(4));
        railRef.current.dataset.visible = String(progress > 0.015 && progress < 0.995);
      }
      if (reducedMotion) return;

      const vh = window.innerHeight;
      if (y > vh * 1.5) return; // hero layers are off-screen; skip work
      const fadeOn = window.innerWidth >= FADE_MIN_WIDTH;
      fadeEls.forEach((el) => {
        el.style.opacity = fadeOn ? String(Math.max(0, 1 - y / (vh * 0.75))) : "";
      });
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [progressRef, railRef, routeKey]);
}
