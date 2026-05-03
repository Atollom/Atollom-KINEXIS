"use client";

import { useState } from "react";
import { useToast } from "@/components/ToastProvider";

export const metadata = undefined; // client component — metadata set via head.tsx if needed

const PRODUCTS = [
  {
    sku: "TAL-003",
    name: "Taladro Percutor 850W",
    category: "Taladros",
    price: 1_540,
    stock: 8,
    sold: 47,
    status: "bajo_stock" as const,
    mlId: "MLM-001",
  },
  {
    sku: "KAP-007",
    name: "Set Brocas Multi-Propósito 29 pzs",
    category: "Accesorios",
    price: 420,
    stock: 62,
    sold: 134,
    status: "activa" as const,
    mlId: "MLM-002",
  },
  {
    sku: "TAL-001",
    name: "Taladro Inalámbrico 20V",
    category: "Taladros",
    price: 2_890,
    stock: 14,
    sold: 28,
    status: "activa" as const,
    mlId: "MLM-003",
  },
  {
    sku: "BRO-002",
    name: "Brocas para Concreto 13mm",
    category: "Accesorios",
    price: 95,
    stock: 0,
    sold: 89,
    status: "pausada" as const,
    mlId: "MLM-004",
  },
  {
    sku: "ARN-002",
    name: "Arnés de Seguridad Industrial",
    category: "EPP",
    price: 680,
    stock: 31,
    sold: 19,
    status: "activa" as const,
    mlId: "MLM-005",
  },
  {
    sku: "TAL-008",
    name: "Taladro de Columna Bancada",
    category: "Taladros",
    price: 5_400,
    stock: 3,
    sold: 7,
    status: "bajo_stock" as const,
    mlId: "MLM-006",
  },
  {
    sku: "KAP-011",
    name: "Llave de Impacto Neumática",
    category: "Herramienta Neumática",
    price: 1_180,
    stock: 22,
    sold: 55,
    status: "activa" as const,
    mlId: "MLM-007",
  },
  {
    sku: "BRO-015",
    name: "Broca Diamantada 100mm",
    category: "Accesorios",
    price: 340,
    stock: 9,
    sold: 12,
    status: "activa" as const,
    mlId: "MLM-008",
  },
];

const STATUS_CFG = {
  activa:     { label: "Activa",      color: "text-[#CCFF00]", bg: "bg-[#CCFF00]/10",  icon: "check_circle" },
  bajo_stock: { label: "Bajo Stock",  color: "text-amber-400", bg: "bg-amber-400/10",  icon: "warning" },
  pausada:    { label: "Pausada",     color: "text-red-400",   bg: "bg-red-400/10",    icon: "pause_circle" },
};

export default function MLProductsPage() {
  const { showToast } = useToast();
  const [filter, setFilter] = useState<"all" | "activa" | "bajo_stock" | "pausada">("all");
  const [editingPrice, setEditingPrice] = useState<string | null>(null);
  const [prices, setPrices] = useState<Record<string, number>>(
    Object.fromEntries(PRODUCTS.map(p => [p.sku, p.price]))
  );
  const [draft, setDraft] = useState<string>("");

  const filtered = filter === "all" ? PRODUCTS : PRODUCTS.filter(p => p.status === filter);

  function startEdit(sku: string) {
    setEditingPrice(sku);
    setDraft(String(prices[sku]));
  }

  function commitEdit(sku: string) {
    const n = Number(draft);
    if (!isNaN(n) && n > 0) {
      setPrices(p => ({ ...p, [sku]: n }));
      showToast({ type: "success", title: "Precio Actualizado", message: `${sku}: $${n.toLocaleString()} MXN` });
    }
    setEditingPrice(null);
  }

  const counts = {
    all: PRODUCTS.length,
    activa: PRODUCTS.filter(p => p.status === "activa").length,
    bajo_stock: PRODUCTS.filter(p => p.status === "bajo_stock").length,
    pausada: PRODUCTS.filter(p => p.status === "pausada").length,
  };

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
            {PRODUCTS.length} publicaciones · Kap Tools
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

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {(["all", "activa", "bajo_stock", "pausada"] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-[10px] font-black label-tracking transition-all ${
              filter === f
                ? "bg-primary text-black"
                : "glass-card border border-white/5 text-on-surface-variant hover:border-primary/20"
            }`}
          >
            {f === "all" ? "TODOS" : STATUS_CFG[f].label.toUpperCase()} ({counts[f]})
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="glass-card rounded-[2rem] border border-white/5 overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-[2fr_2fr_1fr_1fr_1fr_1fr_1fr] gap-4 px-8 py-4 border-b border-white/5">
          {["SKU", "Producto", "Categoría", "Precio MXN", "Stock", "Ventas/mes", "Estado"].map(h => (
            <span key={h} className="text-[9px] font-black label-tracking text-on-surface/30 uppercase">{h}</span>
          ))}
        </div>

        <div className="divide-y divide-white/5">
          {filtered.map(product => {
            const cfg = STATUS_CFG[product.status];
            const isEditing = editingPrice === product.sku;
            return (
              <div
                key={product.sku}
                className="grid grid-cols-[2fr_2fr_1fr_1fr_1fr_1fr_1fr] gap-4 items-center px-8 py-5 hover:bg-white/[0.02] transition-colors group"
              >
                {/* SKU */}
                <span className="text-xs font-black text-primary tight-tracking">{product.sku}</span>

                {/* Product name */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined !text-[14px] text-on-surface/40">
                      {product.category === "Taladros" ? "hardware" : product.category === "EPP" ? "safety_check" : "build"}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-on-surface truncate">{product.name}</span>
                </div>

                {/* Category */}
                <span className="text-[10px] font-medium text-on-surface-variant">{product.category}</span>

                {/* Price — editable */}
                <div>
                  {isEditing ? (
                    <input
                      autoFocus
                      type="number"
                      value={draft}
                      onChange={e => setDraft(e.target.value)}
                      onBlur={() => commitEdit(product.sku)}
                      onKeyDown={e => { if (e.key === "Enter") commitEdit(product.sku); if (e.key === "Escape") setEditingPrice(null); }}
                      className="w-24 bg-white/10 border border-primary/60 rounded-lg px-2 py-1 text-xs font-black text-on-surface outline-none"
                    />
                  ) : (
                    <button
                      onClick={() => startEdit(product.sku)}
                      className="text-xs font-black text-on-surface hover:text-primary transition-colors flex items-center gap-1 group/price"
                      title="Click para editar"
                    >
                      ${prices[product.sku].toLocaleString()}
                      <span className="material-symbols-outlined !text-[12px] opacity-0 group-hover/price:opacity-60 transition-opacity">edit</span>
                    </button>
                  )}
                </div>

                {/* Stock */}
                <span className={`text-xs font-black ${product.stock === 0 ? "text-red-400" : product.stock < 10 ? "text-amber-400" : "text-on-surface"}`}>
                  {product.stock} uds
                </span>

                {/* Monthly sales */}
                <div className="flex items-center gap-1">
                  <span className="text-xs font-black text-on-surface">{product.sold}</span>
                  <span className="material-symbols-outlined !text-[12px] text-primary">trending_up</span>
                </div>

                {/* Status badge */}
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-black label-tracking ${cfg.color} ${cfg.bg} w-fit`}>
                  <span className="material-symbols-outlined !text-[10px]">{cfg.icon}</span>
                  {cfg.label.toUpperCase()}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="h-10" />
    </div>
  );
}
