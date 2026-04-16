"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/5" />;
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="
        relative w-10 h-10 rounded-xl 
        flex items-center justify-center
        bg-white/[0.03] border border-white/5
        transition-all duration-500 active:scale-90
        group overflow-hidden
      "
      aria-label="Toggle Interface Mode"
    >
      {/* Dynamic Background */}
      <div className={`absolute inset-0 transition-opacity duration-700 ${isDark ? 'bg-[#ccff00]/5 opacity-100' : 'bg-black/5 opacity-100'}`} />
      
      {/* Icons */}
      <div className="relative z-10">
        <span 
          className={`material-symbols-outlined text-lg transition-all duration-700 shadow-volt-text ${isDark ? "rotate-0 text-[#ccff00]" : "rotate-90 opacity-0 absolute"}`}
        >
          near_me
        </span>
        <span 
          className={`material-symbols-outlined text-lg transition-all duration-700 ${!isDark ? "rotate-0 text-black" : "-rotate-90 opacity-0 absolute"}`}
        >
          lightbulb
        </span>
      </div>

      {/* Hover Pulse */}
      <div className={`absolute inset-0 rounded-xl bg-white/0 group-hover:bg-white/5 transition-all duration-500`} />
      <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-t-full transition-all duration-500 ${isDark ? 'bg-[#ccff00] shadow-volt' : 'bg-black/20'}`} />
    </button>
  );
}
