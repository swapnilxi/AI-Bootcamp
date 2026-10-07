"use client";

import { useEffect, type RefObject } from "react";
import { hasFinePointer, prefersReducedMotion } from "@/lib/motion";

const FOLLOW_EASE = 0.22;
const SCALE_EASE = 0.12;
const INTERACTIVE = "a, button, [role='button'], input, select, textarea";

/** Soft gold halo that trails the mouse with a little weight and swells over controls. */
export function useCursorGlow(glowRef: RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const glow = glowRef.current;
    if (!glow || !hasFinePointer()) return;
    const ease = prefersReducedMotion() ? 1 : FOLLOW_EASE;

    let targetX = -200;
    let targetY = -200;
    let x = targetX;
    let y = targetY;
    let scale = 1;
    let targetScale = 1;
    let rafId = 0;
    let running = false;

    const tick = () => {
      x += (targetX - x) * ease;
      y += (targetY - y) * ease;
      scale += (targetScale - scale) * SCALE_EASE;
      glow.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -50%) scale(${scale.toFixed(3)})`;
      const settled =
        Math.abs(targetX - x) < 0.1 && Math.abs(targetY - y) < 0.1 && Math.abs(targetScale - scale) < 0.001;
      if (settled) {
        running = false;
        return;
      }
      rafId = requestAnimationFrame(tick);
    };
    const start = () => {
      if (running) return;
      running = true;
      rafId = requestAnimationFrame(tick);
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      if (glow.dataset.visible !== "true") {
        // Appear at the pointer instead of sliding in from the corner
        x = targetX = e.clientX;
        y = targetY = e.clientY;
        glow.dataset.visible = "true";
      }
      targetX = e.clientX;
      targetY = e.clientY;
      targetScale = (e.target as HTMLElement).closest(INTERACTIVE) ? 1.6 : 1;
      start();
    };
    const onLeave = () => {
      glow.dataset.visible = "false";
    };
    const onDown = () => {
      targetScale *= 0.75;
      start();
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, [glowRef]);
}
