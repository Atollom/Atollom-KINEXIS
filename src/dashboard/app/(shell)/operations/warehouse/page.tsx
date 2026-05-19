'use client'

import { useState, useEffect } from 'react'
import { authenticatedFetch } from '@/lib/api-client'

interface WItem {
  sku: string
  quantity: number
  min_stock: number
  cost: number
  location: string
  value: number
  status: 'ok' | 'low' | 'out'
  updated_at: string
}

interface LocationRow {
  location: string
  sku_count: number
  total_units: number
  total_value: number
}

interface WarehouseData {
  items: WItem[]
  by_location: LocationRow[]
  kpis: { total_skus: number; total_units: number; total_value: number; locations: number }
}

const STATUS_CFG = {
  ok:  { label: 'Normal',      color: 'text-green-400', dot: 'bg-green-400' },
  low: { label: 'Stock Bajo',  color: 'text-amber-400', dot: 'bg-amber-400' },
  out: { label: 'Agotado',     color: 'text-red-400',   dot: 'bg-red-400'   },
}

const mockWh: WarehouseData = {
  items: [],
  by_location: [],
  kpis: { total_skus: 0, total_units: 0, total_value: 0, locations: 0 },
}

export default function WarehousePage() {
  const [data, setData] = useState<WarehouseData>(mockWh)
  const [loading, setLoading] = useState(true)
  const [dataSource, setDataSource] = useState<'live' | 'mock'>('mock')
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'low' | 'out'>('all')

  useEffect(() => {
    let mounted = true
    authenticatedFetch('/api/operations/warehouse')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (mounted && d?.items) {
          setData(d)
          setDataSource('live')
        }
      })
      .catch(() => {})
      .finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [])

  const filtered = data.items.filter(i => {
    if (filterStatus !== 'all' && i.status !== filterStatus) return false
    if (search && !i.sku.toLowerCase().includes(search.toLowerCase()) && !i.location.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const fmt = (v: number) => v >= 1e6 ? `$${(v / 1e6).toFixed(2)}M` : v >= 1000 ? `$${(v / 1000).toFixed(0)}K` : `$${v.toFixed(0)}`

  return (
    <div className="space-y-10 animate-in">
      <header className="space-y-2">
        <span className="text-[0.75rem] font-bold label-tracking text-primary drop-shadow-[0_0_8px_rgba(204,255,0,0.2)]">
          Operaciones / Almacén
        </span>
        <div className="flex items-center gap-3">
          <h1 className="text-4xl md:text-5xl font-black tight-tracking text-on-surface">Almacén</h1>
          <span className={`px-2 py-1 rounded-full text-[9px] font-black label-tracking border ${
            loading ? 'border-white/10 text-white/30' :
            dataSource === 'live' ? 'border-green-500/30 bg-green-500/10 text-green-400' :
            'border-amber-500/30 bg-amber-500/10 text-amber-400'
          }`}>
            {loading ? 'CARGANDO' : dataSource === 'live' ? 'LIVE' : 'SANDBOX'}
          </span>
        </div>
        <p className="text-sm text-on-surface-variant">Inventario por ubicación y estado de stock</p>
      </header>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'SKUs Totales', value: data.kpis.total_skus, color: 'text-on-surface' },
          { label: 'Unidades', value: data.kpis.total_units.toLocaleString(), color: 'text-blue-400' },
          { label: 'Valor Total', value: fmt(data.kpis.total_value), color: 'text-primary' },
          { label: 'Ubicaciones', value: data.kpis.locations, color: 'text-purple-400' },
        ].map(k => (
          <div key={k.label} className="glass-card rounded-[1.5rem] border border-white/5 p-5">
            <p className="text-[9px] font-black label-tracking text-on-surface/40 uppercase mb-2">{k.label}</p>
            <p className={`text-2xl font-black ${k.color}`}>{loading ? '—' : k.value}</p>
          </div>
        ))}
      </div>

      {/* By location */}
      {data.by_location.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.by_location.map(loc => (
            <div key={loc.location} className="glass-card rounded-[1.5rem] border border-white/5 p-5">
              <p className="text-[9px] font-black label-tracking text-on-surface/40 uppercase mb-1">{loc.location}</p>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-xl font-black text-on-surface">{loc.total_units.toLocaleString()}</p>
                  <p className="text-[9px] text-on-surface/40">{loc.sku_count} SKUs</p>
                </div>
                <p className="text-sm font-black text-primary">{fmt(loc.total_value)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filters + table */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-72">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface/30 !text-[16px]">search</span>
          <input
            type="text"
            placeholder="Buscar SKU o ubicación…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-[11px] font-medium text-on-surface placeholder:text-on-surface/30 focus:border-primary/50 outline-none w-full"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'low', 'out'] as const).map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-4 py-2 rounded-xl text-[9px] font-black label-tracking transition-all ${
                filterStatus === s ? 'bg-primary text-black' : 'glass-card border border-white/5 text-on-surface/50 hover:border-primary/20'
              }`}
            >
              {s === 'all' ? 'TODOS' : s === 'low' ? 'STOCK BAJO' : 'AGOTADOS'}
            </button>
          ))}
        </div>
      </div>

      <div className="glass-card rounded-[2rem] border border-white/5 overflow-hidden">
        <div className="divide-y divide-white/5">
          {loading ? (
            <div className="p-12 text-center text-sm text-on-surface/40">Cargando…</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <span className="material-symbols-outlined !text-[32px] text-on-surface/20">inventory_2</span>
              <p className="text-sm text-on-surface/40 mt-2">{data.items.length === 0 ? 'Sin datos de inventario' : 'Sin resultados'}</p>
            </div>
          ) : filtered.map(item => {
            const sCfg = STATUS_CFG[item.status]
            return (
              <div key={item.sku} className="flex items-center gap-4 px-8 py-4 hover:bg-white/[0.02] transition-colors">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${sCfg.dot}`} />
                <p className="text-xs font-mono font-bold text-on-surface flex-1">{item.sku}</p>
                <p className="text-[10px] text-on-surface/40 w-32 truncate">{item.location}</p>
                <p className={`text-xs font-black w-20 text-right ${sCfg.color}`}>
                  {item.quantity} uds
                </p>
                <p className="text-xs font-black text-on-surface w-24 text-right">{fmt(item.value)}</p>
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg ${sCfg.color} bg-white/5 border border-white/10`}>
                  {sCfg.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      <div className="h-10" />
    </div>
  )
}
