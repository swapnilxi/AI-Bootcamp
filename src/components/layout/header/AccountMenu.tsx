"use client";

import { useEffect, useRef, useState, type ComponentProps } from "react";
import Link from "next/link";
import type { Session } from "next-auth";
import { signOut } from "next-auth/react";
import { AnimatePresence, motion } from "framer-motion";
import { Icon } from "@/components/ui/Icon";
import { EASE_OUT } from "@/lib/motion";

interface AccountMenuProps {
  session: Session | null;
  /** Lets the header stay visible while the popover is open. */
  onOpenChange?: (open: boolean) => void;
}

/** Desktop account button with a popover for sign-in options or member shortcuts. */
export function AccountMenu({ session, onOpenChange }: AccountMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => onOpenChange?.(open), [open, onOpenChange]);

  // Dismiss on outside click or Escape
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const isInstructor = session?.user?.role === "INSTRUCTOR";
  const initial = (session?.user?.name || session?.user?.email || "M").trim().charAt(0).toUpperCase();

  return (
    <div ref={rootRef} className="relative hidden lg:block">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account"
        className={`flex items-center justify-center w-[42px] h-[42px] !min-h-0 rounded-full border transition-[border-color,background-color,color] duration-300 ${
          open
            ? "border-gold/70 bg-gold-soft text-gold"
            : "border-white/10 bg-white/[0.02] text-text-muted hover:border-gold/50 hover:text-gold"
        }`}
      >
        {session ? (
          <span className="font-serif text-base leading-none text-text">{initial}</span>
        ) : (
          <Icon name="user" variant="line" size={17} />
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98, transition: { duration: 0.18 } }}
            transition={{ duration: 0.4, ease: EASE_OUT }}
            style={{ transformOrigin: "top right" }}
            className="absolute right-0 top-[calc(100%+12px)] w-64 max-w-[calc(100vw-2rem)] rounded-xl border border-white/[0.08] bg-[#111114]/95 backdrop-blur-xl p-2 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.9)]"
          >
            {session ? (
              <>
                <div className="px-3 pt-2 pb-3 mb-1 border-b border-white/[0.06]">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-text-muted">Signed in</p>
                  <p className="text-sm text-text truncate mt-1">{session.user?.name || session.user?.email}</p>
                </div>
                {isInstructor && <MenuLink href="/dashboard/instructor" icon="role-instructor" label="Instructor Studio" />}
                <MenuLink href="/dashboard" icon="user" label="Client Portal" />
                <MenuLink href="/my-bookings" icon="calendar" label="My Bookings" />
                <MenuLink href="/profile" icon="settings" label="Profile & Birth Chart" />
                <button
                  role="menuitem"
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="w-full flex items-center gap-3 px-3 py-2.5 !min-h-0 rounded-lg text-sm text-text-muted hover:text-text hover:bg-white/[0.04] transition-colors"
                >
                  <Icon name="close" variant="line" size={15} className="text-text-muted" />
                  Sign out
                </button>
              </>
            ) : (
              <>
                <MenuLink href="/login" icon="user" label="Member Sign In" hint="Clients & subscribers" />
                <MenuLink href="/login?role=instructor" icon="role-instructor" label="Instructor Sign In" hint="Instructors & mentors" />
                <div className="mt-1 pt-2 border-t border-white/[0.06]">
                  <Link
                    href="/register"
                    role="menuitem"
                    className="group flex items-center justify-between px-3 py-2.5 !min-h-0 rounded-lg text-sm text-text hover:bg-gold-soft transition-colors"
                  >
                    Create an account
                    <Icon name="arrow" variant="line" size={14} className="nudge" />
                  </Link>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface MenuLinkProps {
  href: string;
  icon: ComponentProps<typeof Icon>["name"];
  label: string;
  hint?: string;
}

function MenuLink({ href, icon, label, hint }: MenuLinkProps) {
  return (
    <Link
      href={href}
      role="menuitem"
      className="group flex items-center gap-3 px-3 py-2.5 !min-h-0 rounded-lg hover:bg-white/[0.04] transition-colors"
    >
      <span className="flex items-center justify-center w-8 h-8 rounded-full border border-cream/20 bg-cream/[0.04] text-text transition-colors group-hover:border-gold/50">
        <Icon name={icon} variant="line" size={15} />
      </span>
      <span className="flex flex-col">
        <span className="text-sm text-text group-hover:text-gold transition-colors">{label}</span>
        {hint && <span className="text-[11px] text-text-muted">{hint}</span>}
      </span>
    </Link>
  );
}
