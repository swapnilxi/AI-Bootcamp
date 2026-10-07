"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";

// First paint uses a CSS entrance (runs before hydration, no flash);
// client-side route changes get the Framer Motion transition.
let hasNavigated = false;

export default function Template({ children }: { children: React.ReactNode }) {
  const animateIn = hasNavigated;

  useEffect(() => {
    hasNavigated = true;
  }, []);

  return (
    <motion.div
      className={`flex-grow flex flex-col ${animateIn ? "" : "page-enter"}`}
      initial={animateIn ? { opacity: 0, y: 16 } : false}
      animate={{ opacity: 1, y: 0, transitionEnd: { transform: "none" } }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
