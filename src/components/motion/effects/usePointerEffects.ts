"use client";

import { useEffect } from "react";
import { hasFinePointer, prefersReducedMotion } from "@/lib/motion";

const MAX_TILT_DEG = 3;
const MAGNET_STRENGTH = 0.25;
const MAGNET_MAX_PX = 8;

/**
 * Mouse-only micro-interactions:
 * - `.card-premium`: cursor spotlight (--mx/--my) and a slight 3D tilt (--rx/--ry)
 * - `.magnetic`: wrapper drifts a few pixels toward the cursor
 */
export function usePointerEffects() {
  useEffect(() => {
    if (!hasFinePointer()) return;
    const reducedMotion = prefersReducedMotion();

    let activeCard: HTMLElement | null = null;
    let activeMagnet: HTMLElement | null = null;

    const resetCard = (card: HTMLElement) => {
      card.style.setProperty("--rx", "0deg");
      card.style.setProperty("--ry", "0deg");
    };
    const clamp = (v: number) => Math.max(-MAGNET_MAX_PX, Math.min(MAGNET_MAX_PX, v));

    const onPointerMove = (e: PointerEvent) => {
      const target = e.target as HTMLElement;

      const card = target.closest<HTMLElement>(".card-premium");
      if (activeCard && activeCard !== card) resetCard(activeCard);
      activeCard = card;
      if (card) {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        card.style.setProperty("--mx", `${x}px`);
        card.style.setProperty("--my", `${y}px`);
        if (!reducedMotion) {
          card.style.setProperty("--rx", `${(-(y / rect.height - 0.5) * MAX_TILT_DEG).toFixed(2)}deg`);
          card.style.setProperty("--ry", `${((x / rect.width - 0.5) * MAX_TILT_DEG).toFixed(2)}deg`);
        }
      }

      const magnet = target.closest<HTMLElement>(".magnetic");
      if (activeMagnet && activeMagnet !== magnet) activeMagnet.style.transform = "";
      activeMagnet = magnet;
      if (magnet && !reducedMotion) {
        const rect = magnet.getBoundingClientRect();
        const dx = e.clientX - (rect.left + rect.width / 2);
        const dy = e.clientY - (rect.top + rect.height / 2);
        magnet.style.transform = `translate3d(${clamp(dx * MAGNET_STRENGTH)}px, ${clamp(dy * MAGNET_STRENGTH)}px, 0)`;
      }
    };

    const onLeaveWindow = () => {
      if (activeCard) resetCard(activeCard);
      if (activeMagnet) activeMagnet.style.transform = "";
      activeCard = activeMagnet = null;
    };

    document.addEventListener("pointermove", onPointerMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeaveWindow);
    return () => {
      document.removeEventListener("pointermove", onPointerMove);
      document.documentElement.removeEventListener("pointerleave", onLeaveWindow);
    };
  }, []);
}
