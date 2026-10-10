"use client";

/**
 * ViewModeBanner
 *
 * Rendered just below the header when an admin/superadmin is previewing
 * a non-admin view. Makes it unmistakably clear this is a preview session.
 */

import { AnimatePresence, motion } from "framer-motion";
import { GraduationCap, User, X } from "lucide-react";
import { useViewMode } from "@/components/providers/ViewModeProvider";

export function ViewModeBanner() {
  const { viewMode, setViewMode, canSwitchView } = useViewMode();

  const isPreview = canSwitchView && viewMode !== "admin";

  const config =
    viewMode === "instructor"
      ? {
          label: "Previewing as Instructor",
          hint: "You're seeing the platform as an instructor would.",
          Icon: GraduationCap,
          colors:
            "bg-gold/10 border-gold/30 text-gold",
          dot: "bg-gold",
        }
      : {
          label: "Previewing as User",
          hint: "You're seeing the platform as a regular student would.",
          Icon: User,
          colors:
            "bg-cream/8 border-cream/20 text-cream/80",
          dot: "bg-cream/60",
        };

  return (
    <AnimatePresence>
      {isPreview && (
        <motion.div
          key={viewMode}
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="overflow-hidden sticky top-[68px] z-40"
        >
          <div
            className={`flex items-center justify-between gap-3 px-4 py-2 border-b text-xs ${config.colors}`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`w-1.5 h-1.5 rounded-full animate-pulse ${config.dot}`}
              />
              <config.Icon className="w-3.5 h-3.5 shrink-0" />
              <span className="font-semibold">{config.label}</span>
              <span className="hidden sm:inline opacity-60">—</span>
              <span className="hidden sm:inline opacity-60">{config.hint}</span>
            </div>
            <button
              type="button"
              onClick={() => setViewMode("admin")}
              aria-label="Exit preview mode"
              className="flex items-center gap-1 px-2 py-0.5 rounded-full border border-current/30 hover:bg-current/10 transition-colors text-[11px] font-medium"
            >
              <X className="w-3 h-3" />
              <span>Exit preview</span>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
