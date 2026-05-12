import type { Metadata } from 'next'
import { mockCustomerSegments, mockCustomerSegmentStats } from '@/lib/mockData'

export const metadata: Metadata = {
  title: 'Segmentos — KINEXIS',
  description: 'Segmentación inteligente de clientes por comportamiento y valor.',
}

const CHURN_CONFIG = {
  low: { label: 'Bajo', color: '#4ade80', bg: 'bg-green-400/10' },
  medium: { label: 'Medio', color: '#facc15', bg: 'bg-yellow-400/10' },
  high: { label: 'Alto', color: '#f87171', bg: 'bg-red-400/10' },
}

export default function CustomerSegmentsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-black tight-tracking" style={{ color: 'var(--text-primary)' }}>
              Segmentos
            </h1>
            <span className="px-2 py-1 rounded-full bg-purple-400/10 border border-purple-400/20 text-[9px] font-black label-tracking text-purple-400">
              AGENTE #20
            </span>
          </div>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Grupos de clientes por comportamiento, valor y ciclo de vida
          </p>
        </div>
        <button
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all hover:opacity-90 active:scale-[0.97]"
          style={{ backgroundColor: 'var(--accent-primary)', color: '#000' }}
        >
          <span className="material-symbols-outlined !text-[14px]">add</span>
          Nuevo segmento
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Segmentos', value: mockCustomerSegmentStats.total_segments, color: 'var(--text-primary)' },
          { label: 'Clientes totales', value: mockCustomerSegmentStats.total_customers.toLocaleString(), color: '#a78bfa' },
          { label: 'LTV promedio', value: `$${mockCustomerSegmentStats.avg_ltv.toLocaleString()}`, color: '#CCFF00' },
          { label: 'En riesgo', value: mockCustomerSegmentStats.high_risk_count.toLocaleString(), color: '#f87171' },
        ].map(s => (
          <div key={s.label} className="glass-card p-4 rounded-2xl">
            <p className="text-[10px] label-tracking mb-1" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
            <p className="text-xl font-black" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Segment cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockCustomerSegments.map(seg => {
          const cc = CHURN_CONFIG[seg.churn_risk]
          return (
            <div key={seg.id} className="glass-card rounded-2xl p-5 space-y-4 hover:border-purple-400/20 transition-colors cursor-pointer" style={{ border: '1px solid var(--border-color)' }}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: seg.color }} />
                    <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{seg.name}</p>
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>{seg.description}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-2xl font-black" style={{ color: seg.color }}>{seg.customers_count.toLocaleString()}</p>
                  <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>clientes</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-3 border-t" style={{ borderColor: 'var(--border-color)' }}>
                <div>
                  <p className="text-[10px] label-tracking mb-0.5" style={{ color: 'var(--text-muted)' }}>LTV prom.</p>
                  <p className="text-xs font-bold" style={{ color: '#CCFF00' }}>${seg.avg_ltv.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[10px] label-tracking mb-0.5" style={{ color: 'var(--text-muted)' }}>Órd. prom.</p>
                  <p className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{seg.avg_orders}</p>
                </div>
                <div>
                  <p className="text-[10px] label-tracking mb-0.5" style={{ color: 'var(--text-muted)' }}>Churn riesgo</p>
                  <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${cc.bg}`} style={{ color: cc.color }}>
                    {cc.label}
                  </span>
                </div>
              </div>
              <button
                className="w-full py-2 rounded-xl text-xs font-bold transition-all hover:opacity-90 active:scale-[0.97]"
                style={{ backgroundColor: 'rgba(167,139,250,0.1)', color: '#a78bfa', border: '1px solid rgba(167,139,250,0.2)' }}
              >
                Ver segmento →
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
