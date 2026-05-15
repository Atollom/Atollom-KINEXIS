'use client'

import { useState } from 'react'
import { mockWATemplates, mockWATemplateStats } from '@/lib/mockData'
import { useToast } from '@/components/ToastProvider'

const CATEGORY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  UTILITY:        { label: 'Utilidad',        color: '#60a5fa', bg: 'bg-blue-400/10' },
  MARKETING:      { label: 'Marketing',       color: '#f472b6', bg: 'bg-pink-400/10' },
  AUTHENTICATION: { label: 'Autenticación',   color: '#a78bfa', bg: 'bg-purple-400/10' },
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  APPROVED: { label: 'Aprobada',  color: '#4ade80', bg: 'bg-green-400/10' },
  PENDING:  { label: 'Revisión', color: '#facc15', bg: 'bg-yellow-400/10' },
  REJECTED: { label: 'Rechazada', color: '#f87171', bg: 'bg-red-400/10' },
}

const LANG_LABELS: Record<string, string> = {
  'es': 'Español', 'es_MX': 'Español MX', 'en': 'Inglés', 'en_US': 'Inglés US', 'pt_BR': 'Portugués BR',
}

export default function WATemplatesPage() {
  const { showToast } = useToast()
  const [selected, setSelected] = useState<string | null>(mockWATemplates[0]?.id ?? null)
  const [creating, setCreating] = useState(false)

  const preview = mockWATemplates.find(t => t.id === selected)

  const handleCreate = () => {
    setCreating(true)
    setTimeout(() => {
      setCreating(false)
      showToast({ type: 'info', title: 'Editor próximamente', message: 'Builder visual de templates en Fase 3.' })
    }, 800)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-black tight-tracking" style={{ color: 'var(--text-primary)' }}>WA Templates</h1>
            <span className="px-2 py-1 rounded-full bg-[#4ade80]/10 border border-[#4ade80]/20 text-[9px] font-black label-tracking text-[#4ade80]">WHATSAPP</span>
          </div>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Templates aprobados por Meta para envíos masivos y automatizaciones</p>
        </div>
        <button
          onClick={handleCreate}
          disabled={creating}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all hover:opacity-90 active:scale-[0.97] disabled:opacity-60"
          style={{ backgroundColor: 'var(--accent-primary)', color: '#000' }}
        >
          <span className={`material-symbols-outlined !text-[14px] ${creating ? 'animate-spin' : ''}`}>{creating ? 'progress_activity' : 'add'}</span>
          Nuevo template
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total templates', value: mockWATemplateStats.total,    color: 'var(--text-primary)' },
          { label: 'Aprobados',       value: mockWATemplateStats.approved,  color: '#4ade80' },
          { label: 'En revisión',     value: mockWATemplateStats.pending,   color: '#facc15' },
          { label: 'Rechazados',      value: mockWATemplateStats.rejected,  color: '#f87171' },
        ].map(s => (
          <div key={s.label} className="glass-card p-4 rounded-2xl">
            <p className="text-[10px] label-tracking mb-1" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
            <p className="text-xl font-black" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Template list */}
        <div className="lg:col-span-3 glass-card rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
            <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Biblioteca de templates</h2>
          </div>
          <div className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
            {mockWATemplates.map(tmpl => {
              const cc = CATEGORY_CONFIG[tmpl.category]
              const sc = STATUS_CONFIG[tmpl.status]
              const isSelected = selected === tmpl.id
              return (
                <button key={tmpl.id} onClick={() => setSelected(tmpl.id)}
                  className="w-full text-left px-5 py-4 transition-colors hover:bg-white/[0.02]"
                  style={isSelected ? { backgroundColor: 'rgba(204,255,0,0.04)', borderLeft: '2px solid #CCFF00' } : { borderLeft: '2px solid transparent' }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <p className="font-bold text-sm truncate" style={{ color: 'var(--text-primary)' }}>{tmpl.name}</p>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${cc.bg}`} style={{ color: cc.color }}>{cc.label}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-black ${sc.bg}`} style={{ color: sc.color }}>{sc.label}</span>
                      </div>
                      <p className="text-[11px] line-clamp-2" style={{ color: 'var(--text-muted)' }}>{tmpl.body}</p>
                      <div className="flex items-center gap-3 mt-1.5 text-[10px]" style={{ color: 'var(--text-muted)' }}>
                        <span>{LANG_LABELS[tmpl.language] ?? tmpl.language}</span>
                        {tmpl.variables > 0 && <span>{tmpl.variables} variables</span>}
                        {tmpl.usage_count && <span>{tmpl.usage_count.toLocaleString()} envíos</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {tmpl.status === 'APPROVED' && (
                        <button onClick={e => { e.stopPropagation(); showToast({ type: 'success', title: 'Campaña iniciada', message: `Enviando "${tmpl.name}"` }) }}
                          className="px-2 py-1 rounded-lg text-[10px] font-bold transition-all hover:opacity-80"
                          style={{ backgroundColor: 'rgba(74,222,128,0.1)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.2)' }}>
                          Usar
                        </button>
                      )}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Preview panel */}
        <div className="lg:col-span-2 space-y-3">
          {preview ? (
            <>
              <div className="glass-card rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Vista previa</h3>
                  <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{LANG_LABELS[preview.language] ?? preview.language}</span>
                </div>

                {/* Phone mockup */}
                <div className="rounded-2xl p-4 space-y-2" style={{ backgroundColor: '#0a1628' }}>
                  <div className="flex items-center gap-2 pb-2 border-b border-white/5">
                    <div className="w-7 h-7 rounded-full bg-[#4ade80]/20 flex items-center justify-center">
                      <span className="material-symbols-outlined !text-[13px] text-[#4ade80]">storefront</span>
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-white">KINEXIS Business</p>
                      <p className="text-[9px] text-white/40">Cuenta verificada</p>
                    </div>
                  </div>

                  <div className="rounded-xl rounded-tl-none p-3 max-w-[85%]" style={{ backgroundColor: '#1a2f4a' }}>
                    {preview.header && (
                      <p className="text-[11px] font-bold text-white mb-1">{preview.header}</p>
                    )}
                    <p className="text-[11px] text-white/80 leading-relaxed">{preview.body}</p>
                    {preview.footer && (
                      <p className="text-[9px] text-white/40 mt-1">{preview.footer}</p>
                    )}
                    {preview.buttons && preview.buttons.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-white/10 space-y-1">
                        {preview.buttons.map((btn, i) => (
                          <div key={i} className="text-center py-1 rounded-lg text-[11px] font-bold text-[#4ade80]"
                            style={{ backgroundColor: 'rgba(74,222,128,0.1)' }}>
                            {btn.text}
                          </div>
                        ))}
                      </div>
                    )}
                    <p className="text-[9px] text-white/30 text-right mt-1">9:41 AM ✓✓</p>
                  </div>
                </div>
              </div>

              <div className="glass-card rounded-2xl p-5 space-y-3">
                <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Detalles</h3>
                {[
                  { label: 'Categoría', value: CATEGORY_CONFIG[preview.category]?.label },
                  { label: 'Estado', value: STATUS_CONFIG[preview.status]?.label },
                  { label: 'Variables', value: `${preview.variables} variables` },
                  { label: 'Envíos totales', value: preview.usage_count?.toLocaleString() ?? '—' },
                  { label: 'Creado', value: new Date(preview.created_at).toLocaleDateString('es-MX') },
                ].map(r => (
                  <div key={r.label} className="flex items-center justify-between">
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{r.label}</p>
                    <p className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>{r.value}</p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="glass-card rounded-2xl p-8 flex flex-col items-center text-center gap-3">
              <span className="material-symbols-outlined !text-[32px]" style={{ color: 'var(--text-muted)' }}>chat_bubble_outline</span>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Selecciona un template para ver la vista previa</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
