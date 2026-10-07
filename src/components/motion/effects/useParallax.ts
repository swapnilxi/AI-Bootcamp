"use client";

import { useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { prefersReducedMotion } from "@/lib/motion";

gsap.registerPlugin(ScrollTrigger);

/** Pixels of drift each way at `data-speed="1"`. Depth should be felt, not seen. */
const DRIFT_PX = 120;

/**
 * Declarative depth, in the spirit of Locomotive's `data-scroll-speed` but driven
 * by the ScrollTrigger instance this site already runs — so parallax, pinning and
 * Lenis share one scroll position and cannot drift apart.
 *
 *   data-speed="0.3"       leads the page, so the layer reads as nearer
 *   data-speed="-0.3"      trails the page, so it recedes
 *   data-speed-x="0.1"     the same, sideways
 *   data-speed-min="1024"  only below-this-width viewports opt out
 *
 * Drift is measured across the element's own transit of the viewport, so a layer
 * sitting at the top of the page starts at rest rather than jumping. Elements opt
 * in by attribute, and only transforms are written — scroll never touches layout.
 */
export function useParallax(pathname: string) {
  useEffect(() => {
    if (prefersReducedMotion()) return;

    const targets = gsap.utils.toArray<HTMLElement>("[data-speed], [data-speed-x]");
    if (!targets.length) return;

    // Group by breakpoint so each guard costs one matchMedia context, not one per element
    const groups = new Map<number, HTMLElement[]>();
    targets.forEach((el) => {
      const min = parseInt(el.dataset.speedMin ?? "0", 10) || 0;
      groups.set(min, [...(groups.get(min) ?? []), el]);
    });

    const media = gsap.matchMedia();

    groups.forEach((els, min) => {
      media.add(min > 0 ? `(min-width: ${min}px)` : "all", () => {
        const tweens = els.map((el) => {
          const y = parseFloat(el.dataset.speed ?? "0") || 0;
          const x = parseFloat(el.dataset.speedX ?? "0") || 0;

          return gsap.fromTo(
            el,
            { y: y * DRIFT_PX, x: x * DRIFT_PX },
            {
              y: -y * DRIFT_PX,
              x: -x * DRIFT_PX,
              ease: "none",
              force3D: true,
              scrollTrigger: {
                trigger: el,
                start: "top bottom",
                end: "bottom top",
                scrub: true,
                invalidateOnRefresh: true,
              },
            }
          );
        });

        return () => {
          tweens.forEach((tween) => {
            tween.scrollTrigger?.kill();
            tween.kill();
          });
          gsap.set(els, { clearProps: "transform" });
        };
      });
    });

    return () => media.revert();
  }, [pathname]);
}
