"use client";

import { useState } from "react";
import { useToast } from "@/components/ToastProvider";
import { mockERPInventory, mockERPInventoryStats } from "@/lib/mockData";
import type { ERPInventoryItem } from "@/lib/mockData";

type FilterKey = "all" | "in_stock" | "low_stock" | "out_of_stock" | "overstocked";

const STATUS_CFG: Record<ERPInventoryItem["status"], { label: string; color: string; bg: string; icon: string }> = {
  in_stock:     { label: "En Stock",   color: "text-[#CCFF00]",     bg: "bg-[#CCFF00]/10",  icon: "check_circle" },
  low_stock:    { label: "Bajo Stock", color: "text-amber-400",     bg: "bg-amber-400/10",  icon: "warning"      },
  out_of_stock: { label: "Agotado",    color: "text-red-400",       bg: "bg-red-400/10",    icon: "cancel"       },
  overstocked:  { label: "Sobrestock", color: "text-blue-400",      bg: "bg-blue-400/10",   icon: "inventory"    },
};

export default function ERPInventoryPage() {
  const { showToast } = useToast();
  const [filter, setFilter] = useState<FilterKey>("all");
  const [search, setSearch] = useState("");

  const base = mockERPInventory.filter(i => filter === "all" ? true : i.status === filter);
  const items = search
    ? base.filter(i => i.name.toLowerCase().includes(search.toLowerCase()) || i.sku.toLowerCase().includes(search.toLowerCase()))
    : base;

  const counts: Record<FilterKey, number> = {
    all:          mockERPInventory.length,
    in_stock:     mockERPInventory.filter(i => i.status === "in_stock").length,
    low_stock:    mockERPInventory.filter(i => i.status === "low_stock").length,
    out_of_stock: mockERPInventory.filter(i => i.status === "out_of_stock").length,
    overstocked:  mockERPInventory.filter(i => i.status === "overstocked").length,
  };

  const urgentCount = counts.out_of_stock + counts.low_stock;

  return (
    <div className="space-y-10 animate-in">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="text-[0.75rem] font-bold label-tracking text-primary drop-shadow-[0_0_8px_rgba(204,255,0,0.2)]">
              ERP / Inventario / Control de Existencias
            </span>
            <span className="px-2 py-1 rounded-full bg-primary/10 border border-primary/20 text-[9px] font-black label-tracking text-primary">
              AGENTE #5
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tight-tracking text-on-surface">
            Control de Inventarios
          </h1>
          <p className="text-sm text-on-surface-variant">
            {mockERPInventoryStats.total_items} SKUs · Valor total{" "}
            <span className="text-primary font-bold">${(mockERPInventoryStats.total_value / 1_000_000).toFixed(2)}M MXN</span>
          </p>
        </div>
        <div className="flex gap-3 self-start md:self-auto">
          <button
            onClick={() => showToast({ type: "info", title: "Generando reporte", message: "Valuación de inventario → PDF" })}
            className="px-6 py-3 glass-card border-white/5 rounded-2xl text-[10px] font-black label-tracking text-on-surface-variant hover:border-primary/20 transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined !text-[16px]">summarize</span>
            REPORTE
          </button>
          <button
            onClick={() => showToast({ type: "success", title: "Ajuste registrado", message: "Movimiento de inventario creado" })}
            className="px-6 py-3 rounded-2xl bg-primary text-black text-[10px] font-black label-tracking hover:bg-primary/90 transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined !text-[16px]">add_circle</span>
            AJUSTE
          </button>
        </div>
      </header>

      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: "Total SKUs",  value: mockERPInventoryStats.total_items,                          icon: "inventory_2",     color: "text-on-surface"  },
          { label: "En Stock",    value: mockERPInventoryStats.in_stock,                             icon: "check_circle",    color: "text-[#CCFF00]"   },
          { label: "Bajo Stock",  value: mockERPInventoryStats.low_stock,                            icon: "warning",         color: "text-amber-400"   },
          { label: "Agotados",    value: mockERPInventoryStats.out_of_stock,                         icon: "cancel",          color: "text-red-400"     },
          { label: "Valor Total", value: `$${(mockERPInventoryStats.total_value / 1_000_000).toFixed(1)}M`, icon: "account_balance", color: "text-blue-400" },
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

      {/* Alert banner */}
      {urgentCount > 0 && (
        <div className="glass-card rounded-2xl border border-red-400/30 bg-red-400/5 p-5 flex items-center gap-4">
          <span className="material-symbols-outlined !text-[24px] text-red-400">emergency</span>
          <div>
            <p className="text-sm font-black text-red-400">
              {urgentCount} SKU{urgentCount > 1 ? "s" : ""} requieren reabastecimiento urgente
            </p>
            <p className="text-[10px] text-on-surface/40 mt-0.5">
              {counts.out_of_stock} agotados · {counts.low_stock} bajo punto de reorden · Agente #5 genera órdenes automáticamente
            </p>
          </div>
          <button
            onClick={() => showToast({ type: "success", title: "Órdenes generadas", message: `Agente #5 creó ${urgentCount} órdenes de compra` })}
            className="ml-auto px-4 py-2 rounded-xl bg-red-400/10 border border-red-400/20 text-red-400 text-[9px] font-black label-tracking hover:bg-red-400/20 transition-colors whitespace-nowrap flex items-center gap-1"
          >
            <span className="material-symbols-outlined !text-[12px]">auto_fix_high</span>
            REORDER AUTO
          </button>
        </div>
      )}

      {/* Filters + Search */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          {(["all", "in_stock", "low_stock", "out_of_stock", "overstocked"] as FilterKey[]).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black label-tracking transition-all ${
                filter === f ? "bg-primary text-black" : "glass-card border border-white/5 text-on-surface-variant hover:border-primary/20"
              }`}
            >
              {f === "all" ? "TODOS" : f === "in_stock" ? "EN STOCK" : f === "low_stock" ? "BAJO STOCK" : f === "out_of_stock" ? "AGOTADOS" : "SOBRESTOCK"} ({counts[f]})
            </button>
          ))}
        </div>
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface/30 !text-[16px]">search</span>
          <input
            type="text"
            placeholder="Buscar SKU, nombre..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-[11px] font-medium text-on-surface placeholder:text-on-surface/30 focus:border-primary/50 outline-none w-56"
          />
        </div>
      </div>

      {/* Inventory table */}
      <div className="glass-card rounded-[2rem] border border-white/5 overflow-hidden">
        <div className="grid grid-cols-[2fr_1.2fr_1fr_0.8fr_0.8fr_0.8fr_1fr_1fr_auto] gap-3 px-8 py-4 border-b border-white/5">
          {["SKU / Nombre", "Categoría", "Almacén", "Disponible", "Reservado", "Reorder", "Costo Unit.", "Valor Total", ""].map((h, i) => (
            <span key={i} className="text-[9px] font-black label-tracking text-on-surface/30 uppercase">{h}</span>
          ))}
        </div>

        <div className="divide-y divide-white/5">
          {items.map(item => {
            const sCfg = STATUS_CFG[item.status];
            const needsReorder = item.available <= item.reorder_point;
            return (
              <div
                key={item.id}
                className="grid grid-cols-[2fr_1.2fr_1fr_0.8fr_0.8fr_0.8fr_1fr_1fr_auto] gap-3 items-center px-8 py-5 hover:bg-white/[0.02] transition-colors group"
              >
                <div className="min-w-0">
                  <p className="text-xs font-bold text-on-surface truncate">{item.name}</p>
                  <p className="text-[9px] font-mono text-on-surface/30 mt-0.5">{item.sku}</p>
                </div>

                <span className="text-[10px] text-on-surface/60 truncate">{item.category}</span>

                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined !text-[12px] text-primary">warehouse</span>
                  <span className="text-[9px] text-on-surface/60 truncate">{item.warehouse.split(" ")[0]}</span>
                </div>

                <span className={`text-xs font-black ${
                  item.available === 0 ? "text-red-400" : item.available <= item.reorder_point ? "text-amber-400" : "text-[#CCFF00]"
                }`}>{item.available}</span>

                <span className="text-xs font-black text-blue-400">{item.reserved}</span>

                <div className="flex items-center gap-1">
                  <span className={`text-xs font-black ${needsReorder ? "text-red-400" : "text-on-surface/40"}`}>{item.reorder_point}</span>
                  {needsReorder && <span className="material-symbols-outlined !text-[12px] text-red-400">arrow_downward</span>}
                </div>

                <span className="text-xs font-black text-on-surface">${item.unit_cost.toLocaleString()}</span>

                <span className="text-xs font-black text-on-surface">${item.total_value.toLocaleString()}</span>

                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[8px] font-black ${sCfg.color} ${sCfg.bg}`}>
                    <span className="material-symbols-outlined !text-[9px]">{sCfg.icon}</span>
                    {sCfg.label.toUpperCase()}
                  </span>
                  {(item.status === "low_stock" || item.status === "out_of_stock") && (
                    <button
                      onClick={() => showToast({ type: "success", title: "Orden de compra", message: `${item.sku} · ${item.reorder_quantity} uds → ${item.supplier}` })}
                      className="px-2 py-1 rounded-lg bg-primary/10 border border-primary/20 text-primary text-[9px] font-black hover:bg-primary/20 transition-colors whitespace-nowrap"
                    >
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
