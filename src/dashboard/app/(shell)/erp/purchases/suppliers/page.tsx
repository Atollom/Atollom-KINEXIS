import type { Metadata } from 'next'
import { mockVendors, mockVendorStats } from '@/lib/mockData'

export const metadata: Metadata = {
  title: 'Proveedores — KINEXIS',
  description: 'Evaluación y gestión de proveedores con métricas de rendimiento.',
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} className="material-symbols-outlined !text-[12px]" style={{ color: i <= Math.round(rating) ? '#facc15' : 'var(--border-color)', fontVariationSettings: "'FILL' 1" }}>star</span>
      ))}
      <span className="text-[10px] ml-1 font-bold" style={{ color: '#facc15' }}>{rating}</span>
    </div>
  )
}

export default function SuppliersPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-black tight-tracking" style={{ color: 'var(--text-primary)' }}>
              Proveedores
            </h1>
            <span className="px-2 py-1 rounded-full bg-[#CCFF00]/10 border border-[#CCFF00]/20 text-[9px] font-black label-tracking text-[#CCFF00]">
              AGENTE #16
            </span>
          </div>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Evaluación por precio, calidad y cumplimiento de entrega
          </p>
        </div>
        <button
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all hover:opacity-90 active:scale-[0.97]"
          style={{ backgroundColor: 'var(--accent-primary)', color: '#000' }}
        >
          <span className="material-symbols-outlined !text-[14px]">add</span>
          Agregar proveedor
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Total', value: mockVendorStats.total, color: 'var(--text-primary)' },
          { label: 'Activos', value: mockVendorStats.active, color: '#4ade80' },
          { label: 'Inactivos', value: mockVendorStats.inactive, color: '#f87171' },
          { label: 'Rating prom.', value: mockVendorStats.avg_rating, color: '#facc15' },
          { label: 'Gasto total', value: `$${(mockVendorStats.total_spent_ytd / 1e6).toFixed(2)}M`, color: '#CCFF00' },
        ].map(s => (
          <div key={s.label} className="glass-card p-4 rounded-2xl">
            <p className="text-[10px] label-tracking mb-1" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
            <p className="text-xl font-black" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Vendor cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {mockVendors.map(v => (
          <div key={v.id} className="glass-card rounded-2xl p-5 space-y-4 hover:border-[#CCFF00]/20 transition-colors cursor-pointer" style={{ border: `1px solid ${v.status === 'inactive' ? 'rgba(248,113,113,0.1)' : 'var(--border-color)'}` }}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-bold text-sm" style={{ color: v.status === 'inactive' ? 'var(--text-muted)' : 'var(--text-primary)' }}>{v.name}</p>
                  {v.status === 'inactive' && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-400/10 text-red-400">Inactivo</span>}
                </div>
                <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{v.contact_name} · {v.email}</p>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/5" style={{ color: 'var(--text-muted)' }}>{v.category}</span>
              </div>
              <StarRating rating={v.rating} />
            </div>
            <div className="grid grid-cols-3 gap-3 pt-3 border-t" style={{ borderColor: 'var(--border-color)' }}>
              <div>
                <p className="text-[10px] label-tracking mb-0.5" style={{ color: 'var(--text-muted)' }}>Compras</p>
                <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{v.total_purchases}</p>
              </div>
              <div>
                <p className="text-[10px] label-tracking mb-0.5" style={{ color: 'var(--text-muted)' }}>Gastado</p>
                <p className="text-sm font-bold" style={{ color: '#CCFF00' }}>${(v.total_spent / 1e6).toFixed(2)}M</p>
              </div>
              <div>
                <p className="text-[10px] label-tracking mb-0.5" style={{ color: 'var(--text-muted)' }}>On-time</p>
                <p className="text-sm font-bold" style={{ color: v.on_time_delivery_rate >= 90 ? '#4ade80' : v.on_time_delivery_rate >= 75 ? '#facc15' : '#f87171' }}>
                  {v.on_time_delivery_rate}%
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                Términos: {v.payment_terms} · Último pedido: {v.last_order_date}
              </p>
              {v.active_pos > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#CCFF00]/10 text-[#CCFF00]">{v.active_pos} PO activas</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
