"use client";

import Link from "next/link";
import type { Session } from "next-auth";
import { signOut } from "next-auth/react";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { EASE_OUT } from "@/lib/motion";
import { NAV_LINKS, WHATSAPP_URL, isActivePath } from "./nav-config";

export const MOBILE_MENU_ID = "mobile-menu";

const panel: Variants = {
  closed: { clipPath: "inset(0 0 100% 0)", transition: { duration: 0.6, ease: EASE_OUT, when: "afterChildren" } },
  open: {
    clipPath: "inset(0 0 0% 0)",
    transition: { duration: 0.75, ease: EASE_OUT, staggerChildren: 0.06, delayChildren: 0.18 },
  },
};
const item: Variants = {
  closed: { opacity: 0, y: 28, transition: { duration: 0.3, ease: EASE_OUT } },
  open: { opacity: 1, y: 0, transition: { duration: 0.8, ease: EASE_OUT } },
};

interface MobileMenuProps {
  open: boolean;
  pathname: string;
  session: Session | null;
  onClose: () => void;
}

/**
 * Full-screen navigation for phones and tablets. Rendered as a sibling of the
 * header so `position: fixed` isn't trapped by the header's transform.
 * Type and spacing scale with viewport height so it also fits landscape phones.
 */
export function MobileMenu({ open, pathname, session, onClose }: MobileMenuProps) {
  const isInstructor = session?.user?.role === "INSTRUCTOR";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          id={MOBILE_MENU_ID}
          key={MOBILE_MENU_ID}
          variants={panel}
          initial="closed"
          animate="open"
          exit="closed"
          data-lenis-prevent
          className="lg:hidden fixed inset-0 z-40 overflow-y-auto overscroll-contain bg-[#0B0B0D]/[0.97] backdrop-blur-2xl pt-[calc(5.5rem+env(safe-area-inset-top))] pb-[calc(2.5rem+env(safe-area-inset-bottom))] px-6 sm:px-10"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-40 right-[-30%] w-[520px] h-[520px] rounded-full opacity-50 blur-[90px]"
            style={{ background: "radial-gradient(circle, rgba(249, 115, 22,0.16), transparent 65%)" }}
          />

          <div className="relative mx-auto max-w-xl">
            <nav aria-label="Mobile" className="flex flex-col">
              {NAV_LINKS.map((link, i) => {
                const active = isActivePath(pathname, link.href);
                return (
                  <motion.div key={link.href} variants={item}>
                    <Link
                      href={link.href}
                      onClick={onClose}
                      aria-current={active ? "page" : undefined}
                      className="group flex items-baseline gap-4 py-[clamp(0.45rem,1.8vh,0.9rem)] border-b border-white/[0.06]"
                    >
                      <span className="font-sans text-[11px] tabular-nums tracking-[0.2em] text-text-muted/60">0{i + 1}</span>
                      <span
                        className={`font-serif text-[clamp(1.35rem,4.6vh,1.9rem)] leading-tight transition-colors duration-300 ${
                          active ? "text-gold" : "text-text group-hover:text-gold"
                        }`}
                      >
                        {link.label}
                      </span>
                    </Link>
                  </motion.div>
                );
              })}
            </nav>

            <motion.div variants={item} className="mt-8 grid gap-3">
              <Button href="/paths" variant="primary" size="md" className="w-full">
                Start learning
                <Icon name="arrow" variant="line" size={16} className="ml-1.5 nudge" />
              </Button>
              {session ? (
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    href={isInstructor ? "/dashboard/instructor" : "/my-bookings"}
                    variant="secondary"
                    size="sm"
                    className="w-full"
                  >
                    {isInstructor ? "Studio" : "My sessions"}
                  </Button>
                  <Button href="/dashboard" variant="secondary" size="sm" className="w-full">
                    Portal
                  </Button>
                  <button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="col-span-2 py-2 text-xs uppercase tracking-[0.18em] text-text-muted hover:text-gold transition-colors"
                  >
                    Sign out
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <Button href="/login" variant="secondary" size="sm" className="w-full">
                    Sign In
                  </Button>
                  <Button href="/login?role=instructor" variant="outline" size="sm" className="w-full">
                    Faculty
                  </Button>
                </div>
              )}
            </motion.div>

            <motion.a
              variants={item}
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 flex items-center justify-center gap-2 text-xs uppercase tracking-[0.18em] text-text-muted hover:text-gold transition-colors"
            >
              <Icon name="whatsapp" variant="filled" size={14} className="text-gold" />
              WhatsApp Direct
            </motion.a>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
