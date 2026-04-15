"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="w-9 h-9 rounded-xl bg-white/[0.03] border border-white/[0.05]" />;
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="
        relative w-9 h-9 rounded-xl 
        flex items-center justify-center
        bg-white/[0.03] border border-white/[0.05]
        text-on-surface-variant hover:text-primary
        transition-all duration-300 active:scale-95
        group
      "
      aria-label="Cambiar tema"
    >
      <span 
        className={`material-symbols-outlined text-[20px] transition-all duration-500 ${isDark ? "rotate-0 opacity-100" : "rotate-90 opacity-0 absolute"}`}
      >
        dark_mode
      </span>
      <span 
        className={`material-symbols-outlined text-[20px] transition-all duration-500 ${!isDark ? "rotate-0 opacity-100" : "-rotate-90 opacity-0 absolute"}`}
      >
        light_mode
      </span>
      
      {/* Subtle glow on hover */}
      <div className="absolute inset-0 rounded-xl bg-primary/0 group-hover:bg-primary/5 transition-colors duration-300" />
    </button>
  );
}
