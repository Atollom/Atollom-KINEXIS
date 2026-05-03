"use client";

import { useState } from "react";
import { useToast } from "@/components/ToastProvider";

const ORDERS = [
  {
    id: "ML-2026-0841",
    product: "Taladro Percutor 850W",
    sku: "TAL-003",
    buyer: "Constructora ABC",
    total: 1_540,
    qty: 1,
    status: "en_camino" as const,
    date: "02 May 2026",
    trackingCode: "SK-9182736",
  },
  {
    id: "ML-2026-0840",
    product: "Set Brocas Multi-Propósito 29 pzs",
    sku: "KAP-007",
    buyer: "Ferretería Puebla Centro",
    total: 840,
    qty: 2,
    status: "entregado" as const,
    date: "01 May 2026",
    trackingCode: "SK-9182701",
  },
  {
    id: "ML-2026-0839",
    product: "Taladro Inalámbrico 20V",
    sku: "TAL-001",
    buyer: "Eduardo Martínez",
    total: 2_890,
    qty: 1,
    status: "pagado" as const,
    date: "01 May 2026",
    trackingCode: null,
  },
  {
    id: "ML-2026-0838",
    product: "Llave de Impacto Neumática",
    sku: "KAP-011",
    buyer: "Taller El Maestro",
    total: 2_360,
    qty: 2,
    status: "entregado" as const,
    date: "30 Abr 2026",
    trackingCode: "SK-9182644",
  },
  {
    id: "ML-2026-0837",
    product: "Arnés de Seguridad Industrial",
    sku: "ARN-002",
    buyer: "Construye MX SA de CV",
    total: 3_400,
    qty: 5,
    status: "en_camino" as const,
    date: "30 Abr 2026",
    trackingCode: "SK-9182598",
  },
  {
    id: "ML-2026-0836",
    product: "Broca Diamantada 100mm",
    sku: "BRO-015",
    buyer: "Ricardo Salinas",
    total: 340,
    qty: 1,
    status: "cancelado" as const,
    date: "29 Abr 2026",
    trackingCode: null,
  },
  {
    id: "ML-2026-0835",
    product: "Taladro Percutor 850W",
    sku: "TAL-003",
    buyer: "Obra Civil Tlaxcala",
    total: 4_620,
    qty: 3,
    status: "entregado" as const,
    date: "28 Abr 2026",
    trackingCode: "SK-9182511",
  },
];

const STATUS_CFG = {
  pagado:    { label: "Pagado",     color: "text-blue-400",    bg: "bg-blue-400/10",   icon: "payments" },
  en_camino: { label: "En Camino", color: "text-amber-400",   bg: "bg-amber-400/10",  icon: "local_shipping" },
  entregado: { label: "Entregado", color: "text-[#CCFF00]",   bg: "bg-[#CCFF00]/10",  icon: "check_circle" },
  cancelado: { label: "Cancelado", color: "text-red-400",     bg: "bg-red-400/10",    icon: "cancel" },
};

type FilterKey = "all" | "pagado" | "en_camino" | "entregado" | "cancelado";

export default function MLOrdersPage() {
  const { showToast } = useToast();
  const [filter, setFilter] = useState<FilterKey>("all");

  const filtered = filter === "all" ? ORDERS : ORDERS.filter(o => o.status === filter);

  const counts: Record<FilterKey, number> = {
    all: ORDERS.length,
    pagado: ORDERS.filter(o => o.status === "pagado").length,
    en_camino: ORDERS.filter(o => o.status === "en_camino").length,
    entregado: ORDERS.filter(o => o.status === "entregado").length,
    cancelado: ORDERS.filter(o => o.status === "cancelado").length,
  };

  const totalRevenue = filtered
    .filter(o => o.status !== "cancelado")
    .reduce((sum, o) => sum + o.total, 0);

  function handleGenerateGuide(order: typeof ORDERS[0]) {
    showToast({
      type: "success",
      title: "Guía Generada",
      message: `Skydropx: ${order.id} — ${order.buyer}`,
    });
  }

  return (
    <div className="space-y-10 animate-in">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <span className="text-[0.75rem] font-bold label-tracking text-[#FFE600] drop-shadow-[0_0_8px_rgba(255,230,0,0.3)]">
            Channel Intelligence / Mercado Libre / Órdenes
          </span>
          <h1 className="text-4xl md:text-5xl font-black tight-tracking text-on-surface">
            Órdenes ML
          </h1>
          <p className="text-sm text-on-surface-variant">
            {filtered.length} órdenes · <span className="text-primary font-bold">${totalRevenue.toLocaleString()} MXN</span>
          </p>
        </div>

        <button
          onClick={() => showToast({ type: "info", title: "Sincronizando Órdenes", message: "Obteniendo órdenes recientes desde ML API..." })}
          className="px-8 py-4 glass-card border-white/5 rounded-2xl text-[10px] font-black label-tracking text-on-surface-variant hover:text-on-surface hover:border-primary/20 transition-all flex items-center gap-2 self-start md:self-auto"
        >
          <span className="material-symbols-outlined !text-[16px]">sync</span>
          SYNC ÓRDENES
        </button>
      </header>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {(["pagado", "en_camino", "entregado", "cancelado"] as const).map(s => {
          const cfg = STATUS_CFG[s];
          return (
            <div key={s} className="glass-card p-6 rounded-[1.5rem] border border-white/5">
              <div className="flex items-center gap-3 mb-2">
                <span className={`material-symbols-outlined !text-[18px] ${cfg.color}`}>{cfg.icon}</span>
                <span className="text-[9px] font-black label-tracking text-on-surface/40 uppercase">{cfg.label}</span>
              </div>
              <p className="text-3xl font-black tight-tracking text-on-surface">{counts[s]}</p>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {(["all", "pagado", "en_camino", "entregado", "cancelado"] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-[10px] font-black label-tracking transition-all ${
              filter === f
                ? "bg-primary text-black"
                : "glass-card border border-white/5 text-on-surface-variant hover:border-primary/20"
            }`}
          >
            {f === "all" ? "TODAS" : STATUS_CFG[f].label.toUpperCase()} ({counts[f]})
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="glass-card rounded-[2rem] border border-white/5 overflow-hidden">
        {/* Header row */}
        <div className="grid grid-cols-[1.5fr_2fr_1.5fr_1fr_1fr_1fr_auto] gap-4 px-8 py-4 border-b border-white/5">
          {["Orden", "Producto", "Comprador", "Total", "Estado", "Fecha", ""].map((h, i) => (
            <span key={i} className="text-[9px] font-black label-tracking text-on-surface/30 uppercase">{h}</span>
          ))}
        </div>

        <div className="divide-y divide-white/5">
          {filtered.map(order => {
            const cfg = STATUS_CFG[order.status];
            return (
              <div
                key={order.id}
                className="grid grid-cols-[1.5fr_2fr_1.5fr_1fr_1fr_1fr_auto] gap-4 items-center px-8 py-5 hover:bg-white/[0.02] transition-colors group"
              >
                {/* Order ID */}
                <div>
                  <p className="text-[10px] font-black text-primary">{order.id}</p>
                  {order.trackingCode && (
                    <p className="text-[9px] text-on-surface/30 font-medium">{order.trackingCode}</p>
                  )}
                </div>

                {/* Product */}
                <div className="min-w-0">
                  <p className="text-xs font-bold text-on-surface truncate">{order.product}</p>
                  <p className="text-[9px] text-on-surface/30 font-medium">{order.sku} · x{order.qty}</p>
                </div>

                {/* Buyer */}
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-6 h-6 rounded-full bg-white/10 border border-white/10 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined !text-[12px] text-on-surface/40">person</span>
                  </div>
                  <span className="text-xs text-on-surface-variant truncate">{order.buyer}</span>
                </div>

                {/* Total */}
                <span className="text-xs font-black text-on-surface">${order.total.toLocaleString()}</span>

                {/* Status badge */}
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-black label-tracking ${cfg.color} ${cfg.bg} w-fit`}>
                  <span className="material-symbols-outlined !text-[10px]">{cfg.icon}</span>
                  {cfg.label.toUpperCase()}
                </span>

                {/* Date */}
                <span className="text-[10px] text-on-surface/40 font-medium">{order.date}</span>

                {/* Actions */}
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {order.status === "pagado" && (
                    <button
                      onClick={() => handleGenerateGuide(order)}
                      className="px-3 py-1.5 rounded-lg bg-primary text-black text-[9px] font-black label-tracking hover:scale-105 transition-all flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined !text-[11px]">local_shipping</span>
                      GUÍA
                    </button>
                  )}
                  <button
                    onClick={() => showToast({ type: "info", title: "Orden " + order.id, message: `Comprador: ${order.buyer} · $${order.total.toLocaleString()} MXN` })}
                    className="w-7 h-7 rounded-lg border border-white/10 hover:border-primary/40 flex items-center justify-center transition-colors"
                    title="Ver detalle"
                  >
                    <span className="material-symbols-outlined !text-[14px] text-on-surface/40">open_in_new</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="h-10" />
    </div>
  );
}
