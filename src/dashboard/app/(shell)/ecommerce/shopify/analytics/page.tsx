"use client";

import { useState } from "react";
import { useToast } from "@/components/ToastProvider";
import { mockShopifyAnalytics } from "@/lib/mockData";
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

type Period = "7d" | "30d" | "90d";

function fmtDate(iso: string) {
  const d = new Date(iso);
  return `${d.getDate()} ${d.toLocaleDateString("es-MX", { month: "short" })}`;
}
function fmtK(n: number) { return n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${n}`; }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "rgba(8,8,8,0.96)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", padding: "10px 14px" }}>
      <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "9px", fontWeight: 900, marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</p>
      {payload.map((p: { color: string; name: string; value: number }, i: number) => (
        <p key={i} style={{ color: p.color, fontSize: "11px", fontWeight: 900 }}>{p.name}: {typeof p.value === "number" && p.name === "Ventas" ? fmtK(p.value) : p.value}</p>
      ))}
    </div>
  );
}

export default function ShopifyAnalyticsPage() {
  const { showToast } = useToast();
  const [period, setPeriod] = useState<Period>("7d");
  const d = mockShopifyAnalytics;

  const trend = period === "7d" ? d.sales_trend.slice(-7) : d.sales_trend;
  const convRate = (d.summary.total_orders / d.summary.total_sessions * 100).toFixed(1);

  return (
    <div className="space-y-10 animate-in">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <span className="text-[0.75rem] font-bold label-tracking text-[#CCFF00] drop-shadow-[0_0_8px_rgba(204,255,0,0.3)]">
            Channel Intelligence / Shopify / Analytics
          </span>
          <h1 className="text-4xl md:text-5xl font-black tight-tracking text-on-surface">
            Analytics Shopify
          </h1>
          <p className="text-sm text-on-surface-variant">Conversión · Tráfico · Revenue · Cart Recovery</p>
        </div>
        <div className="flex gap-2 self-start md:self-auto">
          {(["7d", "30d", "90d"] as Period[]).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black label-tracking transition-all ${
                period === p ? "bg-primary text-black" : "glass-card border border-white/5 text-on-surface-variant hover:border-[#CCFF00]/20"
              }`}
            >
              {p === "7d" ? "7 DÍAS" : p === "30d" ? "30 DÍAS" : "90 DÍAS"}
            </button>
          ))}
          <button
            onClick={() => showToast({ type: "success", title: "Exportando", message: "Generando reporte Shopify → Excel" })}
            className="px-4 py-2 glass-card border-white/5 rounded-xl text-[10px] font-black label-tracking text-on-surface-variant hover:border-[#CCFF00]/20 transition-all flex items-center gap-1"
          >
            <span className="material-symbols-outlined !text-[14px]">download</span>
            EXPORT
          </button>
        </div>
      </header>

      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Revenue (mes)",   value: `$${(d.summary.total_sales / 1000).toFixed(1)}k`, sub: `+${d.summary.growth_vs_prev}% vs anterior`, subColor: "text-[#CCFF00]", icon: "trending_up",  color: "text-[#CCFF00]"  },
          { label: "Órdenes",         value: d.summary.total_orders,     sub: `${d.summary.total_sessions.toLocaleString()} sesiones`,              subColor: "text-on-surface/30", icon: "receipt_long", color: "text-blue-400"   },
          { label: "Ticket Promedio", value: `$${d.summary.avg_ticket.toFixed(0)}`,             sub: "Valor promedio por orden",                                                subColor: "text-on-surface/30", icon: "payments",     color: "text-amber-400"  },
          { label: "Conversión",      value: `${convRate}%`,                                    sub: `${d.summary.abandoned_carts} carritos abandonados`,                       subColor: "text-red-400",       icon: "funnel",       color: "text-purple-400" },
        ].map(kpi => (
          <div key={kpi.label} className="glass-card rounded-[1.5rem] border border-white/5 p-6 space-y-1">
            <div className="flex items-center gap-3 mb-3">
              <span className={`material-symbols-outlined !text-[18px] ${kpi.color}`}>{kpi.icon}</span>
              <span className="text-[9px] font-black label-tracking text-on-surface/40 uppercase">{kpi.label}</span>
            </div>
            <p className="text-2xl font-black tight-tracking text-on-surface">{kpi.value}</p>
            <p className={`text-[10px] font-bold ${kpi.subColor}`}>{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Sales + Orders dual chart */}
      <div className="glass-card rounded-[2rem] border border-white/5 p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-sm font-black text-on-surface">Tendencia de Ventas y Órdenes</h3>
            <p className="text-[10px] text-on-surface/40 mt-0.5">Revenue diario + volumen de órdenes</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-[#CCFF00] rounded" />
              <span className="text-[9px] text-on-surface/50 font-black">Ventas</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-blue-400 rounded" />
              <span className="text-[9px] text-on-surface/50 font-black">Órdenes</span>
            </div>
          </div>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trend} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tickFormatter={fmtDate} tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 9, fontWeight: 900 }} axisLine={{ stroke: "rgba(255,255,255,0.05)" }} tickLine={false} />
              <YAxis yAxisId="left" tickFormatter={v => fmtK(v as number)} tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 9, fontWeight: 900 }} axisLine={false} tickLine={false} width={48} />
              <YAxis yAxisId="right" orientation="right" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 9, fontWeight: 900 }} axisLine={false} tickLine={false} width={32} />
              <Tooltip content={<ChartTooltip />} />
              <Line yAxisId="left"  type="monotone" dataKey="sales"  name="Ventas"  stroke="#CCFF00" strokeWidth={2.5} dot={false} activeDot={{ r: 4, fill: "#CCFF00" }} />
              <Line yAxisId="right" type="monotone" dataKey="orders" name="Órdenes" stroke="#60a5fa" strokeWidth={2}   dot={false} activeDot={{ r: 3, fill: "#60a5fa" }} strokeDasharray="4 4" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Traffic sources + Top products */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-6">
        {/* Traffic sources horizontal bar */}
        <div className="glass-card rounded-[2rem] border border-white/5 p-8">
          <h3 className="text-sm font-black text-on-surface mb-1">Fuentes de Tráfico</h3>
          <p className="text-[10px] text-on-surface/40 mb-6">Sesiones y conversión</p>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={d.traffic_sources} layout="vertical" margin={{ top: 0, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                <XAxis type="number" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 8, fontWeight: 900 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 9, fontWeight: 900 }} axisLine={false} tickLine={false} width={60} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="sessions" name="Sesiones" radius={[0, 4, 4, 0]}>
                  {d.traffic_sources.map((src, i) => (
                    <Cell key={i} fill={src.conversion >= 4 ? "#CCFF00" : src.conversion >= 3 ? "#60a5fa" : "rgba(255,255,255,0.10)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            {d.traffic_sources.map(src => (
              <div key={src.name} className="flex items-center justify-between">
                <span className="text-[9px] text-on-surface/60">{src.name}</span>
                <div className="flex items-center gap-3">
                  <span className="text-[9px] text-on-surface/40">{src.orders} ord.</span>
                  <span className={`text-[9px] font-black ${src.conversion >= 4 ? "text-[#CCFF00]" : src.conversion >= 3 ? "text-blue-400" : "text-on-surface/50"}`}>{src.conversion}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top products table */}
        <div className="glass-card rounded-[2rem] border border-white/5 p-8">
          <h3 className="text-sm font-black text-on-surface mb-1">Top Productos</h3>
          <p className="text-[10px] text-on-surface/40 mb-6">Por revenue · Mayo 2026</p>
          <div className="space-y-3">
            {d.top_products.map((p, i) => {
              const maxRev = Math.max(...d.top_products.map(x => x.revenue));
              const barPct = (p.revenue / maxRev) * 100;
              return (
                <div key={p.sku} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[9px] font-black text-on-surface/30 w-4 flex-shrink-0">#{i + 1}</span>
                      <p className="text-[10px] font-bold text-on-surface truncate">{p.name.split(" ").slice(0, 4).join(" ")}</p>
                    </div>
                    <div className="text-right flex-shrink-0 ml-4">
                      <p className="text-[10px] font-black text-on-surface">{fmtK(p.revenue)}</p>
                      <p className={`text-[8px] font-black ${p.growth >= 0 ? "text-[#CCFF00]" : "text-red-400"}`}>
                        {p.growth >= 0 ? "+" : ""}{p.growth}%
                      </p>
                    </div>
                  </div>
                  <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${i === 0 ? "bg-[#CCFF00]" : "bg-white/20"}`} style={{ width: `${barPct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Cart recovery */}
      <div className="glass-card rounded-[2rem] border border-white/5 p-8">
        <div className="flex items-center gap-3 mb-8">
          <h3 className="text-sm font-black text-on-surface">Recuperación de Carritos</h3>
          <span className="px-2 py-1 rounded-full bg-purple-400/10 border border-purple-400/20 text-[9px] font-black label-tracking text-purple-400">EMAIL AUTOMATION</span>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: "Carritos Abandonados", value: d.cart_recovery.abandoned,                        color: "text-red-400"     },
            { label: "Recuperados",           value: d.cart_recovery.recovered,                        color: "text-[#CCFF00]"   },
            { label: "Tasa Recuperación",     value: `${d.cart_recovery.recovery_rate}%`,              color: "text-blue-400"    },
            { label: "Revenue Recuperado",    value: `$${(d.cart_recovery.recovered_revenue / 1000).toFixed(1)}k`, color: "text-amber-400" },
          ].map(s => (
            <div key={s.label}>
              <p className="text-[9px] font-black label-tracking text-on-surface/30 uppercase mb-1">{s.label}</p>
              <p className={`text-2xl font-black tight-tracking ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 pt-6 border-t border-white/5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] font-black label-tracking text-on-surface/30 uppercase">Tasa recuperación</span>
            <span className="text-[9px] font-black text-blue-400">{d.cart_recovery.recovery_rate}%</span>
          </div>
          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-blue-400 rounded-full" style={{ width: `${d.cart_recovery.recovery_rate}%` }} />
          </div>
        </div>
      </div>

      <div className="h-10" />
    </div>
  );
}
