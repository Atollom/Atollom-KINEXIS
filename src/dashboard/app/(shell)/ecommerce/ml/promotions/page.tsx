import type { Metadata } from 'next'
import { mockMLPromotions, mockMLPromotionStats } from '@/lib/mockData'

export const metadata: Metadata = {
  title: 'Promociones ML — KINEXIS',
  description: 'Gestiona promociones y descuentos en Mercado Libre.',
}

const TYPE_LABELS: Record<string, string> = { classic: 'Clásica', deal_day: 'Deal del Día', discount: 'Descuento', combo: 'Combo' }

export default function MLPromotionsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-black tight-tracking" style={{ color: 'var(--text-primary)' }}>
              Promociones ML
            </h1>
            <span className="px-2 py-1 rounded-full bg-yellow-400/10 border border-yellow-400/20 text-[9px] font-black label-tracking text-yellow-400">
              AGENTE #2
            </span>
          </div>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Campañas y descuentos activos en Mercado Libre
          </p>
        </div>
        <button
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all hover:opacity-90 active:scale-[0.97]"
          style={{ backgroundColor: 'var(--accent-primary)', color: '#000' }}
        >
          <span className="material-symbols-outlined !text-[14px]">add</span>
          Nueva promoción
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Activas', value: mockMLPromotionStats.active, color: '#4ade80' },
          { label: 'Programadas', value: mockMLPromotionStats.scheduled, color: '#60a5fa' },
          { label: 'Terminadas', value: mockMLPromotionStats.ended, color: 'var(--text-muted)' },
          { label: 'Lift promedio', value: `+${mockMLPromotionStats.avg_lift}%`, color: '#CCFF00' },
          { label: 'Productos', value: mockMLPromotionStats.total_products, color: 'var(--text-primary)' },
        ].map(s => (
          <div key={s.label} className="glass-card p-4 rounded-2xl">
            <p className="text-[10px] label-tracking mb-1" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
            <p className="text-xl font-black" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {mockMLPromotions.map(promo => (
          <div key={promo.id} className="glass-card rounded-2xl p-5 space-y-4 hover:border-yellow-400/20 transition-colors" style={{ border: '1px solid var(--border-color)' }}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <p className="font-bold text-sm leading-tight mb-1" style={{ color: 'var(--text-primary)' }}>{promo.title}</p>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-yellow-400/10 text-yellow-400">{TYPE_LABELS[promo.type]}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${promo.status === 'active' ? 'bg-green-400/10 text-green-400' : promo.status === 'scheduled' ? 'bg-blue-400/10 text-blue-400' : 'bg-white/5 text-white/30'}`}>
                    {promo.status === 'active' ? 'Activa' : promo.status === 'scheduled' ? 'Programada' : 'Terminada'}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black" style={{ color: '#CCFF00' }}>-{promo.discount_pct}%</p>
                <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>descuento</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 pt-1 border-t" style={{ borderColor: 'var(--border-color)' }}>
              <div>
                <p className="text-[10px] label-tracking mb-0.5" style={{ color: 'var(--text-muted)' }}>Productos</p>
                <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{promo.products_count}</p>
              </div>
              <div>
                <p className="text-[10px] label-tracking mb-0.5" style={{ color: 'var(--text-muted)' }}>Sales Lift</p>
                <p className="text-sm font-bold" style={{ color: promo.sales_lift > 0 ? '#4ade80' : 'var(--text-muted)' }}>
                  {promo.sales_lift > 0 ? `+${promo.sales_lift}%` : '—'}
                </p>
              </div>
              <div>
                <p className="text-[10px] label-tracking mb-0.5" style={{ color: 'var(--text-muted)' }}>Vigencia</p>
                <p className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>{promo.start_date}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
