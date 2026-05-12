import type { Metadata } from 'next'
import { mockMLCatalog, mockMLCatalogStats } from '@/lib/mockData'

export const metadata: Metadata = {
  title: 'Catálogo ML — KINEXIS',
  description: 'Gestiona tus publicaciones en Mercado Libre con análisis de salud y rendimiento.',
}

function HealthBar({ score }: { score: number }) {
  const color = score >= 80 ? '#CCFF00' : score >= 60 ? '#facc15' : '#f87171'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full" style={{ backgroundColor: 'var(--border-color)' }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${score}%`, backgroundColor: color }} />
      </div>
      <span className="text-[10px] font-bold w-6 text-right" style={{ color }}>{score}</span>
    </div>
  )
}

export default function MLCatalogPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-black tight-tracking" style={{ color: 'var(--text-primary)' }}>
              Catálogo ML
            </h1>
            <span className="px-2 py-1 rounded-full bg-yellow-400/10 border border-yellow-400/20 text-[9px] font-black label-tracking text-yellow-400">
              AGENTE #1
            </span>
          </div>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Publicaciones activas en Mercado Libre con análisis de salud
          </p>
        </div>
        <button
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all hover:opacity-90 active:scale-[0.97]"
          style={{ backgroundColor: 'var(--accent-primary)', color: '#000' }}
        >
          <span className="material-symbols-outlined !text-[14px]">sync</span>
          Sincronizar catálogo
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Total', value: mockMLCatalogStats.total, color: 'var(--text-primary)' },
          { label: 'Activas', value: mockMLCatalogStats.active, color: '#4ade80' },
          { label: 'Pausadas', value: mockMLCatalogStats.paused, color: '#facc15' },
          { label: 'Inactivas', value: mockMLCatalogStats.inactive, color: '#f87171' },
          { label: 'Salud prom.', value: `${mockMLCatalogStats.avg_health}%`, color: '#CCFF00' },
          { label: 'Visitas', value: mockMLCatalogStats.total_visits.toLocaleString(), color: '#60a5fa' },
        ].map(s => (
          <div key={s.label} className="glass-card p-4 rounded-2xl">
            <p className="text-[10px] label-tracking mb-1" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
            <p className="text-xl font-black" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-color)' }}>
          <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Publicaciones</h2>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <span className="material-symbols-outlined !text-[14px]" style={{ color: 'var(--text-muted)' }}>search</span>
            <span style={{ color: 'var(--text-muted)' }}>Buscar producto...</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                {['Producto', 'Catálogo ID', 'Precio', 'Vendidos', 'Visitas', 'Conversión', 'Salud', 'Estado'].map(h => (
                  <th key={h} className="px-5 py-3 text-left font-bold label-tracking text-[10px]" style={{ color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mockMLCatalog.map(item => (
                <tr key={item.id} className="border-b transition-colors hover:bg-white/[0.02] cursor-pointer" style={{ borderColor: 'var(--border-color)' }}>
                  <td className="px-5 py-3">
                    <div>
                      <p className="font-bold text-xs leading-tight mb-0.5" style={{ color: 'var(--text-primary)' }}>{item.title}</p>
                      <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{item.brand} · {item.category}</p>
                    </div>
                  </td>
                  <td className="px-5 py-3 font-mono text-[10px] text-yellow-400">{item.catalog_id}</td>
                  <td className="px-5 py-3 font-bold" style={{ color: 'var(--text-primary)' }}>${item.price.toLocaleString()}</td>
                  <td className="px-5 py-3" style={{ color: 'var(--text-secondary)' }}>{item.sold_quantity.toLocaleString()}</td>
                  <td className="px-5 py-3" style={{ color: 'var(--text-secondary)' }}>{item.visits.toLocaleString()}</td>
                  <td className="px-5 py-3 font-bold" style={{ color: '#CCFF00' }}>{item.conversion}%</td>
                  <td className="px-5 py-3 w-32"><HealthBar score={item.health_score} /></td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${item.status === 'active' ? 'bg-green-400/10 text-green-400' : item.status === 'paused' ? 'bg-yellow-400/10 text-yellow-400' : 'bg-red-400/10 text-red-400'}`}>
                      {item.status === 'active' ? 'Activa' : item.status === 'paused' ? 'Pausada' : 'Inactiva'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
