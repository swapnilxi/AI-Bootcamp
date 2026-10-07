"use client";

import { useEffect } from "react";
import { autoTagReveals } from "./auto-reveal";

const SETTLE_MS = 1200;

/**
 * Adds `is-visible` to `.reveal` / `.draw-on` elements as they enter the
 * viewport, then `reveal-done` once the entrance has settled (so hover
 * transitions aren't slowed by reveal timing). One long-lived observer also
 * picks up content rendered later (route changes, client-fetched lists).
 */
export function useScrollReveal() {
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target as HTMLElement;
          el.classList.add("is-visible");
          observer.unobserve(el);
          if (el.classList.contains("reveal")) {
            const delay = parseFloat(getComputedStyle(el).getPropertyValue("--d")) || 0;
            timers.push(setTimeout(() => el.classList.add("reveal-done"), delay + SETTLE_MS));
          }
        });
      },
      { threshold: 0, rootMargin: "0px 0px -8% 0px" }
    );

    const scan = () => {
      autoTagReveals();
      document
        .querySelectorAll(".reveal:not(.is-visible), .draw-on:not(.is-visible)")
        .forEach((el) => observer.observe(el));
    };

    let scheduled = 0;
    const mutations = new MutationObserver(() => {
      if (scheduled) return;
      scheduled = requestAnimationFrame(() => {
        scheduled = 0;
        scan();
      });
    });

    const initialTimer = setTimeout(() => {
      scan();
      const main = document.querySelector("main");
      if (main) mutations.observe(main, { childList: true, subtree: true });
    }, 0);

    return () => {
      clearTimeout(initialTimer);
      observer.disconnect();
      mutations.disconnect();
      if (scheduled) cancelAnimationFrame(scheduled);
      timers.forEach(clearTimeout);
    };
  }, []);
}
