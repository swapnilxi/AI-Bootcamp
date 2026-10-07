"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("theme") as "dark" | "light" | null;
    const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initial = saved || (prefersDark ? "dark" : "light");
    setTheme(initial);
    applyTheme(initial);
  }, []);

  const applyTheme = (t: "dark" | "light") => {
    document.documentElement.setAttribute("data-theme", t);
    if (t === "light") {
      document.documentElement.classList.add("light");
    } else {
      document.documentElement.classList.remove("light");
    }
  };

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("theme", next);
    applyTheme(next);
  };

  if (!mounted) {
    return (
      <div className={`w-9 h-9 rounded-full bg-cream-soft border border-line ${className}`} />
    );
  }

  const isDark = theme === "dark";

  return (
    <motion.button
      type="button"
      onClick={toggle}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      className={`relative inline-flex items-center justify-center w-9 h-9 rounded-full transition-colors duration-200 border ${
        isDark
          ? "bg-black-raised/80 border-cream-border text-cream hover:border-orange hover:shadow-[0_0_12px_rgba(255,115,21,0.25)]"
          : "bg-surface-elevated/90 border-line-strong text-ink hover:border-orange hover:shadow-[0_0_12px_rgba(220,76,0,0.2)]"
      } ${className}`}
    >
      {isDark ? (
        /* Sun Icon for Dark Mode (click to switch to Light) */
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-4 h-4 text-orange filter drop-shadow-[0_0_4px_rgba(255,115,21,0.4)]"
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
        </svg>
      ) : (
        /* Moon Icon for Light Mode (click to switch to Dark) */
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-4 h-4 text-orange filter drop-shadow-[0_0_4px_rgba(220,76,0,0.3)]"
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </motion.button>
  );
}
