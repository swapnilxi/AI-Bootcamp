"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { Icon } from "@/components/ui/Icon";
import { useSmoothScroll } from "@/components/motion/SmoothScrollProvider";
import { EASE_OUT } from "@/lib/motion";
import { DesktopNav } from "./DesktopNav";
import { AccountMenu } from "./AccountMenu";
import { InstructorMenu } from "./InstructorMenu";
import { MenuToggle } from "./MenuToggle";
import { MobileMenu, MOBILE_MENU_ID } from "./MobileMenu";
import { useHeaderScroll } from "./useHeaderScroll";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

/** Distance the bar travels when tucked away; clears its height plus drop shadow. */
const HIDDEN_OFFSET_PX = -140;

/**
 * Site header: logo, primary navigation, booking CTA and account access.
 * Turns to glass once the page scrolls, hides while reading downward and
 * returns on any upward scroll. Below `lg` the links move into MobileMenu.
 */
export function EditorialHeader() {
  const { data: session } = useSession();
  const pathname = usePathname() || "/";
  const { pause, resume } = useSmoothScroll();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [instructorOpen, setInstructorOpen] = useState(false);
  const { scrolled, hidden, show } = useHeaderScroll(mobileOpen || accountOpen || instructorOpen);

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  // Every route change starts with menus closed and the bar visible
  useEffect(() => {
    setMobileOpen(false);
    show();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Lock page scroll while the mobile menu is open; Escape closes it
  useEffect(() => {
    if (!mobileOpen) return;
    pause();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMobileOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      resume();
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [mobileOpen, pause, resume]);

  // Close the mobile menu if the viewport grows into the desktop layout
  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1024px)");
    const onChange = (e: MediaQueryListEvent) => e.matches && setMobileOpen(false);
    desktop.addEventListener("change", onChange);
    return () => desktop.removeEventListener("change", onChange);
  }, []);

  return (
    <>
      <motion.header
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: hidden ? HIDDEN_OFFSET_PX : 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: EASE_OUT }}
        className="sticky top-0 z-50"
      >
        {/* Glass layer fades in under the bar once the page scrolls */}
        <div
          aria-hidden="true"
          className={`absolute inset-0 transition-opacity duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] bg-black/70 backdrop-blur-xl backdrop-saturate-150 shadow-[0_18px_40px_-24px_rgba(0,0,0,0.9)] ${
            scrolled || mobileOpen ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-gold/35 to-transparent" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className={`flex items-center justify-between gap-3 transition-[height] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              scrolled ? "h-16 sm:h-[68px]" : "h-[72px] sm:h-20"
            }`}
          >
            <Logo className="shrink-0" />

            <DesktopNav pathname={pathname} />

            <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
              <ThemeToggle />

              <InstructorMenu session={session} onOpenChange={setInstructorOpen} />

              <span className="magnetic inline-flex">
                <Button href="/paths" variant="primary" size="sm" className="!min-h-[42px] !px-3.5 sm:!px-4 xl:!px-5">
                  <span className="xl:hidden">Start</span>
                  <span className="hidden xl:inline normal-case tracking-wide text-[13px]">Start learning</span>
                  <Icon name="arrow" variant="line" size={14} className="ml-1.5 nudge hidden xl:inline-block" />
                </Button>
              </span>

              <AccountMenu session={session} onOpenChange={setAccountOpen} />

              <MenuToggle open={mobileOpen} onToggle={() => setMobileOpen((v) => !v)} controls={MOBILE_MENU_ID} />
            </div>
          </div>
        </div>
      </motion.header>

      <MobileMenu open={mobileOpen} pathname={pathname} session={session} onClose={closeMobile} />
    </>
  );
}
