import type { CSSProperties } from "react";

/** Inline `--d` delay consumed by `.reveal`, `.intro` and `.word-mask` animations. */
export const revealDelay = (ms: number): CSSProperties => ({ "--d": `${ms}ms` }) as CSSProperties;

/** Arbitrary CSS custom properties without casting at every call site. */
export const cssVars = (vars: Record<`--${string}`, string | number>): CSSProperties => vars as CSSProperties;
