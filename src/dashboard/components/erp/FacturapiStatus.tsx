"use client";

import { useState } from "react";

interface FacturapiStatusProps {
  latencyMs?: number;
  version?: string;
  isConnected?: boolean;
}

export function FacturapiStatus({
  latencyMs = 42,
  version = "2.4.0",
  isConnected = true,
}: FacturapiStatusProps) {
  const [reauthing, setReauthing] = useState(false);

  async function handleReAuth() {
    setReauthing(true);
    // In production: POST /api/cfdi/reauth
    await new Promise((r) => setTimeout(r, 1500));
    setReauthing(false);
  }

  return (
    <div className="bg-surface-container-high rounded-xl p-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          {/* Status dot */}
          <div
            className={`
              relative w-3 h-3 rounded-full flex-shrink-0
              ${isConnected ? "bg-success" : "bg-error"}
            `}
            aria-hidden="true"
          >
            {isConnected && (
              <div className="absolute inset-0 rounded-full bg-success animate-ping opacity-50" />
            )}
          </div>

          {/* Info */}
          <div>
            <p className="font-headline font-bold text-sm text-on-surface">
              Facturapi Connection
            </p>
            <p className="text-[10px] text-on-surface-variant mt-0.5">
              v{version} {isConnected ? "Active" : "Disconnected"} · Latency:{" "}
              <span className="text-primary-container font-mono">{latencyMs}ms</span>
            </p>
          </div>
        </div>

        {/* Re-auth button */}
        <button
          onClick={handleReAuth}
          disabled={reauthing}
          className="btn-glass flex items-center gap-2 px-4 py-2"
          aria-label="Reautenticar con Facturapi"
        >
          <span
            className={`material-symbols-outlined text-sm ${reauthing ? "animate-spin" : ""}`}
            aria-hidden="true"
          >
            {reauthing ? "sync" : "key"}
          </span>
          {reauthing ? "RECONECTANDO…" : "RE-AUTHENTICATE SYSTEM"}
        </button>
      </div>
    </div>
  );
}
