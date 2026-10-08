import type { Config } from "tailwindcss";

/**
 * Premium Orange Ramp — the pure, standard Tailwind orange scale.
 * Used strictly as an accent/glow color: #F97316 at 500 (primary),
 * #FB923C at 400 (bright accent), #EA580C at 600 (deep accent).
 */
const orange = {
  50: "#FFF7ED",
  100: "#FFEDD5",
  200: "#FED7AA",
  300: "#FDBA74",
  400: "#FB923C",
  500: "#F97316",
  600: "#EA580C",
  700: "#C2410C",
  800: "#9A3412",
  900: "#7C2D12",
  950: "#431407",
  DEFAULT: "#F97316",
  spiced: "#EA580C",
  soft: "rgba(249, 115, 22, 0.14)",
};

/**
 * Luxury Cream / Ivory Palette.
 * Warm, tactile alabaster and ivory tones to replace cold clinical white.
 * In Dark Mode: carries typography, glass highlights, subtle borders and pills.
 * In Light Mode: forms the warm ground, elevated surfaces, and ambient backdrop.
 */
const cream = {
  50: "#FDFAF6",
  100: "#FAF6F0",
  200: "#F5EFE4",
  300: "#EFE5D2",
  400: "#DECDB6",
  500: "#C4B296",
  600: "#9C8A6F",
  700: "#756650",
  800: "#4F4435",
  900: "#2B241C",
  DEFAULT: "#FAF6F0",
};

const config: Config = {
  darkMode: ["class", '[data-theme="dark"]'],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      borderRadius: {
        pill: "9999px",
        lg: "0.9rem",
        xl: "1.15rem",
        "2xl": "1.5rem",
        "3xl": "2rem",
      },
      colors: {
        // `cream` (and its `white` alias) carries body/heading text — the same
        // role as `text` — so both resolve to the theme-aware ink variable and
        // flip correctly between dark and light mode instead of staying a fixed
        // off-white that would vanish against a light background.
        cream: { ...cream, DEFAULT: "rgb(var(--text-rgb-ch) / <alpha-value>)" },
        white: { ...cream, DEFAULT: "rgb(var(--text-rgb-ch) / <alpha-value>)" },
        black: {
          DEFAULT: "rgb(var(--black-rgb-ch) / <alpha-value>)",
          raised: "rgb(var(--black-raised-rgb-ch) / <alpha-value>)",
          card: "rgb(var(--black-card-rgb-ch) / <alpha-value>)",
          line: "var(--black-line)",
        },
        orange,
        gold: orange,
        amber: orange,
        text: {
          DEFAULT: "rgb(var(--text-rgb-ch) / <alpha-value>)",
          muted: "rgb(var(--text-muted-rgb-ch) / <alpha-value>)",
        },
        ink: {
          DEFAULT: "rgb(var(--text-rgb-ch) / <alpha-value>)",
          50: "#151311",
          100: "rgba(245, 237, 224, 0.12)",
          200: "#D8CBB4",
          800: "#FAF6F0",
          900: "#FAF6F0",
          950: "#FAF6F0",
        },
        indigo: {
          DEFAULT: "#F97316",
          light: "#FB923C",
          dark: "#151311",
        },
        ivory: {
          DEFAULT: "#0C0B0A",
          warm: "#151311",
          pure: "#151311",
        },
        mist: {
          DEFAULT: "rgba(245, 237, 224, 0.12)",
          light: "#151311",
          dark: "rgba(245, 237, 224, 0.12)",
        },
        clay: {
          DEFAULT: "#F97316",
          light: "#FB923C",
          dark: "#EA580C",
        },
        // Status semantics for badges/alerts — separate from the orange brand
        // accent above. `info` reuses the brand accent: this app has one
        // accent color, and "informational" already reads as "on-brand".
        success: "rgb(var(--success-rgb-ch) / <alpha-value>)",
        warning: "rgb(var(--warning-rgb-ch) / <alpha-value>)",
        danger: "rgb(var(--danger-rgb-ch) / <alpha-value>)",
        info: orange,
      },
      fontFamily: {
        serif: ["var(--font-cormorant)", "Cormorant Garamond", "Georgia", "serif"],
        sans: ["var(--font-inter)", "Inter", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        heading: ["var(--font-montserrat)", "Montserrat", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 3px 0 rgba(0, 0, 0, 0.4)",
        "card-hover": "0 8px 24px -4px rgba(0, 0, 0, 0.6)",
        gold: "0 0 20px 0 rgba(249, 115, 22, 0.25)",
        orange: "0 0 20px 0 rgba(249, 115, 22, 0.25)",
        "neon-subtle": "0 0 16px -2px rgba(249, 115, 22, 0.28)",
      },
      keyframes: {
        "float-gentle": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-5px)" },
        },
      },
      animation: {
        "float-gentle": "float-gentle 4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
