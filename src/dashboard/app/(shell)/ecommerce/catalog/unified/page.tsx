'use client'

import { useState, useEffect } from 'react'
import { authenticatedFetch } from '@/lib/api-client'

interface Product {
  id: string
  sku: string
  name: string
  category: string | null
  base_price: number
  cost: number
  is_kit: boolean
  created_at: string
}

export default function UnifiedCatalogPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [dataSource, setDataSource] = useState<'live' | 'mock'>('mock')
  const [search, setSearch] = useState('')

  useEffect(() => {
    authenticatedFetch('/api/ecommerce/products')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        const list = d?.products ?? d
        if (Array.isArray(list) && list.length > 0) {
          setProducts(list)
          setDataSource('live')
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = products.filter(p =>
    !search ||
    p.sku.toLowerCase().includes(search.toLowerCase()) ||
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.category ?? '').toLowerCase().includes(search.toLowerCase())
  )

  const margin = (p: Product) => p.base_price > 0 ? Math.round(((p.base_price - p.cost) / p.base_price) * 100) : 0

  return (
    <div className="space-y-10 animate-in">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <span className="text-[0.75rem] font-bold label-tracking text-primary drop-shadow-[0_0_8px_rgba(204,255,0,0.2)]">
            E-commerce / Catálogo Unificado
          </span>
          <div className="flex items-center gap-3">
            <h1 className="text-4xl md:text-5xl font-black tight-tracking text-on-surface">Catálogo Unificado</h1>
            <span className={`px-2 py-1 rounded-full text-[9px] font-black label-tracking border ${
              loading ? 'border-white/10 text-white/30' :
              dataSource === 'live' ? 'border-green-500/30 bg-green-500/10 text-green-400' :
              'border-amber-500/30 bg-amber-500/10 text-amber-400'
            }`}>
              {loading ? 'CARGANDO' : dataSource === 'live' ? 'LIVE' : 'SANDBOX'}
            </span>
          </div>
          <p className="text-sm text-on-surface-variant">
            {loading ? '…' : `${products.length} producto${products.length !== 1 ? 's' : ''} · todos los canales`}
          </p>
        </div>
        <button className="px-6 py-3 rounded-2xl bg-primary text-black text-[10px] font-black label-tracking hover:bg-primary/90 transition-all flex items-center gap-2 self-start md:self-auto">
          <span className="material-symbols-outlined !text-[16px]">add</span>
          NUEVO PRODUCTO
        </button>
      </header>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total SKUs', value: products.length, color: 'text-on-surface' },
          { label: 'Kits', value: products.filter(p => p.is_kit).length, color: 'text-blue-400' },
          { label: 'Categorías', value: new Set(products.map(p => p.category).filter(Boolean)).size, color: 'text-purple-400' },
          { label: 'Precio Prom.', value: products.length > 0 ? `$${Math.round(products.reduce((s, p) => s + p.base_price, 0) / products.length).toLocaleString()}` : '—', color: 'text-primary' },
        ].map(k => (
          <div key={k.label} className="glass-card rounded-[1.5rem] border border-white/5 p-5">
            <p className="text-[9px] font-black label-tracking text-on-surface/40 uppercase mb-2">{k.label}</p>
            <p className={`text-2xl font-black ${k.color}`}>{loading ? '—' : k.value}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative w-72">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface/30 !text-[16px]">search</span>
        <input
          type="text"
          placeholder="Buscar SKU, nombre o categoría…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-[11px] font-medium text-on-surface placeholder:text-on-surface/30 focus:border-primary/50 outline-none w-full"
        />
      </div>

      <div className="glass-card rounded-[2rem] border border-white/5 overflow-hidden">
        <div className="divide-y divide-white/5">
          {loading ? (
            <div className="p-12 text-center text-sm text-on-surface/40">Cargando…</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <span className="material-symbols-outlined !text-[32px] text-on-surface/20">category</span>
              <p className="text-sm text-on-surface/40 mt-2">
                {products.length === 0 ? 'Sin productos en el catálogo' : 'Sin resultados para la búsqueda'}
              </p>
            </div>
          ) : filtered.map(p => {
            const m = margin(p)
            return (
              <div key={p.id} className="flex items-center gap-4 px-8 py-4 hover:bg-white/[0.02] transition-colors group">
                <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined !text-[16px] text-primary">{p.is_kit ? 'inventory_2' : 'package'}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-mono font-bold text-on-surface">{p.sku}</p>
                    {p.is_kit && (
                      <span className="text-[8px] font-black label-tracking text-blue-400 bg-blue-400/10 border border-blue-400/20 px-1.5 py-0.5 rounded-lg">KIT</span>
                    )}
                  </div>
                  <p className="text-[10px] text-on-surface/60 truncate">{p.name}</p>
                </div>
                <p className="text-[10px] text-on-surface/40 w-24 truncate">{p.category ?? '—'}</p>
                <div className="text-right">
                  <p className="text-xs font-black text-on-surface">${p.base_price.toLocaleString()}</p>
                  <p className="text-[9px] text-on-surface/40">costo: ${p.cost.toLocaleString()}</p>
                </div>
                <span className={`text-[9px] font-black w-14 text-right ${m >= 40 ? 'text-green-400' : m >= 20 ? 'text-amber-400' : 'text-red-400'}`}>
                  {m}% mg
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
