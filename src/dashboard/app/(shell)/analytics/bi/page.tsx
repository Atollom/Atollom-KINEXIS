'use client'

import { useState, useEffect } from 'react'
import { useToast } from '@/components/ToastProvider'

const FALLBACK_STATS = { total_dashboards: 3, total_widgets: 9, total_views: 368, shared_users: 5 }
const FALLBACK_DASHBOARDS = [
  { id: 'bi1', name: 'Executive Overview',    description: 'Vista 360° para dirección',       widgets: [{ id: 'w1', type: 'metric', title: 'Revenue MTD', data_source: 'sales', size: 'sm' }, { id: 'w2', type: 'chart', title: 'Ventas por Canal', data_source: 'sales', size: 'lg' }, { id: 'w3', type: 'table', title: 'Top 10 Productos', data_source: 'products', size: 'md' }, { id: 'w4', type: 'metric', title: 'ROAS Global', data_source: 'marketing', size: 'sm' }], shared_with: ['admin@kaptools.com'], created_by: 'Carlos Cortés', last_updated: '2026-05-09T14:30:00Z', views: 234 },
  { id: 'bi2', name: 'Marketing Performance', description: 'ROI y conversiones por canal',    widgets: [{ id: 'w5', type: 'chart', title: 'ROAS por Canal', data_source: 'marketing', size: 'lg' }, { id: 'w6', type: 'metric', title: 'CAC Promedio', data_source: 'marketing', size: 'sm' }, { id: 'w7', type: 'chart', title: 'Embudo Conversión', data_source: 'funnel', size: 'md' }], shared_with: ['marketing@kaptools.com'], created_by: 'Laura Méndez', last_updated: '2026-05-10T09:00:00Z', views: 89 },
  { id: 'bi3', name: 'Inventory Intelligence', description: 'Stock, rotación y reorden',      widgets: [{ id: 'w8', type: 'table', title: 'SKUs críticos', data_source: 'inventory', size: 'md' }, { id: 'w9', type: 'metric', title: 'Turnover Rate', data_source: 'inventory', size: 'sm' }], shared_with: ['almacen@kaptools.com'], created_by: 'Carlos Cortés', last_updated: '2026-05-08T16:00:00Z', views: 45 },
]

const WIDGET_ICONS: Record<string, string> = { metric: 'straighten', chart: 'bar_chart', table: 'table_view', map: 'map' }
const WIDGET_COLORS: Record<string, string> = { metric: '#CCFF00', chart: '#60a5fa', table: '#a78bfa', map: '#4ade80' }
const SIZE_SPANS: Record<string, string> = { sm: 'col-span-1', md: 'col-span-1 md:col-span-2', lg: 'col-span-1 md:col-span-3' }

export default function DataStudioPage() {
  const { showToast } = useToast()
  const [biStats, setBiStats]       = useState(FALLBACK_STATS)
  const [dashboards, setDashboards] = useState(FALLBACK_DASHBOARDS)
  const [active, setActive]         = useState(FALLBACK_DASHBOARDS[0].id)

  useEffect(() => {
    fetch('/api/bi')
      .then(r => r.json())
      .then(d => {
        if (d.stats)      { setBiStats(d.stats) }
        if (d.dashboards) { setDashboards(d.dashboards); setActive(d.dashboards[0].id) }
      })
      .catch(() => {})
  }, [])

  const dashboard = dashboards.find(d => d.id === active) ?? dashboards[0]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-black tight-tracking" style={{ color: 'var(--text-primary)' }}>Data Studio</h1>
            <span className="px-2 py-1 rounded-full bg-[#CCFF00]/10 border border-[#CCFF00]/20 text-[9px] font-black label-tracking text-[#CCFF00]">BI</span>
          </div>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Dashboards personalizados con widgets de métricas, gráficos y tablas</p>
        </div>
        <button
          onClick={() => showToast({ type: 'info', title: 'Editor próximamente', message: 'Builder drag-and-drop de dashboards en Fase 3.' })}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all hover:opacity-90 active:scale-[0.97]"
          style={{ backgroundColor: 'var(--accent-primary)', color: '#000' }}
        >
          <span className="material-symbols-outlined !text-[14px]">add</span>
          Nuevo dashboard
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Dashboards', value: biStats.total_dashboards, color: 'var(--text-primary)' },
          { label: 'Widgets', value: biStats.total_widgets, color: '#60a5fa' },
          { label: 'Vistas totales', value: biStats.total_views.toLocaleString(), color: '#CCFF00' },
          { label: 'Usuarios', value: biStats.shared_users, color: '#a78bfa' },
        ].map(s => (
          <div key={s.label} className="glass-card p-4 rounded-2xl">
            <p className="text-[10px] label-tracking mb-1" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
            <p className="text-xl font-black" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Dashboard tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {dashboards.map(d => (
          <button key={d.id} onClick={() => setActive(d.id)}
            className="flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all"
            style={active === d.id
              ? { backgroundColor: 'var(--accent-primary)', color: '#000' }
              : { backgroundColor: 'var(--bg-card)', color: 'var(--text-muted)', border: '1px solid var(--border-color)' }}
          >
            {d.name}
          </button>
        ))}
      </div>

      {/* Active dashboard */}
      <div className="glass-card rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>{dashboard.name}</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{dashboard.description} · {dashboard.views} vistas</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => showToast({ type: 'info', title: 'Compartir', message: 'Link copiado al portapapeles.' })}
              className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:opacity-80"
              style={{ backgroundColor: 'rgba(96,165,250,0.1)', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.2)' }}
            >
              <span className="material-symbols-outlined !text-[13px]">share</span>
            </button>
            <button onClick={() => showToast({ type: 'info', title: 'Editar', message: 'Editor de dashboard próximamente.' })}
              className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:opacity-80"
              style={{ backgroundColor: 'rgba(204,255,0,0.1)', color: '#CCFF00', border: '1px solid rgba(204,255,0,0.2)' }}
            >
              Editar
            </button>
          </div>
        </div>

        {/* Widget grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {dashboard.widgets.map(w => {
            const wc = WIDGET_COLORS[w.type]
            return (
              <div key={w.id} className={`${SIZE_SPANS[w.size]} rounded-2xl p-4 space-y-3`} style={{ backgroundColor: 'var(--bg-card)', border: `1px solid ${wc}20` }}>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>{w.title}</p>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${wc}15` }}>
                    <span className="material-symbols-outlined !text-[13px]" style={{ color: wc }}>{WIDGET_ICONS[w.type]}</span>
                  </div>
                </div>
                {/* Widget placeholder preview */}
                {w.type === 'metric' && (
                  <div>
                    <p className="text-2xl font-black" style={{ color: wc }}>
                      {w.data_source === 'marketing' ? '11.88x' : '$542K'}
                    </p>
                    <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{w.data_source}</p>
                  </div>
                )}
                {w.type === 'chart' && (
                  <div className="space-y-1.5">
                    {[70, 45, 30, 15].map((v, i) => (
                      <div key={i} className="h-1.5 rounded-full" style={{ backgroundColor: 'var(--border-color)' }}>
                        <div className="h-full rounded-full" style={{ width: `${v}%`, backgroundColor: wc, opacity: 1 - i * 0.2 }} />
                      </div>
                    ))}
                  </div>
                )}
                {w.type === 'table' && (
                  <div className="space-y-1">
                    {['Oxímetro CMS50D', 'Tensiómetro OMRON', 'Termómetro IR'].map(item => (
                      <div key={item} className="flex justify-between text-[10px]">
                        <span style={{ color: 'var(--text-muted)' }}>{item}</span>
                        <span className="font-bold" style={{ color: wc }}>${Math.round(Math.random() * 50000).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-[9px] label-tracking" style={{ color: 'var(--text-muted)' }}>FUENTE: {w.data_source.toUpperCase()}</p>
              </div>
            )
          })}
        </div>

        {/* Shared with */}
        <div className="flex items-center gap-2 pt-2 border-t" style={{ borderColor: 'var(--border-color)' }}>
          <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Compartido con:</p>
          {dashboard.shared_with.map(email => (
            <span key={email} className="px-2 py-0.5 rounded-full text-[10px]" style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-muted)', border: '1px solid var(--border-color)' }}>{email}</span>
          ))}
          <p className="ml-auto text-[10px]" style={{ color: 'var(--text-muted)' }}>Actualizado: {new Date(dashboard.last_updated).toLocaleDateString('es-MX')}</p>
        </div>
      </div>
    </div>
  )
}
