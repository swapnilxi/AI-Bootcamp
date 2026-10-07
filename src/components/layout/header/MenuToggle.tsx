"use client";

import { motion } from "framer-motion";
import { EASE_OUT } from "@/lib/motion";

interface MenuToggleProps {
  open: boolean;
  onToggle: () => void;
  controls: string;
}

/** Two-line burger that morphs into a close cross (mobile & tablet only). */
export function MenuToggle({ open, onToggle, controls }: MenuToggleProps) {
  const transition = { duration: 0.45, ease: EASE_OUT };
  return (
    <button
      onClick={onToggle}
      className="lg:hidden relative flex items-center justify-center w-11 h-11 rounded-full border border-white/10 bg-white/[0.02] text-text-muted hover:border-gold/50 transition-colors"
      aria-label={open ? "Close menu" : "Open menu"}
      aria-expanded={open}
      aria-controls={controls}
    >
      <motion.span
        className="absolute h-px w-[18px] bg-current"
        animate={open ? { rotate: 45, y: 0 } : { rotate: 0, y: -4 }}
        transition={transition}
      />
      <motion.span
        className="absolute h-px w-[18px] bg-current"
        animate={open ? { rotate: -45, y: 0 } : { rotate: 0, y: 4 }}
        transition={transition}
      />
    </button>
  );
}
