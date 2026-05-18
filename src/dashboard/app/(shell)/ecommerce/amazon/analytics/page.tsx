"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/components/ToastProvider";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

type Period = "7d" | "30d" | "90d";
const COLORS_PIE = ["#fb923c", "#60a5fa"];
const FEE_COLORS = ["#fb923c", "#60a5fa", "#c084fc", "#fbbf24"];

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

const FALLBACK = {
  source: 'sandbox',
  summary: { total_sales: 67543, total_orders: 187, avg_ticket: 361.20, conversion_rate: 4.8, growth_vs_prev: 18.3, fba_percentage: 73, avg_profit_margin: 38.5 },
  sales_trend: [
    { date: '2026-05-04', sales: 8200, orders: 24, avg_ticket: 342 },
    { date: '2026-05-05', sales: 9100, orders: 28, avg_ticket: 325 },
    { date: '2026-05-06', sales: 7900, orders: 20, avg_ticket: 395 },
    { date: '2026-05-07', sales: 6500, orders: 16, avg_ticket: 406 },
    { date: '2026-05-08', sales: 7400, orders: 19, avg_ticket: 389 },
    { date: '2026-05-09', sales: 6800, orders: 18, avg_ticket: 378 },
    { date: '2026-05-10', sales: 7543, orders: 20, avg_ticket: 377 },
  ],
  monthly_sales: [
    { month: 'Nov 2025', revenue: 41200, units: 312 }, { month: 'Dic 2025', revenue: 58900, units: 445 },
    { month: 'Ene 2026', revenue: 38750, units: 294 }, { month: 'Feb 2026', revenue: 44100, units: 334 },
    { month: 'Mar 2026', revenue: 52300, units: 396 }, { month: 'Abr 2026', revenue: 61480, units: 466 },
    { month: 'May 2026', revenue: 67543, units: 511 },
  ],
  top_products: [
    { name: 'Taladro Percutor 20V', sku: 'KAP-TAL-003-FBA', units_sold: 67, revenue: 60267, growth: 34.2 },
    { name: 'Kit Herramientas 128pz', sku: 'KAP-KIT-105-FBM', units_sold: 145, revenue: 95685, growth: 52.7 },
    { name: 'Compresor Portátil 6 Gal', sku: 'KAP-COM-007-FBA', units_sold: 23, revenue: 34500, growth: 15.8 },
    { name: 'Sierra Circular 7-1/4"', sku: 'KAP-SIE-210-FBA', units_sold: 19, revenue: 22800, growth: -8.2 },
    { name: 'Lijadora Orbital 14k OPM', sku: 'KAP-LIJ-450-FBA', units_sold: 89, revenue: 40930, growth: 78.3 },
  ],
  fulfillment_split: [{ name: 'FBA', value: 73, sales: 49326 }, { name: 'FBM', value: 27, sales: 18217 }],
  fees: [
    { label: 'Referral', amount: 8234, pct: 52 }, { label: 'FBA Fulfil.', amount: 3109, pct: 31 },
    { label: 'Almacenamiento', amount: 1200, pct: 9 }, { label: 'AMS', amount: 1000, pct: 8 },
  ],
}

export default function AmazonAnalyticsPage() {
  const { showToast } = useToast();
  const [period, setPeriod] = useState<Period>("30d");
  const [data, setData] = useState(FALLBACK);

  useEffect(() => {
    fetch("/api/amazon/analytics")
      .then(r => r.json())
      .then(d => setData(d))
      .catch(() => {});
  }, []);

  const d = data;
  const trend = period === "7d" ? d.sales_trend.slice(-7) : d.sales_trend;
  const totalFees = d.fees.reduce((s: { amount: number }, f: { amount: number }) => s + f.amount, 0);
  const netRevenue = d.summary.total_sales - totalFees;

  const monthlyChart = (d.monthly_sales || []).map((m: { month: string; revenue: number; units: number }) => ({ month: m.month.split(" ")[0].toUpperCase(), revenue: m.revenue, units: m.units }));

  return (
    <div className="space-y-10 animate-in">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <span className="text-[0.75rem] font-bold label-tracking text-orange-400 drop-shadow-[0_0_8px_rgba(251,146,60,0.3)]">
            Channel Intelligence / Amazon / Analytics
          </span>
          <h1 className="text-4xl md:text-5xl font-black tight-tracking text-on-surface">
            Analytics Amazon
          </h1>
          <p className="text-sm text-on-surface-variant">Rendimiento de ventas · BSR · Rentabilidad</p>
        </div>
        <div className="flex gap-2 self-start md:self-auto">
          {(["7d", "30d", "90d"] as Period[]).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black label-tracking transition-all ${
                period === p ? "bg-primary text-black" : "glass-card border border-white/5 text-on-surface-variant hover:border-orange-400/20"
              }`}
            >
              {p === "7d" ? "7 DÍAS" : p === "30d" ? "30 DÍAS" : "90 DÍAS"}
            </button>
          ))}
          <button
            onClick={() => showToast({ type: "info", title: "Exportando reporte", message: "Generando CSV → Seller Central" })}
            className="px-4 py-2 glass-card border-white/5 rounded-xl text-[10px] font-black label-tracking text-on-surface-variant hover:border-orange-400/20 transition-all flex items-center gap-1"
          >
            <span className="material-symbols-outlined !text-[14px]">download</span>
            EXPORT
          </button>
        </div>
      </header>

      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Revenue (mes)",   value: `$${(d.summary.total_sales / 1000).toFixed(1)}k`, sub: `+${d.summary.growth_vs_prev}% vs anterior`, subColor: "text-[#CCFF00]", icon: "attach_money",  color: "text-[#CCFF00]"  },
          { label: "Órdenes",         value: d.summary.total_orders,     sub: `Ticket $${d.summary.avg_ticket.toFixed(0)}`,                      subColor: "text-on-surface/30", icon: "shopping_cart",  color: "text-blue-400"   },
          { label: "Margen Neto",     value: `${d.summary.avg_profit_margin}%`,                sub: "Después de fees",                                                 subColor: "text-on-surface/30", icon: "percent",        color: "text-amber-400"  },
          { label: "FBA Share",       value: `${d.summary.fba_percentage}%`,                   sub: "del revenue",                                                     subColor: "text-on-surface/30", icon: "warehouse",      color: "text-orange-400" },
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

      {/* Daily trend + Monthly trend side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-6">
        {/* Daily LineChart */}
        <div className="glass-card rounded-[2rem] border border-white/5 p-8">
          <h3 className="text-sm font-black text-on-surface mb-1">Tendencia Diaria</h3>
          <p className="text-[10px] text-on-surface/40 mb-6">Revenue USD · últimos 10 días</p>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tickFormatter={fmtDate} tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 9, fontWeight: 900 }} axisLine={{ stroke: "rgba(255,255,255,0.05)" }} tickLine={false} />
                <YAxis tickFormatter={v => fmtK(v as number)} tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 9, fontWeight: 900 }} axisLine={false} tickLine={false} width={48} />
                <Tooltip content={<ChartTooltip />} />
                <Line type="monotone" dataKey="sales" name="Ventas" stroke="#fb923c" strokeWidth={2.5} dot={false} activeDot={{ r: 4, fill: "#fb923c" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly BarChart */}
        <div className="glass-card rounded-[2rem] border border-white/5 p-8">
          <h3 className="text-sm font-black text-on-surface mb-1">Ventas Mensuales</h3>
          <p className="text-[10px] text-on-surface/40 mb-6">Últimos 7 meses</p>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyChart} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 8, fontWeight: 900 }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={v => fmtK(v as number)} tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 8, fontWeight: 900 }} axisLine={false} tickLine={false} width={44} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="revenue" name="Revenue" radius={[4, 4, 0, 0]}>
                  {monthlyChart.map((_, i) => (
                    <Cell key={i} fill={i === monthlyChart.length - 1 ? "#fb923c" : "rgba(255,255,255,0.10)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top products + FBA split */}
      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-6">
        {/* Top products */}
        <div className="glass-card rounded-[2rem] border border-white/5 p-8">
          <h3 className="text-sm font-black text-on-surface mb-1">Top Productos</h3>
          <p className="text-[10px] text-on-surface/40 mb-6">Por revenue · Mayo 2026</p>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={d.top_products} layout="vertical" margin={{ top: 0, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                <XAxis type="number" tickFormatter={v => fmtK(v as number)} tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 8, fontWeight: 900 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="sku" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 8, fontWeight: 900 }} axisLine={false} tickLine={false} width={100} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="revenue" name="Revenue" radius={[0, 4, 4, 0]}>
                  {d.top_products.map((_, i) => (
                    <Cell key={i} fill={i === 0 ? "#fb923c" : "rgba(255,255,255,0.10)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* FBA/FBM pie */}
        <div className="glass-card rounded-[2rem] border border-white/5 p-8">
          <h3 className="text-sm font-black text-on-surface mb-1">Split FBA / FBM</h3>
          <p className="text-[10px] text-on-surface/40 mb-4">Por revenue mensual</p>
          <div className="h-36">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={d.fulfillment_split} cx="50%" cy="50%" innerRadius={36} outerRadius={60} dataKey="value" paddingAngle={4}>
                  {d.fulfillment_split.map((_, i) => (
                    <Cell key={i} fill={COLORS_PIE[i % COLORS_PIE.length]} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 mt-2">
            {d.fulfillment_split.map((item, i) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS_PIE[i % COLORS_PIE.length] }} />
                  <span className="text-[10px] font-bold text-on-surface">{item.name}</span>
                </div>
                <span className="text-[9px] font-black text-on-surface/50">{item.value}% · {fmtK(item.sales)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Fee breakdown */}
      <div className="glass-card rounded-[2rem] border border-white/5 p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-sm font-black text-on-surface">Desglose de Fees Amazon</h3>
            <p className="text-[10px] text-on-surface/40 mt-0.5">Total fees: ${totalFees.toLocaleString()} USD · Mayo 2026</p>
          </div>
          <div className="text-right">
            <p className="text-[9px] text-on-surface/30 label-tracking uppercase">Revenue neto</p>
            <p className="text-xl font-black text-[#CCFF00]">${netRevenue.toLocaleString()}</p>
          </div>
        </div>
        <div className="space-y-4">
          {d.fees.map((fee, i) => (
            <div key={fee.label} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: FEE_COLORS[i % FEE_COLORS.length] }} />
                  <span className="text-xs font-bold text-on-surface">{fee.label}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs font-black text-on-surface">${fee.amount.toLocaleString()}</span>
                  <span className="text-[10px] text-on-surface/40 w-8 text-right">{fee.pct}%</span>
                </div>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${fee.pct}%`, backgroundColor: FEE_COLORS[i % FEE_COLORS.length] }} />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between">
          <div>
            <p className="text-[9px] font-black label-tracking text-on-surface/30 uppercase">Revenue bruto</p>
            <p className="text-lg font-black text-on-surface">${d.summary.total_sales.toLocaleString()}</p>
          </div>
          <div className="text-center">
            <p className="text-[9px] font-black label-tracking text-on-surface/30 uppercase">Fees totales</p>
            <p className="text-lg font-black text-red-400">-${totalFees.toLocaleString()}</p>
          </div>
          <div className="text-right">
            <p className="text-[9px] font-black label-tracking text-on-surface/30 uppercase">Revenue neto</p>
            <p className="text-lg font-black text-[#CCFF00]">${netRevenue.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="h-10" />
    </div>
  );
}
