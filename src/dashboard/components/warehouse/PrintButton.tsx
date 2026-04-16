"use client";

import { useState } from "react";

type PrintState = "idle" | "printing" | "done" | "error";

interface PrintButtonProps {
  orderId: string;
  externalId: string;
  onPrinted?: () => void;
}

export function PrintButton({ orderId, externalId, onPrinted }: PrintButtonProps) {
  const [state, setState] = useState<PrintState>("idle");

  async function handlePrint() {
    if (state === "printing" || state === "done") return;
    setState("printing");
    try {
      const res = await fetch("/api/warehouse/print", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: orderId }),
      });
      if (!res.ok) throw new Error("Print failed");
      setState("done");
      onPrinted?.();
    } catch {
      setState("error");
      setTimeout(() => setState("idle"), 3000);
    }
  }

  const configs: Record<PrintState, { label: string; icon: string; cls: string }> = {
    idle:     { label: "GENERATE PRINT",  icon: "print",           cls: "bg-white text-black hover:bg-[#ccff00] hover:shadow-volt" },
    printing: { label: "TRANSMITTING...", icon: "hourglass_empty", cls: "bg-white/5 text-white/20 cursor-not-allowed border border-white/5" },
    done:     { label: "LABEL SECURED",   icon: "check_circle",    cls: "bg-[#ccff00]/10 text-[#ccff00] border border-[#ccff00]/30 cursor-default" },
    error:    { label: "LINK ERROR",      icon: "error",           cls: "bg-red-500/10 text-red-500 border border-red-500/30" },
  };

  const { label, icon, cls } = configs[state];

  return (
    <button
      onClick={handlePrint}
      disabled={state === "printing" || state === "done"}
      className={`
         h-14 px-8 rounded-2xl flex items-center justify-center gap-4
         text-[11px] font-black uppercase tracking-[0.3em] transition-all duration-300
         ${cls}
         shadow-xl active:scale-95
      `}
    >
      <span className="material-symbols-outlined text-xl" aria-hidden="true">{icon}</span>
      {label}
    </button>
  );
}
