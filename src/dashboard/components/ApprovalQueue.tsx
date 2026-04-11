"use client";

import { useState } from "react";

interface ApprovalItem {
  id: string;
  agentName: string;
  action: string;
  detail: string;
  amount?: string;
  priority: "high" | "medium" | "low";
  timestamp: string;
}

const MOCK_ITEMS: ApprovalItem[] = [
  {
    id: "1",
    agentName: "Price Sync Agent",
    action: "Ajuste de precio",
    detail: 'SKU-PINZAS-01 → $489 MXN en ML y Amazon (margen: +22%)',
    amount: "$489 MXN",
    priority: "high",
    timestamp: "Hace 2 min",
  },
  {
    id: "2",
    agentName: "Instagram Content Publisher",
    action: "Publicación pendiente",
    detail: "Feed post: 'Nueva llegada — Pinzas de precisión RC'. Programado 7:00 PM",
    priority: "medium",
    timestamp: "Hace 8 min",
  },
  {
    id: "3",
    agentName: "CFDI Billing Agent",
    action: "Factura por timbrar",
    detail: "Orden #88219 — $4,200 MXN — RFC: XAXX010101000",
    amount: "$4,200 MXN",
    priority: "high",
    timestamp: "Hace 15 min",
  },
];

const PRIORITY_BORDER: Record<string, string> = {
  high:   "border-l-4 border-primary-container",
  medium: "border-l-4 border-secondary",
  low:    "border-l-4 border-outline",
};

const PRIORITY_DOT: Record<string, string> = {
  high:   "bg-primary-container",
  medium: "bg-secondary",
  low:    "bg-outline",
};

export function ApprovalQueue() {
  const [items, setItems] = useState<ApprovalItem[]>(MOCK_ITEMS);

  function handleApprove(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  function handleReject(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  return (
    <section
      className="bg-surface-container-high rounded-xl overflow-hidden"
      aria-label="Cola de aprobación humana"
    >
      {/* Header */}
      <div className="px-6 py-4 glass-panel flex items-center justify-between">
        <h2 className="font-headline font-bold text-base flex items-center gap-2">
          <span className="material-symbols-outlined text-primary-container text-xl" aria-hidden="true">
            verified_user
          </span>
          Cola de Aprobación
        </h2>
        {items.length > 0 && (
          <span className="chip-warning">
            <span className="w-1.5 h-1.5 rounded-full bg-secondary" aria-hidden="true" />
            {items.length} PENDIENTES
          </span>
        )}
        {items.length === 0 && (
          <span className="chip-active">
            <span className="w-1.5 h-1.5 rounded-full bg-primary-container" aria-hidden="true" />
            DESPEJADA
          </span>
        )}
      </div>

      {/* Items list */}
      <div className="p-4 space-y-3">
        {items.length === 0 && (
          <div className="py-12 text-center text-on-surface-variant">
            <span className="material-symbols-outlined text-4xl block mb-3 opacity-40">
              check_circle
            </span>
            <p className="label-sm">Sin elementos pendientes</p>
          </div>
        )}

        {items.map((item) => (
          <div
            key={item.id}
            className={`
              p-5 rounded-xl bg-surface-container
              ${PRIORITY_BORDER[item.priority]}
              hover:bg-surface-bright transition-all duration-200 group
            `}
          >
            {/* Top row */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div
                  className={`w-2 h-2 rounded-full mt-1 ${PRIORITY_DOT[item.priority]}`}
                  aria-hidden="true"
                />
                <div>
                  <p className="text-sm font-bold text-on-surface">{item.agentName}</p>
                  <p className="label-sm text-on-surface-variant mt-0.5">{item.action}</p>
                </div>
              </div>
              {item.amount && (
                <p
                  className={`font-bold font-headline text-base ${
                    item.priority === "high" ? "text-primary-container" : "text-secondary"
                  }`}
                >
                  {item.amount}
                </p>
              )}
            </div>

            {/* Detail */}
            <div className="bg-surface-container-lowest rounded-lg px-3 py-2 mb-4">
              <p className="text-xs text-on-surface-variant italic leading-relaxed">
                {item.detail}
              </p>
            </div>

            {/* Timestamp + actions */}
            <div className="flex items-center justify-between">
              <span className="label-sm text-outline">{item.timestamp}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleReject(item.id)}
                  className="btn-glass px-4 py-2 hover:!text-error hover:!border-error/30"
                  aria-label={`Rechazar: ${item.agentName} — ${item.action}`}
                >
                  Rechazar
                </button>
                <button
                  onClick={() => handleApprove(item.id)}
                  className="btn-volt px-4 py-2"
                  aria-label={`Aprobar: ${item.agentName} — ${item.action}`}
                >
                  Aprobar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
