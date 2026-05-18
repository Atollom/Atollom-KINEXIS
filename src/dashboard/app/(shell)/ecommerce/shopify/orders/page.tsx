"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/components/ToastProvider";
import type { ShopifyOrder } from "@/lib/mockData";

type FilterKey = "all" | "unfulfilled" | "fulfilled" | "partial";

const FIN_CFG: Record<string, { label: string; color: string; bg: string }> = {
  paid:           { label: "Pagado",      color: "text-[#CCFF00]",     bg: "bg-[#CCFF00]/10" },
  pending:        { label: "Pendiente",   color: "text-amber-400",     bg: "bg-amber-400/10" },
  refunded:       { label: "Reembolsado", color: "text-red-400",       bg: "bg-red-400/10"   },
  partially_paid: { label: "Parcial",     color: "text-blue-400",      bg: "bg-blue-400/10"  },
  voided:         { label: "Cancelado",   color: "text-on-surface/40", bg: "bg-white/5"      },
  authorized:     { label: "Autorizado",  color: "text-blue-400",      bg: "bg-blue-400/10"  },
};

const FUL_CFG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  unfulfilled: { label: "Sin cumplir", color: "text-amber-400",     bg: "bg-amber-400/10", icon: "pending"        },
  partial:     { label: "Parcial",     color: "text-blue-400",      bg: "bg-blue-400/10",  icon: "hourglass_top"  },
  fulfilled:   { label: "Cumplido",    color: "text-[#CCFF00]",     bg: "bg-[#CCFF00]/10", icon: "check_circle"   },
  none:        { label: "Sin cumplir", color: "text-amber-400",     bg: "bg-amber-400/10", icon: "pending"        },
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-MX", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

const FALLBACK_SHOPIFY_STATS = { total_orders_month: 0, revenue_month: 0, avg_order_value: 0 };

export default function ShopifyOrdersPage() {
  const { showToast } = useToast();
  const [filter, setFilter] = useState<FilterKey>("all");
  const [orders, setOrders] = useState<ShopifyOrder[]>([]);
  const [shopifyStats, setShopifyStats] = useState(FALLBACK_SHOPIFY_STATS);

  useEffect(() => {
    fetch("/api/shopify/orders")
      .then(r => r.json())
      .then(d => {
        setOrders(d.orders || []);
        setShopifyStats(d.stats || FALLBACK_SHOPIFY_STATS);
      })
      .catch(() => {});
  }, []);

  const filtered = orders.filter(o =>
    filter === "all"         ? true :
    filter === "unfulfilled" ? (o.fulfillment_status === "unfulfilled" || o.fulfillment_status === null) :
    filter === "fulfilled"   ? o.fulfillment_status === "fulfilled" :
    /* partial */              o.fulfillment_status === "partial"
  );

  const counts = {
    all:         orders.length,
    unfulfilled: orders.filter(o => o.fulfillment_status === "unfulfilled" || o.fulfillment_status === null).length,
    fulfilled:   orders.filter(o => o.fulfillment_status === "fulfilled").length,
    partial:     orders.filter(o => o.fulfillment_status === "partial").length,
  };

  return (
    <div className="space-y-10 animate-in">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <span className="text-[0.75rem] font-bold label-tracking text-[#CCFF00] drop-shadow-[0_0_8px_rgba(204,255,0,0.3)]">
            Channel Intelligence / Shopify / Órdenes
          </span>
          <h1 className="text-4xl md:text-5xl font-black tight-tracking text-on-surface">
            Órdenes Shopify
          </h1>
          <p className="text-sm text-on-surface-variant">
            {shopifyStats.total_orders_month} órdenes este mes · {counts.unfulfilled} pendientes de cumplir
          </p>
        </div>
        <button
          onClick={() => showToast({ type: "info", title: "Exportando", message: "Generando CSV de órdenes → Shopify Admin" })}
          className="px-8 py-4 glass-card border-white/5 rounded-2xl text-[10px] font-black label-tracking text-on-surface-variant hover:text-on-surface hover:border-[#CCFF00]/20 transition-all flex items-center gap-2 self-start md:self-auto"
        >
          <span className="material-symbols-outlined !text-[16px]">download</span>
          EXPORTAR
        </button>
      </header>

      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Órdenes (mes)",    value: shopifyStats.total_orders_month,   icon: "receipt_long",    color: "text-on-surface"  },
          { label: "Revenue (mes)",    value: `$${(shopifyStats.revenue_month / 1000).toFixed(1)}k`, icon: "trending_up", color: "text-[#CCFF00]" },
          { label: "Ticket Promedio",  value: `$${shopifyStats.avg_order_value.toFixed(0)}`, icon: "payments", color: "text-blue-400" },
          { label: "Pendiente Cumplir",value: counts.unfulfilled,                    icon: "pending_actions", color: "text-amber-400"   },
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

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {(["all", "unfulfilled", "fulfilled", "partial"] as FilterKey[]).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-[10px] font-black label-tracking transition-all ${
              filter === f ? "bg-primary text-black" : "glass-card border border-white/5 text-on-surface-variant hover:border-[#CCFF00]/20"
            }`}
          >
            {f === "all" ? "TODOS" : f === "unfulfilled" ? "SIN CUMPLIR" : f === "fulfilled" ? "CUMPLIDOS" : "PARCIALES"} ({counts[f]})
          </button>
        ))}
      </div>

      {/* Orders table */}
      <div className="glass-card rounded-[2rem] border border-white/5 overflow-hidden">
        <div className="grid grid-cols-[auto_2fr_1fr_1.5fr_1fr_1fr_1fr_auto] gap-3 px-8 py-4 border-b border-white/5">
          {["#", "Cliente", "Fecha", "Productos", "Total", "Pago", "Envío", ""].map((h, i) => (
            <span key={i} className="text-[9px] font-black label-tracking text-on-surface/30 uppercase">{h}</span>
          ))}
        </div>

        <div className="divide-y divide-white/5">
          {filtered.map(o => {
            const finCfg = FIN_CFG[o.financial_status] ?? { label: o.financial_status, color: "text-on-surface/40", bg: "bg-white/5" };
            const fulKey = o.fulfillment_status ?? "none";
            const fulCfg = FUL_CFG[fulKey] ?? FUL_CFG.none;
            const canFulfill = o.financial_status === "paid" && (o.fulfillment_status === "unfulfilled" || o.fulfillment_status === null);
            return (
              <div key={o.id}
                className="grid grid-cols-[auto_2fr_1fr_1.5fr_1fr_1fr_1fr_auto] gap-3 items-center px-8 py-5 hover:bg-white/[0.02] transition-colors group"
              >
                <span className="text-[10px] font-black text-primary">#{o.order_number}</span>

                <div className="min-w-0">
                  <p className="text-xs font-bold text-on-surface truncate">{o.customer.first_name} {o.customer.last_name}</p>
                  <p className="text-[9px] text-on-surface/30 truncate">{o.email}</p>
                </div>

                <span className="text-[10px] text-on-surface/50">{fmtDate(o.created_at)}</span>

                <div className="min-w-0">
                  {o.line_items.slice(0, 2).map((item, i) => (
                    <p key={i} className="text-[9px] text-on-surface/60 truncate">{item.quantity}× {item.title.split(" ").slice(0, 3).join(" ")}</p>
                  ))}
                  {o.line_items.length > 2 && <p className="text-[8px] text-on-surface/30">+{o.line_items.length - 2} más</p>}
                </div>

                <span className="text-xs font-black text-on-surface">${o.total_price.toLocaleString()}</span>

                <span className={`inline-flex px-2 py-0.5 rounded-full text-[8px] font-black w-fit ${finCfg.color} ${finCfg.bg}`}>
                  {finCfg.label.toUpperCase()}
                </span>

                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-black w-fit ${fulCfg.color} ${fulCfg.bg}`}>
                  <span className="material-symbols-outlined !text-[9px]">{fulCfg.icon}</span>
                  {fulCfg.label.toUpperCase()}
                </span>

                <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                  {canFulfill && (
                    <button
                      onClick={() => showToast({ type: "success", title: "Fulfillment creado", message: `Orden #${o.order_number} → Skydropx` })}
                      className="px-3 py-1.5 rounded-lg bg-[#CCFF00]/10 border border-[#CCFF00]/20 text-[#CCFF00] text-[9px] font-black label-tracking hover:bg-[#CCFF00]/20 transition-colors flex items-center gap-1 whitespace-nowrap"
                    >
                      <span className="material-symbols-outlined !text-[11px]">local_shipping</span>
                      CUMPLIR
                    </button>
                  )}
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
