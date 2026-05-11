"use client";

import { useState } from "react";
import { useToast } from "@/components/ToastProvider";
import { mockMLOrders } from "@/lib/mockData";

// Fulfillment only cares about orders that need a shipping action
const QUEUE = mockMLOrders.filter(o =>
  ["paid", "confirmed"].includes(o.status) || o.shipping_status === "ready_to_ship"
);

const SHIP_LABELS: Record<string, string> = {
  pending: "Sin Guía", handling: "Preparando", ready_to_ship: "Listo",
  shipped: "En Tránsito", delivered: "Entregado",
};

type Stage = "queue" | "scan" | "done";

export default function MLFulfillmentPage() {
  const { showToast } = useToast();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [stage, setStage] = useState<Stage>("queue");
  const [processing, setProcessing] = useState(false);

  const readyOrders  = mockMLOrders.filter(o => o.shipping_status === "ready_to_ship");
  const shippedToday = mockMLOrders.filter(o => o.shipping_status === "shipped").length;
  const delivered    = mockMLOrders.filter(o => o.shipping_status === "delivered").length;
  const noGuide      = mockMLOrders.filter(o => ["paid","confirmed"].includes(o.status) && !o.tracking_number).length;

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected(selected.size === QUEUE.length ? new Set() : new Set(QUEUE.map(o => o.id)));
  }

  async function handleBulkGuides() {
    if (selected.size === 0) {
      showToast({ type: "warning", title: "Sin selección", message: "Selecciona al menos una orden" });
      return;
    }
    setProcessing(true);
    setStage("scan");
    await new Promise(r => setTimeout(r, 1800));
    setStage("done");
    setProcessing(false);
    showToast({
      type: "success",
      title: `${selected.size} guías generadas`,
      message: `Skydropx · Agente #1 procesó ${selected.size} envíos`,
    });
  }

  return (
    <div className="space-y-10 animate-in">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="text-[0.75rem] font-bold label-tracking text-[#FFE600] drop-shadow-[0_0_8px_rgba(255,230,0,0.3)]">
              Channel Intelligence / Mercado Libre / Fulfillment
            </span>
            <span className="px-2 py-1 rounded-full bg-primary/10 border border-primary/20 text-[9px] font-black label-tracking text-primary">
              AGENTE #1
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tight-tracking text-on-surface">
            ML Fulfillment
          </h1>
          <p className="text-sm text-on-surface-variant">
            Generación automática de guías · Integración Skydropx
          </p>
        </div>

        <div className="flex gap-3 self-start md:self-auto">
          <button
            onClick={handleBulkGuides}
            disabled={selected.size === 0 || processing}
            className="px-8 py-4 rounded-2xl bg-primary text-black text-[10px] font-black label-tracking hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined !text-[16px]">
              {processing ? "hourglass_empty" : "local_shipping"}
            </span>
            {processing ? "PROCESANDO..." : `GENERAR GUÍAS${selected.size > 0 ? ` (${selected.size})` : ""}`}
          </button>
          <button
            onClick={() => showToast({ type: "info", title: "Imprimiendo etiquetas", message: `${selected.size || QUEUE.length} etiquetas → impresora Zebra` })}
            className="px-6 py-4 glass-card border-white/5 rounded-2xl text-[10px] font-black label-tracking text-on-surface-variant hover:border-primary/20 transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined !text-[16px]">print</span>
            IMPRIMIR
          </button>
        </div>
      </header>

      {/* Stage indicator */}
      {stage !== "queue" && (
        <div className={`glass-card rounded-2xl border p-6 flex items-center gap-4 ${
          stage === "done" ? "border-[#CCFF00]/30 bg-[#CCFF00]/5" : "border-blue-400/30 bg-blue-400/5"
        }`}>
          <span className={`material-symbols-outlined !text-[28px] ${stage === "done" ? "text-primary" : "text-blue-400 animate-spin"}`}>
            {stage === "done" ? "check_circle" : "progress_activity"}
          </span>
          <div>
            <p className={`text-sm font-black ${stage === "done" ? "text-primary" : "text-blue-400"}`}>
              {stage === "done" ? `${selected.size} guías generadas exitosamente` : "Agente #1 procesando envíos..."}
            </p>
            <p className="text-[10px] text-on-surface/40 mt-0.5">
              {stage === "done" ? "Guías disponibles en Skydropx · Órdenes actualizadas en ML" : "Conectando con Skydropx API · Validando paquetes"}
            </p>
          </div>
        </div>
      )}

      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Listos p/Enviar", value: readyOrders.length, icon: "inventory",      color: "text-[#CCFF00]"  },
          { label: "Despachados Hoy", value: shippedToday,       icon: "local_shipping", color: "text-amber-400"  },
          { label: "Entregados",      value: delivered,           icon: "check_circle",   color: "text-on-surface" },
          { label: "Sin Guía",        value: noGuide,             icon: "warning",         color: "text-red-400"    },
        ].map(kpi => (
          <div key={kpi.label} className="glass-card rounded-[1.5rem] border border-white/5 p-6">
            <div className="flex items-center gap-3 mb-2">
              <span className={`material-symbols-outlined !text-[18px] ${kpi.color}`}>{kpi.icon}</span>
              <span className="text-[9px] font-black label-tracking text-on-surface/40 uppercase">{kpi.label}</span>
            </div>
            <p className="text-3xl font-black tight-tracking text-on-surface">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Queue table */}
      <div className="glass-card rounded-[2rem] border border-white/5 overflow-hidden">
        {/* Table header with select-all */}
        <div className="flex items-center gap-4 px-8 py-4 border-b border-white/5">
          <button onClick={toggleAll}
            className="w-5 h-5 rounded-md border border-white/20 hover:border-primary/60 flex items-center justify-center transition-colors flex-shrink-0"
          >
            {selected.size === QUEUE.length && QUEUE.length > 0 && (
              <span className="material-symbols-outlined !text-[14px] text-primary">check</span>
            )}
          </button>
          <div className="grid grid-cols-[2fr_2fr_1.5fr_1fr_1fr_auto] gap-4 flex-1">
            {["Orden", "Productos", "Comprador", "Total", "Estado Envío", "Acción"].map((h, i) => (
              <span key={i} className="text-[9px] font-black label-tracking text-on-surface/30 uppercase">{h}</span>
            ))}
          </div>
        </div>

        {QUEUE.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <span className="material-symbols-outlined !text-[40px] text-on-surface/20">inventory</span>
            <p className="text-sm font-bold text-on-surface/30">Sin órdenes pendientes de fulfillment</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {QUEUE.map(order => {
              const isSelected = selected.has(order.id);
              const shLabel = SHIP_LABELS[order.shipping_status] ?? order.shipping_status;
              const firstItem = order.items[0];
              const extra = order.items.length > 1 ? ` +${order.items.length - 1}` : "";
              return (
                <div key={order.id}
                  className={`flex items-center gap-4 px-8 py-5 hover:bg-white/[0.02] transition-colors cursor-pointer ${isSelected ? "bg-primary/5" : ""}`}
                  onClick={() => toggleSelect(order.id)}
                >
                  {/* Checkbox */}
                  <div className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 transition-colors ${
                    isSelected ? "border-primary bg-primary/20" : "border-white/20"
                  }`}>
                    {isSelected && <span className="material-symbols-outlined !text-[14px] text-primary">check</span>}
                  </div>

                  <div className="grid grid-cols-[2fr_2fr_1.5fr_1fr_1fr_auto] gap-4 flex-1 items-center">
                    {/* Order */}
                    <div>
                      <p className="text-[10px] font-black text-primary">ML-{order.order_id}</p>
                      <p className="text-[9px] text-on-surface/30 mt-0.5">
                        {new Date(order.date_created).toLocaleDateString("es-MX", { day:"2-digit", month:"short" })}
                      </p>
                    </div>

                    {/* Product */}
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-on-surface truncate">{firstItem.title}{extra}</p>
                      <p className="text-[9px] text-on-surface/30">{firstItem.sku} · qty {firstItem.quantity}</p>
                    </div>

                    {/* Buyer */}
                    <span className="text-xs text-on-surface-variant truncate">{order.buyer_nickname}</span>

                    {/* Total */}
                    <span className="text-xs font-black text-on-surface">${order.total_amount.toLocaleString()}</span>

                    {/* Shipping status */}
                    <span className={`text-[9px] font-black label-tracking ${
                      order.shipping_status === "ready_to_ship" ? "text-[#CCFF00]" :
                      order.shipping_status === "handling" ? "text-amber-400" : "text-red-400"
                    }`}>
                      {shLabel.toUpperCase()}
                    </span>

                    {/* Action */}
                    <button
                      onClick={e => { e.stopPropagation(); handleBulkGuides(); }}
                      className="px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-primary text-[9px] font-black label-tracking hover:bg-primary/20 transition-colors flex items-center gap-1 whitespace-nowrap"
                    >
                      <span className="material-symbols-outlined !text-[11px]">local_shipping</span>
                      GUÍA
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="h-10" />
    </div>
  );
}
