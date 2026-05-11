"use client";

import { useState } from "react";
import { useToast } from "@/components/ToastProvider";
import { mockAmazonInventory, mockAmazonStats } from "@/lib/mockData";

type FilterKey = "all" | "standard" | "oversize" | "aging";

const AGING_WARN  = 180;
const AGING_ALERT = 365;

function ageColor(days: number) {
  if (days >= AGING_ALERT) return "text-red-400";
  if (days >= AGING_WARN)  return "text-amber-400";
  return "text-on-surface";
}

export default function AmazonInventoryPage() {
  const { showToast } = useToast();
  const [filter, setFilter] = useState<FilterKey>("all");

  const items = mockAmazonInventory.filter(item =>
    filter === "all"      ? true :
    filter === "standard" ? item.storage_type === "standard" :
    filter === "oversize" ? item.storage_type === "oversize" :
    /* aging */              item.age_days >= AGING_WARN
  );

  const counts = {
    all:      mockAmazonInventory.length,
    standard: mockAmazonInventory.filter(i => i.storage_type === "standard").length,
    oversize: mockAmazonInventory.filter(i => i.storage_type === "oversize").length,
    aging:    mockAmazonInventory.filter(i => i.age_days >= AGING_WARN).length,
  };

  const totalUnits       = mockAmazonInventory.reduce((s, i) => s + i.quantity, 0);
  const totalReserved    = mockAmazonInventory.reduce((s, i) => s + i.reserved, 0);
  const totalInbound     = mockAmazonInventory.reduce((s, i) => s + i.inbound, 0);
  const totalUnfulfill   = mockAmazonInventory.reduce((s, i) => s + i.unfulfillable, 0);

  return (
    <div className="space-y-10 animate-in">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <span className="text-[0.75rem] font-bold label-tracking text-orange-400 drop-shadow-[0_0_8px_rgba(251,146,60,0.3)]">
            Channel Intelligence / Amazon / Inventario FBA
          </span>
          <h1 className="text-4xl md:text-5xl font-black tight-tracking text-on-surface">
            Inventario Amazon
          </h1>
          <p className="text-sm text-on-surface-variant">
            Posición en Fulfillment Centers · Valor total <span className="text-primary font-bold">${mockAmazonStats.total_inventory_value.toLocaleString()} USD</span>
          </p>
        </div>
        <button
          onClick={() => showToast({ type: "info", title: "Inventario sincronizado", message: "Datos actualizados desde Seller Central" })}
          className="px-8 py-4 glass-card border-white/5 rounded-2xl text-[10px] font-black label-tracking text-on-surface-variant hover:text-on-surface hover:border-orange-400/20 transition-all flex items-center gap-2 self-start md:self-auto"
        >
          <span className="material-symbols-outlined !text-[16px]">sync</span>
          ACTUALIZAR
        </button>
      </header>

      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Disponibles",     value: totalUnits,     icon: "inventory_2",    color: "text-[#CCFF00]"  },
          { label: "Reservados",      value: totalReserved,  icon: "lock",           color: "text-blue-400"   },
          { label: "Inbound",         value: totalInbound,   icon: "flight_land",    color: "text-amber-400"  },
          { label: "No Vendibles",    value: totalUnfulfill, icon: "block",          color: "text-red-400"    },
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

      {/* Aging alert banner */}
      {counts.aging > 0 && (
        <div className="glass-card rounded-2xl border border-amber-400/30 bg-amber-400/5 p-5 flex items-center gap-4">
          <span className="material-symbols-outlined !text-[24px] text-amber-400">schedule</span>
          <div>
            <p className="text-sm font-black text-amber-400">
              {counts.aging} SKU{counts.aging > 1 ? "s" : ""} con antigüedad +{AGING_WARN} días
            </p>
            <p className="text-[10px] text-on-surface/40 mt-0.5">
              Amazon aplica cargos de almacenamiento a largo plazo a partir del día 181. Considera liquidar o crear una remoción.
            </p>
          </div>
          <button
            onClick={() => showToast({ type: "warning", title: "Orden de remoción", message: "Creando remoción de inventario antiguo → Agente #2" })}
            className="ml-auto px-4 py-2 rounded-xl bg-amber-400/10 border border-amber-400/20 text-amber-400 text-[9px] font-black label-tracking hover:bg-amber-400/20 transition-colors whitespace-nowrap flex items-center gap-1"
          >
            <span className="material-symbols-outlined !text-[12px]">undo</span>
            REMOVER
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {(["all", "standard", "oversize", "aging"] as FilterKey[]).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-[10px] font-black label-tracking transition-all ${
              filter === f ? "bg-primary text-black" : "glass-card border border-white/5 text-on-surface-variant hover:border-orange-400/20"
            }`}
          >
            {f === "all" ? "TODOS" : f === "standard" ? "STANDARD" : f === "oversize" ? "OVERSIZE" : "ANTIGÜEDAD"}{" "}
            ({counts[f]})
          </button>
        ))}
      </div>

      {/* Inventory table */}
      <div className="glass-card rounded-[2rem] border border-white/5 overflow-hidden">
        <div className="grid grid-cols-[2.5fr_1fr_1fr_1fr_1fr_1fr_1fr_auto] gap-3 px-8 py-4 border-b border-white/5">
          {["SKU / FNSKU", "FC", "Disponibles", "Reservados", "Inbound", "No Vendibles", "Antigüedad", ""].map((h, i) => (
            <span key={i} className="text-[9px] font-black label-tracking text-on-surface/30 uppercase">{h}</span>
          ))}
        </div>

        <div className="divide-y divide-white/5">
          {items.map(item => (
            <div key={item.sku}
              className="grid grid-cols-[2.5fr_1fr_1fr_1fr_1fr_1fr_1fr_auto] gap-3 items-center px-8 py-5 hover:bg-white/[0.02] transition-colors group"
            >
              {/* SKU */}
              <div className="min-w-0">
                <p className="text-xs font-bold text-on-surface truncate">{item.title}</p>
                <p className="text-[9px] font-mono text-on-surface/30 mt-0.5">{item.sku}</p>
                <p className="text-[9px] font-mono text-on-surface/20">{item.fnsku}</p>
              </div>

              {/* FC */}
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined !text-[12px] text-orange-400">warehouse</span>
                <span className="text-[10px] font-black text-on-surface/70">{item.fulfillment_center}</span>
              </div>

              {/* Disponibles */}
              <span className={`text-xs font-black ${
                item.quantity === 0 ? "text-red-400" : item.quantity < 20 ? "text-amber-400" : "text-[#CCFF00]"
              }`}>{item.quantity}</span>

              {/* Reservados */}
              <span className="text-xs font-black text-blue-400">{item.reserved}</span>

              {/* Inbound */}
              <span className="text-xs font-black text-on-surface/60">{item.inbound || "—"}</span>

              {/* No vendibles */}
              <span className={`text-xs font-black ${item.unfulfillable > 0 ? "text-red-400" : "text-on-surface/20"}`}>
                {item.unfulfillable || "—"}
              </span>

              {/* Age */}
              <div className="flex items-center gap-1">
                <span className={`text-xs font-black ${ageColor(item.age_days)}`}>{item.age_days} días</span>
                {item.age_days >= AGING_WARN && (
                  <span className="material-symbols-outlined !text-[12px] text-amber-400">schedule</span>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className={`inline-flex px-2 py-1 rounded-full text-[8px] font-black ${
                  item.storage_type === "oversize"
                    ? "bg-purple-400/10 text-purple-400"
                    : "bg-white/5 text-on-surface/40"
                }`}>{item.storage_type.toUpperCase()}</span>
                {item.unfulfillable > 0 && (
                  <button
                    onClick={() => showToast({ type: "warning", title: "Remoción solicitada", message: `${item.sku} · ${item.unfulfillable} unidades no vendibles` })}
                    className="px-2 py-1 rounded-lg bg-red-400/10 border border-red-400/20 text-red-400 text-[9px] font-black hover:bg-red-400/20 transition-colors"
                  >
                    REMOVER
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="h-10" />
    </div>
  );
}
