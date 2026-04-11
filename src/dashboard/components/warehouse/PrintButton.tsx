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
    idle:     { label: "IMPRIMIR",  icon: "print",           cls: "btn-volt" },
    printing: { label: "ENVIANDO…", icon: "hourglass_empty", cls: "btn-glass opacity-70 cursor-not-allowed" },
    done:     { label: "IMPRESO",   icon: "check_circle",    cls: "bg-success/15 text-success border border-success/25 rounded-lg px-4 py-3 label-sm cursor-default" },
    error:    { label: "ERROR",     icon: "error",           cls: "bg-error/15 text-error border border-error/25 rounded-lg px-4 py-3 label-sm" },
  };

  const { label, icon, cls } = configs[state];

  return (
    <button
      onClick={handlePrint}
      disabled={state === "printing" || state === "done"}
      className={`flex items-center gap-2 px-4 py-3 ${cls} transition-all active:scale-95`}
      aria-label={`${label} etiqueta para orden ${externalId}`}
    >
      <span className="material-symbols-outlined text-base" aria-hidden="true">{icon}</span>
      {label}
    </button>
  );
}
