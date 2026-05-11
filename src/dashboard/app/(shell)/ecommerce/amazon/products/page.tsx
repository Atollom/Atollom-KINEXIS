"use client";

import { useState } from "react";
import { useToast } from "@/components/ToastProvider";
import { mockAmazonProducts, mockAmazonStats } from "@/lib/mockData";
import type { AmazonProduct } from "@/lib/mockData";

type FilterKey = "all" | "fba" | "fbm" | "low_stock";

const LOW = 20;

const STATUS_CFG = {
  active:     { label: "Activo",     color: "text-[#CCFF00]", bg: "bg-[#CCFF00]/10",  icon: "check_circle" },
  inactive:   { label: "Inactivo",   color: "text-red-400",   bg: "bg-red-400/10",    icon: "cancel"       },
  incomplete: { label: "Incompleto", color: "text-amber-400", bg: "bg-amber-400/10",  icon: "warning"      },
} as const;

const CHANNEL_CFG = {
  FBA: { color: "text-orange-400", bg: "bg-orange-400/10", icon: "warehouse" },
  FBM: { color: "text-blue-400",   bg: "bg-blue-400/10",   icon: "store"     },
} as const;

function marginColor(m: number) {
  if (m >= 50) return "text-[#CCFF00]";
  if (m >= 35) return "text-amber-400";
  return "text-red-400";
}

export default function AmazonProductsPage() {
  const { showToast } = useToast();
  const [filter, setFilter] = useState<FilterKey>("all");
  const [editingPrice, setEditingPrice] = useState<string | null>(null);
  const [prices, setPrices] = useState<Record<string, number>>(
    Object.fromEntries(mockAmazonProducts.map(p => [p.id, p.price]))
  );
  const [draft, setDraft] = useState("");

  const filtered = mockAmazonProducts.filter(p =>
    filter === "all"       ? true :
    filter === "fba"       ? p.fulfillment_channel === "FBA" :
    filter === "fbm"       ? p.fulfillment_channel === "FBM" :
    /* low_stock */           p.quantity < LOW
  );

  const counts = {
    all:       mockAmazonProducts.length,
    fba:       mockAmazonProducts.filter(p => p.fulfillment_channel === "FBA").length,
    fbm:       mockAmazonProducts.filter(p => p.fulfillment_channel === "FBM").length,
    low_stock: mockAmazonProducts.filter(p => p.quantity < LOW).length,
  };

  function startEdit(id: string) { setEditingPrice(id); setDraft(String(prices[id])); }
  function commitEdit(id: string, title: string) {
    const n = Number(draft);
    if (!isNaN(n) && n > 0) {
      setPrices(prev => ({ ...prev, [id]: n }));
      showToast({ type: "success", title: "Precio actualizado", message: `${title.slice(0, 30)}... → Amazon MWS` });
    }
    setEditingPrice(null);
  }

  return (
    <div className="space-y-10 animate-in">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <span className="text-[0.75rem] font-bold label-tracking text-orange-400 drop-shadow-[0_0_8px_rgba(251,146,60,0.3)]">
            Channel Intelligence / Amazon / Productos
          </span>
          <h1 className="text-4xl md:text-5xl font-black tight-tracking text-on-surface">
            Catálogo Amazon
          </h1>
          <p className="text-sm text-on-surface-variant">
            {mockAmazonStats.total_products} listings · {mockAmazonStats.active_listings} activos · Kap Tools
          </p>
        </div>
        <button
          onClick={() => showToast({ type: "info", title: "Sincronizando", message: "Actualizando catálogo desde Amazon MWS..." })}
          className="px-8 py-4 glass-card border-white/5 rounded-2xl text-[10px] font-black label-tracking text-on-surface-variant hover:text-on-surface hover:border-orange-400/20 transition-all flex items-center gap-2 self-start md:self-auto"
        >
          <span className="material-symbols-outlined !text-[16px]">sync</span>
          SYNC AMAZON
        </button>
      </header>

      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: "Total Listings",  value: mockAmazonStats.total_products,  icon: "inventory_2",    color: "text-on-surface"   },
          { label: "FBA",             value: mockAmazonStats.fba_products,     icon: "warehouse",      color: "text-orange-400"   },
          { label: "FBM",             value: mockAmazonStats.fbm_products,     icon: "store",          color: "text-blue-400"     },
          { label: "Ventas del Mes",  value: `$${(mockAmazonStats.monthly_revenue/1000).toFixed(0)}k`, icon: "trending_up", color: "text-[#CCFF00]" },
          { label: "Bajo Stock",      value: counts.low_stock,                 icon: "warning",        color: "text-red-400"      },
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
        {(["all", "fba", "fbm", "low_stock"] as FilterKey[]).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-[10px] font-black label-tracking transition-all ${
              filter === f ? "bg-primary text-black" : "glass-card border border-white/5 text-on-surface-variant hover:border-orange-400/20"
            }`}
          >
            {f === "all" ? "TODOS" : f === "fba" ? "FBA" : f === "fbm" ? "FBM" : "BAJO STOCK"} ({counts[f]})
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="glass-card rounded-[2rem] border border-white/5 overflow-hidden">
        <div className="grid grid-cols-[2.5fr_1.2fr_1fr_1fr_1fr_1fr_auto] gap-4 px-8 py-4 border-b border-white/5">
          {["Producto / ASIN", "Canal", "Precio USD", "Stock", "BSR", "Margen", ""].map((h, i) => (
            <span key={i} className="text-[9px] font-black label-tracking text-on-surface/30 uppercase">{h}</span>
          ))}
        </div>

        <div className="divide-y divide-white/5">
          {filtered.map(p => {
            const sCfg = STATUS_CFG[p.status];
            const cCfg = CHANNEL_CFG[p.fulfillment_channel];
            const isEd = editingPrice === p.id;
            return (
              <div key={p.id}
                className="grid grid-cols-[2.5fr_1.2fr_1fr_1fr_1fr_1fr_auto] gap-4 items-center px-8 py-5 hover:bg-white/[0.02] transition-colors group"
              >
                {/* Product */}
                <div className="min-w-0">
                  <p className="text-xs font-bold text-on-surface truncate">{p.title}</p>
                  <p className="text-[9px] font-mono text-on-surface/30 mt-0.5">{p.asin} · {p.sku}</p>
                </div>

                {/* Channel */}
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-black w-fit ${cCfg.color} ${cCfg.bg}`}>
                  <span className="material-symbols-outlined !text-[10px]">{cCfg.icon}</span>
                  {p.fulfillment_channel}
                </span>

                {/* Price */}
                <div>
                  {isEd ? (
                    <input autoFocus type="number" value={draft}
                      onChange={e => setDraft(e.target.value)}
                      onBlur={() => commitEdit(p.id, p.title)}
                      onKeyDown={e => { if (e.key === "Enter") commitEdit(p.id, p.title); if (e.key === "Escape") setEditingPrice(null); }}
                      className="w-20 bg-white/10 border border-primary/60 rounded-lg px-2 py-1 text-xs font-black text-on-surface outline-none"
                    />
                  ) : (
                    <button onClick={() => startEdit(p.id)}
                      className="text-xs font-black text-on-surface hover:text-primary transition-colors flex items-center gap-1 group/price"
                      title="Click para editar"
                    >
                      ${prices[p.id].toFixed(2)}
                      <span className="material-symbols-outlined !text-[12px] opacity-0 group-hover/price:opacity-60 transition-opacity">edit</span>
                    </button>
                  )}
                </div>

                {/* Stock */}
                <div>
                  <p className={`text-xs font-black ${
                    p.quantity === 0 ? "text-red-400" : p.quantity < LOW ? "text-amber-400" : "text-on-surface"
                  }`}>{p.quantity} uds</p>
                  {p.inbound_quantity > 0 && (
                    <p className="text-[9px] text-blue-400 font-bold">+{p.inbound_quantity} inbound</p>
                  )}
                </div>

                {/* BSR */}
                <span className="text-xs font-black text-on-surface">
                  {p.sales_rank > 0 ? `#${p.sales_rank.toLocaleString()}` : "—"}
                </span>

                {/* Margin */}
                <span className={`text-xs font-black ${marginColor(p.profit_margin)}`}>
                  {p.profit_margin.toFixed(1)}%
                </span>

                {/* Actions */}
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[8px] font-black ${sCfg.color} ${sCfg.bg}`}>
                    <span className="material-symbols-outlined !text-[9px]">{sCfg.icon}</span>
                    {sCfg.label.toUpperCase()}
                  </span>
                  {p.fulfillment_channel === "FBA" && p.quantity < LOW && (
                    <button
                      onClick={() => showToast({ type: "success", title: "Plan de reabastecimiento", message: `Creando shipment para ${p.sku}` })}
                      className="px-3 py-1.5 rounded-lg bg-orange-400/10 border border-orange-400/20 text-orange-400 text-[9px] font-black label-tracking hover:bg-orange-400/20 transition-colors flex items-center gap-1 whitespace-nowrap"
                    >
                      <span className="material-symbols-outlined !text-[11px]">add_box</span>
                      REABASTECER
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
