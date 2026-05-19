'use client'

import { useState, useEffect } from 'react'
import { authenticatedFetch } from '@/lib/api-client'

interface ReturnItem {
  id: string
  sku: string
  reason: string | null
  status: string | null
  created_at: string
}

interface TicketItem {
  id: string
  subject: string | null
  status: string | null
  priority: string | null
  created_at: string
}

interface QualityData {
  returns: ReturnItem[]
  tickets: TicketItem[]
  kpis: {
    total_returns: number
    pending_returns: number
    total_tickets: number
    open_tickets: number
    high_priority: number
  }
  returns_by_reason: { reason: string; count: number }[]
  tickets_by_status: { status: string; count: number }[]
}

const mockQuality: QualityData = {
  returns: [],
  tickets: [],
  kpis: { total_returns: 0, pending_returns: 0, total_tickets: 0, open_tickets: 0, high_priority: 0 },
  returns_by_reason: [],
  tickets_by_status: [],
}

const TICKET_PRIORITY_CFG: Record<string, { color: string; bg: string; border: string }> = {
  high:   { color: 'text-red-400',    bg: 'bg-red-400/10',    border: 'border-red-400/20'    },
  medium: { color: 'text-amber-400',  bg: 'bg-amber-400/10',  border: 'border-amber-400/20'  },
  low:    { color: 'text-blue-400',   bg: 'bg-blue-400/10',   border: 'border-blue-400/20'   },
}

export default function QualityPage() {
  const [data, setData] = useState<QualityData>(mockQuality)
  const [loading, setLoading] = useState(true)
  const [dataSource, setDataSource] = useState<'live' | 'mock'>('mock')
  const [tab, setTab] = useState<'returns' | 'tickets'>('tickets')

  useEffect(() => {
    let mounted = true
    authenticatedFetch('/api/operations/quality')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (mounted && d?.kpis) {
          setData(d)
          setDataSource('live')
        }
      })
      .catch(() => {})
      .finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [])

  return (
    <div className="space-y-10 animate-in">
      <header className="space-y-2">
        <span className="text-[0.75rem] font-bold label-tracking text-primary drop-shadow-[0_0_8px_rgba(204,255,0,0.2)]">
          Operaciones / Calidad
        </span>
        <div className="flex items-center gap-3">
          <h1 className="text-4xl md:text-5xl font-black tight-tracking text-on-surface">Calidad & Soporte</h1>
          <span className={`px-2 py-1 rounded-full text-[9px] font-black label-tracking border ${
            loading ? 'border-white/10 text-white/30' :
            dataSource === 'live' ? 'border-green-500/30 bg-green-500/10 text-green-400' :
            'border-amber-500/30 bg-amber-500/10 text-amber-400'
          }`}>
            {loading ? 'CARGANDO' : dataSource === 'live' ? 'LIVE' : 'SANDBOX'}
          </span>
        </div>
        <p className="text-sm text-on-surface-variant">Devoluciones y tickets de soporte — últimos 30 días</p>
      </header>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Devoluciones', value: data.kpis.total_returns, color: 'text-on-surface' },
          { label: 'Dev. Pendientes', value: data.kpis.pending_returns, color: 'text-amber-400' },
          { label: 'Tickets', value: data.kpis.total_tickets, color: 'text-on-surface' },
          { label: 'Tickets Abiertos', value: data.kpis.open_tickets, color: 'text-blue-400' },
          { label: 'Alta Prioridad', value: data.kpis.high_priority, color: 'text-red-400' },
        ].map(k => (
          <div key={k.label} className="glass-card rounded-[1.5rem] border border-white/5 p-5">
            <p className="text-[9px] font-black label-tracking text-on-surface/40 uppercase mb-2">{k.label}</p>
            <p className={`text-2xl font-black ${k.color}`}>{loading ? '—' : k.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {(['tickets', 'returns'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2.5 rounded-xl text-[10px] font-black label-tracking transition-all ${
              tab === t ? 'bg-primary text-black' : 'glass-card border border-white/5 text-on-surface-variant hover:border-primary/20'
            }`}
          >
            {t === 'tickets' ? `TICKETS (${data.kpis.total_tickets})` : `DEVOLUCIONES (${data.kpis.total_returns})`}
          </button>
        ))}
      </div>

      {/* Tickets */}
      {tab === 'tickets' && (
        <div className="glass-card rounded-[2rem] border border-white/5 overflow-hidden">
          <div className="divide-y divide-white/5">
            {loading ? (
              <div className="p-12 text-center text-sm text-on-surface/40">Cargando…</div>
            ) : data.tickets.length === 0 ? (
              <div className="p-12 text-center">
                <span className="material-symbols-outlined !text-[32px] text-green-400/30">support_agent</span>
                <p className="text-sm text-on-surface/40 mt-2">Sin tickets en los últimos 30 días</p>
              </div>
            ) : data.tickets.map(t => {
              const pCfg = TICKET_PRIORITY_CFG[t.priority ?? 'low'] ?? TICKET_PRIORITY_CFG.low
              return (
                <div key={t.id} className="flex items-center gap-4 px-8 py-4 hover:bg-white/[0.02] transition-colors">
                  <span className={`material-symbols-outlined !text-[16px] ${pCfg.color}`}>
                    {t.priority === 'high' ? 'priority_high' : 'confirmation_number'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-on-surface truncate">{t.subject ?? 'Sin asunto'}</p>
                    <p className="text-[9px] text-on-surface/40">{t.status ?? 'open'}</p>
                  </div>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[9px] font-black border ${pCfg.color} ${pCfg.bg} ${pCfg.border}`}>
                    {(t.priority ?? 'low').toUpperCase()}
                  </span>
                  <p className="text-[9px] text-on-surface/30">
                    {new Date(t.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Returns */}
      {tab === 'returns' && (
        <div className="glass-card rounded-[2rem] border border-white/5 overflow-hidden">
          <div className="divide-y divide-white/5">
            {loading ? (
              <div className="p-12 text-center text-sm text-on-surface/40">Cargando…</div>
            ) : data.returns.length === 0 ? (
              <div className="p-12 text-center">
                <span className="material-symbols-outlined !text-[32px] text-green-400/30">assignment_return</span>
                <p className="text-sm text-on-surface/40 mt-2">Sin devoluciones en los últimos 30 días</p>
              </div>
            ) : data.returns.map(r => (
              <div key={r.id} className="flex items-center gap-4 px-8 py-4 hover:bg-white/[0.02] transition-colors">
                <span className="material-symbols-outlined !text-[16px] text-amber-400">assignment_return</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-mono font-bold text-on-surface">{r.sku}</p>
                  <p className="text-[9px] text-on-surface/40 truncate">{r.reason ?? 'Sin motivo'}</p>
                </div>
                <span className="text-[9px] font-black text-on-surface/40 uppercase">{r.status ?? 'pending'}</span>
                <p className="text-[9px] text-on-surface/30">
                  {new Date(r.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="h-10" />
    </div>
  )
}
