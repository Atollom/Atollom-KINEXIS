"use client";

import { useState } from "react";
import type { Platform } from "@/types";
import { PlatformBadge } from "@/components/ecommerce/PlatformBadge";
import { PrintButton } from "./PrintButton";

export type TaskStatus = "pending" | "printed" | "confirmed";

export interface WarehouseTask {
  order_id: string;
  external_id: string;
  platform: Platform;
  priority: number;
  customer_name: string;
  address?: string;
  products: Array<{ name: string; qty: number }>;
  created_at: string;
  status: TaskStatus;
}

interface TaskCardProps {
  task: WarehouseTask;
  onConfirm: (id: string) => void;
}

const STATUS_BORDER: Record<TaskStatus, string> = {
  pending:   "border-l-4 border-primary-container",
  printed:   "border-l-4 border-secondary",
  confirmed: "border-l-4 border-success opacity-60",
};

const PRIORITY_BG: Record<number, string> = {
  1: "bg-primary-container text-[#3a4a00]",
  2: "bg-[#ff9900] text-[#1a0800]",
  3: "bg-[#96bf48] text-[#0d1f00]",
};

export function TaskCard({ task, onConfirm }: TaskCardProps) {
  const [status, setStatus] = useState<TaskStatus>(task.status);

  function handlePrinted() {
    setStatus("printed");
  }

  function handleConfirm() {
    setStatus("confirmed");
    onConfirm(task.order_id);
  }

  return (
    <article
      className={`
        rounded-xl bg-surface-container-high p-5
        ${STATUS_BORDER[status]}
        transition-all duration-200
      `}
      aria-label={`Orden ${task.external_id} — ${status}`}
    >
      {/* Top row: priority + platform + order ID */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span
            className={`
              w-7 h-7 rounded-full flex items-center justify-center
              text-xs font-black font-headline flex-shrink-0
              ${PRIORITY_BG[task.priority] ?? "bg-outline text-surface"}
            `}
            aria-label={`Prioridad ${task.priority}`}
          >
            {task.priority}
          </span>
          <PlatformBadge platform={task.platform} size="md" />
          <p className="font-mono font-bold text-lg text-on-surface tracking-tight">
            #{task.external_id}
          </p>
        </div>
        {status === "confirmed" && (
          <span className="chip-active">
            <span className="material-symbols-outlined text-xs filled" aria-hidden="true">check_circle</span>
            SURTIDO
          </span>
        )}
      </div>

      {/* Products */}
      <div className="bg-surface-container-lowest rounded-lg px-4 py-3 mb-4 space-y-1">
        {task.products.map((p, i) => (
          <div key={i} className="flex items-center justify-between">
            <p className="text-sm font-medium text-on-surface">{p.name}</p>
            <span className="label-sm text-on-surface-variant ml-2">×{p.qty}</span>
          </div>
        ))}
      </div>

      {/* Address (Shopify only) */}
      {task.address && task.platform === "shopify" && (
        <div className="flex items-start gap-2 mb-4">
          <span className="material-symbols-outlined text-sm text-on-surface-variant mt-0.5 flex-shrink-0" aria-hidden="true">
            location_on
          </span>
          <p className="text-xs text-on-surface-variant">{task.address}</p>
        </div>
      )}

      {/* Customer */}
      <p className="label-sm text-outline mb-4">{task.customer_name}</p>

      {/* Actions */}
      {status !== "confirmed" && (
        <div className="flex items-center gap-3">
          <PrintButton
            orderId={task.order_id}
            externalId={task.external_id}
            onPrinted={handlePrinted}
          />
          <button
            onClick={handleConfirm}
            disabled={status === "pending"}
            className={`
              flex items-center gap-2 flex-1 justify-center px-4 py-3 rounded-lg
              font-bold label-sm transition-all active:scale-95
              ${status === "printed"
                ? "bg-success/15 text-success border border-success/30 hover:bg-success/25"
                : "btn-glass opacity-50 cursor-not-allowed"
              }
            `}
            aria-label="Confirmar surtido"
            title={status === "pending" ? "Imprime la etiqueta primero" : "Confirmar surtido"}
          >
            <span className="material-symbols-outlined text-base" aria-hidden="true">
              {status === "printed" ? "check_circle" : "lock"}
            </span>
            {status === "printed" ? "CONFIRMAR SURTIDO" : "IMPRIMIR PRIMERO"}
          </button>
        </div>
      )}
    </article>
  );
}
