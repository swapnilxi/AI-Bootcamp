"use client";

import { useState } from "react";
import { useMotionValueEvent, useScroll } from "framer-motion";

const GLASS_AFTER_PX = 24;
const HIDE_AFTER_PX = 160;
const DIRECTION_THRESHOLD_PX = 4;

/**
 * Scroll-driven header state:
 * - `scrolled`: page has left the top, so the bar gets its glass background
 * - `hidden`: reader is scrolling down past the hero, so the bar tucks away
 * While `locked` (a menu is open) the bar never hides.
 */
export function useHeaderScroll(locked: boolean) {
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (y) => {
    const prev = scrollY.getPrevious() ?? 0;
    setScrolled(y > GLASS_AFTER_PX);
    if (locked) return;
    if (y > HIDE_AFTER_PX && y - prev > DIRECTION_THRESHOLD_PX) setHidden(true);
    else if (prev - y > DIRECTION_THRESHOLD_PX || y < HIDE_AFTER_PX) setHidden(false);
  });

  return { scrolled, hidden, show: () => setHidden(false) };
}
