import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
    "./hooks/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "surface": "#040f1b",
        "error": "#ff7351",
        "inverse-surface": "#f8f9ff",
        "surface-bright": "#1b2d41",
        "primary-container": "#cafd00",
        "primary": "#ccff00", // Using the vibrant neon from branding
        "on-background": "#dde9fb",
        "surface-container-lowest": "#000000",
        "secondary-container": "#636100",
        "surface-tint": "#f3ffca",
        "on-surface": "#dde9fb",
        "tertiary-container": "#fce047",
        "primary-dim": "#beee00",
        "surface-container": "#0b1b2a",
        "background": "#040f1b",
        "tertiary-dim": "#edd13a",
        "surface-container-high": "#102131",
        "outline": "#6a7686",
        "on-surface-variant": "#a0acbd",
        "outline-variant": "#3d4957",
        "surface-container-low": "#061422",
        "secondary": "#ece856",
        "surface-container-highest": "#152739",
      },
      fontFamily: {
        headline: ["Inter", "sans-serif"],
        body: ["Inter", "sans-serif"],
        label: ["Inter", "sans-serif"],
      },
      fontSize: {
        "ultra-kpi": ["5.5rem", { lineHeight: "1", letterSpacing: "-0.05em", fontWeight: "900" }],
      },
      borderRadius: {
        "DEFAULT": "1rem",
        "lg": "2rem",
        "xl": "3rem",
        "full": "9999px",
      },
      boxShadow: {
        "luxe": "0 10px 40px -10px rgba(0,0,0,0.5)",
        "glass": "0 8px 32px 0 rgba(0,0,0,0.37)",
        "glow": "0 0 20px rgba(204, 255, 0, 0.3)",
        "ambient": "0 20px 50px rgba(0, 0, 0, 0.5)",
      },
      animation: {
        "luxe": "luxeFade 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
        "float": "float 3s ease-in-out infinite",
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        luxeFade: {
          "0%": { opacity: "0", transform: "translateY(15px) scale(0.98)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        }
      },
    },
  },
  plugins: [],
};

export default config;

