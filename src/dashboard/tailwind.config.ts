import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/dashboard/**/*.{js,ts,jsx,tsx}",
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Luxe Theme Variables
        background: "var(--background)",
        surface: "var(--surface)",
        "surface-bright": "var(--surface-bright)",
        "surface-dim": "var(--surface-dim)",
        "surface-container": "var(--surface-container)",
        
        primary: {
          DEFAULT: "var(--primary)",
          dim: "var(--primary-dim)",
          container: "var(--primary-container)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          container: "var(--secondary-container)",
        },
        tertiary: {
          DEFAULT: "var(--tertiary)",
          container: "var(--tertiary-container)",
        },
        error: {
          DEFAULT: "#ff7351",
          dim: "#d53d18",
          container: "#b92902",
        },
        
        "on-surface": "var(--on-surface)",
        "on-surface-variant": "var(--on-surface-variant)",
        outline: {
          DEFAULT: "#6a7686",
          variant: "var(--outline-variant)",
        },
      },
      fontFamily: {
        headline: ["Inter", "sans-serif"],
        body: ["Inter", "sans-serif"],
      },
      fontSize: {
        "ultra-kpi": ["5.5rem", { lineHeight: "1", letterSpacing: "-0.05em", fontWeight: "900" }],
      },
      borderRadius: {
        "3xl": "1.5rem",
        "4xl": "2rem",
        full: "9999px",
      },
      boxShadow: {
        "luxe": "0 10px 40px -10px rgba(0,0,0,0.5)",
        "glass": "0 8px 32px 0 rgba(0,0,0,0.37)",
      },
      animation: {
        "luxe": "luxeFade 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
        "float": "float 3s ease-in-out infinite",
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
