import type { Metadata } from 'next'
import { mockAmazonReports, mockAmazonReportStats } from '@/lib/mockData'

export const metadata: Metadata = {
  title: 'Amazon Reports — KINEXIS',
  description: 'Reportes de ventas, inventario y publicidad de Amazon.',
}

const TYPE_ICONS: Record<string, string> = {
  Sales: 'bar_chart', Inventory: 'inventory_2', Advertising: 'ads_click',
  Returns: 'assignment_return', Reviews: 'star',
}

export default function AmazonReportsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-black tight-tracking" style={{ color: 'var(--text-primary)' }}>
              Amazon Reports
            </h1>
            <span className="px-2 py-1 rounded-full bg-orange-400/10 border border-orange-400/20 text-[9px] font-black label-tracking text-orange-400">
              AGENTE #9
            </span>
          </div>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Reportes generados desde Seller Central
          </p>
        </div>
        <button
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all hover:opacity-90 active:scale-[0.97]"
          style={{ backgroundColor: 'var(--accent-primary)', color: '#000' }}
        >
          <span className="material-symbols-outlined !text-[14px]">add_chart</span>
          Solicitar reporte
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Listos', value: mockAmazonReportStats.ready, color: '#4ade80' },
          { label: 'Procesando', value: mockAmazonReportStats.processing, color: '#facc15' },
          { label: 'Error', value: mockAmazonReportStats.failed, color: '#f87171' },
          { label: 'Tamaño total', value: `${mockAmazonReportStats.total_size_kb} KB`, color: '#fb923c' },
        ].map(s => (
          <div key={s.label} className="glass-card p-4 rounded-2xl">
            <p className="text-[10px] label-tracking mb-1" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
            <p className="text-xl font-black" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Report list */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
          <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Reportes disponibles</h2>
        </div>
        <div className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
          {mockAmazonReports.map(r => (
            <div key={r.id} className="px-5 py-4 flex items-center gap-4 hover:bg-white/[0.02] transition-colors cursor-pointer">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(251,146,60,0.1)' }}>
                <span className="material-symbols-outlined !text-[18px] text-orange-400">{TYPE_ICONS[r.type] ?? 'description'}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>{r.name}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{r.type} · {r.period}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${r.status === 'ready' ? 'bg-green-400/10 text-green-400' : r.status === 'processing' ? 'bg-yellow-400/10 text-yellow-400' : 'bg-red-400/10 text-red-400'}`}>
                  {r.status === 'ready' ? 'Listo' : r.status === 'processing' ? 'Procesando' : 'Error'}
                </span>
                {r.status === 'ready' && (
                  <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>{r.size_kb} KB</p>
                )}
              </div>
              {r.status === 'ready' && (
                <button className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-colors hover:bg-white/5" style={{ border: '1px solid var(--border-color)' }}>
                  <span className="material-symbols-outlined !text-[16px]" style={{ color: 'var(--text-muted)' }}>download</span>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
