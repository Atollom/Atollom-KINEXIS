"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/components/ToastProvider";
import { mockMLAnalytics } from "@/lib/mockData";

type MLAnalyticsData = typeof mockMLAnalytics;
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

type Period = "7d" | "30d" | "90d";
const COLORS = ["#CCFF00", "#60a5fa", "#fbbf24", "#c084fc", "#fb923c"];

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
        <p key={i} style={{ color: p.color, fontSize: "11px", fontWeight: 900 }}>{p.name}: {fmtK(p.value)}</p>
      ))}
    </div>
  );
}

export default function MLAnalyticsPage() {
  const { showToast } = useToast();
  const [period, setPeriod] = useState<Period>("7d");
  const [analytics, setAnalytics] = useState<MLAnalyticsData>(mockMLAnalytics);

  useEffect(() => {
    fetch("/api/ml/analytics")
      .then(r => r.json())
      .then(d => { if (d.summary) setAnalytics(d); })
      .catch(() => {});
  }, []);

  const d = analytics;
  const trend = period === "7d" ? d.sales_trend.slice(-7) : d.sales_trend;

  return (
    <div className="space-y-10 animate-in">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <span className="text-[0.75rem] font-bold label-tracking text-yellow-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.3)]">
            Channel Intelligence / Mercado Libre / Analytics
          </span>
          <h1 className="text-4xl md:text-5xl font-black tight-tracking text-on-surface">
            Analytics ML
          </h1>
          <p className="text-sm text-on-surface-variant">Rendimiento de ventas · GMV · Conversión</p>
        </div>
        <div className="flex gap-2 self-start md:self-auto">
          {(["7d", "30d", "90d"] as Period[]).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black label-tracking transition-all ${
                period === p ? "bg-yellow-400 text-black" : "glass-card border border-white/5 text-on-surface-variant hover:border-yellow-400/20"
              }`}
            >
              {p === "7d" ? "7 DÍAS" : p === "30d" ? "30 DÍAS" : "90 DÍAS"}
            </button>
          ))}
          <button
            onClick={() => showToast({ type: "success", title: "Exportando", message: "Generando reporte ML → Excel" })}
            className="px-4 py-2 glass-card border-white/5 rounded-xl text-[10px] font-black label-tracking text-on-surface-variant hover:border-yellow-400/20 transition-all flex items-center gap-1"
          >
            <span className="material-symbols-outlined !text-[14px]">download</span>
            EXPORT
          </button>
        </div>
      </header>

      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "GMV (mes)",       value: `$${(d.summary.total_sales / 1000).toFixed(1)}k`, sub: `+${d.summary.growth_vs_prev}% vs anterior`, subColor: "text-[#CCFF00]", icon: "trending_up",  color: "text-yellow-400" },
          { label: "Órdenes",         value: d.summary.total_orders,   sub: `${d.summary.active_listings} listings activos`,     subColor: "text-on-surface/30", icon: "receipt_long", color: "text-blue-400"   },
          { label: "Ticket Promedio", value: `$${d.summary.avg_ticket.toFixed(0)}`,            sub: "Por orden",                                        subColor: "text-on-surface/30", icon: "payments",     color: "text-[#CCFF00]"  },
          { label: "Conversión",      value: `${d.summary.conversion_rate}%`,                  sub: "Visitas → ventas",                                 subColor: "text-on-surface/30", icon: "funnel",       color: "text-amber-400"  },
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

      {/* Sales trend */}
      <div className="glass-card rounded-[2rem] border border-white/5 p-8">
        <div className="mb-6">
          <h3 className="text-sm font-black text-on-surface">Tendencia de Ventas</h3>
          <p className="text-[10px] text-on-surface/40 mt-0.5">Revenue diario · Mercado Libre</p>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trend} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="date"
                tickFormatter={fmtDate}
                tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 9, fontWeight: 900 }}
                axisLine={{ stroke: "rgba(255,255,255,0.05)" }}
                tickLine={false}
              />
              <YAxis
                tickFormatter={v => fmtK(v as number)}
                tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 9, fontWeight: 900 }}
                axisLine={false}
                tickLine={false}
                width={48}
              />
              <Tooltip content={<ChartTooltip />} />
              <Line type="monotone" dataKey="sales" name="Ventas" stroke="#fbbf24" strokeWidth={2.5} dot={false} activeDot={{ r: 4, fill: "#fbbf24" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top products + Listing types */}
      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-6">
        {/* Horizontal bar - top products */}
        <div className="glass-card rounded-[2rem] border border-white/5 p-8">
          <h3 className="text-sm font-black text-on-surface mb-1">Top Productos por Revenue</h3>
          <p className="text-[10px] text-on-surface/40 mb-6">Mayo 2026</p>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={d.top_products} layout="vertical" margin={{ top: 0, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                <XAxis type="number" tickFormatter={v => fmtK(v as number)} tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 8, fontWeight: 900 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="sku" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 8, fontWeight: 900 }} axisLine={false} tickLine={false} width={84} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="revenue" name="Revenue" radius={[0, 4, 4, 0]}>
                  {d.top_products.map((_, i) => (
                    <Cell key={i} fill={i === 0 ? "#fbbf24" : "rgba(255,255,255,0.10)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie - listing types */}
        <div className="glass-card rounded-[2rem] border border-white/5 p-8">
          <h3 className="text-sm font-black text-on-surface mb-1">Tipos de Publicación</h3>
          <p className="text-[10px] text-on-surface/40 mb-4">Por cantidad de listings activos</p>
          <div className="h-36">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={d.listing_types} cx="50%" cy="50%" innerRadius={36} outerRadius={60} dataKey="value" paddingAngle={4}>
                  {d.listing_types.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 mt-3">
            {d.listing_types.map((t, i) => (
              <div key={t.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-[10px] font-bold text-on-surface">{t.name}</span>
                </div>
                <span className="text-[9px] font-black text-on-surface/50">{t.value} · {t.percentage}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Questions stats */}
      <div className="glass-card rounded-[2rem] border border-white/5 p-8">
        <div className="flex items-center gap-3 mb-6">
          <h3 className="text-sm font-black text-on-surface">Preguntas & Respuestas</h3>
          <span className="px-2 py-1 rounded-full bg-yellow-400/10 border border-yellow-400/20 text-[9px] font-black label-tracking text-yellow-400">AGENTE #27</span>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: "Total Preguntas",  value: d.questions_stats.total,              color: "text-on-surface"  },
            { label: "Respondidas",       value: d.questions_stats.answered,           color: "text-[#CCFF00]"   },
            { label: "Tasa Respuesta",    value: `${d.questions_stats.answer_rate}%`, color: "text-blue-400"    },
            { label: "Tiempo Promedio",   value: d.questions_stats.avg_response_time, color: "text-amber-400"   },
          ].map(s => (
            <div key={s.label}>
              <p className="text-[9px] font-black label-tracking text-on-surface/30 uppercase mb-1">{s.label}</p>
              <p className={`text-2xl font-black tight-tracking ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="h-10" />
    </div>
  );
}
