"use client";

import { useState } from "react";
import { useToast } from "@/components/ToastProvider";
import { mockPriceRules, mockPriceRulesStats, mockPriceChanges } from "@/lib/mockData";
import type { PriceRule } from "@/lib/mockData";

const TYPE_CFG: Record<PriceRule["type"], { label: string; color: string; bg: string; icon: string; desc: string }> = {
  markup:     { label: "Markup",     color: "text-[#CCFF00]",  bg: "bg-[#CCFF00]/10",  icon: "add_circle",     desc: "% sobre costo"       },
  margin:     { label: "Margen",     color: "text-blue-400",   bg: "bg-blue-400/10",   icon: "percent",        desc: "Margen objetivo"     },
  competitor: { label: "Competencia", color: "text-amber-400", bg: "bg-amber-400/10",  icon: "compare_arrows", desc: "Precio vs competidor" },
  dynamic:    { label: "Dinámico",   color: "text-purple-400", bg: "bg-purple-400/10", icon: "auto_fix_high",  desc: "Ajuste automático"   },
};

const CHANNEL_COLOR: Record<string, string> = {
  "Mercado Libre": "text-yellow-400",
  "Amazon":        "text-orange-400",
  "Shopify":       "text-[#CCFF00]",
};

function fmtDate(iso: string) {
  const d = new Date(iso);
  return `${d.getDate()}/${d.getMonth() + 1} ${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default function PricingPage() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<"rules" | "changes">("rules");

  return (
    <div className="space-y-10 animate-in">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="text-[0.75rem] font-bold label-tracking text-[#CCFF00] drop-shadow-[0_0_8px_rgba(204,255,0,0.2)]">
              E-commerce / Gestión / Precios
            </span>
            <span className="px-2 py-1 rounded-full bg-primary/10 border border-primary/20 text-[9px] font-black label-tracking text-primary">
              AGENTE #6
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tight-tracking text-on-surface">
            Gestión de Precios
          </h1>
          <p className="text-sm text-on-surface-variant">
            {mockPriceRulesStats.active_rules} reglas activas ·{" "}
            <span className="text-[#CCFF00] font-bold">{mockPriceRulesStats.products_covered}</span> productos cubiertos ·{" "}
            <span className="text-blue-400 font-bold">{mockPriceRulesStats.changes_today}</span> cambios hoy
          </p>
        </div>
        <div className="flex gap-3 self-start md:self-auto">
          <button
            onClick={() => showToast({ type: "success", title: "Re-pricing ejecutado", message: `Agente #6 actualizó ${mockPriceRulesStats.products_covered} precios` })}
            className="px-6 py-3 rounded-2xl bg-primary text-black text-[10px] font-black label-tracking hover:bg-primary/90 transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined !text-[16px]">refresh</span>
            RE-PRICING AUTO
          </button>
        </div>
      </header>

      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { label: "Reglas Activas",      value: `${mockPriceRulesStats.active_rules} / ${mockPriceRulesStats.total_rules}`, icon: "rule",         color: "text-[#CCFF00]"  },
          { label: "Productos Cubiertos", value: mockPriceRulesStats.products_covered,                                        icon: "inventory_2",  color: "text-blue-400"   },
          { label: "Margen Promedio",     value: `${mockPriceRulesStats.avg_margin}%`,                                        icon: "percent",      color: "text-amber-400"  },
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

      {/* Tab switcher */}
      <div className="flex gap-2">
        {(["rules", "changes"] as const).map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`px-5 py-2.5 rounded-xl text-[10px] font-black label-tracking transition-all ${
              activeTab === t
                ? "bg-primary text-black"
                : "glass-card border border-white/5 text-on-surface-variant hover:border-[#CCFF00]/20"
            }`}
          >
            {t === "rules" ? "REGLAS DE PRECIO" : "HISTORIAL CAMBIOS"}
          </button>
        ))}
      </div>

      {/* Rules tab */}
      {activeTab === "rules" && (
        <div className="space-y-4">
          {mockPriceRules.map(rule => {
            const tCfg = TYPE_CFG[rule.type];
            return (
              <div key={rule.id} className="glass-card rounded-[2rem] border border-white/5 p-6 hover:bg-white/[0.02] transition-colors group">
                <div className="flex items-start gap-5">
                  {/* Type icon */}
                  <div className={`flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center ${tCfg.bg} border border-white/5`}>
                    <span className={`material-symbols-outlined !text-[20px] ${tCfg.color}`}>{tCfg.icon}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <h3 className="text-sm font-black text-on-surface">{rule.name}</h3>
                          <span className={`px-2 py-0.5 rounded-full text-[8px] font-black ${tCfg.color} ${tCfg.bg}`}>
                            {tCfg.label.toUpperCase()}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[8px] font-black ${
                            rule.status === "active"
                              ? "text-[#CCFF00] bg-[#CCFF00]/10"
                              : "text-on-surface/40 bg-white/5"
                          }`}>
                            {rule.status === "active" ? "ACTIVA" : "PAUSADA"}
                          </span>
                        </div>
                        <p className="text-[10px] text-on-surface/40">{tCfg.desc}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs font-black text-on-surface">{rule.products_affected} productos</p>
                        <p className="text-[9px] text-on-surface/30 mt-0.5">Última vez {fmtDate(rule.last_applied)}</p>
                      </div>
                    </div>

                    {/* Config pills */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {rule.rule_config.base && (
                        <span className="px-2.5 py-1 rounded-xl bg-white/5 border border-white/5 text-[9px] font-black text-on-surface/60">
                          Base: {rule.rule_config.base}
                        </span>
                      )}
                      {rule.rule_config.markup_pct !== undefined && (
                        <span className="px-2.5 py-1 rounded-xl bg-[#CCFF00]/10 border border-[#CCFF00]/20 text-[9px] font-black text-[#CCFF00]">
                          +{rule.rule_config.markup_pct}% markup
                        </span>
                      )}
                      {rule.rule_config.margin_pct !== undefined && (
                        <span className="px-2.5 py-1 rounded-xl bg-blue-400/10 border border-blue-400/20 text-[9px] font-black text-blue-400">
                          {rule.rule_config.margin_pct}% margen
                        </span>
                      )}
                      {rule.rule_config.min_price !== undefined && (
                        <span className="px-2.5 py-1 rounded-xl bg-white/5 border border-white/5 text-[9px] font-bold text-on-surface/50">
                          Min ${rule.rule_config.min_price.toLocaleString()}
                        </span>
                      )}
                      {rule.rule_config.max_price !== undefined && (
                        <span className="px-2.5 py-1 rounded-xl bg-white/5 border border-white/5 text-[9px] font-bold text-on-surface/50">
                          Max ${rule.rule_config.max_price.toLocaleString()}
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => showToast({ type: "success", title: "Regla aplicada", message: `"${rule.name}" → ${rule.products_affected} productos actualizados` })}
                        className="px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/20 text-primary text-[9px] font-black hover:bg-primary/20 transition-colors flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined !text-[11px]">play_arrow</span>
                        APLICAR
                      </button>
                      <button
                        onClick={() => showToast({
                          type: rule.status === "active" ? "warning" : "success",
                          title: rule.status === "active" ? "Regla pausada" : "Regla activada",
                          message: `"${rule.name}" → ${rule.status === "active" ? "pausada" : "activa"}`,
                        })}
                        className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-on-surface/60 text-[9px] font-black hover:bg-white/10 transition-colors flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined !text-[11px]">{rule.status === "active" ? "pause" : "play_arrow"}</span>
                        {rule.status === "active" ? "PAUSAR" : "ACTIVAR"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* New rule CTA */}
          <button
            onClick={() => showToast({ type: "info", title: "Constructor de reglas", message: "Agente #6 abriendo wizard de nueva regla" })}
            className="w-full glass-card rounded-[2rem] border border-dashed border-white/10 p-6 flex items-center justify-center gap-3 hover:border-primary/30 hover:bg-white/[0.02] transition-all text-on-surface/30 hover:text-on-surface/60"
          >
            <span className="material-symbols-outlined !text-[20px]">add_circle</span>
            <span className="text-[10px] font-black label-tracking">NUEVA REGLA DE PRECIO</span>
          </button>
        </div>
      )}

      {/* Changes tab */}
      {activeTab === "changes" && (
        <div className="glass-card rounded-[2rem] border border-white/5 overflow-hidden">
          <div className="grid grid-cols-[1.5fr_1.2fr_1fr_0.8fr_0.8fr_1.2fr_1fr] gap-3 px-8 py-4 border-b border-white/5">
            {["Producto / SKU", "Canal", "Precio Ant.", "Precio Nuevo", "Cambio", "Razón", "Hora"].map((h, i) => (
              <span key={i} className="text-[9px] font-black label-tracking text-on-surface/30 uppercase">{h}</span>
            ))}
          </div>
          <div className="divide-y divide-white/5">
            {mockPriceChanges.map((c, i) => (
              <div
                key={i}
                className="grid grid-cols-[1.5fr_1.2fr_1fr_0.8fr_0.8fr_1.2fr_1fr] gap-3 items-center px-8 py-4 hover:bg-white/[0.02] transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-on-surface truncate">
                    {c.product_name.split(" ").slice(0, 3).join(" ")}
                  </p>
                  <p className="text-[8px] font-mono text-on-surface/30">{c.sku}</p>
                </div>
                <span className={`text-[10px] font-black ${CHANNEL_COLOR[c.channel] ?? "text-on-surface/60"}`}>
                  {c.channel}
                </span>
                <span className="text-[10px] font-bold text-on-surface/50">${c.old_price.toLocaleString()}</span>
                <span className="text-[10px] font-black text-on-surface">${c.new_price.toLocaleString()}</span>
                <span className={`text-[10px] font-black ${c.change_pct >= 0 ? "text-[#CCFF00]" : "text-red-400"}`}>
                  {c.change_pct >= 0 ? "+" : ""}{c.change_pct}%
                </span>
                <span className="text-[9px] text-on-surface/50 truncate">{c.reason}</span>
                <span className="text-[9px] text-on-surface/30">{fmtDate(c.applied_at)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="h-10" />
    </div>
  );
}
