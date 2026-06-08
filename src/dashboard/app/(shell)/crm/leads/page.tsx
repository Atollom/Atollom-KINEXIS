'use client'

import { useEffect, useState } from 'react'
import { Users, Star, TrendingUp, Phone, Building2 } from 'lucide-react'

interface Lead {
  id: string
  name: string
  company: string
  source: string
  score: number
  stage: string
  estimated_value: number
  notes: string | null
  created_at: string
  updated_at: string
}

function fmt(n: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n)
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'Hoy'
  if (days === 1) return 'Ayer'
  return `Hace ${days}d`
}

const stageLabels: Record<string, string> = {
  new: 'Nuevo', contacted: 'Contactado', quote_sent: 'Cotización',
  negotiating: 'Negociando', won: 'Ganado', lost: 'Perdido',
}

const stageColors: Record<string, string> = {
  new: 'bg-gray-100 text-gray-600',
  contacted: 'bg-blue-100 text-blue-700',
  quote_sent: 'bg-yellow-100 text-yellow-700',
  negotiating: 'bg-purple-100 text-purple-700',
  won: 'bg-green-100 text-green-700',
  lost: 'bg-red-100 text-red-600',
}

const sourceColors: Record<string, string> = {
  whatsapp: 'bg-green-100 text-green-700',
  instagram: 'bg-pink-100 text-pink-700',
  facebook: 'bg-blue-100 text-blue-700',
  web: 'bg-gray-100 text-gray-600',
  email: 'bg-yellow-100 text-yellow-700',
  b2b: 'bg-purple-100 text-purple-700',
}

const stages = ['all', 'new', 'contacted', 'quote_sent', 'negotiating', 'won', 'lost'] as const

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [filter, setFilter] = useState<string>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/crm/leads')
      .then(r => r.json())
      .then(d => setLeads(d.leads ?? []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const filtered = filter === 'all' ? leads : leads.filter(l => l.stage === filter)

  const pipelineValue = leads
    .filter(l => !['won', 'lost'].includes(l.stage))
    .reduce((s, l) => s + l.estimated_value, 0)

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
          <p className="text-sm text-gray-500 mt-1">Prospectos y contactos del pipeline de ventas</p>
        </div>
        <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">CRM · Pipeline</span>
      </div>

      {/* Summary KPIs */}
      {!loading && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-2"><Users className="w-4 h-4 text-blue-500" /><span className="text-xs text-gray-500">Total leads</span></div>
            <p className="text-2xl font-bold text-blue-700">{leads.length}</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-2"><TrendingUp className="w-4 h-4 text-green-500" /><span className="text-xs text-gray-500">Pipeline activo</span></div>
            <p className="text-xl font-bold text-green-700">{fmt(pipelineValue)}</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-2"><Star className="w-4 h-4 text-yellow-500" /><span className="text-xs text-gray-500">Score promedio</span></div>
            <p className="text-2xl font-bold text-yellow-600">
              {leads.length ? Math.round(leads.reduce((s, l) => s + l.score, 0) / leads.length) : 0}
            </p>
          </div>
        </div>
      )}

      {/* Stage tabs */}
      <div className="flex gap-2 flex-wrap">
        {stages.map(s => (
          <button key={s} onClick={() => setFilter(s)} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${filter === s ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {s === 'all' ? 'Todos' : stageLabels[s]}
            {!loading && <span className="ml-1 opacity-70">({s === 'all' ? leads.length : leads.filter(l => l.stage === s).length})</span>}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-14 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Sin leads en esta etapa</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Nombre</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Fuente</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Etapa</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">Score</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">Valor est.</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Actualizado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(lead => (
                <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {lead.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{lead.name}</p>
                        {lead.company !== 'Individual' && (
                          <p className="text-xs text-gray-400 flex items-center gap-0.5">
                            <Building2 className="w-3 h-3" />
                            {lead.company}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${sourceColors[lead.source] ?? 'bg-gray-100 text-gray-500'}`}>
                      {lead.source}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${stageColors[lead.stage] ?? 'bg-gray-100 text-gray-500'}`}>
                      {stageLabels[lead.stage] ?? lead.stage}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={`font-bold ${lead.score >= 70 ? 'text-green-600' : lead.score >= 40 ? 'text-yellow-600' : 'text-gray-400'}`}>
                      {lead.score}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-gray-700">
                    {lead.estimated_value > 0 ? fmt(lead.estimated_value) : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{relativeTime(lead.updated_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
