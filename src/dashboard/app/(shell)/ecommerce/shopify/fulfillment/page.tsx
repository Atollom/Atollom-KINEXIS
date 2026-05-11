"use client";

import { useState } from "react";
import { useToast } from "@/components/ToastProvider";
import { mockShopifyFulfillments, mockFulfillmentStats } from "@/lib/mockData";
import type { ShopifyFulfillment } from "@/lib/mockData";

type FilterKey = "all" | "pending" | "processing" | "fulfilled" | "cancelled";

const STATUS_CFG: Record<ShopifyFulfillment["status"], { label: string; color: string; bg: string; icon: string }> = {
  pending:    { label: "Pendiente",   color: "text-amber-400",     bg: "bg-amber-400/10",  icon: "pending"          },
  processing: { label: "Procesando",  color: "text-blue-400",      bg: "bg-blue-400/10",   icon: "sync"             },
  fulfilled:  { label: "Enviado",     color: "text-[#CCFF00]",     bg: "bg-[#CCFF00]/10",  icon: "local_shipping"   },
  cancelled:  { label: "Cancelado",   color: "text-on-surface/40", bg: "bg-white/5",       icon: "cancel"           },
};

const CARRIER_ICON: Record<string, string> = {
  FedEx: "🟣", DHL: "🟡", Estafeta: "🔵",
};

function fmtDate(iso: string) {
  const d = new Date(iso);
  return `${d.getDate()}/${d.getMonth() + 1} ${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default function ShopifyFulfillmentPage() {
  const { showToast } = useToast();
  const [filter, setFilter] = useState<FilterKey>("all");

  const items = filter === "all"
    ? mockShopifyFulfillments
    : mockShopifyFulfillments.filter(f => f.status === filter);

  const counts: Record<FilterKey, number> = {
    all:        mockShopifyFulfillments.length,
    pending:    mockFulfillmentStats.pending,
    processing: mockFulfillmentStats.processing,
    fulfilled:  mockFulfillmentStats.fulfilled,
    cancelled:  mockFulfillmentStats.cancelled,
  };

  return (
    <div className="space-y-10 animate-in">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="text-[0.75rem] font-bold label-tracking text-[#CCFF00] drop-shadow-[0_0_8px_rgba(204,255,0,0.3)]">
              Channel Intelligence / Shopify / Fulfillment
            </span>
            <span className="px-2 py-1 rounded-full bg-primary/10 border border-primary/20 text-[9px] font-black label-tracking text-primary">
              AGENTE #3
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tight-tracking text-on-surface">
            Shopify Fulfillment
          </h1>
          <p className="text-sm text-on-surface-variant">
            {mockFulfillmentStats.pending_items} artículos pendientes ·{" "}
            <span className="text-amber-400 font-bold">{mockFulfillmentStats.pending} órdenes</span> sin enviar
          </p>
        </div>
        <div className="flex gap-3 self-start md:self-auto">
          <button
            onClick={() => showToast({ type: "success", title: "Agente #3 procesando", message: `${mockFulfillmentStats.pending} órdenes enviadas a fulfillment masivo` })}
            className="px-6 py-3 rounded-2xl bg-primary text-black text-[10px] font-black label-tracking hover:bg-primary/90 transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined !text-[16px]">auto_fix_high</span>
            FULFILLMENT MASIVO
          </button>
        </div>
      </header>

      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: "Total Órdenes",  value: mockFulfillmentStats.total,             icon: "receipt_long",  color: "text-on-surface"  },
          { label: "Pendientes",     value: mockFulfillmentStats.pending,            icon: "pending",       color: "text-amber-400"   },
          { label: "Procesando",     value: mockFulfillmentStats.processing,         icon: "sync",          color: "text-blue-400"    },
          { label: "Enviados",       value: mockFulfillmentStats.fulfilled,          icon: "local_shipping", color: "text-[#CCFF00]"  },
          { label: "Tiempo Prom.",   value: `${mockFulfillmentStats.avg_fulfillment_hours}h`, icon: "schedule", color: "text-purple-400" },
        ].map(kpi => (
          <div key={kpi.label} className="glass-card rounded-[1.5rem] border border-white/5 p-6">
            <div className="flex items-center gap-3 mb-3">
              <span className={`material-symbols-outlined !text-[18px] ${kpi.color}`}>{kpi.icon}</span>
              <span className="text-[9px] font-black label-tracking text-on-surface/40 uppercase">{kpi.label}</span>
            </div>
            <p className="text-2xl font-black tight-tracking text-on-surface">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Alert banner for pending */}
      {mockFulfillmentStats.pending > 0 && (
        <div className="glass-card rounded-2xl border border-amber-400/30 bg-amber-400/5 p-5 flex items-center gap-4">
          <span className="material-symbols-outlined !text-[24px] text-amber-400">schedule</span>
          <div>
            <p className="text-sm font-black text-amber-400">
              {mockFulfillmentStats.pending} órdenes esperando fulfillment
            </p>
            <p className="text-[10px] text-on-surface/40 mt-0.5">
              {mockFulfillmentStats.pending_items} artículos · Agente #3 puede generar etiquetas automáticamente
            </p>
          </div>
          <button
            onClick={() => showToast({ type: "success", title: "Etiquetas generadas", message: `${mockFulfillmentStats.pending} etiquetas enviadas a impresora` })}
            className="ml-auto px-4 py-2 rounded-xl bg-amber-400/10 border border-amber-400/20 text-amber-400 text-[9px] font-black label-tracking hover:bg-amber-400/20 transition-colors whitespace-nowrap flex items-center gap-1"
          >
            <span className="material-symbols-outlined !text-[12px]">print</span>
            GENERAR ETIQUETAS
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {(["all", "pending", "processing", "fulfilled", "cancelled"] as FilterKey[]).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-[10px] font-black label-tracking transition-all ${
              filter === f
                ? "bg-primary text-black"
                : "glass-card border border-white/5 text-on-surface-variant hover:border-[#CCFF00]/20"
            }`}
          >
            {f === "all" ? "TODAS" : f === "pending" ? "PENDIENTES" : f === "processing" ? "PROCESANDO" : f === "fulfilled" ? "ENVIADAS" : "CANCELADAS"}
            {" "}({counts[f]})
          </button>
        ))}
      </div>

      {/* Fulfillment cards */}
      <div className="space-y-4">
        {items.map(f => {
          const sCfg = STATUS_CFG[f.status];
          const totalItems = f.items.reduce((s, i) => s + i.quantity, 0);
          return (
            <div key={f.id} className="glass-card rounded-[2rem] border border-white/5 p-6 hover:bg-white/[0.02] transition-colors group">
              <div className="flex items-start gap-5">
                {/* Order number */}
                <div className="flex-shrink-0 w-14 h-14 glass-card rounded-2xl border border-white/5 flex flex-col items-center justify-center">
                  <span className="text-[8px] font-black text-on-surface/30 label-tracking">#</span>
                  <span className="text-sm font-black text-on-surface">{f.order_number}</span>
                </div>

                <div className="flex-1 min-w-0 space-y-3">
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-black ${sCfg.color} ${sCfg.bg}`}>
                          <span className="material-symbols-outlined !text-[9px]">{sCfg.icon}</span>
                          {sCfg.label.toUpperCase()}
                        </span>
                        <span className="text-[9px] text-on-surface/30">{fmtDate(f.created_at)}</span>
                        {f.fulfilled_at && (
                          <span className="text-[9px] text-[#CCFF00]/60">→ Enviado {fmtDate(f.fulfilled_at)}</span>
                        )}
                      </div>
                      <p className="text-xs font-bold text-on-surface">
                        {f.destination.name}{" "}
                        <span className="font-normal text-on-surface/40">· {f.destination.city}, {f.destination.province}</span>
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-[9px] font-black text-on-surface/30 label-tracking uppercase">{CARRIER_ICON[f.shipping.carrier] || ""} {f.shipping.carrier}</p>
                      <p className="text-[9px] text-on-surface/50">{f.shipping.service}</p>
                      {f.shipping.tracking_number && (
                        <p className="text-[9px] font-mono text-blue-400 mt-0.5">{f.shipping.tracking_number}</p>
                      )}
                    </div>
                  </div>

                  {/* Items */}
                  <div className="flex flex-wrap gap-2">
                    {f.items.map((item, i) => (
                      <span key={i} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/5 border border-white/5 text-[9px] font-bold text-on-surface/70">
                        <span className="text-on-surface/30">{item.quantity}×</span>
                        {item.title.split(" ").slice(0, 3).join(" ")}
                        <span className="font-mono text-on-surface/30 text-[8px]">{item.sku}</span>
                      </span>
                    ))}
                    <span className="inline-flex items-center px-2.5 py-1 rounded-xl bg-white/5 border border-white/5 text-[9px] text-on-surface/30">
                      {totalItems} art.
                    </span>
                  </div>

                  {/* Actions */}
                  {f.status !== "cancelled" && (
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity pt-1">
                      {(f.status === "pending" || f.status === "processing") && (
                        <>
                          <button
                            onClick={() => showToast({ type: "success", title: "Agente #3 procesando", message: `Orden #${f.order_number} → ${f.shipping.carrier} ${f.shipping.service}` })}
                            className="px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/20 text-primary text-[9px] font-black hover:bg-primary/20 transition-colors flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined !text-[11px]">local_shipping</span>
                            CUMPLIR
                          </button>
                          <button
                            onClick={() => showToast({ type: "info", title: "Etiqueta generada", message: `${f.shipping.carrier} · ${f.shipping.service} → lista para imprimir` })}
                            className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-on-surface/60 text-[9px] font-black hover:bg-white/10 transition-colors flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined !text-[11px]">print</span>
                            ETIQUETA
                          </button>
                        </>
                      )}
                      {f.shipping.tracking_number && (
                        <button
                          onClick={() => showToast({ type: "info", title: "Rastreo abierto", message: `${f.shipping.tracking_number}` })}
                          className="px-3 py-1.5 rounded-xl bg-blue-400/10 border border-blue-400/20 text-blue-400 text-[9px] font-black hover:bg-blue-400/20 transition-colors flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined !text-[11px]">location_on</span>
                          RASTREAR
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="h-10" />
    </div>
  );
}
