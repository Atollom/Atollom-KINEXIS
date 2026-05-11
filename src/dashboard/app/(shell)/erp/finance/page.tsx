"use client";

import { useToast } from "@/components/ToastProvider";
import {
  mockFinanceSnapshot, mockFinanceHistory, mockFinanceByChannel,
  mockARAging, mockAPSummary,
} from "@/lib/mockData";
import {
  LineChart, Line, BarChart, Bar, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

function fmtK(n: number) { return n >= 1000000 ? `$${(n / 1000000).toFixed(2)}M` : n >= 1000 ? `$${(n / 1000).toFixed(0)}k` : `$${n}`; }

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

const AP_STATUS_CFG = {
  pending:   { color: "text-amber-400",    bg: "bg-amber-400/10",  label: "Pendiente" },
  overdue:   { color: "text-red-400",      bg: "bg-red-400/10",    label: "Vencida"   },
  scheduled: { color: "text-blue-400",     bg: "bg-blue-400/10",   label: "Programada" },
} as const;

const CHANNEL_COLORS = ["#CCFF00", "#fb923c", "#60a5fa", "#c084fc"];

export default function ERPFinancePage() {
  const { showToast } = useToast();
  const snap = mockFinanceSnapshot;

  const totalAR = mockARAging.reduce((s, a) => s + a.amount, 0);
  const maxAR = Math.max(...mockARAging.map(a => a.amount));
  const overdueAP = mockAPSummary.filter(a => a.status === "overdue").length;

  return (
    <div className="space-y-10 animate-in">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="text-[0.75rem] font-bold label-tracking text-primary drop-shadow-[0_0_8px_rgba(204,255,0,0.2)]">
              ERP / Finanzas / Snapshot
            </span>
            <span className="px-2 py-1 rounded-full bg-primary/10 border border-primary/20 text-[9px] font-black label-tracking text-primary">
              AGENTE #18
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tight-tracking text-on-surface">
            Finanzas
          </h1>
          <p className="text-sm text-on-surface-variant">
            P&L · Cuentas por Cobrar · Cuentas por Pagar · Cash Flow
          </p>
        </div>
        <div className="flex gap-3 self-start md:self-auto">
          <button
            onClick={() => showToast({ type: "info", title: "Reporte generado", message: "Estado financiero Mayo 2026 → PDF" })}
            className="px-6 py-3 glass-card border-white/5 rounded-2xl text-[10px] font-black label-tracking text-on-surface-variant hover:border-primary/20 transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined !text-[16px]">summarize</span>
            REPORTE
          </button>
          <button
            onClick={() => showToast({ type: "success", title: "Pago registrado", message: "Movimiento creado en contabilidad" })}
            className="px-6 py-3 rounded-2xl bg-primary text-black text-[10px] font-black label-tracking hover:bg-primary/90 transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined !text-[16px]">add_card</span>
            REGISTRAR PAGO
          </button>
        </div>
      </header>

      {/* P&L KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Revenue MTD",   value: fmtK(snap.revenue_mtd),   sub: `+${snap.growth_vs_prev}% vs anterior`, subColor: "text-[#CCFF00]", icon: "trending_up",            color: "text-[#CCFF00]"  },
          { label: "Gastos MTD",    value: fmtK(snap.expenses_mtd),  sub: "Costo operativo",                      subColor: "text-on-surface/30", icon: "payments",           color: "text-red-400"    },
          { label: "Utilidad Neta", value: fmtK(snap.profit_mtd),    sub: `Margen ${snap.profit_margin}%`,        subColor: "text-[#CCFF00]", icon: "account_balance_wallet", color: "text-blue-400"   },
          { label: "Cash Balance",  value: fmtK(snap.cash_balance),  sub: `Burn rate ${fmtK(snap.burn_rate)}/mes`,subColor: "text-on-surface/30", icon: "savings",            color: "text-amber-400"  },
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

      {/* Revenue history + Channel breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-6">
        {/* P&L LineChart */}
        <div className="glass-card rounded-[2rem] border border-white/5 p-8">
          <h3 className="text-sm font-black text-on-surface mb-1">Historial P&L</h3>
          <p className="text-[10px] text-on-surface/40 mb-6">Revenue · Gastos · Utilidad — últimos 5 meses</p>
          <div className="flex items-center gap-4 mb-4">
            {[
              { color: "#CCFF00", label: "Revenue"  },
              { color: "#f87171", label: "Gastos"   },
              { color: "#60a5fa", label: "Utilidad" },
            ].map(l => (
              <div key={l.label} className="flex items-center gap-1.5">
                <div className="w-3 h-0.5 rounded" style={{ backgroundColor: l.color }} />
                <span className="text-[9px] font-black text-on-surface/50">{l.label}</span>
              </div>
            ))}
          </div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockFinanceHistory} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 9, fontWeight: 900 }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={v => fmtK(v as number)} tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 9, fontWeight: 900 }} axisLine={false} tickLine={false} width={52} />
                <Tooltip content={<ChartTooltip />} />
                <Line type="monotone" dataKey="revenue"  name="Revenue"  stroke="#CCFF00" strokeWidth={2.5} dot={false} activeDot={{ r: 4, fill: "#CCFF00" }} />
                <Line type="monotone" dataKey="expenses" name="Gastos"   stroke="#f87171" strokeWidth={2}   dot={false} activeDot={{ r: 3, fill: "#f87171" }} strokeDasharray="4 4" />
                <Line type="monotone" dataKey="profit"   name="Utilidad" stroke="#60a5fa" strokeWidth={2}   dot={false} activeDot={{ r: 3, fill: "#60a5fa" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Channel BarChart */}
        <div className="glass-card rounded-[2rem] border border-white/5 p-8">
          <h3 className="text-sm font-black text-on-surface mb-1">Revenue por Canal</h3>
          <p className="text-[10px] text-on-surface/40 mb-6">Distribución Mayo 2026</p>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockFinanceByChannel} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="channel" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 9, fontWeight: 900 }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={v => fmtK(v as number)} tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 9, fontWeight: 900 }} axisLine={false} tickLine={false} width={48} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="revenue" name="Revenue" radius={[4, 4, 0, 0]}>
                  {mockFinanceByChannel.map((_, i) => (
                    <Cell key={i} fill={CHANNEL_COLORS[i % CHANNEL_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-1.5">
            {mockFinanceByChannel.map((c, i) => (
              <div key={c.channel} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: CHANNEL_COLORS[i] }} />
                  <span className="text-[9px] font-bold text-on-surface/60">{c.channel}</span>
                </div>
                <span className="text-[9px] font-black text-on-surface/50">{fmtK(c.revenue)} · {c.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AR Aging + AP */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AR Aging */}
        <div className="glass-card rounded-[2rem] border border-white/5 p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-black text-on-surface">Cuentas por Cobrar</h3>
              <p className="text-[10px] text-on-surface/40 mt-0.5">Antigüedad · Total {fmtK(totalAR)}</p>
            </div>
            <span className="text-xl font-black text-[#CCFF00]">{fmtK(snap.ar_total)}</span>
          </div>
          <div className="space-y-4">
            {mockARAging.map(a => {
              const pct = (a.amount / maxAR) * 100;
              const isRisk = a.range.startsWith(">") || a.range.startsWith("61");
              return (
                <div key={a.range} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`text-[9px] font-black label-tracking ${isRisk ? "text-red-400" : "text-on-surface/60"}`}>{a.range}</span>
                      <span className="text-[8px] text-on-surface/30">{a.count} clientes</span>
                    </div>
                    <span className={`text-xs font-black ${isRisk ? "text-red-400" : "text-on-surface"}`}>{fmtK(a.amount)}</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${isRisk ? "bg-red-400" : "bg-[#CCFF00]"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-6 pt-5 border-t border-white/5 flex justify-end">
            <button
              onClick={() => showToast({ type: "info", title: "Cobranza iniciada", message: "Agente #18 enviando recordatorios automáticos" })}
              className="px-4 py-2 rounded-xl bg-primary/10 border border-primary/20 text-primary text-[9px] font-black hover:bg-primary/20 transition-colors flex items-center gap-1"
            >
              <span className="material-symbols-outlined !text-[11px]">auto_fix_high</span>
              COBRANZA AUTO
            </button>
          </div>
        </div>

        {/* AP Summary */}
        <div className="glass-card rounded-[2rem] border border-white/5 p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-black text-on-surface">Cuentas por Pagar</h3>
              <p className="text-[10px] text-on-surface/40 mt-0.5">Proveedores · {mockAPSummary.length} facturas</p>
            </div>
            <div className="text-right">
              <span className="text-xl font-black text-red-400">{fmtK(snap.ap_total)}</span>
              {overdueAP > 0 && (
                <p className="text-[9px] text-red-400">{overdueAP} vencida{overdueAP > 1 ? "s" : ""}</p>
              )}
            </div>
          </div>
          <div className="space-y-3">
            {mockAPSummary.map(ap => {
              const sCfg = AP_STATUS_CFG[ap.status];
              return (
                <div key={ap.supplier} className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors group">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-on-surface truncate">{ap.supplier}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[8px] font-black ${sCfg.color} ${sCfg.bg}`}>
                        {sCfg.label.toUpperCase()}
                      </span>
                      <span className="text-[9px] text-on-surface/30">Vence {ap.due}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 ml-4">
                    <span className={`text-xs font-black ${ap.status === "overdue" ? "text-red-400" : "text-on-surface"}`}>
                      {fmtK(ap.amount)}
                    </span>
                    <button
                      onClick={() => showToast({ type: "success", title: "Pago programado", message: `${ap.supplier} · ${fmtK(ap.amount)}` })}
                      className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-on-surface/50 text-[9px] font-black hover:bg-white/10 transition-colors opacity-0 group-hover:opacity-100 whitespace-nowrap"
                    >
                      PAGAR
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="h-10" />
    </div>
  );
}
