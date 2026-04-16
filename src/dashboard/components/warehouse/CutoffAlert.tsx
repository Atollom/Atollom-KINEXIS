"use client";

import { useEffect, useState } from "react";

function getMxTime(): Date {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: "America/Mexico_City" })
  );
}

export function CutoffAlert() {
  const [minutesLeft, setMinutesLeft] = useState<number | null>(null);

  useEffect(() => {
    function compute() {
      const now = getMxTime();
      const cutoff = new Date(now);
      cutoff.setHours(9, 0, 0, 0);
      const diff = Math.floor((cutoff.getTime() - now.getTime()) / 60_000);
      setMinutesLeft(diff > 0 && diff < 120 ? diff : null);
    }
    compute();
    const id = setInterval(compute, 30_000);
    return () => clearInterval(id);
  }, []);

  if (minutesLeft === null) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="
        glass-card
        rounded-[1.5rem] px-8 py-5
        border border-[#ccff00]/30
        animate-pulse shadow-volt
        flex items-center gap-6
        relative overflow-hidden
      "
    >
      <div className="absolute inset-0 bg-gradient-to-r from-[#ccff00]/5 to-transparent pointer-events-none" />
      
      <div className="w-12 h-12 rounded-full bg-[#ccff00]/10 flex items-center justify-center relative z-10">
         <span className="material-symbols-outlined text-[#ccff00] text-3xl">bolt</span>
      </div>

      <div className="relative z-10">
        <h4 className="text-[12px] font-black text-[#ccff00] uppercase tracking-[0.3em] leading-none">
          ML Critical Cutoff: <span className="text-white italic">{minutesLeft}m REMAINING</span>
        </h4>
        <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mt-2">
          Prioritize Mercado Libre operational queue immediately
        </p>
      </div>
    </div>
  );
}
