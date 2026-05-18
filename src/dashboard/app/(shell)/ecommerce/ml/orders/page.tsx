"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/components/ToastProvider";
import type { MLOrder } from "@/lib/mockData";

type FilterKey = "all" | "paid" | "shipped" | "delivered" | "cancelled";

const STATUS_CFG: Record<MLOrder["status"], { label: string; color: string; bg: string; icon: string; filterKey: FilterKey }> = {
  confirmed:        { label: "Confirmada",  color: "text-blue-400",    bg: "bg-blue-400/10",    icon: "check",           filterKey: "paid"      },
  payment_required: { label: "Pago Pend.",  color: "text-amber-400",   bg: "bg-amber-400/10",   icon: "pending",         filterKey: "paid"      },
  paid:             { label: "Pagado",      color: "text-blue-400",    bg: "bg-blue-400/10",    icon: "payments",        filterKey: "paid"      },
  shipped:          { label: "En Camino",   color: "text-amber-400",   bg: "bg-amber-400/10",   icon: "local_shipping",  filterKey: "shipped"   },
  delivered:        { label: "Entregado",   color: "text-[#CCFF00]",   bg: "bg-[#CCFF00]/10",   icon: "check_circle",   filterKey: "delivered" },
  cancelled:        { label: "Cancelado",   color: "text-red-400",     bg: "bg-red-400/10",     icon: "cancel",          filterKey: "cancelled" },
};

const SHIP_STATUS_CFG: Record<MLOrder["shipping_status"], { label: string; color: string }> = {
  pending:       { label: "Sin Guía",         color: "text-red-400"    },
  handling:      { label: "Preparando",       color: "text-amber-400"  },
  ready_to_ship: { label: "Listo p/Enviar",  color: "text-[#CCFF00]"  },
  shipped:       { label: "En Tránsito",      color: "text-blue-400"   },
  delivered:     { label: "Entregado",        color: "text-on-surface/40" },
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
}

export default function MLOrdersPage() {
  const { showToast } = useToast();
  const [filter, setFilter] = useState<FilterKey>("all");
  const [orders, setOrders] = useState<MLOrder[]>([]);

  useEffect(() => {
    fetch("/api/ml/orders")
      .then(r => r.json())
      .then(d => setOrders(d.orders || []))
      .catch(() => {});
  }, []);

  const filtered = filter === "all"
    ? orders
    : orders.filter(o => STATUS_CFG[o.status].filterKey === filter);

  const counts = {
    all:       orders.length,
    paid:      orders.filter(o => ["paid", "confirmed", "payment_required"].includes(o.status)).length,
    shipped:   orders.filter(o => o.status === "shipped").length,
    delivered: orders.filter(o => o.status === "delivered").length,
    cancelled: orders.filter(o => o.status === "cancelled").length,
  };

  const revenue = orders
    .filter(o => o.status !== "cancelled")
    .reduce((s, o) => s + o.total_amount, 0);

  function handleGuide(order: MLOrder) {
    showToast({ type: "success", title: "Guía Generada", message: `Skydropx → ${order.order_id} · ${order.buyer_nickname}` });
  }

  function handleDetail(order: MLOrder) {
    const items = order.items.map(i => `${i.title} x${i.quantity}`).join(", ");
    showToast({ type: "info", title: `Orden ${order.order_id}`, message: `${order.buyer_nickname} · ${items} · $${order.total_amount.toLocaleString()}` });
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
            {filtered.length} órdenes · <span className="text-primary font-bold">${revenue.toLocaleString()} MXN</span> total
          </p>
        </div>
        <button
          onClick={() => showToast({ type: "info", title: "Sincronizando Órdenes", message: "Obteniendo órdenes desde ML API..." })}
          className="px-8 py-4 glass-card border-white/5 rounded-2xl text-[10px] font-black label-tracking text-on-surface-variant hover:text-on-surface hover:border-primary/20 transition-all flex items-center gap-2 self-start md:self-auto"
        >
          <span className="material-symbols-outlined !text-[16px]">sync</span>
          SYNC ÓRDENES
        </button>
      </header>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Pagadas",    count: counts.paid,      icon: "payments",       color: "text-blue-400"   },
          { label: "En Camino",  count: counts.shipped,   icon: "local_shipping", color: "text-amber-400"  },
          { label: "Entregadas", count: counts.delivered, icon: "check_circle",   color: "text-[#CCFF00]"  },
          { label: "Canceladas", count: counts.cancelled, icon: "cancel",         color: "text-red-400"    },
        ].map(kpi => (
          <div key={kpi.label} className="glass-card p-6 rounded-[1.5rem] border border-white/5">
            <div className="flex items-center gap-3 mb-2">
              <span className={`material-symbols-outlined !text-[18px] ${kpi.color}`}>{kpi.icon}</span>
              <span className="text-[9px] font-black label-tracking text-on-surface/40 uppercase">{kpi.label}</span>
            </div>
            <p className="text-3xl font-black tight-tracking text-on-surface">{kpi.count}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {(["all", "paid", "shipped", "delivered", "cancelled"] as FilterKey[]).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-[10px] font-black label-tracking transition-all ${
              filter === f ? "bg-primary text-black" : "glass-card border border-white/5 text-on-surface-variant hover:border-primary/20"
            }`}
          >
            {f === "all" ? "TODAS" : f === "paid" ? "PAGADAS" : f === "shipped" ? "EN CAMINO" : f === "delivered" ? "ENTREGADAS" : "CANCELADAS"}{" "}
            ({counts[f]})
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="glass-card rounded-[2rem] border border-white/5 overflow-hidden">
        <div className="grid grid-cols-[1.5fr_2.5fr_1.5fr_1fr_1.2fr_1fr_auto] gap-4 px-8 py-4 border-b border-white/5">
          {["Orden", "Productos", "Comprador", "Total", "Envío", "Fecha", ""].map((h, i) => (
            <span key={i} className="text-[9px] font-black label-tracking text-on-surface/30 uppercase">{h}</span>
          ))}
        </div>

        <div className="divide-y divide-white/5">
          {filtered.map(order => {
            const sCfg = STATUS_CFG[order.status];
            const shCfg = SHIP_STATUS_CFG[order.shipping_status];
            const firstItem = order.items[0];
            const extra = order.items.length > 1 ? ` +${order.items.length - 1}` : "";
            return (
              <div key={order.id}
                className="grid grid-cols-[1.5fr_2.5fr_1.5fr_1fr_1.2fr_1fr_auto] gap-4 items-center px-8 py-5 hover:bg-white/[0.02] transition-colors group"
              >
                {/* Order ID + status badge */}
                <div>
                  <p className="text-[10px] font-black text-primary">ML-{order.order_id}</p>
                  <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[8px] font-black ${sCfg.color} ${sCfg.bg} mt-1`}>
                    <span className="material-symbols-outlined !text-[9px]">{sCfg.icon}</span>
                    {sCfg.label.toUpperCase()}
                  </span>
                </div>

                {/* Products */}
                <div className="min-w-0">
                  <p className="text-xs font-bold text-on-surface truncate">{firstItem.title}{extra}</p>
                  <p className="text-[9px] text-on-surface/30">{firstItem.sku} · x{firstItem.quantity}{extra && " · varios SKU"}</p>
                </div>

                {/* Buyer */}
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-6 h-6 rounded-full bg-white/10 border border-white/10 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined !text-[12px] text-on-surface/40">person</span>
                  </div>
                  <span className="text-xs text-on-surface-variant truncate">{order.buyer_nickname}</span>
                </div>

                {/* Total */}
                <span className="text-xs font-black text-on-surface">${order.total_amount.toLocaleString()}</span>

                {/* Shipping */}
                <div>
                  <p className={`text-[9px] font-black label-tracking ${shCfg.color}`}>{shCfg.label.toUpperCase()}</p>
                  {order.tracking_number && (
                    <p className="text-[8px] text-on-surface/30 font-mono mt-0.5">{order.tracking_number}</p>
                  )}
                </div>

                {/* Date */}
                <span className="text-[10px] text-on-surface/40">{fmtDate(order.date_created)}</span>

                {/* Actions */}
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {(order.status === "paid" || order.status === "confirmed") && order.shipping_status === "ready_to_ship" && (
                    <button onClick={() => handleGuide(order)}
                      className="px-3 py-1.5 rounded-lg bg-primary text-black text-[9px] font-black label-tracking hover:scale-105 transition-all flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined !text-[11px]">local_shipping</span>
                      GUÍA
                    </button>
                  )}
                  <button onClick={() => handleDetail(order)}
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
