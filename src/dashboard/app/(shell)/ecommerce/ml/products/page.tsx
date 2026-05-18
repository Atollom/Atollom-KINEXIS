"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/components/ToastProvider";
import type { MLProduct } from "@/lib/mockData";

const LOW_STOCK_THRESHOLD = 10;

type FilterKey = "all" | "active" | "paused" | "low_stock";

function getDisplayStatus(p: MLProduct): "active" | "low_stock" | "paused" {
  if (p.status === "paused" || p.status === "closed") return "paused";
  if (p.available_quantity <= LOW_STOCK_THRESHOLD) return "low_stock";
  return "active";
}

const STATUS_CFG = {
  active:    { label: "Activa",      color: "text-[#CCFF00]", bg: "bg-[#CCFF00]/10",  icon: "check_circle" },
  low_stock: { label: "Bajo Stock",  color: "text-amber-400", bg: "bg-amber-400/10",  icon: "warning" },
  paused:    { label: "Pausada",     color: "text-red-400",   bg: "bg-red-400/10",    icon: "pause_circle" },
} as const;

const LISTING_CFG = {
  gold_special: { label: "Premium",  color: "text-yellow-400", bg: "bg-yellow-400/10" },
  gold_pro:     { label: "Pro",       color: "text-blue-400",   bg: "bg-blue-400/10"   },
  free:         { label: "Gratis",    color: "text-white/40",   bg: "bg-white/5"        },
} as const;

const CAT_ICON: Record<string, string> = {
  Taladros: "hardware", Compresores: "air", Neumática: "settings", Accesorios: "build",
  Medición: "straighten", EPP: "safety_check", Corte: "content_cut",
};

const FALLBACK_STATS = { total_products: 0, active_products: 0, total_sales_month: 0 };

export default function MLProductsPage() {
  const { showToast } = useToast();
  const [filter, setFilter] = useState<FilterKey>("all");
  const [editingPrice, setEditingPrice] = useState<string | null>(null);
  const [products, setProducts] = useState<MLProduct[]>([]);
  const [mlStats, setMlStats] = useState(FALLBACK_STATS);
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [draft, setDraft] = useState("");

  useEffect(() => {
    fetch("/api/ml/products")
      .then(r => r.json())
      .then(d => {
        const prods: MLProduct[] = d.products || [];
        setProducts(prods);
        setMlStats(d.stats || FALLBACK_STATS);
        setPrices(Object.fromEntries(prods.map(p => [p.id, p.price])));
      })
      .catch(() => {});
  }, []);

  const withStatus = products.map(p => ({ ...p, displayStatus: getDisplayStatus(p) }));

  const filtered = filter === "all"
    ? withStatus
    : filter === "active"   ? withStatus.filter(p => p.displayStatus === "active")
    : filter === "paused"   ? withStatus.filter(p => p.displayStatus === "paused")
    :                         withStatus.filter(p => p.displayStatus === "low_stock");

  const counts = {
    all:       withStatus.length,
    active:    withStatus.filter(p => p.displayStatus === "active").length,
    paused:    withStatus.filter(p => p.displayStatus === "paused").length,
    low_stock: withStatus.filter(p => p.displayStatus === "low_stock").length,
  };

  function startEdit(id: string) { setEditingPrice(id); setDraft(String(prices[id])); }
  function commitEdit(id: string, name: string) {
    const n = Number(draft);
    if (!isNaN(n) && n > 0) {
      setPrices(prev => ({ ...prev, [id]: n }));
      showToast({ type: "success", title: "Precio actualizado", message: `${name}: $${n.toLocaleString()} MXN → ML API` });
    }
    setEditingPrice(null);
  }

  return (
    <div className="space-y-10 animate-in">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <span className="text-[0.75rem] font-bold label-tracking text-[#FFE600] drop-shadow-[0_0_8px_rgba(255,230,0,0.3)]">
            Channel Intelligence / Mercado Libre / Productos
          </span>
          <h1 className="text-4xl md:text-5xl font-black tight-tracking text-on-surface">
            Catálogo ML
          </h1>
          <p className="text-sm text-on-surface-variant">
            {mlStats.total_products} publicaciones · Kap Tools
          </p>
        </div>
        <button
          onClick={() => showToast({ type: "info", title: "Sincronizando", message: "Actualizando catálogo desde ML API..." })}
          className="px-8 py-4 glass-card border-white/5 rounded-2xl text-[10px] font-black label-tracking text-on-surface-variant hover:text-on-surface hover:border-primary/20 transition-all flex items-center gap-2 self-start md:self-auto"
        >
          <span className="material-symbols-outlined !text-[16px]">sync</span>
          SYNC CATÁLOGO
        </button>
      </header>

      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Productos", value: mlStats.total_products, icon: "inventory_2",     color: "text-on-surface" },
          { label: "Activos",          value: mlStats.active_products, icon: "check_circle",   color: "text-[#CCFF00]"  },
          { label: "Bajo Stock",        value: counts.low_stock,        icon: "warning",         color: "text-amber-400"  },
          { label: "Ventas del Mes",    value: `$${(mlStats.total_sales_month/1000).toFixed(0)}k`, icon: "trending_up", color: "text-blue-400" },
        ].map(kpi => (
          <div key={kpi.label} className="glass-card rounded-[1.5rem] border border-white/5 p-6">
            <div className="flex items-center gap-3 mb-3">
              <span className={`material-symbols-outlined !text-[20px] ${kpi.color}`}>{kpi.icon}</span>
              <span className="text-[9px] font-black label-tracking text-on-surface/40 uppercase">{kpi.label}</span>
            </div>
            <p className="text-3xl font-black tight-tracking text-on-surface">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {(["all", "active", "low_stock", "paused"] as FilterKey[]).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-[10px] font-black label-tracking transition-all ${
              filter === f ? "bg-primary text-black" : "glass-card border border-white/5 text-on-surface-variant hover:border-primary/20"
            }`}
          >
            {f === "all" ? "TODOS" : f === "active" ? "ACTIVOS" : f === "low_stock" ? "BAJO STOCK" : "PAUSADOS"}{" "}
            ({counts[f]})
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="glass-card rounded-[2rem] border border-white/5 overflow-hidden">
        <div className="grid grid-cols-[1.5fr_2.5fr_1.2fr_1fr_1fr_1fr_1fr_auto] gap-4 px-8 py-4 border-b border-white/5">
          {["SKU / ML ID", "Producto", "Categoría", "Tipo", "Precio MXN", "Stock", "Vendidos", ""].map((h, i) => (
            <span key={i} className="text-[9px] font-black label-tracking text-on-surface/30 uppercase">{h}</span>
          ))}
        </div>

        <div className="divide-y divide-white/5">
          {filtered.map(product => {
            const sCfg  = STATUS_CFG[product.displayStatus];
            const lCfg  = LISTING_CFG[product.listing_type];
            const isEd  = editingPrice === product.id;
            const icon  = CAT_ICON[product.category] ?? "build";
            return (
              <div key={product.id}
                className="grid grid-cols-[1.5fr_2.5fr_1.2fr_1fr_1fr_1fr_1fr_auto] gap-4 items-center px-8 py-5 hover:bg-white/[0.02] transition-colors group"
              >
                {/* SKU / ML ID */}
                <div>
                  <p className="text-[10px] font-black text-primary">{product.sku}</p>
                  <p className="text-[9px] text-on-surface/30 font-mono">{product.ml_id}</p>
                </div>

                {/* Title */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined !text-[14px] text-on-surface/40">{icon}</span>
                  </div>
                  <span className="text-xs font-bold text-on-surface truncate">{product.title}</span>
                </div>

                {/* Category */}
                <span className="text-[10px] text-on-surface-variant">{product.category}</span>

                {/* Listing type */}
                <span className={`inline-flex px-2 py-1 rounded-full text-[9px] font-black label-tracking w-fit ${lCfg.color} ${lCfg.bg}`}>
                  {lCfg.label.toUpperCase()}
                </span>

                {/* Price — editable */}
                <div>
                  {isEd ? (
                    <input autoFocus type="number" value={draft}
                      onChange={e => setDraft(e.target.value)}
                      onBlur={() => commitEdit(product.id, product.title)}
                      onKeyDown={e => { if (e.key === "Enter") commitEdit(product.id, product.title); if (e.key === "Escape") setEditingPrice(null); }}
                      className="w-24 bg-white/10 border border-primary/60 rounded-lg px-2 py-1 text-xs font-black text-on-surface outline-none"
                    />
                  ) : (
                    <button onClick={() => startEdit(product.id)}
                      className="text-xs font-black text-on-surface hover:text-primary transition-colors flex items-center gap-1 group/price"
                      title="Click para editar"
                    >
                      ${prices[product.id].toLocaleString()}
                      <span className="material-symbols-outlined !text-[12px] opacity-0 group-hover/price:opacity-60 transition-opacity">edit</span>
                    </button>
                  )}
                </div>

                {/* Stock */}
                <span className={`text-xs font-black ${
                  product.available_quantity === 0 ? "text-red-400" :
                  product.available_quantity <= LOW_STOCK_THRESHOLD ? "text-amber-400" : "text-on-surface"
                }`}>
                  {product.available_quantity} uds
                </span>

                {/* Sold */}
                <div className="flex items-center gap-1">
                  <span className="text-xs font-black text-on-surface">{product.sold_quantity}</span>
                  <span className="material-symbols-outlined !text-[12px] text-primary">trending_up</span>
                </div>

                {/* Actions on hover */}
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-black label-tracking ${sCfg.color} ${sCfg.bg}`}>
                    <span className="material-symbols-outlined !text-[10px]">{sCfg.icon}</span>
                    {sCfg.label.toUpperCase()}
                  </span>
                  <a href={product.permalink} target="_blank" rel="noopener noreferrer"
                    className="w-7 h-7 rounded-lg border border-white/10 hover:border-primary/40 flex items-center justify-center transition-colors"
                    title="Ver en ML"
                  >
                    <span className="material-symbols-outlined !text-[14px] text-on-surface/40">open_in_new</span>
                  </a>
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
