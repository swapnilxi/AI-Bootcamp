// Pure accent-color constants, safe in client components, server routes, and middleware.

export const ACCENT_COLORS = ["orange", "purple", "pink", "yellow", "green"] as const;
export type AccentColor = (typeof ACCENT_COLORS)[number];

export const DEFAULT_ACCENT: AccentColor = "orange";

export const ACCENT_META: Record<AccentColor, { label: string; swatch: string }> = {
  orange: { label: "Orange", swatch: "#F97316" },
  purple: { label: "Purple", swatch: "#7131CC" },
  pink: { label: "Pink", swatch: "#E92688" },
  yellow: { label: "Yellow", swatch: "#F6CC23" },
  green: { label: "Green", swatch: "#26CA7E" },
};

export function isAccentColor(value: unknown): value is AccentColor {
  return typeof value === "string" && (ACCENT_COLORS as readonly string[]).includes(value);
}

export const ACCENT_STORAGE_KEY = "accentColor";
