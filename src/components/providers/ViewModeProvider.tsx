"use client";

/**
 * ViewModeContext
 *
 * Lets admins / superadmins "view-as" a different role without actually
 * changing their session. The active view mode is persisted to localStorage
 * so it survives page refreshes.
 *
 * Consumers should read `effectiveRole` instead of the raw session role
 * when deciding what UI to render.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "next-auth";
import { isAdminRole } from "@/lib/roles";

export type ViewMode = "admin" | "instructor" | "user";

interface ViewModeContextValue {
  /** The mode currently being previewed. */
  viewMode: ViewMode;
  /** Set a new view-as mode. */
  setViewMode: (mode: ViewMode) => void;
  /** Whether the current session is allowed to switch view modes. */
  canSwitchView: boolean;
  /**
   * The effective role string that other components should use for
   * rendering decisions. When the admin switches to "user" this returns
   * "USER", to "instructor" returns "INSTRUCTOR", etc.
   */
  effectiveRole: string;
}

const ViewModeContext = createContext<ViewModeContextValue>({
  viewMode: "admin",
  setViewMode: () => {},
  canSwitchView: false,
  effectiveRole: "USER",
});

const STORAGE_KEY = "aib:viewMode";

export function ViewModeProvider({
  children,
  session,
}: {
  children: ReactNode;
  session: Session | null;
}) {
  const realRole = session?.user?.role ?? "USER";
  const canSwitch = isAdminRole(realRole);

  const [viewMode, setViewModeState] = useState<ViewMode>(() => {
    // Initialise from localStorage only if the user is privileged; otherwise
    // always default to "admin" so the state is neutral for non-admins.
    if (typeof window === "undefined") return "admin";
    const saved = localStorage.getItem(STORAGE_KEY) as ViewMode | null;
    return saved ?? "admin";
  });

  // Keep localStorage in sync
  const setViewMode = useCallback((mode: ViewMode) => {
    setViewModeState(mode);
    localStorage.setItem(STORAGE_KEY, mode);
  }, []);

  // If the user logs out or loses admin rights, reset to "admin"
  useEffect(() => {
    if (!canSwitch) {
      setViewModeState("admin");
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [canSwitch]);

  const effectiveRole =
    !canSwitch
      ? realRole
      : viewMode === "admin"
      ? realRole
      : viewMode === "instructor"
      ? "INSTRUCTOR"
      : "USER";

  return (
    <ViewModeContext.Provider
      value={{ viewMode, setViewMode, canSwitchView: canSwitch, effectiveRole }}
    >
      {children}
    </ViewModeContext.Provider>
  );
}

export function useViewMode() {
  return useContext(ViewModeContext);
}
