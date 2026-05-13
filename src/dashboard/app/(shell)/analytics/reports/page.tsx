'use client'

import { useState } from 'react'
import { mockCustomReports, mockCustomReportStats } from '@/lib/mockData'
import { useToast } from '@/components/ToastProvider'

const TYPE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  sales: { label: 'Ventas', color: '#CCFF00', bg: 'bg-[#CCFF00]/10' },
  inventory: { label: 'Inventario', color: '#fb923c', bg: 'bg-orange-400/10' },
  customers: { label: 'Clientes', color: '#a78bfa', bg: 'bg-purple-400/10' },
  marketing: { label: 'Marketing', color: '#f472b6', bg: 'bg-pink-400/10' },
  financial: { label: 'Financiero', color: '#60a5fa', bg: 'bg-blue-400/10' },
}
const FREQ_LABELS: Record<string, string> = { daily: 'Diario', weekly: 'Semanal', monthly: 'Mensual' }

export default function CustomReportsPage() {
  const { showToast } = useToast()
  const [running, setRunning] = useState<string | null>(null)

  const handleRun = (id: string, name: string) => {
    setRunning(id)
    setTimeout(() => {
      setRunning(null)
      showToast({ type: 'success', title: 'Reporte ejecutado', message: `"${name}" generado con éxito.` })
    }, 2000)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-black tight-tracking" style={{ color: 'var(--text-primary)' }}>Custom Reports</h1>
            <span className="px-2 py-1 rounded-full bg-[#CCFF00]/10 border border-[#CCFF00]/20 text-[9px] font-black label-tracking text-[#CCFF00]">ANALYTICS</span>
          </div>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Reportes personalizados con filtros, columnas y programación automática</p>
        </div>
        <button
          onClick={() => showToast({ type: 'info', title: 'Builder próximamente', message: 'Editor visual de reportes en Fase 3.' })}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all hover:opacity-90 active:scale-[0.97]"
          style={{ backgroundColor: 'var(--accent-primary)', color: '#000' }}
        >
          <span className="material-symbols-outlined !text-[14px]">add</span>
          Nuevo reporte
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Reportes', value: mockCustomReportStats.total, color: 'var(--text-primary)' },
          { label: 'Programados', value: mockCustomReportStats.scheduled, color: '#CCFF00' },
          { label: 'Manuales', value: mockCustomReportStats.manual, color: '#60a5fa' },
          { label: 'Registros prom.', value: mockCustomReportStats.avg_records.toLocaleString(), color: '#a78bfa' },
        ].map(s => (
          <div key={s.label} className="glass-card p-4 rounded-2xl">
            <p className="text-[10px] label-tracking mb-1" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
            <p className="text-xl font-black" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Report list */}
      <div className="space-y-3">
        {mockCustomReports.map(rep => {
          const tc = TYPE_CONFIG[rep.type]
          const isRunning = running === rep.id
          return (
            <div key={rep.id} className="glass-card rounded-2xl p-5 space-y-3" style={{ border: '1px solid var(--border-color)' }}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{rep.name}</p>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${tc.bg}`} style={{ color: tc.color }}>{tc.label}</span>
                    {rep.schedule && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#CCFF00]/10 text-[#CCFF00]">
                        {FREQ_LABELS[rep.schedule.frequency]}
                      </span>
                    )}
                  </div>
                  {/* Filters */}
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {rep.filters.map((f, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-md text-[10px] font-mono" style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-muted)', border: '1px solid var(--border-color)' }}>
                        {f.field} {f.operator} {f.value || ''}
                      </span>
                    ))}
                  </div>
                  {/* Columns */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] label-tracking" style={{ color: 'var(--text-muted)' }}>COLUMNAS:</span>
                    {rep.columns.slice(0, 4).map(col => (
                      <span key={col} className="px-1.5 py-0.5 rounded text-[10px]" style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }}>{col}</span>
                    ))}
                    {rep.columns.length > 4 && <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>+{rep.columns.length - 4}</span>}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  {rep.records_last_run && <p className="text-xs font-bold mb-1" style={{ color: '#CCFF00' }}>{rep.records_last_run.toLocaleString()} registros</p>}
                  {rep.last_run && <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Último: {new Date(rep.last_run).toLocaleDateString('es-MX')}</p>}
                  {rep.schedule && <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>→ {rep.schedule.recipients.length} destinatarios</p>}
                </div>
              </div>
              {/* Actions */}
              <div className="flex items-center gap-2 pt-2 border-t" style={{ borderColor: 'var(--border-color)' }}>
                <button
                  onClick={() => handleRun(rep.id, rep.name)}
                  disabled={isRunning}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:opacity-80 disabled:opacity-50"
                  style={{ backgroundColor: 'var(--accent-primary)', color: '#000' }}
                >
                  <span className={`material-symbols-outlined !text-[13px] ${isRunning ? 'animate-spin' : ''}`}>{isRunning ? 'progress_activity' : 'play_arrow'}</span>
                  {isRunning ? 'Ejecutando...' : 'Ejecutar ahora'}
                </button>
                <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:opacity-80" style={{ backgroundColor: 'rgba(96,165,250,0.1)', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.2)' }}>
                  <span className="material-symbols-outlined !text-[13px]">edit</span>
                  Editar
                </button>
                <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:opacity-80" style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', border: '1px solid var(--border-color)' }}>
                  <span className="material-symbols-outlined !text-[13px]">download</span>
                  Descargar
                </button>
                <p className="ml-auto text-[10px]" style={{ color: 'var(--text-muted)' }}>Por {rep.created_by}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
