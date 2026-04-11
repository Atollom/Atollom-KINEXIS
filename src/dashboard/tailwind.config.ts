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
        // Surface hierarchy
        "surface":                  "#000f21",
        "surface-dim":              "#000f21",
        "surface-container-lowest": "#000000",
        "surface-container-low":    "#001429",
        "surface-container":        "#001a34",
        "surface-container-high":   "#00213e",
        "surface-container-highest":"#002748",
        "surface-variant":          "#002748",
        "surface-bright":           "#002d52",

        // Primary — Electric Lime
        "primary":           "#f3ffca",
        "primary-dim":       "#beee00",
        "primary-container": "#cafd00",
        "primary-fixed":     "#cafd00",
        "primary-fixed-dim": "#beee00",
        "on-primary":        "#516700",
        "on-primary-fixed":  "#3a4a00",
        "on-primary-fixed-variant": "#526900",
        "on-primary-container": "#4a5e00",
        "inverse-primary":   "#516700",

        // Secondary — Warning Yellow
        "secondary":          "#ece856",
        "secondary-dim":      "#ddda49",
        "secondary-fixed":    "#ece856",
        "secondary-fixed-dim":"#ddda49",
        "secondary-container":"#636100",
        "on-secondary":       "#565400",
        "on-secondary-fixed": "#434100",
        "on-secondary-fixed-variant": "#605e00",
        "on-secondary-container": "#fffca4",

        // Tertiary — Warm Yellow
        "tertiary":           "#ffeea5",
        "tertiary-dim":       "#edd13a",
        "tertiary-fixed":     "#fce047",
        "tertiary-fixed-dim": "#edd13a",
        "tertiary-container": "#fce047",
        "on-tertiary":        "#665800",
        "on-tertiary-fixed":  "#483d00",
        "on-tertiary-fixed-variant": "#685900",
        "on-tertiary-container": "#5d5000",

        // Text
        "on-surface":         "#d7e7ff",
        "on-surface-variant": "#96adcc",
        "on-background":      "#d7e7ff",
        "inverse-on-surface": "#405772",

        // Borders
        "outline":            "#617794",
        "outline-variant":    "#334964",

        // Status
        "error":           "#ff7351",
        "error-dim":       "#d53d18",
        "error-container": "#b92902",
        "on-error":        "#450900",
        "on-error-container": "#ffd2c8",

        // Background
        "background": "#000f21",
        "surface-tint": "#f3ffca",
        "inverse-surface": "#f8f9ff",
      },
      fontFamily: {
        headline: ["Space Grotesk", "sans-serif"],
        body:     ["Inter", "sans-serif"],
        label:    ["Inter", "sans-serif"],
        mono:     ["'Courier New'", "monospace"],
      },
      borderRadius: {
        DEFAULT: "0.125rem",
        sm:      "0.25rem",
        lg:      "0.5rem",
        xl:      "0.75rem",
        "2xl":   "1rem",
        full:    "9999px",
      },
      boxShadow: {
        "volt":        "0 0 24px 2px rgba(202,253,0,0.08)",
        "volt-strong": "0 0 15px rgba(202,253,0,0.3)",
        "volt-glow":   "0 0 8px rgba(202,253,0,0.6)",
        "card":        "0 4px 32px 0 rgba(0,0,0,0.5)",
        "header":      "0 0 15px rgba(204,255,0,0.1)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4,0,0.6,1) infinite",
      },
    },
  },
  plugins: [],
};

export default config;
