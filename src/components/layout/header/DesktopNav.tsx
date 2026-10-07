"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { NAV_LINKS, isActivePath } from "./nav-config";

const SPRING = { type: "spring", stiffness: 380, damping: 32 } as const;

/** Desktop link row: a highlight glides between hovered links; a gold dot marks the current page. */
export function DesktopNav({ pathname }: { pathname: string }) {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <nav aria-label="Primary" className="hidden lg:flex items-center" onMouseLeave={() => setHovered(null)}>
      {NAV_LINKS.map((link) => {
        const active = isActivePath(pathname, link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            onMouseEnter={() => setHovered(link.href)}
            onFocus={() => setHovered(link.href)}
            aria-current={active ? "page" : undefined}
            className={`relative inline-flex items-center whitespace-nowrap px-2 xl:px-3.5 py-2 text-[13px] xl:text-sm tracking-wide rounded-full transition-colors duration-300 ${
              active ? "text-gold" : "text-text-muted hover:text-text"
            }`}
          >
            {hovered === link.href && (
              <motion.span
                layoutId="nav-hover"
                className="absolute inset-0 rounded-full bg-white/[0.045] border border-white/[0.06]"
                transition={SPRING}
              />
            )}
            <span className="relative">{link.label}</span>
            {active && (
              <motion.span
                layoutId="nav-active"
                className="neon-dot absolute left-1/2 -translate-x-1/2 bottom-0.5 h-1 w-1 rounded-full"
                transition={SPRING}
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
