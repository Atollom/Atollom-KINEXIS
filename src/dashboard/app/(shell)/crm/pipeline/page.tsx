'use client'

import { useState, useEffect } from 'react'
import { useToast } from '@/components/ToastProvider'
import { authenticatedFetch } from '@/lib/api-client'
import {
  mockCRMDeals,
  mockCRMStats,
  type CRMDeal,
} from '@/lib/mockData'

const STAGES: Array<{ key: CRMDeal['stage']; label: string; color: string; bg: string; border: string; icon: string }> = [
  { key: 'lead',        label: 'Lead',        color: 'text-on-surface/50', bg: 'bg-white/5',        border: 'border-white/10',      icon: 'person_add'   },
  { key: 'qualified',   label: 'Calificado',  color: 'text-blue-400',      bg: 'bg-blue-400/10',    border: 'border-blue-400/20',   icon: 'verified'     },
  { key: 'proposal',    label: 'Propuesta',   color: 'text-purple-400',    bg: 'bg-purple-400/10',  border: 'border-purple-400/20', icon: 'description'  },
  { key: 'negotiation', label: 'Negociación', color: 'text-amber-400',     bg: 'bg-amber-400/10',   border: 'border-amber-400/20',  icon: 'handshake'    },
  { key: 'closed_won',  label: 'Ganado ✓',    color: 'text-[#CCFF00]',    bg: 'bg-[#CCFF00]/10',  border: 'border-[#CCFF00]/20',  icon: 'celebration'  },
  { key: 'closed_lost', label: 'Perdido',     color: 'text-red-400',       bg: 'bg-red-400/10',     border: 'border-red-400/20',    icon: 'cancel'       },
]

const SOURCE_LABELS: Record<CRMDeal['source'], string> = {
  website: 'Web', referral: 'Referido', cold_call: 'Llamada', trade_show: 'Expo', linkedin: 'LinkedIn',
}

function probColor(p: number) {
  if (p >= 70) return 'text-[#CCFF00]'
  if (p >= 40) return 'text-amber-400'
  return 'text-red-400'
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })
}

interface PipelineStats {
  total_deals: number
  total_pipeline_value: number
  won_value_month: number
  conversion_rate: number
}

export default function CRMPipelinePage() {
  const { showToast } = useToast()
  const [deals, setDeals] = useState<CRMDeal[]>(mockCRMDeals)
  const [stats, setStats] = useState<PipelineStats>(mockCRMStats)
  const [source, setSource] = useState<'live' | 'mock'>('mock')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    authenticatedFetch('/api/crm/pipeline')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data && Array.isArray(data.deals) && data.deals.length > 0) {
          setDeals(data.deals)
          if (data.stats && Object.keys(data.stats).length > 0) setStats(data.stats)
          setSource('live')
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const dealsByStage = (stage: CRMDeal['stage']) => deals.filter(d => d.stage === stage)
  const stageValue   = (stage: CRMDeal['stage']) => dealsByStage(stage).reduce((s, d) => s + d.value, 0)

  return (
    <div className="space-y-10 animate-in">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <span className="text-[0.75rem] font-bold label-tracking text-purple-400 drop-shadow-[0_0_8px_rgba(192,132,252,0.3)]">
            CRM / Pipeline de Ventas B2B
          </span>
          <div className="flex items-center gap-3">
            <h1 className="text-4xl md:text-5xl font-black tight-tracking text-on-surface">
              Pipeline B2B
            </h1>
            <span className={`px-2 py-1 rounded-full text-[9px] font-black label-tracking border ${
              loading ? 'border-white/10 text-white/30' :
              source === 'live' ? 'border-green-500/30 bg-green-500/10 text-green-400' :
              'border-amber-500/30 bg-amber-500/10 text-amber-400'
            }`}>
              {loading ? 'CARGANDO' : source === 'live' ? 'LIVE' : 'SANDBOX'}
            </span>
          </div>
          <p className="text-sm text-on-surface-variant">
            {stats.total_deals} deals activos ·{' '}
            <span className="text-purple-400 font-bold">${stats.total_pipeline_value.toLocaleString()} USD</span> en pipeline
          </p>
        </div>
        <button
          onClick={() => showToast({ type: 'success', title: 'Deal creado', message: 'Nuevo prospecto agregado al pipeline' })}
          className="px-8 py-4 rounded-2xl bg-purple-500 text-white text-[10px] font-black label-tracking hover:bg-purple-500/90 transition-all flex items-center gap-2 self-start md:self-auto"
        >
          <span className="material-symbols-outlined !text-[16px]">add_circle</span>
          NUEVO DEAL
        </button>
      </header>

      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Pipeline Total',  value: `$${(stats.total_pipeline_value / 1000).toFixed(0)}k`, icon: 'account_balance_wallet', color: 'text-purple-400' },
          { label: 'Deals Activos',   value: stats.total_deals,                                      icon: 'work',                   color: 'text-blue-400'   },
          { label: 'Ganados (mes)',   value: `$${(stats.won_value_month / 1000).toFixed(0)}k`,       icon: 'emoji_events',           color: 'text-[#CCFF00]'  },
          { label: 'Conversión',      value: `${stats.conversion_rate}%`,                            icon: 'trending_up',            color: 'text-amber-400'  },
        ].map(kpi => (
          <div key={kpi.label} className="glass-card rounded-[1.5rem] border border-white/5 p-6">
            <div className="flex items-center gap-3 mb-3">
              <span className={`material-symbols-outlined !text-[18px] ${kpi.color}`}>{kpi.icon}</span>
              <span className="text-[9px] font-black label-tracking text-on-surface/40 uppercase">{kpi.label}</span>
            </div>
            <p className="text-2xl font-black tight-tracking text-on-surface">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Kanban board */}
      <div className="overflow-x-auto pb-4 -mx-4 px-4">
        <div className="flex gap-4 min-w-max">
          {STAGES.map(stage => {
            const stageDeals = dealsByStage(stage.key)
            const total = stageValue(stage.key)
            return (
              <div key={stage.key} className="w-64 flex-shrink-0">
                <div className={`flex items-center justify-between px-4 py-3 rounded-2xl mb-3 border ${stage.bg} ${stage.border}`}>
                  <div className="flex items-center gap-2">
                    <span className={`material-symbols-outlined !text-[14px] ${stage.color}`}>{stage.icon}</span>
                    <span className={`text-[9px] font-black label-tracking ${stage.color}`}>{stage.label.toUpperCase()}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-black text-on-surface/50">{stageDeals.length}</p>
                    {total > 0 && <p className={`text-[8px] font-black ${stage.color}`}>${(total / 1000).toFixed(0)}k</p>}
                  </div>
                </div>

                <div className="space-y-3">
                  {stageDeals.map(deal => (
                    <div
                      key={deal.id}
                      className="glass-card rounded-[1.5rem] border border-white/5 p-4 hover:border-purple-400/20 transition-colors group cursor-pointer"
                      onClick={() => showToast({ type: 'info', title: deal.company, message: deal.notes ?? 'Ver detalle del deal' })}
                    >
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="min-w-0">
                          <p className="text-[10px] font-black text-on-surface leading-tight line-clamp-2">{deal.title}</p>
                          <p className="text-[9px] text-on-surface/40 mt-0.5 truncate">{deal.company}</p>
                        </div>
                        <p className="text-sm font-black text-[#CCFF00] flex-shrink-0">${(deal.value / 1000).toFixed(0)}k</p>
                      </div>

                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-5 h-5 rounded-full bg-purple-400/20 flex items-center justify-center flex-shrink-0">
                          <span className="material-symbols-outlined !text-[10px] text-purple-400">person</span>
                        </div>
                        <p className="text-[9px] text-on-surface/50 truncate">{deal.contact.name}</p>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 rounded-full text-[7px] font-black bg-white/5 text-on-surface/40">
                            {SOURCE_LABELS[deal.source]}
                          </span>
                          <span className={`text-[9px] font-black ${probColor(deal.probability)}`}>{deal.probability}%</span>
                        </div>
                        <span className="text-[8px] text-on-surface/30">{fmtDate(deal.expected_close_date)}</span>
                      </div>

                      <div className="mt-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={e => { e.stopPropagation(); showToast({ type: 'info', title: 'Avanzar deal', message: `${deal.title} → próxima etapa` }) }}
                          className="flex-1 px-2 py-1 rounded-lg bg-purple-400/10 border border-purple-400/20 text-purple-400 text-[8px] font-black hover:bg-purple-400/20 transition-colors text-center"
                        >
                          AVANZAR
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); showToast({ type: 'success', title: 'Seguimiento agendado', message: `Tarea para ${deal.contact.name}` }) }}
                          className="flex-1 px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-on-surface/50 text-[8px] font-black hover:bg-white/10 transition-colors text-center"
                        >
                          SEGUIR
                        </button>
                      </div>
                    </div>
                  ))}

                  {stageDeals.length === 0 && (
                    <div className="text-center py-10 text-on-surface/20">
                      <span className="material-symbols-outlined !text-[24px]">inbox</span>
                      <p className="text-[8px] font-black label-tracking mt-2">VACÍO</p>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="h-10" />
    </div>
  )
}
