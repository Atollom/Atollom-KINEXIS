"use client";

import { useState } from "react";
import { useToast } from "@/components/ToastProvider";
import { mockFBAShipments, mockAmazonStats, mockAmazonInventory } from "@/lib/mockData";
import type { FBAShipment } from "@/lib/mockData";

type FilterKey = "all" | "active" | "closed";

const STATUS_CFG: Record<FBAShipment["status"], { label: string; color: string; bg: string; icon: string; step: number }> = {
  working:    { label: "Preparando",   color: "text-amber-400",   bg: "bg-amber-400/10",   icon: "package_2",       step: 1 },
  shipped:    { label: "Enviado",      color: "text-blue-400",    bg: "bg-blue-400/10",    icon: "local_shipping",  step: 2 },
  in_transit: { label: "En Tránsito", color: "text-blue-400",    bg: "bg-blue-400/10",    icon: "flight_takeoff",  step: 3 },
  receiving:  { label: "Recibiendo",  color: "text-orange-400",  bg: "bg-orange-400/10",  icon: "inventory",       step: 4 },
  closed:     { label: "Cerrado",     color: "text-on-surface/40", bg: "bg-white/5",       icon: "check_circle",   step: 5 },
};

const STEPS = ["Preparando", "Enviado", "En Tránsito", "Recibiendo", "Cerrado"];

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
}

export default function AmazonFBAPage() {
  const { showToast } = useToast();
  const [filter, setFilter] = useState<FilterKey>("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  const shipments = filter === "active"
    ? mockFBAShipments.filter(s => s.status !== "closed")
    : filter === "closed"
    ? mockFBAShipments.filter(s => s.status === "closed")
    : mockFBAShipments;

  const counts = {
    all:    mockFBAShipments.length,
    active: mockFBAShipments.filter(s => s.status !== "closed").length,
    closed: mockFBAShipments.filter(s => s.status === "closed").length,
  };

  const totalUnitsInFC = mockAmazonInventory.reduce((s, i) => s + i.quantity, 0);
  const unfulfillable  = mockAmazonInventory.reduce((s, i) => s + i.unfulfillable, 0);
  const inbound        = mockAmazonInventory.reduce((s, i) => s + i.inbound, 0);

  function handleCreateShipment() {
    showToast({ type: "success", title: "Plan de envío creado", message: "Agente #2 generó el plan FBA · Revisa items" });
  }

  return (
    <div className="space-y-10 animate-in">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="text-[0.75rem] font-bold label-tracking text-orange-400 drop-shadow-[0_0_8px_rgba(251,146,60,0.3)]">
              Channel Intelligence / Amazon / FBA Manager
            </span>
            <span className="px-2 py-1 rounded-full bg-orange-400/10 border border-orange-400/20 text-[9px] font-black label-tracking text-orange-400">
              AGENTE #2
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tight-tracking text-on-surface">
            FBA Manager
          </h1>
          <p className="text-sm text-on-surface-variant">
            Reabastecimiento automático · Fulfillment by Amazon
          </p>
        </div>
        <button onClick={handleCreateShipment}
          className="px-8 py-4 rounded-2xl bg-orange-400 text-black text-[10px] font-black label-tracking hover:bg-orange-400/90 transition-all flex items-center gap-2 self-start md:self-auto"
        >
          <span className="material-symbols-outlined !text-[16px]">add_box</span>
          NUEVO SHIPMENT
        </button>
      </header>

      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Unidades en FC",    value: totalUnitsInFC,                       icon: "warehouse",      color: "text-orange-400"   },
          { label: "Inbound",           value: inbound,                              icon: "flight_land",    color: "text-blue-400"     },
          { label: "Shipments Activos", value: counts.active,                        icon: "local_shipping", color: "text-[#CCFF00]"    },
          { label: "No Vendibles",      value: unfulfillable,                        icon: "block",          color: "text-red-400"      },
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

      {/* Filters */}
      <div className="flex gap-2">
        {(["all", "active", "closed"] as FilterKey[]).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-[10px] font-black label-tracking transition-all ${
              filter === f ? "bg-primary text-black" : "glass-card border border-white/5 text-on-surface-variant hover:border-orange-400/20"
            }`}
          >
            {f === "all" ? "TODOS" : f === "active" ? "ACTIVOS" : "CERRADOS"} ({counts[f]})
          </button>
        ))}
      </div>

      {/* Shipment cards */}
      <div className="space-y-4">
        {shipments.map(s => {
          const cfg = STATUS_CFG[s.status];
          const isOpen = expanded === s.id;
          const receiveProgress = s.status === "receiving"
            ? Math.round((s.items.reduce((a, i) => a + i.quantity_received, 0) / s.total_units) * 100)
            : 0;

          return (
            <div key={s.id}
              className={`glass-card rounded-[2rem] border transition-colors overflow-hidden ${
                s.status === "closed" ? "border-white/5 opacity-60" : "border-orange-400/10"
              }`}
            >
              {/* Shipment header row */}
              <div className="flex items-center justify-between px-8 py-6 cursor-pointer"
                onClick={() => setExpanded(isOpen ? null : s.id)}
              >
                <div className="flex items-center gap-5 min-w-0 flex-1">
                  <span className={`material-symbols-outlined !text-[24px] ${cfg.color}`}>{cfg.icon}</span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <p className="text-[10px] font-black text-on-surface/50 font-mono">{s.shipment_id}</p>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-black ${cfg.color} ${cfg.bg}`}>
                        {cfg.label.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-on-surface truncate">{s.name}</p>
                    <p className="text-[10px] text-on-surface/40 mt-0.5">
                      <span className="material-symbols-outlined !text-[12px] align-middle">location_on</span>
                      {" "}{s.destination_fc}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-8 flex-shrink-0">
                  <div className="text-right hidden md:block">
                    <p className="text-[9px] font-black label-tracking text-on-surface/30 uppercase">Unidades</p>
                    <p className="text-xl font-black tight-tracking text-on-surface">{s.total_units}</p>
                  </div>
                  <div className="text-right hidden md:block">
                    <p className="text-[9px] font-black label-tracking text-on-surface/30 uppercase">Creado</p>
                    <p className="text-xs text-on-surface/60">{fmtDate(s.created_date)}</p>
                    {s.ship_date && <p className="text-[9px] text-on-surface/30">Enviado {fmtDate(s.ship_date)}</p>}
                  </div>
                  <span className={`material-symbols-outlined !text-[20px] text-on-surface/30 transition-transform ${isOpen ? "rotate-180" : ""}`}>
                    expand_more
                  </span>
                </div>
              </div>

              {/* Progress bar for receiving */}
              {s.status === "receiving" && (
                <div className="px-8 pb-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] font-black label-tracking text-orange-400 uppercase">Recepción en progreso</span>
                    <span className="text-[9px] font-black text-on-surface/60">{receiveProgress}%</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-orange-400 rounded-full transition-all" style={{ width: `${receiveProgress}%` }} />
                  </div>
                </div>
              )}

              {/* Progress steps */}
              {isOpen && (
                <div className="border-t border-white/5 px-8 py-6 space-y-6">
                  {/* Step tracker */}
                  <div className="flex items-center gap-2">
                    {STEPS.map((step, idx) => {
                      const done = cfg.step > idx + 1;
                      const active = cfg.step === idx + 1;
                      return (
                        <div key={step} className="flex items-center gap-2 flex-1 last:flex-none">
                          <div className="flex flex-col items-center gap-1">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                              done ? "bg-[#CCFF00] text-black" : active ? "bg-orange-400 text-black" : "bg-white/5 border border-white/10"
                            }`}>
                              {done
                                ? <span className="material-symbols-outlined !text-[14px]">check</span>
                                : <span className={`text-[10px] font-black ${active ? "text-black" : "text-on-surface/20"}`}>{idx + 1}</span>
                              }
                            </div>
                            <span className={`text-[8px] font-black label-tracking text-center whitespace-nowrap ${
                              active ? "text-orange-400" : done ? "text-on-surface/40" : "text-on-surface/20"
                            }`}>{step.toUpperCase()}</span>
                          </div>
                          {idx < STEPS.length - 1 && (
                            <div className={`h-px flex-1 mb-4 ${done ? "bg-[#CCFF00]/40" : "bg-white/5"}`} />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Items */}
                  <div>
                    <p className="text-[9px] font-black label-tracking text-on-surface/30 uppercase mb-3">Productos</p>
                    <div className="space-y-2">
                      {s.items.map((item, i) => (
                        <div key={i} className="flex items-center justify-between py-3 px-4 bg-white/[0.02] rounded-xl border border-white/5">
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-on-surface truncate">{item.title}</p>
                            <p className="text-[9px] text-on-surface/30 font-mono">{item.sku}</p>
                          </div>
                          <div className="flex items-center gap-6 flex-shrink-0 ml-4">
                            <div className="text-right">
                              <p className="text-[9px] text-on-surface/30 uppercase label-tracking">Enviado</p>
                              <p className="text-xs font-black text-on-surface">{item.quantity_shipped}</p>
                            </div>
                            {item.quantity_received > 0 && (
                              <div className="text-right">
                                <p className="text-[9px] text-on-surface/30 uppercase label-tracking">Recibido</p>
                                <p className="text-xs font-black text-[#CCFF00]">{item.quantity_received}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tracking */}
                  {s.tracking_number && (
                    <div className="flex items-center gap-3 py-3 px-4 bg-white/[0.02] rounded-xl border border-white/5">
                      <span className="material-symbols-outlined !text-[16px] text-on-surface/40">local_shipping</span>
                      <div>
                        <p className="text-[9px] text-on-surface/30 label-tracking uppercase">Tracking Number</p>
                        <p className="text-xs font-black text-on-surface font-mono">{s.tracking_number}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="h-10" />
    </div>
  );
}
