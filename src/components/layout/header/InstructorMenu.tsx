"use client";

import { useEffect, useRef, useState, type ComponentProps } from "react";
import Link from "next/link";
import type { Session } from "next-auth";
import { AnimatePresence, motion } from "framer-motion";
import {
  GraduationCap,
  ChevronDown,
  PlusCircle,
  Users,
  Sparkles,
  LogIn,
  ArrowRight,
  Eye,
  Shield,
  User,
} from "lucide-react";
import { EASE_OUT } from "@/lib/motion";
import { isInstructorRole, isAdminRole } from "@/lib/roles";
import { useViewMode, type ViewMode } from "@/components/providers/ViewModeProvider";

interface InstructorMenuProps {
  session: Session | null;
  /** Lets the header stay visible while the popover is open. */
  onOpenChange?: (open: boolean) => void;
}

export function InstructorMenu({ session, onOpenChange }: InstructorMenuProps) {
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

  const role = session?.user?.role;
  const isInstructor = isInstructorRole(role);
  const isAdmin = isAdminRole(role);
  const { viewMode, setViewMode } = useViewMode();

  return (
    <div ref={rootRef} className="relative hidden md:block">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Instructor Menu"
        className={`flex items-center gap-1.5 h-[42px] px-3 sm:px-3.5 rounded-full border transition-all duration-300 text-xs font-medium tracking-wide select-none ${
          open
            ? "border-gold/70 bg-gold-soft text-gold shadow-[0_0_15px_-3px_rgba(249,115,22,0.3)]"
            : "border-black-line bg-cream/[0.02] text-text-muted hover:border-gold/50 hover:text-gold"
        }`}
      >
        <GraduationCap className="w-4 h-4 text-gold shrink-0" />
        <span className="hidden lg:inline font-medium">Instructor</span>
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform duration-300 ${
            open ? "rotate-180 text-gold" : "opacity-60"
          }`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98, transition: { duration: 0.18 } }}
            transition={{ duration: 0.35, ease: EASE_OUT }}
            style={{ transformOrigin: "top right" }}
            className="absolute right-0 top-[calc(100%+10px)] w-72 max-w-[calc(100vw-2rem)] rounded-2xl border border-black-line bg-black-raised/95 backdrop-blur-xl p-2.5 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.95)] z-50"
          >
            {/* Header / Category Label */}
            <div className="flex items-center justify-between px-3 pt-2 pb-2.5 mb-1 border-b border-black-line">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-gold animate-pulse" />
                <p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-text-muted">
                  {isInstructor ? "Instructor Studio" : "Faculty & Teaching"}
                </p>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-gold-soft text-gold font-medium border border-gold/30">
                Academy
              </span>
            </div>

            {/* Menu Links */}
            <div className="space-y-0.5">
              <InstructorMenuLink
                href="/instructors"
                onClick={() => setOpen(false)}
                icon={<Users className="w-4 h-4 text-gold" />}
                label="Faculty & Mentors"
                hint="Browse instructors & 1-on-1 sessions"
              />

              <InstructorMenuLink
                href="/dashboard/instructor"
                onClick={() => setOpen(false)}
                icon={<GraduationCap className="w-4 h-4 text-gold" />}
                label="Instructor Studio"
                hint="Teaching dashboard, students & analytics"
              />

              <InstructorMenuLink
                href="/courses/new"
                onClick={() => setOpen(false)}
                icon={<PlusCircle className="w-4 h-4 text-gold" />}
                label="Author New Class"
                hint="Publish a course, lessons & study plan"
              />

              <InstructorMenuLink
                href="/mentorship"
                onClick={() => setOpen(false)}
                icon={<Sparkles className="w-4 h-4 text-gold" />}
                label="1-on-1 Mentorship"
                hint="Personalized AI engineering guidance"
              />

              <InstructorMenuLink
                href="/courses"
                onClick={() => setOpen(false)}
                icon={<Eye className="w-4 h-4 text-gold" />}
                label="Browse as Viewer"
                hint="Explore curriculum as a student"
              />
            </div>

            {/* Account / Onboarding Shortcuts */}
            <div className="mt-2 pt-2 border-t border-black-line space-y-1">
              {!session ? (
                <>
                  <InstructorMenuLink
                    href="/login?role=instructor"
                    onClick={() => setOpen(false)}
                    icon={<LogIn className="w-4 h-4 text-text-muted" />}
                    label="Instructor Sign In"
                    hint="Access your faculty account"
                  />
                  <Link
                    href="/register"
                    onClick={() => setOpen(false)}
                    role="menuitem"
                    className="group flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-text hover:bg-gold-soft hover:text-gold transition-colors"
                  >
                    <span>Apply to Join Faculty</span>
                    <ArrowRight className="w-3.5 h-3.5 text-text-muted group-hover:text-gold transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </>
              ) : isInstructor ? (
                <div className="space-y-1">
                  {/* Status chip */}
                  <div className="px-3 py-1.5 rounded-xl bg-cream/[0.03] border border-black-line text-[11px] text-text-muted flex items-center justify-between">
                    <span>{isAdmin ? "Logged in as Admin" : "Logged in as Faculty"}</span>
                    <span className="text-gold font-medium">Active</span>
                  </div>

                  {/* View-as switcher — visible to admins; instructors only get viewer toggle */}
                  {isAdmin ? (
                    <ViewAsSwitcher
                      current={viewMode}
                      onChange={(m) => { setViewMode(m); setOpen(false); }}
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => { setViewMode("user"); setOpen(false); }}
                      className="group w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-medium text-text-muted hover:text-gold hover:bg-gold-soft transition-colors"
                    >
                      <span className="flex items-center gap-1.5">
                        <Eye className="w-3.5 h-3.5 text-gold" />
                        <span>Browse as Viewer</span>
                      </span>
                      <ArrowRight className="w-3 h-3 text-text-muted group-hover:text-gold transition-transform group-hover:translate-x-0.5" />
                    </button>
                  )}
                </div>
              ) : (
                <Link
                  href="/register"
                  onClick={() => setOpen(false)}
                  role="menuitem"
                  className="group flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-text hover:bg-gold-soft hover:text-gold transition-colors"
                >
                  <span>Apply to Teach at Bootcamp</span>
                  <ArrowRight className="w-3.5 h-3.5 text-text-muted group-hover:text-gold transition-transform group-hover:translate-x-0.5" />
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface InstructorMenuLinkProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  hint?: string;
  onClick?: () => void;
}

function InstructorMenuLink({ href, icon, label, hint, onClick }: InstructorMenuLinkProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      role="menuitem"
      className="group flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-cream/[0.05] transition-colors"
    >
      <span className="flex items-center justify-center w-8 h-8 rounded-lg border border-cream/15 bg-cream/[0.03] text-text transition-colors group-hover:border-gold/50 group-hover:bg-gold-soft shrink-0">
        {icon}
      </span>
      <span className="flex flex-col min-w-0">
        <span className="text-sm font-medium text-text group-hover:text-gold transition-colors truncate">
          {label}
        </span>
        {hint && <span className="text-[11px] text-text-muted truncate">{hint}</span>}
      </span>
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/* View-as switcher (admin only)                                        */
/* ------------------------------------------------------------------ */

interface ViewAsSwitcherProps {
  current: ViewMode;
  onChange: (mode: ViewMode) => void;
}

const VIEW_OPTIONS: {
  mode: ViewMode;
  label: string;
  hint: string;
  Icon: React.ElementType;
  iconClass: string;
  activeBg: string;
  activeBorder: string;
  activeText: string;
}[] = [
  {
    mode: "admin",
    label: "Admin view",
    hint: "Full platform controls",
    Icon: Shield,
    iconClass: "text-orange",
    activeBg: "bg-orange/10",
    activeBorder: "border-orange/40",
    activeText: "text-orange",
  },
  {
    mode: "instructor",
    label: "Instructor view",
    hint: "Teaching dashboard & tools",
    Icon: GraduationCap,
    iconClass: "text-gold",
    activeBg: "bg-gold/10",
    activeBorder: "border-gold/40",
    activeText: "text-gold",
  },
  {
    mode: "user",
    label: "User view",
    hint: "Student / learner perspective",
    Icon: User,
    iconClass: "text-cream/70",
    activeBg: "bg-cream/8",
    activeBorder: "border-cream/25",
    activeText: "text-cream",
  },
];

function ViewAsSwitcher({ current, onChange }: ViewAsSwitcherProps) {
  return (
    <div className="pt-1">
      <p className="px-3 pb-1.5 text-[9px] uppercase tracking-[0.18em] font-semibold text-text-muted">
        View as
      </p>
      <div className="space-y-0.5">
        {VIEW_OPTIONS.map(({ mode, label, hint, Icon, iconClass, activeBg, activeBorder, activeText }) => {
          const active = current === mode;
          return (
            <button
              key={mode}
              type="button"
              onClick={() => onChange(mode)}
              className={`group w-full flex items-center gap-3 px-3 py-2 rounded-xl border transition-all duration-150 text-left ${
                active
                  ? `${activeBg} ${activeBorder} ${activeText}`
                  : "border-transparent hover:bg-cream/[0.05] text-text-muted hover:text-text"
              }`}
            >
              {/* Icon */}
              <span
                className={`flex items-center justify-center w-7 h-7 rounded-lg border shrink-0 transition-colors ${
                  active
                    ? `${activeBorder} ${activeBg}`
                    : "border-cream/15 bg-cream/[0.03] group-hover:border-gold/30"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${active ? iconClass : "text-text-muted group-hover:text-gold"}`} />
              </span>

              {/* Label + hint */}
              <span className="flex flex-col min-w-0 flex-1">
                <span className={`text-xs font-medium truncate ${active ? activeText : ""}`}>{label}</span>
                <span className="text-[10px] text-text-muted truncate">{hint}</span>
              </span>

              {/* Active checkmark */}
              {active && (
                <span className={`ml-auto text-[10px] font-bold ${iconClass}`}>✓</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

