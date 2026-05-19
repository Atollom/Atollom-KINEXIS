'use client'

import { useState, useEffect } from 'react'
import { mockEmailCampaigns, mockEmailCampaignStats, type EmailCampaign } from '@/lib/mockData'
import { authenticatedFetch } from '@/lib/api-client'

const STATUS_CONFIG = {
  sent:      { label: 'Enviada',     color: '#4ade80', bg: 'bg-green-400/10' },
  sending:   { label: 'Enviando',    color: '#CCFF00', bg: 'bg-[#CCFF00]/10' },
  scheduled: { label: 'Programada',  color: '#60a5fa', bg: 'bg-blue-400/10'  },
  draft:     { label: 'Borrador',    color: '#94a3b8', bg: 'bg-white/5'      },
}

interface CampaignStats {
  total: number; sent: number; draft: number; scheduled: number
  avg_open_rate: number; avg_click_rate: number; total_revenue: number
}

export default function EmailCampaignsPage() {
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>(mockEmailCampaigns)
  const [stats, setStats] = useState<CampaignStats>(mockEmailCampaignStats)
  const [source, setSource] = useState<'live' | 'mock'>('mock')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    authenticatedFetch('/api/crm/campaigns')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data && Array.isArray(data.campaigns) && data.campaigns.length > 0) {
          setCampaigns(data.campaigns)
          if (data.stats && Object.keys(data.stats).length > 0) setStats(data.stats)
          setSource('live')
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-black tight-tracking" style={{ color: 'var(--text-primary)' }}>
              Campañas Email
            </h1>
            <span className="px-2 py-1 rounded-full bg-purple-400/10 border border-purple-400/20 text-[9px] font-black label-tracking text-purple-400">
              AGENTE #22
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
            Email marketing con segmentación y análisis de rendimiento
          </p>
        </div>
        <button
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all hover:opacity-90 active:scale-[0.97]"
          style={{ backgroundColor: 'var(--accent-primary)', color: '#000' }}
        >
          <span className="material-symbols-outlined !text-[14px]">add</span>
          Nueva campaña
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {[
          { label: 'Total',            value: stats.total,                                        color: 'var(--text-primary)' },
          { label: 'Enviadas',         value: stats.sent,                                         color: '#4ade80' },
          { label: 'Borrador',         value: stats.draft,                                        color: 'var(--text-muted)' },
          { label: 'Programadas',      value: stats.scheduled,                                    color: '#60a5fa' },
          { label: 'Open Rate prom.',  value: `${stats.avg_open_rate}%`,                          color: '#a78bfa' },
          { label: 'Click Rate prom.', value: `${stats.avg_click_rate}%`,                         color: '#CCFF00' },
          { label: 'Revenue total',    value: `$${stats.total_revenue.toLocaleString()}`,          color: '#4ade80' },
        ].map(s => (
          <div key={s.label} className="glass-card p-4 rounded-2xl">
            <p className="text-[10px] label-tracking mb-1" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
            <p className="text-lg font-black" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Campaign list */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
          <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Historial de campañas</h2>
        </div>
        <div className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
          {campaigns.map(c => {
            const sc = STATUS_CONFIG[c.status] ?? STATUS_CONFIG['draft']
            return (
              <div key={c.id} className="px-5 py-4 flex flex-col md:flex-row md:items-center gap-4 hover:bg-white/[0.02] transition-colors cursor-pointer">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate mb-0.5" style={{ color: 'var(--text-primary)' }}>{c.subject}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{c.segment}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${sc.bg}`} style={{ color: sc.color }}>
                      {sc.label}
                    </span>
                  </div>
                </div>
                {c.status === 'sent' ? (
                  <div className="flex items-center gap-6 flex-shrink-0">
                    <div className="text-center">
                      <p className="text-[10px] label-tracking" style={{ color: 'var(--text-muted)' }}>Enviados</p>
                      <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{c.sent_count.toLocaleString()}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] label-tracking" style={{ color: 'var(--text-muted)' }}>Open Rate</p>
                      <p className="text-sm font-bold text-purple-400">{c.open_rate}%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] label-tracking" style={{ color: 'var(--text-muted)' }}>Click Rate</p>
                      <p className="text-sm font-bold" style={{ color: '#CCFF00' }}>{c.click_rate}%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] label-tracking" style={{ color: 'var(--text-muted)' }}>Revenue</p>
                      <p className="text-sm font-bold text-green-400">${c.revenue.toLocaleString()}</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {c.sent_at ? `Programada: ${new Date(c.sent_at).toLocaleDateString('es-MX')}` : 'Sin fecha'}
                    </p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
