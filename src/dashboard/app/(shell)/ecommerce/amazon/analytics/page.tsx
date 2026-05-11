"use client";

import { useState } from "react";
import { useToast } from "@/components/ToastProvider";
import { mockAmazonSales, mockAmazonProducts, mockAmazonStats } from "@/lib/mockData";

type Period = "7d" | "30d" | "90d";

const TOP_PRODUCTS = mockAmazonProducts
  .map(p => ({
    ...p,
    monthly_revenue: Math.round(p.price * p.sold_quantity_mock),
  }))
  // We compute a mock sold count for analytics only
  .sort((a, b) => b.price * (b.sales_rank ? 10000 / b.sales_rank : 0) - a.price * (a.sales_rank ? 10000 / a.sales_rank : 0))
  .slice(0, 5);

// Sold units per product for analytics (mock, not stored in interface)
const SOLD_MOCK: Record<string, number> = {
  "1": 187, "2": 56, "3": 134, "4": 29, "5": 47, "6": 82, "7": 61, "8": 211,
};

const FEE_BREAKDOWN = [
  { label: "Comisión Referral",    pct: 52, amount: 35067, color: "bg-orange-400" },
  { label: "Fulfillment (FBA)",    pct: 31, amount: 20938, color: "bg-blue-400"   },
  { label: "Almacenamiento",       pct: 9,  amount: 6079,  color: "bg-purple-400" },
  { label: "Publicidad (AMS)",     pct: 8,  amount: 5403,  color: "bg-amber-400"  },
];

const maxRevenue = Math.max(...mockAmazonSales.map(m => m.revenue));

function fmtK(n: number) { return n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${n}`; }

export default function AmazonAnalyticsPage() {
  const { showToast } = useToast();
  const [period, setPeriod] = useState<Period>("30d");

  const currentMonth   = mockAmazonSales[mockAmazonSales.length - 1];
  const previousMonth  = mockAmazonSales[mockAmazonSales.length - 2];
  const revGrowth      = ((currentMonth.revenue - previousMonth.revenue) / previousMonth.revenue * 100).toFixed(1);
  const unitsGrowth    = ((currentMonth.units - previousMonth.units) / previousMonth.units * 100).toFixed(1);
  const totalFees      = FEE_BREAKDOWN.reduce((s, f) => s + f.amount, 0);

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
          <p className="text-sm text-on-surface-variant">
            Rendimiento de ventas · BSR · Rentabilidad
          </p>
        </div>

        {/* Period selector */}
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
          {
            label: "Revenue (mes)", value: `$${(mockAmazonStats.monthly_revenue/1000).toFixed(1)}k`,
            sub: `+${revGrowth}% vs mes anterior`, subColor: "text-[#CCFF00]", icon: "attach_money", color: "text-[#CCFF00]",
          },
          {
            label: "Unidades Vendidas", value: currentMonth.units,
            sub: `+${unitsGrowth}% vs mes anterior`, subColor: "text-[#CCFF00]", icon: "shopping_cart", color: "text-blue-400",
          },
          {
            label: "Margen Promedio", value: `${mockAmazonStats.avg_profit_margin}%`,
            sub: "Neto después de fees", subColor: "text-on-surface/30", icon: "percent", color: "text-amber-400",
          },
          {
            label: "Mejor BSR", value: `#${mockAmazonStats.best_seller_rank}`,
            sub: "Set Brocas 29 Piezas", subColor: "text-on-surface/30", icon: "military_tech", color: "text-orange-400",
          },
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

      {/* Sales chart + Top products side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-6">
        {/* Bar chart */}
        <div className="glass-card rounded-[2rem] border border-white/5 p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-sm font-black text-on-surface">Ventas Mensuales</h3>
              <p className="text-[10px] text-on-surface/40 mt-0.5">Revenue USD · últimos 7 meses</p>
            </div>
            <span className="text-[9px] font-black label-tracking text-on-surface/30 uppercase">MXN</span>
          </div>

          <div className="flex items-end gap-3 h-48">
            {mockAmazonSales.map((m, i) => {
              const pct  = (m.revenue / maxRevenue) * 100;
              const isLast = i === mockAmazonSales.length - 1;
              return (
                <div key={m.month} className="flex flex-col items-center gap-2 flex-1">
                  <span className="text-[9px] font-black text-on-surface/40">{fmtK(m.revenue)}</span>
                  <div className="w-full rounded-t-lg transition-all relative" style={{ height: `${pct}%` }}>
                    <div className={`w-full h-full rounded-t-lg ${isLast ? "bg-orange-400" : "bg-white/10 hover:bg-white/20"} transition-colors`} />
                  </div>
                  <span className={`text-[8px] font-black label-tracking text-center leading-tight ${
                    isLast ? "text-orange-400" : "text-on-surface/30"
                  }`}>{m.month.split(" ")[0].toUpperCase()}</span>
                </div>
              );
            })}
          </div>

          {/* Revenue / Units row */}
          <div className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-white/5">
            {[
              { label: "Órdenes (mes)",  value: currentMonth.orders },
              { label: "Unidades",       value: currentMonth.units  },
              { label: "Revenue",        value: fmtK(currentMonth.revenue) },
            ].map(s => (
              <div key={s.label}>
                <p className="text-[9px] font-black label-tracking text-on-surface/30 uppercase">{s.label}</p>
                <p className="text-lg font-black tight-tracking text-on-surface mt-0.5">{s.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Top products */}
        <div className="glass-card rounded-[2rem] border border-white/5 p-8">
          <h3 className="text-sm font-black text-on-surface mb-1">Top Productos</h3>
          <p className="text-[10px] text-on-surface/40 mb-6">Por BSR · Mayo 2026</p>

          <div className="space-y-4">
            {mockAmazonProducts
              .sort((a, b) => a.sales_rank - b.sales_rank)
              .slice(0, 5)
              .map((p, i) => {
                const units = SOLD_MOCK[p.id] ?? 0;
                const rev   = Math.round(p.price * units);
                const barPct = Math.min((units / (SOLD_MOCK["8"] ?? 1)) * 100, 100);
                return (
                  <div key={p.id} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[10px] font-black text-on-surface/30 w-4 flex-shrink-0">#{i + 1}</span>
                        <p className="text-[10px] font-bold text-on-surface truncate">{p.title.split(" ").slice(0, 4).join(" ")}</p>
                      </div>
                      <div className="text-right flex-shrink-0 ml-2">
                        <p className="text-[10px] font-black text-on-surface">{fmtK(rev)}</p>
                        <p className="text-[8px] text-on-surface/30">{units} uds</p>
                      </div>
                    </div>
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${i === 0 ? "bg-orange-400" : "bg-white/20"}`}
                        style={{ width: `${barPct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
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
            <p className="text-xl font-black text-[#CCFF00]">${(mockAmazonStats.monthly_revenue - totalFees).toLocaleString()}</p>
          </div>
        </div>

        <div className="space-y-4">
          {FEE_BREAKDOWN.map(fee => (
            <div key={fee.label} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full ${fee.color}`} />
                  <span className="text-xs font-bold text-on-surface">{fee.label}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs font-black text-on-surface">${fee.amount.toLocaleString()}</span>
                  <span className="text-[10px] text-on-surface/40 w-8 text-right">{fee.pct}%</span>
                </div>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${fee.color}`} style={{ width: `${fee.pct}%` }} />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between">
          <span className="text-[10px] font-black label-tracking text-on-surface/30 uppercase">Revenue bruto</span>
          <span className="text-[10px] font-black label-tracking text-on-surface/30 uppercase">Fees totales</span>
          <span className="text-[10px] font-black label-tracking text-on-surface/30 uppercase">Revenue neto</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-lg font-black text-on-surface">${mockAmazonStats.monthly_revenue.toLocaleString()}</span>
          <span className="text-lg font-black text-red-400">-${totalFees.toLocaleString()}</span>
          <span className="text-lg font-black text-[#CCFF00]">${(mockAmazonStats.monthly_revenue - totalFees).toLocaleString()}</span>
        </div>
      </div>

      <div className="h-10" />
    </div>
  );
}
