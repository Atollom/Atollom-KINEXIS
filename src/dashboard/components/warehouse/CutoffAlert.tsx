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
        flex items-center gap-3
        rounded-xl px-5 py-4
        bg-primary-container/10
        border border-primary-container/30
        animate-pulse
      "
      style={{ boxShadow: "0 0 20px rgba(202,253,0,0.12)" }}
    >
      <span
        className="material-symbols-outlined text-primary-container text-2xl flex-shrink-0 filled"
        aria-hidden="true"
      >
        bolt
      </span>
      <div>
        <p className="font-headline font-bold text-primary-container text-base">
          CORTE ML EN {minutesLeft} MINUTOS
        </p>
        <p className="text-xs text-on-surface-variant">Priorizar órdenes ML antes de las 9:00 AM</p>
      </div>
    </div>
  );
}
