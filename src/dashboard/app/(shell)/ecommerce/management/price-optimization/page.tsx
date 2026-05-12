import type { Metadata } from 'next'
import { mockPriceOptSuggestions, mockPriceOptStats } from '@/lib/mockData'

export const metadata: Metadata = {
  title: 'Optimización de Precios — KINEXIS',
  description: 'Sugerencias de precios basadas en competencia y márgenes.',
}

const IMPACT_CONFIG = {
  high: { label: 'Alto', color: '#CCFF00', bg: 'bg-[#CCFF00]/10' },
  medium: { label: 'Medio', color: '#facc15', bg: 'bg-yellow-400/10' },
  low: { label: 'Bajo', color: '#94a3b8', bg: 'bg-white/5' },
}

const CHANNEL_CONFIG = {
  ml: { label: 'ML', color: 'text-yellow-400' },
  amazon: { label: 'Amazon', color: 'text-orange-400' },
  shopify: { label: 'Shopify', color: 'text-[#CCFF00]' },
  all: { label: 'Todos', color: 'text-purple-400' },
}

export default function PriceOptimizationPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-black tight-tracking" style={{ color: 'var(--text-primary)' }}>
              Price Optimizer
            </h1>
            <span className="px-2 py-1 rounded-full bg-[#CCFF00]/10 border border-[#CCFF00]/20 text-[9px] font-black label-tracking text-[#CCFF00]">
              AGENTE #16
            </span>
          </div>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Sugerencias de precios basadas en competencia y márgenes
          </p>
        </div>
        <button
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all hover:opacity-90 active:scale-[0.97]"
          style={{ backgroundColor: 'var(--accent-primary)', color: '#000' }}
        >
          <span className="material-symbols-outlined !text-[14px]">refresh</span>
          Analizar precios
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Sugerencias', value: mockPriceOptStats.suggestions, color: 'var(--text-primary)' },
          { label: 'Impacto alto', value: mockPriceOptStats.high_impact, color: '#CCFF00' },
          { label: 'Impacto medio', value: mockPriceOptStats.medium_impact, color: '#facc15' },
          { label: 'Ganancia potencial', value: `$${mockPriceOptStats.total_potential_gain.toLocaleString()}`, color: '#4ade80' },
        ].map(s => (
          <div key={s.label} className="glass-card p-4 rounded-2xl">
            <p className="text-[10px] label-tracking mb-1" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
            <p className="text-xl font-black" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Suggestion cards */}
      <div className="space-y-3">
        {mockPriceOptSuggestions.map(s => {
          const ic = IMPACT_CONFIG[s.impact]
          const cc = CHANNEL_CONFIG[s.channel]
          const diff = s.suggested_price - s.current_price
          const pct = ((diff / s.current_price) * 100).toFixed(1)
          return (
            <div key={s.id} className="glass-card rounded-2xl p-5" style={{ border: '1px solid var(--border-color)' }}>
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{s.title}</p>
                    <span className="font-mono text-[10px]" style={{ color: 'var(--text-muted)' }}>({s.sku})</span>
                  </div>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.reason}</p>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${ic.bg}`} style={{ color: ic.color }}>
                      Impacto {ic.label}
                    </span>
                    <span className={`text-xs font-bold ${cc.color}`}>{cc.label}</span>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-[10px] label-tracking mb-0.5" style={{ color: 'var(--text-muted)' }}>Actual</p>
                    <p className="text-lg font-black" style={{ color: 'var(--text-secondary)' }}>${s.current_price.toLocaleString()}</p>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="material-symbols-outlined !text-[20px]" style={{ color: diff < 0 ? '#f87171' : '#4ade80' }}>
                      {diff < 0 ? 'arrow_downward' : 'arrow_upward'}
                    </span>
                    <span className="text-[10px] font-bold" style={{ color: diff < 0 ? '#f87171' : '#4ade80' }}>
                      {diff < 0 ? '' : '+'}{pct}%
                    </span>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] label-tracking mb-0.5" style={{ color: 'var(--text-muted)' }}>Sugerido</p>
                    <p className="text-lg font-black" style={{ color: '#CCFF00' }}>${s.suggested_price.toLocaleString()}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] label-tracking mb-0.5" style={{ color: 'var(--text-muted)' }}>Ganancia pot.</p>
                    <p className="text-sm font-black text-green-400">+${s.potential_gain.toLocaleString()}</p>
                  </div>
                  <button
                    className="px-4 py-2 rounded-xl text-xs font-bold transition-all hover:opacity-90 active:scale-[0.97] whitespace-nowrap"
                    style={{ backgroundColor: 'var(--accent-primary)', color: '#000' }}
                  >
                    Aplicar
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
