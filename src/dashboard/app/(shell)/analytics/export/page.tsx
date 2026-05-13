'use client'

import { useState } from 'react'
import { mockExportJobs, mockExportStats } from '@/lib/mockData'
import { useToast } from '@/components/ToastProvider'

const TYPE_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  orders: { label: 'Órdenes', icon: 'shopping_cart', color: '#CCFF00' },
  products: { label: 'Productos', icon: 'inventory_2', color: '#fb923c' },
  customers: { label: 'Clientes', icon: 'group', color: '#a78bfa' },
  inventory: { label: 'Inventario', icon: 'warehouse', color: '#60a5fa' },
  financial: { label: 'Financiero', icon: 'receipt_long', color: '#4ade80' },
}
const FORMAT_CONFIG: Record<string, { color: string; bg: string }> = {
  csv: { color: '#4ade80', bg: 'bg-green-400/10' },
  xlsx: { color: '#CCFF00', bg: 'bg-[#CCFF00]/10' },
  pdf: { color: '#f87171', bg: 'bg-red-400/10' },
  json: { color: '#a78bfa', bg: 'bg-purple-400/10' },
}
const STATUS_CONFIG = {
  completed: { label: 'Listo', color: '#4ade80', bg: 'bg-green-400/10' },
  processing: { label: 'Procesando', color: '#facc15', bg: 'bg-yellow-400/10' },
  pending: { label: 'Pendiente', color: '#94a3b8', bg: 'bg-white/5' },
  failed: { label: 'Error', color: '#f87171', bg: 'bg-red-400/10' },
}

export default function ExportCenterPage() {
  const { showToast } = useToast()
  const [creating, setCreating] = useState(false)

  const handleNew = () => {
    setCreating(true)
    setTimeout(() => { setCreating(false); showToast({ type: 'success', title: 'Exportación iniciada', message: 'Recibirás una notificación cuando esté lista.' }) }, 1500)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-black tight-tracking" style={{ color: 'var(--text-primary)' }}>Export Center</h1>
            <span className="px-2 py-1 rounded-full bg-[#CCFF00]/10 border border-[#CCFF00]/20 text-[9px] font-black label-tracking text-[#CCFF00]">ANALYTICS</span>
          </div>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Exporta datos en CSV, XLSX, PDF o JSON</p>
        </div>
        <button
          onClick={handleNew}
          disabled={creating}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all hover:opacity-90 active:scale-[0.97] disabled:opacity-60"
          style={{ backgroundColor: 'var(--accent-primary)', color: '#000' }}
        >
          <span className={`material-symbols-outlined !text-[14px] ${creating ? 'animate-spin' : ''}`}>{creating ? 'progress_activity' : 'download'}</span>
          {creating ? 'Preparando...' : 'Nueva exportación'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Total exports', value: mockExportStats.total, color: 'var(--text-primary)' },
          { label: 'Listos', value: mockExportStats.completed, color: '#4ade80' },
          { label: 'Procesando', value: mockExportStats.processing, color: '#facc15' },
          { label: 'Fallidos', value: mockExportStats.failed, color: '#f87171' },
          { label: 'Tamaño total', value: `${mockExportStats.total_size_mb} MB`, color: '#CCFF00' },
        ].map(s => (
          <div key={s.label} className="glass-card p-4 rounded-2xl">
            <p className="text-[10px] label-tracking mb-1" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
            <p className="text-xl font-black" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Quick export buttons */}
      <div className="glass-card rounded-2xl p-5">
        <h2 className="text-sm font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Exportación rápida</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {Object.entries(TYPE_CONFIG).map(([key, tc]) => (
            <button key={key} onClick={() => showToast({ type: 'info', title: 'Export iniciado', message: `Exportando ${tc.label}...` })}
              className="flex flex-col items-center gap-2 p-4 rounded-xl transition-all hover:opacity-90 active:scale-[0.97]"
              style={{ backgroundColor: `${tc.color}10`, border: `1px solid ${tc.color}20` }}
            >
              <span className="material-symbols-outlined !text-[22px]" style={{ color: tc.color }}>{tc.icon}</span>
              <p className="text-[10px] font-bold" style={{ color: tc.color }}>{tc.label}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Export history */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
          <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Historial de exportaciones</h2>
        </div>
        <div className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
          {mockExportJobs.map(job => {
            const tc = TYPE_CONFIG[job.type]
            const fc = FORMAT_CONFIG[job.format]
            const sc = STATUS_CONFIG[job.status]
            return (
              <div key={job.id} className="px-5 py-4 flex items-center gap-4 hover:bg-white/[0.02] transition-colors">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${tc.color}15` }}>
                  <span className="material-symbols-outlined !text-[16px]" style={{ color: tc.color }}>{tc.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate" style={{ color: 'var(--text-primary)' }}>{job.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${fc.bg}`} style={{ color: fc.color }}>{job.format}</span>
                    <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{new Date(job.created_at).toLocaleDateString('es-MX')}</p>
                    {job.records_count && <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{job.records_count.toLocaleString()} registros</p>}
                    {job.file_size_kb && <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{job.file_size_kb} KB</p>}
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${sc.bg}`} style={{ color: sc.color }}>{sc.label}</span>
                  {job.status === 'completed' && (
                    <button onClick={() => showToast({ type: 'success', title: 'Descarga iniciada', message: job.name })}
                      className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors hover:bg-white/5"
                      style={{ border: '1px solid var(--border-color)' }}
                    >
                      <span className="material-symbols-outlined !text-[15px]" style={{ color: '#CCFF00' }}>download</span>
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
