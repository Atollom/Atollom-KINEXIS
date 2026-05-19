'use client'

import { useState, useEffect } from 'react'
import { authenticatedFetch } from '@/lib/api-client'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface SalesData {
  kpis: { total_revenue: number; total_orders: number; avg_order_value: number }
  by_platform: { platform: string; orders: number; revenue: number }[]
  daily_trend: { date: string; revenue: number; orders: number }[]
}

const PLATFORM_COLORS: Record<string, string> = {
  ml: '#facc15',
  amazon: '#fb923c',
  shopify: '#CCFF00',
  b2b: '#60a5fa',
}

const tooltipStyle = {
  backgroundColor: '#0c1a2e',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 12,
  color: '#fff',
  fontSize: 11,
}

const mockData: SalesData = {
  kpis: { total_revenue: 0, total_orders: 0, avg_order_value: 0 },
  by_platform: [],
  daily_trend: [],
}

export default function SalesAnalyticsPage() {
  const [data, setData] = useState<SalesData>(mockData)
  const [loading, setLoading] = useState(true)
  const [dataSource, setDataSource] = useState<'live' | 'mock'>('mock')

  useEffect(() => {
    let mounted = true
    authenticatedFetch('/api/analytics/sales')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (mounted && d?.kpis) {
          setData(d)
          setDataSource('live')
        }
      })
      .catch(() => {})
      .finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [])

  const fmt = (v: number) => v >= 1000 ? `$${(v / 1000).toFixed(0)}K` : `$${v.toFixed(0)}`

  return (
    <div className="space-y-8 animate-in">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <span className="text-[0.75rem] font-bold label-tracking text-primary drop-shadow-[0_0_8px_rgba(204,255,0,0.2)]">
            Analytics / Ventas
          </span>
          <div className="flex items-center gap-3">
            <h1 className="text-4xl md:text-5xl font-black tight-tracking text-on-surface">Analytics Ventas</h1>
            <span className={`px-2 py-1 rounded-full text-[9px] font-black label-tracking border ${
              loading ? 'border-white/10 text-white/30' :
              dataSource === 'live' ? 'border-green-500/30 bg-green-500/10 text-green-400' :
              'border-amber-500/30 bg-amber-500/10 text-amber-400'
            }`}>
              {loading ? 'CARGANDO' : dataSource === 'live' ? 'LIVE' : 'SANDBOX'}
            </span>
          </div>
          <p className="text-sm text-on-surface-variant">Últimos 30 días · todos los canales</p>
        </div>
      </header>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Revenue Total', value: fmt(data.kpis.total_revenue), color: 'text-primary' },
          { label: 'Órdenes', value: data.kpis.total_orders.toLocaleString(), color: 'text-blue-400' },
          { label: 'Ticket Promedio', value: fmt(data.kpis.avg_order_value), color: 'text-purple-400' },
        ].map(k => (
          <div key={k.label} className="glass-card rounded-[1.5rem] border border-white/5 p-6">
            <p className="text-[9px] font-black label-tracking text-on-surface/40 uppercase mb-2">{k.label}</p>
            <p className={`text-3xl font-black ${k.color}`}>{loading ? '—' : k.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue por plataforma */}
        <div className="glass-card rounded-[2rem] border border-white/5 p-6">
          <h2 className="text-sm font-black text-on-surface mb-4">Revenue por Canal</h2>
          {loading ? (
            <div className="h-48 flex items-center justify-center text-on-surface/30 text-sm">Cargando…</div>
          ) : data.by_platform.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center gap-2">
              <span className="material-symbols-outlined !text-[32px] text-on-surface/20">bar_chart</span>
              <p className="text-sm text-on-surface/40">Sin datos de ventas aún</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.by_platform} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="platform" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => fmt(v as number)} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: unknown) => [`$${Number(v ?? 0).toLocaleString()}`, 'Revenue']} />
                <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
                  {data.by_platform.map(p => (
                    <Cell key={p.platform} fill={PLATFORM_COLORS[p.platform] ?? '#60a5fa'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Tendencia diaria */}
        <div className="glass-card rounded-[2rem] border border-white/5 p-6">
          <h2 className="text-sm font-black text-on-surface mb-4">Tendencia Diaria</h2>
          {loading ? (
            <div className="h-48 flex items-center justify-center text-on-surface/30 text-sm">Cargando…</div>
          ) : data.daily_trend.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center gap-2">
              <span className="material-symbols-outlined !text-[32px] text-on-surface/20">show_chart</span>
              <p className="text-sm text-on-surface/40">Sin órdenes en los últimos 30 días</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={data.daily_trend} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 9 }} axisLine={false} tickLine={false}
                  tickFormatter={v => (v as string).slice(5)} />
                <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => fmt(v as number)} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: unknown) => [`$${Number(v ?? 0).toLocaleString()}`, 'Revenue']} />
                <Line type="monotone" dataKey="revenue" stroke="#CCFF00" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Platform breakdown table */}
      {data.by_platform.length > 0 && (
        <div className="glass-card rounded-[2rem] border border-white/5 overflow-hidden">
          <div className="px-8 py-5 border-b border-white/5">
            <h2 className="text-sm font-black text-on-surface">Desglose por Canal</h2>
          </div>
          <div className="divide-y divide-white/5">
            {data.by_platform.sort((a, b) => b.revenue - a.revenue).map(p => {
              const total = data.by_platform.reduce((s, x) => s + x.revenue, 1)
              const pct = Math.round((p.revenue / total) * 100)
              return (
                <div key={p.platform} className="flex items-center gap-4 px-8 py-4">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: PLATFORM_COLORS[p.platform] ?? '#60a5fa' }} />
                  <p className="text-xs font-bold text-on-surface uppercase w-20">{p.platform}</p>
                  <div className="flex-1 h-1.5 rounded-full bg-white/5">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: PLATFORM_COLORS[p.platform] ?? '#60a5fa' }} />
                  </div>
                  <p className="text-xs font-black text-on-surface w-20 text-right">{fmt(p.revenue)}</p>
                  <p className="text-[10px] text-on-surface/40 w-16 text-right">{p.orders} órd.</p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="h-10" />
    </div>
  )
}
