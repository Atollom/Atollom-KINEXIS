'use client'

import { useState, useEffect } from 'react'
import { User, Search, TrendingUp } from 'lucide-react'

interface Lead {
  id: string
  name: string
  company: string | null
  email: string | null
  stage: string
  score: number | null
  pipeline_value: number | null
  created_at: string
}

const STAGE_LABELS: Record<string, string> = {
  new: 'Nuevo',
  contacted: 'Contactado',
  quote_sent: 'Cotización enviada',
  negotiating: 'Negociando',
  won: 'Ganado',
  lost: 'Perdido',
}

const STAGE_COLORS: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700',
  contacted: 'bg-yellow-100 text-yellow-700',
  quote_sent: 'bg-purple-100 text-purple-700',
  negotiating: 'bg-orange-100 text-orange-700',
  won: 'bg-green-100 text-green-700',
  lost: 'bg-gray-100 text-gray-500',
}

function fmt(n: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n)
}

export default function PipelineLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [stage, setStage] = useState('all')

  useEffect(() => {
    const url = stage === 'all' ? '/api/crm/leads' : `/api/crm/leads?stage=${stage}`
    fetch(url)
      .then(r => r.json())
      .then(data => setLeads(data.leads ?? []))
      .finally(() => setLoading(false))
  }, [stage])

  const filtered = leads.filter(l =>
    search === '' ||
    l.name?.toLowerCase().includes(search.toLowerCase()) ||
    l.company?.toLowerCase().includes(search.toLowerCase()) ||
    l.email?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Leads del Pipeline</h1>
        <p className="text-sm text-gray-500 mt-1">Agente #31 · Lead Scorer — listado detallado</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, empresa o email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 focus:border-green-400 focus:outline-none rounded-lg text-sm"
          />
        </div>
        <select
          value={stage}
          onChange={e => setStage(e.target.value)}
          className="px-3 py-2.5 border border-gray-200 focus:border-green-400 focus:outline-none rounded-lg text-sm bg-white"
        >
          <option value="all">Todas las etapas</option>
          {Object.entries(STAGE_LABELS).map(([val, lbl]) => (
            <option key={val} value={val}>{lbl}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <User className="w-12 h-12 text-gray-200 mb-4" />
            <p className="font-medium text-gray-500">Sin leads</p>
            <p className="text-sm text-gray-400 mt-1">Ajusta los filtros o crea nuevos leads</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left font-semibold text-gray-500 px-4 py-3">Lead</th>
                  <th className="text-left font-semibold text-gray-500 px-4 py-3">Empresa</th>
                  <th className="text-left font-semibold text-gray-500 px-4 py-3">Etapa</th>
                  <th className="text-left font-semibold text-gray-500 px-4 py-3">Score</th>
                  <th className="text-right font-semibold text-gray-500 px-4 py-3">Valor</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(lead => (
                  <tr key={lead.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-semibold text-xs">
                          {lead.name?.[0]?.toUpperCase() ?? '?'}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{lead.name}</p>
                          <p className="text-xs text-gray-400">{lead.email ?? '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{lead.company ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STAGE_COLORS[lead.stage] ?? 'bg-gray-100 text-gray-500'}`}>
                        {STAGE_LABELS[lead.stage] ?? lead.stage}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {lead.score != null ? (
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-green-500 rounded-full" style={{ width: `${lead.score}%` }} />
                          </div>
                          <span className="text-xs font-semibold text-gray-700">{lead.score}</span>
                        </div>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">
                      {lead.pipeline_value ? fmt(lead.pipeline_value) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 text-sm text-gray-400">
        <TrendingUp className="w-4 h-4" />
        {filtered.length} lead{filtered.length !== 1 ? 's' : ''} mostrado{filtered.length !== 1 ? 's' : ''}
      </div>
    </div>
  )
}
