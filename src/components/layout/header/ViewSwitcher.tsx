"use client";

/**
 * ViewSwitcher
 *
 * A compact segmented pill shown in the header only to ADMIN / SUPER_ADMIN
 * users. Clicking a segment updates the ViewModeContext so the UI reflects
 * what that role would see, without changing the real session.
 */

import { motion, AnimatePresence } from "framer-motion";
import type { Session } from "next-auth";
import { isAdminRole } from "@/lib/roles";
import { useViewMode, type ViewMode } from "@/components/providers/ViewModeProvider";
import { Shield, GraduationCap, User } from "lucide-react";

interface ViewSwitcherProps {
  session: Session | null;
}

interface SegmentDef {
  mode: ViewMode;
  label: string;
  shortLabel: string;
  Icon: React.ElementType;
  activeClass: string;
  activeBg: string;
}

const SEGMENTS: SegmentDef[] = [
  {
    mode: "admin",
    label: "Admin view",
    shortLabel: "Admin",
    Icon: Shield,
    activeClass: "text-orange",
    activeBg: "bg-orange/15 border-orange/40",
  },
  {
    mode: "instructor",
    label: "Instructor view",
    shortLabel: "Instructor",
    Icon: GraduationCap,
    activeClass: "text-gold",
    activeBg: "bg-gold/15 border-gold/40",
  },
  {
    mode: "user",
    label: "User view",
    shortLabel: "User",
    Icon: User,
    activeClass: "text-cream",
    activeBg: "bg-cream/10 border-cream/25",
  },
];

export function ViewSwitcher({ session }: ViewSwitcherProps) {
  const role = session?.user?.role;
  const { viewMode, setViewMode, canSwitchView } = useViewMode();

  // Only render for admin / superadmin
  if (!canSwitchView || !isAdminRole(role)) return null;

  return (
    <div
      role="group"
      aria-label="Switch view mode"
      className="hidden sm:flex items-center gap-0.5 h-9 px-1 rounded-full border border-black-line bg-black-raised/80 backdrop-blur-sm"
    >
      {SEGMENTS.map(({ mode, label, shortLabel, Icon, activeClass, activeBg }) => {
        const active = viewMode === mode;
        return (
          <motion.button
            key={mode}
            type="button"
            onClick={() => setViewMode(mode)}
            aria-label={label}
            aria-pressed={active}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            className={`relative flex items-center gap-1.5 px-2.5 h-7 rounded-full text-[11px] font-medium transition-colors duration-200 select-none ${
              active
                ? `${activeClass} ${activeBg} border`
                : "text-text-muted hover:text-cream border border-transparent"
            }`}
          >
            <Icon className="w-3 h-3 shrink-0" />
            <span className="hidden md:inline">{shortLabel}</span>

            {/* Active glow */}
            <AnimatePresence>
              {active && (
                <motion.span
                  layoutId="view-switcher-glow"
                  className="absolute inset-0 rounded-full blur-md opacity-20"
                  style={{
                    background:
                      mode === "admin"
                        ? "rgba(var(--orange-rgb),1)"
                        : mode === "instructor"
                        ? "rgba(var(--gold-rgb),1)"
                        : "rgba(255,255,255,0.5)",
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.2 }}
                  exit={{ opacity: 0 }}
                />
              )}
            </AnimatePresence>
          </motion.button>
        );
      })}

      {/* Viewing-as badge tooltip */}
      {viewMode !== "admin" && (
        <span className="ml-1 mr-0.5 text-[9px] uppercase tracking-widest text-text-muted font-semibold opacity-60 hidden lg:block">
          preview
        </span>
      )}
    </div>
  );
}
