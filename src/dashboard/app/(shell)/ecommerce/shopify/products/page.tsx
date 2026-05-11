"use client";

import { useState } from "react";
import { useToast } from "@/components/ToastProvider";
import { mockShopifyProducts, mockShopifyStats } from "@/lib/mockData";

type FilterKey = "all" | "active" | "draft" | "low_stock";
const LOW = 20;

const STATUS_CFG = {
  active:   { label: "Activo",    color: "text-[#CCFF00]",     bg: "bg-[#CCFF00]/10",  icon: "check_circle" },
  draft:    { label: "Borrador",  color: "text-amber-400",     bg: "bg-amber-400/10",  icon: "edit"         },
  archived: { label: "Archivado", color: "text-on-surface/40", bg: "bg-white/5",       icon: "archive"      },
} as const;

export default function ShopifyProductsPage() {
  const { showToast } = useToast();
  const [filter, setFilter] = useState<FilterKey>("all");

  const filtered = mockShopifyProducts.filter(p =>
    filter === "all"       ? true :
    filter === "active"    ? p.status === "active" :
    filter === "draft"     ? p.status === "draft" :
    /* low_stock */          p.total_inventory < LOW
  );

  const counts = {
    all:       mockShopifyProducts.length,
    active:    mockShopifyProducts.filter(p => p.status === "active").length,
    draft:     mockShopifyProducts.filter(p => p.status === "draft").length,
    low_stock: mockShopifyProducts.filter(p => p.total_inventory < LOW).length,
  };

  return (
    <div className="space-y-10 animate-in">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <span className="text-[0.75rem] font-bold label-tracking text-[#CCFF00] drop-shadow-[0_0_8px_rgba(204,255,0,0.3)]">
            Channel Intelligence / Shopify / Productos
          </span>
          <h1 className="text-4xl md:text-5xl font-black tight-tracking text-on-surface">
            Catálogo Shopify
          </h1>
          <p className="text-sm text-on-surface-variant">
            {mockShopifyStats.total_products} productos · {mockShopifyStats.active_products} activos · Kap Tools Store
          </p>
        </div>
        <button
          onClick={() => showToast({ type: "info", title: "Sincronizando", message: "Actualizando catálogo desde Shopify GraphQL API..." })}
          className="px-8 py-4 glass-card border-white/5 rounded-2xl text-[10px] font-black label-tracking text-on-surface-variant hover:text-on-surface hover:border-[#CCFF00]/20 transition-all flex items-center gap-2 self-start md:self-auto"
        >
          <span className="material-symbols-outlined !text-[16px]">sync</span>
          SYNC SHOPIFY
        </button>
      </header>

      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Productos", value: mockShopifyStats.total_products,  icon: "inventory_2",  color: "text-on-surface"  },
          { label: "Activos",         value: mockShopifyStats.active_products,  icon: "store",        color: "text-[#CCFF00]"   },
          { label: "Revenue (mes)",   value: `$${(mockShopifyStats.revenue_month / 1000).toFixed(1)}k`, icon: "trending_up", color: "text-[#CCFF00]" },
          { label: "Bajo Stock",      value: counts.low_stock,                  icon: "warning",      color: "text-red-400"     },
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
        {(["all", "active", "draft", "low_stock"] as FilterKey[]).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-[10px] font-black label-tracking transition-all ${
              filter === f ? "bg-primary text-black" : "glass-card border border-white/5 text-on-surface-variant hover:border-[#CCFF00]/20"
            }`}
          >
            {f === "all" ? "TODOS" : f === "active" ? "ACTIVOS" : f === "draft" ? "BORRADORES" : "BAJO STOCK"} ({counts[f]})
          </button>
        ))}
      </div>

      {/* Product card grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map(p => {
          const sCfg = STATUS_CFG[p.status];
          return (
            <div key={p.id} className="glass-card rounded-[2rem] border border-white/5 p-6 flex flex-col gap-4 hover:border-[#CCFF00]/10 transition-colors group">
              {/* Title + status */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-on-surface leading-tight mb-0.5 line-clamp-2">{p.title}</p>
                  <p className="text-[9px] font-mono text-on-surface/30">{p.handle}</p>
                </div>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-black flex-shrink-0 ${sCfg.color} ${sCfg.bg}`}>
                  <span className="material-symbols-outlined !text-[9px]">{sCfg.icon}</span>
                  {sCfg.label.toUpperCase()}
                </span>
              </div>

              {/* Meta badges */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded-full text-[8px] font-black bg-white/5 text-on-surface/50">{p.product_type}</span>
                {p.tags.slice(0, 2).map(t => (
                  <span key={t} className="px-2 py-0.5 rounded-full text-[8px] font-black bg-[#CCFF00]/5 text-[#CCFF00]/60">{t}</span>
                ))}
              </div>

              {/* Variants */}
              <div className="space-y-1.5">
                <p className="text-[8px] font-black label-tracking text-on-surface/30 uppercase">{p.total_variants} variante{p.total_variants !== 1 ? "s" : ""}</p>
                {p.variants.slice(0, 2).map(v => (
                  <div key={v.id} className="flex items-center justify-between py-2 px-3 bg-white/[0.02] rounded-xl border border-white/5">
                    <div className="min-w-0">
                      <p className="text-[9px] font-bold text-on-surface truncate">{v.title}</p>
                      <p className="text-[8px] font-mono text-on-surface/30">{v.sku}</p>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      <p className="text-[9px] font-black text-on-surface">${v.price.toFixed(0)}</p>
                      <p className={`text-[8px] font-black ${v.inventory_quantity === 0 ? "text-red-400" : v.inventory_quantity < 10 ? "text-amber-400" : "text-[#CCFF00]"}`}>
                        {v.inventory_quantity} uds
                      </p>
                    </div>
                  </div>
                ))}
                {p.variants.length > 2 && (
                  <p className="text-[8px] text-on-surface/30 text-center">+{p.variants.length - 2} más</p>
                )}
              </div>

              {/* Stock total */}
              <div className="flex items-center justify-between mt-auto">
                <span className="text-[8px] font-black label-tracking text-on-surface/30 uppercase">Stock total</span>
                <span className={`text-xs font-black ${
                  p.total_inventory === 0 ? "text-red-400" : p.total_inventory < LOW ? "text-amber-400" : "text-[#CCFF00]"
                }`}>{p.total_inventory} uds</span>
              </div>

              {/* Actions */}
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => showToast({ type: "info", title: "Abriendo en Shopify", message: `${p.title} → Shopify Admin` })}
                  className="flex-1 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-[9px] font-black text-on-surface hover:border-[#CCFF00]/20 transition-colors flex items-center justify-center gap-1"
                >
                  <span className="material-symbols-outlined !text-[11px]">open_in_new</span>
                  ADMIN
                </button>
                {p.total_inventory < LOW && (
                  <button
                    onClick={() => showToast({ type: "success", title: "Restock creado", message: `Orden de compra → ${p.vendor}` })}
                    className="flex-1 px-3 py-1.5 rounded-xl bg-[#CCFF00]/10 border border-[#CCFF00]/20 text-[9px] font-black text-[#CCFF00] hover:bg-[#CCFF00]/20 transition-colors flex items-center justify-center gap-1"
                  >
                    <span className="material-symbols-outlined !text-[11px]">add_shopping_cart</span>
                    STOCK
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="h-10" />
    </div>
  );
}
