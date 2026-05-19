'use client'

import { useState, useEffect } from 'react'
import { authenticatedFetch } from '@/lib/api-client'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface InvData {
  kpis: { total_value: number; total_skus: number; low_stock_count: number; out_of_stock_count: number }
  low_stock_items: { sku: string; quantity: number; min_stock: number; location: string }[]
  movement_trend: { date: string; in: number; out: number }[]
}

const mockInv: InvData = {
  kpis: { total_value: 0, total_skus: 0, low_stock_count: 0, out_of_stock_count: 0 },
  low_stock_items: [],
  movement_trend: [],
}

const tooltipStyle = {
  backgroundColor: '#0c1a2e',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 12,
  color: '#fff',
  fontSize: 11,
}

export default function InventoryAnalyticsPage() {
  const [data, setData] = useState<InvData>(mockInv)
  const [loading, setLoading] = useState(true)
  const [dataSource, setDataSource] = useState<'live' | 'mock'>('mock')

  useEffect(() => {
    authenticatedFetch('/api/analytics/inventory')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.kpis) {
          setData(d)
          setDataSource('live')
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const fmt = (v: number) => v >= 1000000 ? `$${(v / 1e6).toFixed(2)}M` : v >= 1000 ? `$${(v / 1000).toFixed(0)}K` : `$${v.toFixed(0)}`

  return (
    <div className="space-y-8 animate-in">
      <header className="space-y-2">
        <span className="text-[0.75rem] font-bold label-tracking text-primary drop-shadow-[0_0_8px_rgba(204,255,0,0.2)]">
          Analytics / Inventario
        </span>
        <div className="flex items-center gap-3">
          <h1 className="text-4xl md:text-5xl font-black tight-tracking text-on-surface">Analytics Inventario</h1>
          <span className={`px-2 py-1 rounded-full text-[9px] font-black label-tracking border ${
            loading ? 'border-white/10 text-white/30' :
            dataSource === 'live' ? 'border-green-500/30 bg-green-500/10 text-green-400' :
            'border-amber-500/30 bg-amber-500/10 text-amber-400'
          }`}>
            {loading ? 'CARGANDO' : dataSource === 'live' ? 'LIVE' : 'SANDBOX'}
          </span>
        </div>
        <p className="text-sm text-on-surface-variant">Valor, stock crítico y movimientos</p>
      </header>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Valor Total', value: fmt(data.kpis.total_value), color: 'text-primary' },
          { label: 'Total SKUs', value: data.kpis.total_skus.toLocaleString(), color: 'text-blue-400' },
          { label: 'Stock Bajo', value: data.kpis.low_stock_count, color: 'text-amber-400' },
          { label: 'Agotados', value: data.kpis.out_of_stock_count, color: 'text-red-400' },
        ].map(k => (
          <div key={k.label} className="glass-card rounded-[1.5rem] border border-white/5 p-6">
            <p className="text-[9px] font-black label-tracking text-on-surface/40 uppercase mb-2">{k.label}</p>
            <p className={`text-3xl font-black ${k.color}`}>{loading ? '—' : k.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Movement trend */}
        <div className="glass-card rounded-[2rem] border border-white/5 p-6">
          <h2 className="text-sm font-black text-on-surface mb-4">Movimientos 14 días</h2>
          {loading ? (
            <div className="h-48 flex items-center justify-center text-on-surface/30 text-sm">Cargando…</div>
          ) : data.movement_trend.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center gap-2">
              <span className="material-symbols-outlined !text-[32px] text-on-surface/20">swap_vert</span>
              <p className="text-sm text-on-surface/40">Sin movimientos recientes</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.movement_trend} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 9 }} axisLine={false} tickLine={false}
                  tickFormatter={v => (v as string).slice(5)} />
                <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="in" fill="#4ade80" radius={[4, 4, 0, 0]} name="Entradas" />
                <Bar dataKey="out" fill="#f87171" radius={[4, 4, 0, 0]} name="Salidas" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Low stock */}
        <div className="glass-card rounded-[2rem] border border-amber-400/10 overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-5 border-b border-white/5">
            <span className="material-symbols-outlined !text-[16px] text-amber-400">warning</span>
            <h2 className="text-sm font-black text-on-surface">Stock Crítico</h2>
            <span className="px-2 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/20 text-[9px] font-black text-amber-400">
              {data.kpis.low_stock_count + data.kpis.out_of_stock_count} SKUs
            </span>
          </div>
          {loading ? (
            <div className="p-8 text-center text-sm text-on-surface/40">Cargando…</div>
          ) : data.low_stock_items.length === 0 ? (
            <div className="p-8 text-center">
              <span className="material-symbols-outlined !text-[32px] text-green-400/30">check_circle</span>
              <p className="text-sm text-on-surface/40 mt-2">Todo el inventario en niveles normales</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {data.low_stock_items.map(item => (
                <div key={item.sku} className="flex items-center gap-4 px-6 py-3">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${item.quantity === 0 ? 'bg-red-400' : 'bg-amber-400'}`} />
                  <p className="text-xs font-mono font-bold text-on-surface flex-1">{item.sku}</p>
                  <p className="text-[10px] text-on-surface/40">{item.location}</p>
                  <p className={`text-xs font-black ${item.quantity === 0 ? 'text-red-400' : 'text-amber-400'}`}>
                    {item.quantity} / {item.min_stock}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="h-10" />
    </div>
  )
}
