'use client'

import { useState } from 'react'
import { mockFBCatalog, mockFBCatalogStats } from '@/lib/mockData'
import { useToast } from '@/components/ToastProvider'

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  active:       { label: 'Activo',       color: '#4ade80', bg: 'bg-green-400/10' },
  pending:      { label: 'Pendiente',    color: '#facc15', bg: 'bg-yellow-400/10' },
  rejected:     { label: 'Rechazado',    color: '#f87171', bg: 'bg-red-400/10' },
  disapproved:  { label: 'Desaprobado',  color: '#fb923c', bg: 'bg-orange-400/10' },
}

const AVAIL_CONFIG: Record<string, { label: string; color: string }> = {
  in_stock:     { label: 'En stock',     color: '#4ade80' },
  out_of_stock: { label: 'Agotado',      color: '#f87171' },
}

export default function FacebookCatalogPage() {
  const { showToast } = useToast()
  const [syncing, setSyncing] = useState(false)
  const [filter, setFilter] = useState<string>('all')

  const handleSync = () => {
    setSyncing(true)
    setTimeout(() => {
      setSyncing(false)
      showToast({ type: 'success', title: 'Catálogo sincronizado', message: 'Todos los productos fueron enviados a Facebook.' })
    }, 2000)
  }

  const filtered = filter === 'all' ? mockFBCatalog : mockFBCatalog.filter(p => p.status === filter)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-black tight-tracking" style={{ color: 'var(--text-primary)' }}>Facebook Catalog</h1>
            <span className="px-2 py-1 rounded-full bg-[#60a5fa]/10 border border-[#60a5fa]/20 text-[9px] font-black label-tracking text-[#60a5fa]">META</span>
          </div>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Gestión de catálogo de productos para Facebook e Instagram Shopping</p>
        </div>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all hover:opacity-90 active:scale-[0.97] disabled:opacity-60"
          style={{ backgroundColor: 'var(--accent-primary)', color: '#000' }}
        >
          <span className={`material-symbols-outlined !text-[14px] ${syncing ? 'animate-spin' : ''}`}>{syncing ? 'progress_activity' : 'sync'}</span>
          {syncing ? 'Sincronizando...' : 'Sincronizar catálogo'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Total productos', value: mockFBCatalogStats.total,       color: 'var(--text-primary)' },
          { label: 'Activos',         value: mockFBCatalogStats.active,      color: '#4ade80' },
          { label: 'Pendientes',      value: mockFBCatalogStats.pending,     color: '#facc15' },
          { label: 'Rechazados',      value: mockFBCatalogStats.rejected,    color: '#f87171' },
          { label: 'Sync hoy',        value: mockFBCatalogStats.synced_today, color: '#60a5fa' },
        ].map(s => (
          <div key={s.label} className="glass-card p-4 rounded-2xl">
            <p className="text-[10px] label-tracking mb-1" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
            <p className="text-xl font-black" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {['all', 'active', 'pending', 'rejected', 'disapproved'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className="flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-all capitalize"
            style={filter === f
              ? { backgroundColor: 'var(--accent-primary)', color: '#000' }
              : { backgroundColor: 'var(--bg-card)', color: 'var(--text-muted)', border: '1px solid var(--border-color)' }}
          >
            {f === 'all' ? 'Todos' : STATUS_CONFIG[f]?.label ?? f}
          </button>
        ))}
      </div>

      {/* Product table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-color)' }}>
          <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Productos ({filtered.length})</h2>
          <button onClick={() => showToast({ type: 'info', title: 'Importar', message: 'Importación masiva desde CSV próximamente.' })}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:opacity-80"
            style={{ backgroundColor: 'rgba(96,165,250,0.1)', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.2)' }}
          >
            <span className="material-symbols-outlined !text-[13px]">upload</span>
            Importar
          </button>
        </div>
        <div className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
          {filtered.map(product => {
            const sc = STATUS_CONFIG[product.status]
            const ac = AVAIL_CONFIG[product.availability]
            return (
              <div key={product.id} className="px-5 py-4 flex items-center gap-4 hover:bg-white/[0.02] transition-colors">
                {/* Color swatch placeholder */}
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.15)' }}>
                  <span className="material-symbols-outlined !text-[18px] text-[#60a5fa]">shopping_bag</span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-bold text-sm truncate" style={{ color: 'var(--text-primary)' }}>{product.name}</p>
                    <span className={`flex-shrink-0 px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${sc.bg}`} style={{ color: sc.color }}>{sc.label}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px]" style={{ color: 'var(--text-muted)' }}>
                    <span>SKU: <span className="font-mono">{product.sku}</span></span>
                    <span>{product.category}</span>
                    <span style={{ color: ac.color }}>{ac.label}</span>
                  </div>
                  {product.issues && product.issues.length > 0 && (
                    <div className="flex items-center gap-1 mt-1">
                      <span className="material-symbols-outlined !text-[11px] text-[#f87171]">warning</span>
                      <span className="text-[10px] text-[#f87171]">{product.issues[0]}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-4 flex-shrink-0">
                  <div className="text-right">
                    <p className="text-sm font-black" style={{ color: '#CCFF00' }}>${product.price.toLocaleString('es-MX')}</p>
                    {product.facebook_product_id && (
                      <p className="text-[9px] font-mono" style={{ color: 'var(--text-muted)' }}>ID: {product.facebook_product_id.slice(-8)}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => showToast({ type: 'info', title: 'Editar producto', message: product.name })}
                      className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-white/5"
                      style={{ border: '1px solid var(--border-color)' }}>
                      <span className="material-symbols-outlined !text-[14px]" style={{ color: 'var(--text-muted)' }}>edit</span>
                    </button>
                    {product.status === 'rejected' || product.status === 'disapproved' ? (
                      <button onClick={() => showToast({ type: 'info', title: 'Revisar', message: `Revisando problemas de ${product.name}` })}
                        className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-red-400/10"
                        style={{ border: '1px solid rgba(248,113,113,0.2)' }}>
                        <span className="material-symbols-outlined !text-[14px] text-[#f87171]">bug_report</span>
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
