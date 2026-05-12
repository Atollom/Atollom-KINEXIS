import type { Metadata } from 'next'
import { mockSalesReports, mockSalesReportStats } from '@/lib/mockData'

export const metadata: Metadata = {
  title: 'Sales Reports — KINEXIS',
  description: 'Reportes de pipeline, forecast y rendimiento del equipo de ventas.',
}

const TYPE_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  pipeline: { label: 'Pipeline', icon: 'bar_chart', color: '#a78bfa' },
  forecast: { label: 'Forecast', icon: 'trending_up', color: '#CCFF00' },
  performance: { label: 'Performance', icon: 'speed', color: '#fb923c' },
  activity: { label: 'Actividad', icon: 'event_note', color: '#60a5fa' },
}

export default function SalesReportsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-black tight-tracking" style={{ color: 'var(--text-primary)' }}>
              Sales Reports
            </h1>
            <span className="px-2 py-1 rounded-full bg-purple-400/10 border border-purple-400/20 text-[9px] font-black label-tracking text-purple-400">
              CRM
            </span>
          </div>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Pipeline, forecast y métricas de rendimiento del equipo
          </p>
        </div>
        <button
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all hover:opacity-90 active:scale-[0.97]"
          style={{ backgroundColor: 'var(--accent-primary)', color: '#000' }}
        >
          <span className="material-symbols-outlined !text-[14px]">add_chart</span>
          Generar reporte
        </button>
      </div>

      {/* KPI summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Pipeline activo', value: `$${mockSalesReportStats.total_pipeline_value.toLocaleString()}`, color: '#a78bfa' },
          { label: 'Conversión prom.', value: `${mockSalesReportStats.avg_conversion}%`, color: '#CCFF00' },
          { label: 'Deal size prom.', value: `$${mockSalesReportStats.avg_deal_size.toLocaleString()}`, color: '#4ade80' },
          { label: 'Reportes', value: mockSalesReportStats.reports, color: 'var(--text-primary)' },
        ].map(s => (
          <div key={s.label} className="glass-card p-4 rounded-2xl">
            <p className="text-[10px] label-tracking mb-1" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
            <p className="text-xl font-black" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Report cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {mockSalesReports.map(rep => {
          const tc = TYPE_CONFIG[rep.type]
          return (
            <div key={rep.id} className="glass-card rounded-2xl p-5 space-y-4 hover:border-purple-400/20 transition-colors cursor-pointer" style={{ border: '1px solid var(--border-color)' }}>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${tc.color}15` }}>
                  <span className="material-symbols-outlined !text-[18px]" style={{ color: tc.color }}>{tc.icon}</span>
                </div>
                <div className="flex-1">
                  <p className="font-bold text-sm mb-0.5" style={{ color: 'var(--text-primary)' }}>{rep.name}</p>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ backgroundColor: `${tc.color}15`, color: tc.color }}>{tc.label}</span>
                    <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{rep.period}</span>
                  </div>
                </div>
                <button className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-colors hover:bg-white/5" style={{ border: '1px solid var(--border-color)' }}>
                  <span className="material-symbols-outlined !text-[16px]" style={{ color: 'var(--text-muted)' }}>download</span>
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t" style={{ borderColor: 'var(--border-color)' }}>
                <div>
                  <p className="text-[10px] label-tracking mb-0.5" style={{ color: 'var(--text-muted)' }}>Deals</p>
                  <p className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>{rep.data.total_deals}</p>
                </div>
                <div>
                  <p className="text-[10px] label-tracking mb-0.5" style={{ color: 'var(--text-muted)' }}>Ganados</p>
                  <p className="text-sm font-black text-green-400">{rep.data.won_deals}</p>
                </div>
                <div>
                  <p className="text-[10px] label-tracking mb-0.5" style={{ color: 'var(--text-muted)' }}>Conversión</p>
                  <p className="text-sm font-black" style={{ color: '#CCFF00' }}>{rep.data.conversion_rate}%</p>
                </div>
                <div>
                  <p className="text-[10px] label-tracking mb-0.5" style={{ color: 'var(--text-muted)' }}>Valor ganado</p>
                  <p className="text-sm font-black" style={{ color: '#a78bfa' }}>${rep.data.won_value.toLocaleString()}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
