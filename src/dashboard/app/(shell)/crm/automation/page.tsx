'use client'

import { useState, useEffect } from 'react'
import { mockDealAutomations, mockAutomationStats, type DealAutomation } from '@/lib/mockData'
import { useToast } from '@/components/ToastProvider'
import { authenticatedFetch } from '@/lib/api-client'

const TRIGGER_ICONS: Record<string, string> = {
  stage_change: 'swap_horiz', time_based: 'schedule', value_threshold: 'attach_money', activity: 'event',
}
const ACTION_COLORS: Record<string, string> = {
  email: 'text-blue-400 bg-blue-400/10', task: 'text-[#CCFF00] bg-[#CCFF00]/10',
  notification: 'text-orange-400 bg-orange-400/10', webhook: 'text-purple-400 bg-purple-400/10',
  field_update: 'text-pink-400 bg-pink-400/10',
}

interface AutoStats {
  total: number; active: number; paused: number; total_deals_affected: number; avg_success_rate: number
}

export default function DealAutomationPage() {
  const [automations, setAutomations] = useState<DealAutomation[]>(mockDealAutomations)
  const [stats, setStats] = useState<AutoStats>(mockAutomationStats)
  const [source, setSource] = useState<'live' | 'mock'>('mock')
  const [loading, setLoading] = useState(true)
  const { showToast } = useToast()

  useEffect(() => {
    authenticatedFetch('/api/crm/automation')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data && Array.isArray(data.automations) && data.automations.length > 0) {
          setAutomations(data.automations)
          if (data.stats && Object.keys(data.stats).length > 0) setStats(data.stats)
          setSource('live')
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleToggle = (id: string) => {
    setAutomations(prev => prev.map(a => a.id === id ? { ...a, status: a.status === 'active' ? 'paused' as const : 'active' as const } : a))
    showToast({ type: 'success', title: 'Estado actualizado', message: 'Automatización modificada.' })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-black tight-tracking" style={{ color: 'var(--text-primary)' }}>
              Deal Automation
            </h1>
            <span className="px-2 py-1 rounded-full bg-purple-400/10 border border-purple-400/20 text-[9px] font-black label-tracking text-purple-400">
              AGENTE #34
            </span>
            <span className={`px-2 py-1 rounded-full text-[9px] font-black label-tracking border ${
              loading ? 'border-white/10 text-white/30' :
              source === 'live' ? 'border-green-500/30 bg-green-500/10 text-green-400' :
              'border-amber-500/30 bg-amber-500/10 text-amber-400'
            }`}>
              {loading ? 'CARGANDO' : source === 'live' ? 'LIVE' : 'SANDBOX'}
            </span>
          </div>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Reglas automáticas disparadas por eventos en el pipeline
          </p>
        </div>
        <button
          onClick={() => showToast({ type: 'info', title: 'Builder próximamente', message: 'Editor visual de automatizaciones en Fase 3.' })}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all hover:opacity-90 active:scale-[0.97]"
          style={{ backgroundColor: 'var(--accent-primary)', color: '#000' }}
        >
          <span className="material-symbols-outlined !text-[14px]">add</span>
          Nueva automatización
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Total',           value: stats.total,               color: 'var(--text-primary)' },
          { label: 'Activas',         value: stats.active,              color: '#4ade80' },
          { label: 'Pausadas',        value: stats.paused,              color: '#facc15' },
          { label: 'Deals afectados', value: stats.total_deals_affected, color: '#a78bfa' },
          { label: 'Éxito prom.',     value: `${stats.avg_success_rate}%`, color: '#CCFF00' },
        ].map(s => (
          <div key={s.label} className="glass-card p-4 rounded-2xl">
            <p className="text-[10px] label-tracking mb-1" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
            <p className="text-xl font-black" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Automation cards */}
      <div className="space-y-4">
        {automations.map(auto => (
          <div key={auto.id} className="glass-card rounded-2xl p-5 space-y-4" style={{ border: `1px solid ${auto.status === 'active' ? 'rgba(167,139,250,0.15)' : 'var(--border-color)'}` }}>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(167,139,250,0.1)' }}>
                <span className="material-symbols-outlined !text-[18px] text-purple-400">{TRIGGER_ICONS[auto.trigger.type] ?? 'bolt'}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{auto.name}</p>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${auto.status === 'active' ? 'bg-green-400/10 text-green-400' : 'bg-white/5 text-white/30'}`}>
                    {auto.status === 'active' ? 'Activa' : 'Pausada'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mb-3">
                  <span className="text-[10px] label-tracking" style={{ color: 'var(--text-muted)' }}>TRIGGER:</span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-purple-400/10 text-purple-300">{auto.trigger.condition}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {auto.actions.map((action, i) => (
                    <span key={i} className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${ACTION_COLORS[action.type] ?? 'bg-white/5 text-white/30'}`}>
                      {action.label}
                    </span>
                  ))}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-2xl font-black" style={{ color: '#CCFF00' }}>{auto.success_rate}%</p>
                <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>tasa éxito</p>
                <p className="text-xs font-bold mt-1" style={{ color: '#a78bfa' }}>{auto.deals_affected} deals</p>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-3 border-t" style={{ borderColor: 'var(--border-color)' }}>
              <button
                onClick={() => handleToggle(auto.id)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:opacity-80"
                style={{ backgroundColor: auto.status === 'active' ? 'rgba(251,146,60,0.1)' : 'rgba(74,222,128,0.1)', color: auto.status === 'active' ? '#fb923c' : '#4ade80', border: `1px solid ${auto.status === 'active' ? 'rgba(251,146,60,0.2)' : 'rgba(74,222,128,0.2)'}` }}
              >
                {auto.status === 'active' ? 'Pausar' : 'Activar'}
              </button>
              <button className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:opacity-80" style={{ backgroundColor: 'rgba(96,165,250,0.1)', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.2)' }}>
                Editar
              </button>
              <p className="ml-auto text-[10px]" style={{ color: 'var(--text-muted)' }}>
                Creada {new Date(auto.created_at).toLocaleDateString('es-MX')}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
