'use client'

import { useEffect, useState } from 'react'
import { Target, AlertTriangle, TrendingUp, Zap } from 'lucide-react'

interface Opportunity {
  id: string
  name: string
  company: string
  channel: string
  score: number
  stage: string
  stage_label: string
  value: number
  weighted_value: number
  close_probability: number
  days_stale: number
  at_risk: boolean
  updated_at: string
}

interface Stats {
  total: number
  pipeline_value: number
  weighted_value: number
  at_risk: number
  by_stage: { contacted: number; quote_sent: number; negotiating: number }
}

function fmt(n: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n)
}

const stageColors: Record<string, string> = {
  contacted: 'bg-blue-100 text-blue-700',
  quote_sent: 'bg-yellow-100 text-yellow-700',
  negotiating: 'bg-purple-100 text-purple-700',
}

const channelConfig: Record<string, string> = {
  whatsapp: 'bg-green-100 text-green-700',
  instagram: 'bg-pink-100 text-pink-700',
  facebook: 'bg-blue-100 text-blue-700',
  web: 'bg-gray-100 text-gray-600',
}

export default function OpportunitiesPage() {
  const [opps, setOpps] = useState<Opportunity[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [filter, setFilter] = useState<string>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/crm/opportunities')
      .then(r => r.json())
      .then(d => {
        setOpps(d.opportunities ?? [])
        setStats(d.stats ?? null)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const filtered = filter === 'all' ? opps
    : filter === 'at_risk' ? opps.filter(o => o.at_risk)
    : opps.filter(o => o.stage === filter)

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Oportunidades</h1>
          <p className="text-sm text-gray-500 mt-1">Pipeline activo con probabilidad de cierre</p>
        </div>
        <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">CRM · Ventas</span>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-5 animate-pulse h-24 border border-gray-100" />
          ))}
        </div>
      ) : stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-2"><Target className="w-4 h-4 text-blue-500" /><span className="text-xs text-gray-500">Pipeline total</span></div>
            <p className="text-xl font-bold text-blue-700">{fmt(stats.pipeline_value)}</p>
            <p className="text-xs text-gray-400">{stats.total} oportunidades</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-2"><TrendingUp className="w-4 h-4 text-green-500" /><span className="text-xs text-gray-500">Valor ponderado</span></div>
            <p className="text-xl font-bold text-green-700">{fmt(stats.weighted_value)}</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-2"><Zap className="w-4 h-4 text-purple-500" /><span className="text-xs text-gray-500">En negociación</span></div>
            <p className="text-2xl font-bold text-purple-700">{stats.by_stage.negotiating}</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-2"><AlertTriangle className="w-4 h-4 text-red-500" /><span className="text-xs text-gray-500">En riesgo</span></div>
            <p className="text-2xl font-bold text-red-600">{stats.at_risk}</p>
            <p className="text-xs text-gray-400">Sin actividad +14 días</p>
          </div>
        </div>
      )}

      {/* Stage breakdown */}
      {!loading && stats && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { key: 'contacted', label: 'Contactados', count: stats.by_stage.contacted, pct: 15 },
            { key: 'quote_sent', label: 'Cotiz. Enviada', count: stats.by_stage.quote_sent, pct: 45 },
            { key: 'negotiating', label: 'Negociando', count: stats.by_stage.negotiating, pct: 75 },
          ].map(stage => (
            <div key={stage.key} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex justify-between items-start mb-2">
                <p className="text-xs text-gray-500">{stage.label}</p>
                <span className="text-xs font-bold text-gray-600">{stage.pct}%</span>
              </div>
              <p className="text-xl font-bold text-gray-900">{stage.count}</p>
              <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full" style={{ width: `${stage.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: 'all', label: `Todas (${opps.length})` },
          { key: 'contacted', label: `Contactados (${opps.filter(o => o.stage === 'contacted').length})` },
          { key: 'quote_sent', label: `Cotización (${opps.filter(o => o.stage === 'quote_sent').length})` },
          { key: 'negotiating', label: `Negociando (${opps.filter(o => o.stage === 'negotiating').length})` },
          { key: 'at_risk', label: `En riesgo (${opps.filter(o => o.at_risk).length})` },
        ].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${filter === f.key ? (f.key === 'at_risk' ? 'bg-red-600 text-white' : 'bg-green-600 text-white') : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-14 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <Target className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Sin oportunidades en esta etapa</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Contacto</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Etapa</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Canal</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">Valor</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">Pond.</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">P. Cierre</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Riesgo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(opp => (
                <tr key={opp.id} className={`hover:bg-gray-50 transition-colors ${opp.at_risk ? 'bg-red-50/20' : ''}`}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{opp.name}</p>
                    {opp.company !== 'Individual' && <p className="text-xs text-gray-400">{opp.company}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${stageColors[opp.stage] ?? 'bg-gray-100 text-gray-500'}`}>
                      {opp.stage_label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${channelConfig[opp.channel] ?? 'bg-gray-100 text-gray-500'}`}>
                      {opp.channel}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900">{fmt(opp.value)}</td>
                  <td className="px-4 py-3 text-right text-green-700 font-medium">{fmt(opp.weighted_value)}</td>
                  <td className="px-4 py-3 text-right font-bold text-gray-700">{opp.close_probability}%</td>
                  <td className="px-4 py-3">
                    {opp.at_risk ? (
                      <span className="flex items-center gap-1 text-red-600 text-xs font-medium">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        {opp.days_stale}d sin actividad
                      </span>
                    ) : (
                      <span className="text-xs text-green-600">Al día</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
