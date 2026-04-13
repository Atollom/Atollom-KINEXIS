import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── Core surface hierarchy ──────────────────────────
        "surface":                   "#0D1B3E",
        "surface-dim":               "#081326",
        "surface-container-lowest":  "#060E1E",
        "surface-container-low":     "#0A1628",
        "surface-container":         "#0E1D40",
        "surface-container-high":    "#132650",
        "surface-container-highest": "#182F5E",
        "surface-variant":           "#182F5E",
        "surface-bright":            "#1E3A6E",

        // ── Primary — Lime Green ────────────────────────────
        "primary":            "#D4FF6B",
        "primary-dim":        "#A8E63D",
        "primary-container":  "#A8E63D",
        "primary-fixed":      "#A8E63D",
        "primary-fixed-dim":  "#8BC730",
        "on-primary":         "#2A4A00",
        "on-primary-fixed":   "#1E3600",
        "on-primary-fixed-variant": "#2A4A00",
        "on-primary-container": "#2A4A00",
        "inverse-primary":    "#3A6100",

        // ── Secondary — Warning Amber ───────────────────────
        "secondary":           "#F59E0B",
        "secondary-dim":       "#D97706",
        "secondary-fixed":     "#F59E0B",
        "secondary-fixed-dim": "#D97706",
        "secondary-container": "#92400E",
        "on-secondary":        "#451A03",
        "on-secondary-fixed":  "#451A03",
        "on-secondary-fixed-variant": "#78350F",
        "on-secondary-container": "#FEF3C7",

        // ── Tertiary — Blue (Ecommerce) ─────────────────────
        "tertiary":            "#60A5FA",
        "tertiary-dim":        "#3B82F6",
        "tertiary-fixed":      "#3B82F6",
        "tertiary-fixed-dim":  "#2563EB",
        "tertiary-container":  "#1E40AF",
        "on-tertiary":         "#DBEAFE",
        "on-tertiary-fixed":   "#EFF6FF",
        "on-tertiary-fixed-variant": "#DBEAFE",
        "on-tertiary-container": "#BFDBFE",

        // ── Text ────────────────────────────────────────────
        "on-surface":          "#d7e7ff",
        "on-surface-variant":  "#8DA4C4",
        "on-background":       "#d7e7ff",
        "inverse-on-surface":  "#0D1B3E",

        // ── Borders ─────────────────────────────────────────
        "outline":             "#506584",
        "outline-variant":     "#2A3E5C",

        // ── Status ──────────────────────────────────────────
        "error":            "#EF4444",
        "error-dim":        "#DC2626",
        "error-container":  "#991B1B",
        "on-error":         "#FEE2E2",
        "on-error-container": "#FCA5A5",

        // ── Background ──────────────────────────────────────
        "background":      "#0D1B3E",
        "surface-tint":    "#A8E63D",
        "inverse-surface": "#F8FAFC",
      },
      fontFamily: {
        headline: ["Space Grotesk", "sans-serif"],
        body:     ["Inter", "sans-serif"],
        label:    ["Inter", "sans-serif"],
        mono:     ["'JetBrains Mono'", "'Courier New'", "monospace"],
      },
      borderRadius: {
        DEFAULT: "0.375rem",
        sm:      "0.25rem",
        lg:      "0.75rem",
        xl:      "1rem",
        "2xl":   "1.25rem",
        "3xl":   "1.5rem",
        full:    "9999px",
      },
      boxShadow: {
        "volt":        "0 0 24px 2px rgba(168,230,61,0.08)",
        "volt-strong": "0 0 15px rgba(168,230,61,0.25)",
        "volt-glow":   "0 0 8px rgba(168,230,61,0.5)",
        "card":        "0 4px 32px 0 rgba(0,0,0,0.4)",
        "header":      "0 1px 12px rgba(168,230,61,0.06)",
        "blue-glow":   "0 0 12px rgba(59,130,246,0.3)",
        "green-glow":  "0 0 12px rgba(34,197,94,0.3)",
        "amber-glow":  "0 0 12px rgba(245,158,11,0.3)",
      },
      animation: {
        "pulse-slow":   "pulse 3s cubic-bezier(0.4,0,0.6,1) infinite",
        "fade-in":      "fadeIn 0.3s ease-out",
        "slide-up":     "slideUp 0.3s ease-out",
        "slide-right":  "slideRight 0.3s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%":   { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideRight: {
          "0%":   { opacity: "0", transform: "translateX(-8px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
