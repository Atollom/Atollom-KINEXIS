import type { Metadata } from 'next'
import { mockShopifyCollections, mockShopifyCollectionStats } from '@/lib/mockData'

export const metadata: Metadata = {
  title: 'Shopify Collections — KINEXIS',
  description: 'Gestiona colecciones manuales e inteligentes de Shopify.',
}

export default function ShopifyCollectionsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-black tight-tracking" style={{ color: 'var(--text-primary)' }}>
              Collections
            </h1>
            <span className="px-2 py-1 rounded-full bg-[#CCFF00]/10 border border-[#CCFF00]/20 text-[9px] font-black label-tracking text-[#CCFF00]">
              SHOPIFY
            </span>
          </div>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Colecciones de productos en tu tienda Shopify
          </p>
        </div>
        <button
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all hover:opacity-90 active:scale-[0.97]"
          style={{ backgroundColor: 'var(--accent-primary)', color: '#000' }}
        >
          <span className="material-symbols-outlined !text-[14px]">add</span>
          Nueva colección
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Total', value: mockShopifyCollectionStats.total, color: 'var(--text-primary)' },
          { label: 'Publicadas', value: mockShopifyCollectionStats.published, color: '#CCFF00' },
          { label: 'Inteligentes', value: mockShopifyCollectionStats.smart, color: '#4ade80' },
          { label: 'Manuales', value: mockShopifyCollectionStats.manual, color: '#60a5fa' },
          { label: 'Revenue 30d', value: `$${mockShopifyCollectionStats.total_revenue_30d.toLocaleString()}`, color: '#CCFF00' },
        ].map(s => (
          <div key={s.label} className="glass-card p-4 rounded-2xl">
            <p className="text-[10px] label-tracking mb-1" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
            <p className="text-xl font-black" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Collection cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockShopifyCollections.map(col => (
          <div key={col.id} className="glass-card rounded-2xl p-5 space-y-4 hover:border-[#CCFF00]/20 transition-colors cursor-pointer" style={{ border: '1px solid var(--border-color)' }}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-bold text-sm leading-tight mb-1" style={{ color: 'var(--text-primary)' }}>{col.title}</p>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${col.type === 'smart' ? 'bg-[#CCFF00]/10 text-[#CCFF00]' : 'bg-blue-400/10 text-blue-400'}`}>
                    {col.type === 'smart' ? 'Inteligente' : 'Manual'}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${col.published ? 'bg-green-400/10 text-green-400' : 'bg-white/5 text-white/30'}`}>
                    {col.published ? 'Publicada' : 'Borrador'}
                  </span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(204,255,0,0.08)' }}>
                <span className="material-symbols-outlined !text-[18px] text-[#CCFF00]">collections_bookmark</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 pt-3 border-t" style={{ borderColor: 'var(--border-color)' }}>
              <div>
                <p className="text-[10px] label-tracking mb-0.5" style={{ color: 'var(--text-muted)' }}>Productos</p>
                <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{col.products_count}</p>
              </div>
              <div>
                <p className="text-[10px] label-tracking mb-0.5" style={{ color: 'var(--text-muted)' }}>Revenue 30d</p>
                <p className="text-sm font-bold" style={{ color: col.revenue_30d > 0 ? '#CCFF00' : 'var(--text-muted)' }}>
                  {col.revenue_30d > 0 ? `$${col.revenue_30d.toLocaleString()}` : '—'}
                </p>
              </div>
              <div>
                <p className="text-[10px] label-tracking mb-0.5" style={{ color: 'var(--text-muted)' }}>Órdenes</p>
                <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{col.orders_30d > 0 ? col.orders_30d : '—'}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
