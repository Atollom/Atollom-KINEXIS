'use client'

import { useState } from 'react'
import { mockConsolidatedMetrics, mockRevenueHistory } from '@/lib/mockData'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts'

const PERIOD_OPTIONS = [{ label: '7d', value: '7d' }, { label: '30d', value: '30d' }, { label: '90d', value: '90d' }] as const
type Period = typeof PERIOD_OPTIONS[number]['value']

const tooltipStyle = { backgroundColor: '#0c1a2e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, color: '#fff', fontSize: 11 }

export default function ConsolidatedDashboardPage() {
  const [period, setPeriod] = useState<Period>('30d')
  const m = mockConsolidatedMetrics

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-black tight-tracking" style={{ color: 'var(--text-primary)' }}>Consolidated Dashboard</h1>
            <span className="px-2 py-1 rounded-full bg-[#CCFF00]/10 border border-[#CCFF00]/20 text-[9px] font-black label-tracking text-[#CCFF00]">360°</span>
          </div>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Vista unificada de todos los canales y módulos</p>
        </div>
        <div className="flex items-center gap-1 p-1 rounded-xl" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          {PERIOD_OPTIONS.map(opt => (
            <button key={opt.value} onClick={() => setPeriod(opt.value)}
              className="px-4 py-1.5 rounded-lg text-xs font-bold transition-all"
              style={period === opt.value ? { backgroundColor: 'var(--accent-primary)', color: '#000' } : { color: 'var(--text-muted)' }}
            >{opt.label}</button>
          ))}
        </div>
      </div>

      {/* Top KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Revenue', value: `$${(m.revenue.total / 1000).toFixed(0)}K`, sub: `+${m.revenue.growth}%`, subColor: '#4ade80', color: '#CCFF00' },
          { label: 'Órdenes', value: m.orders.total, sub: `+${m.orders.growth}%`, subColor: '#4ade80', color: '#a78bfa' },
          { label: 'AOV', value: `$${m.orders.avg_value.toFixed(0)}`, sub: 'promedio', subColor: 'var(--text-muted)', color: '#60a5fa' },
          { label: 'ROAS', value: `${m.marketing.roas}x`, sub: 'marketing', subColor: 'var(--text-muted)', color: '#fb923c' },
          { label: 'Inventario', value: `$${(m.inventory.total_value / 1e6).toFixed(1)}M`, sub: 'valor total', subColor: 'var(--text-muted)', color: '#f472b6' },
        ].map(k => (
          <div key={k.label} className="glass-card p-4 rounded-2xl">
            <p className="text-[10px] label-tracking mb-1" style={{ color: 'var(--text-muted)' }}>{k.label}</p>
            <p className="text-2xl font-black" style={{ color: k.color }}>{k.value}</p>
            <p className="text-[10px] font-bold mt-0.5" style={{ color: k.subColor }}>{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Revenue by channel — bar + trend line */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-card rounded-2xl p-5">
          <h2 className="text-sm font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Revenue por Canal — Mayo</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={m.revenue.by_channel} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="channel" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}K`} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [`$${Number(v ?? 0).toLocaleString()}`, 'Revenue']} />
              <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                {m.revenue.by_channel.map(c => <Cell key={c.channel} fill={c.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card rounded-2xl p-5">
          <h2 className="text-sm font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Tendencia Revenue — 5 meses</h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={mockRevenueHistory} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}K`} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => `$${Number(v ?? 0).toLocaleString()}`} />
              <Line type="monotone" dataKey="shopify" stroke="#CCFF00" strokeWidth={2} dot={false} name="Shopify" />
              <Line type="monotone" dataKey="ml" stroke="#facc15" strokeWidth={2} dot={false} name="ML" />
              <Line type="monotone" dataKey="amazon" stroke="#fb923c" strokeWidth={2} dot={false} name="Amazon" />
              <Line type="monotone" dataKey="b2b" stroke="#60a5fa" strokeWidth={2} dot={false} name="B2B" />
              <Legend wrapperStyle={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom metrics grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Customers */}
        <div className="glass-card rounded-2xl p-5 space-y-3">
          <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Clientes</h3>
          {[
            { label: 'Total clientes', value: m.customers.total.toLocaleString(), color: 'var(--text-primary)' },
            { label: 'Nuevos (mes)', value: m.customers.new, color: '#4ade80' },
            { label: 'Recurrentes', value: m.customers.returning, color: '#60a5fa' },
            { label: 'Churn rate', value: `${m.customers.churn_rate}%`, color: '#f87171' },
            { label: 'CAC', value: `$${m.marketing.cac.toFixed(0)}`, color: '#facc15' },
            { label: 'LTV', value: `$${m.marketing.ltv.toFixed(0)}`, color: '#CCFF00' },
          ].map(r => (
            <div key={r.label} className="flex items-center justify-between">
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{r.label}</p>
              <p className="text-xs font-black" style={{ color: r.color }}>{r.value}</p>
            </div>
          ))}
        </div>

        {/* Inventory */}
        <div className="glass-card rounded-2xl p-5 space-y-3">
          <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Inventario</h3>
          {[
            { label: 'Valor total', value: `$${(m.inventory.total_value / 1e6).toFixed(2)}M`, color: '#CCFF00' },
            { label: 'Stock bajo', value: m.inventory.low_stock_items, color: '#facc15' },
            { label: 'Agotado', value: m.inventory.out_of_stock, color: '#f87171' },
            { label: 'Turnover rate', value: `${m.inventory.turnover_rate}x`, color: '#4ade80' },
          ].map(r => (
            <div key={r.label} className="flex items-center justify-between">
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{r.label}</p>
              <p className="text-xs font-black" style={{ color: r.color }}>{r.value}</p>
            </div>
          ))}
        </div>

        {/* Orders breakdown */}
        <div className="glass-card rounded-2xl p-5 space-y-3">
          <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Estado de Órdenes</h3>
          {Object.entries(m.orders.by_status).map(([status, count]) => {
            const colors: Record<string, string> = { pending: '#facc15', processing: '#60a5fa', shipped: '#a78bfa', delivered: '#4ade80', cancelled: '#f87171' }
            const labels: Record<string, string> = { pending: 'Pendiente', processing: 'Procesando', shipped: 'Enviada', delivered: 'Entregada', cancelled: 'Cancelada' }
            const pct = Math.round((count / m.orders.total) * 100)
            return (
              <div key={status} className="space-y-1">
                <div className="flex justify-between text-[10px]">
                  <span style={{ color: 'var(--text-muted)' }}>{labels[status]}</span>
                  <span className="font-bold" style={{ color: colors[status] }}>{count} ({pct}%)</span>
                </div>
                <div className="h-1.5 rounded-full" style={{ backgroundColor: 'var(--border-color)' }}>
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: colors[status] }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
