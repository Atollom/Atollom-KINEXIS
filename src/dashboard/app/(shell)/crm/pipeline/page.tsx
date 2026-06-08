'use client'

import { useEffect, useState } from 'react'
import { Users, Plus } from 'lucide-react'
import Link from 'next/link'

interface Lead {
  id: string; name: string; company: string; source: string
  score: number; stage: string; estimated_value: number; updated_at: string
}

const stages = [
  { key: 'new', label: 'Nuevos', color: 'border-gray-300', header: 'bg-gray-100' },
  { key: 'contacted', label: 'Contactados', color: 'border-blue-300', header: 'bg-blue-50' },
  { key: 'quote_sent', label: 'Cotización', color: 'border-yellow-300', header: 'bg-yellow-50' },
  { key: 'negotiating', label: 'Negociando', color: 'border-purple-300', header: 'bg-purple-50' },
  { key: 'won', label: 'Ganados', color: 'border-green-300', header: 'bg-green-50' },
]

function fmt(n: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n)
}

const sourceColors: Record<string, string> = {
  whatsapp: 'text-green-600', instagram: 'text-pink-600', facebook: 'text-blue-600',
  web: 'text-gray-500', email: 'text-yellow-600',
}

export default function PipelinePage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/crm/leads')
      .then(r => r.json())
      .then(d => setLeads(d.leads ?? []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const byStage = (stage: string) => leads.filter(l => l.stage === stage)
  const stageValue = (stage: string) => byStage(stage).reduce((s, l) => s + l.estimated_value, 0)

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pipeline Kanban</h1>
          <p className="text-sm text-gray-500 mt-1">Visualiza y gestiona el flujo de ventas</p>
        </div>
        <div className="flex gap-2">
          <Link href="/crm/pipeline/scorer" className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors">
            Lead Scorer
          </Link>
          <Link href="/crm/leads" className="px-4 py-2 text-sm bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors flex items-center gap-1">
            <Users className="w-4 h-4" />
            Ver todos
          </Link>
        </div>
      </div>

      {/* Kanban board */}
      <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: '60vh' }}>
        {stages.map(stage => {
          const stageleads = loading ? [] : byStage(stage.key)
          return (
            <div key={stage.key} className={`flex flex-col min-w-[260px] bg-white rounded-xl border-2 ${stage.color} shadow-sm`}>
              {/* Column header */}
              <div className={`px-4 py-3 rounded-t-xl ${stage.header} flex items-center justify-between`}>
                <div>
                  <h3 className="font-semibold text-gray-800 text-sm">{stage.label}</h3>
                  {!loading && <p className="text-xs text-gray-500">{stageleads.length} leads · {fmt(stageValue(stage.key))}</p>}
                </div>
                <span className="w-6 h-6 bg-white bg-opacity-70 rounded-full flex items-center justify-center text-xs font-bold text-gray-600">
                  {loading ? '—' : stageleads.length}
                </span>
              </div>

              {/* Cards */}
              <div className="flex-1 p-2 space-y-2 overflow-y-auto" style={{ maxHeight: '65vh' }}>
                {loading ? (
                  Array.from({ length: 2 }).map((_, i) => (
                    <div key={i} className="bg-gray-100 rounded-lg h-20 animate-pulse" />
                  ))
                ) : stageleads.length === 0 ? (
                  <div className="text-center py-6 text-gray-300 text-sm">Sin leads</div>
                ) : (
                  stageleads.map(lead => (
                    <div key={lead.id} className="bg-white border border-gray-100 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                      <div className="flex items-start justify-between mb-1.5">
                        <p className="font-medium text-gray-900 text-sm leading-tight">{lead.name}</p>
                        <span className={`text-xs font-bold ${lead.score >= 70 ? 'text-green-600' : lead.score >= 40 ? 'text-yellow-600' : 'text-gray-400'}`}>
                          {lead.score}
                        </span>
                      </div>
                      {lead.company !== 'Individual' && (
                        <p className="text-xs text-gray-400 mb-1.5">{lead.company}</p>
                      )}
                      <div className="flex items-center justify-between">
                        <span className={`text-xs capitalize font-medium ${sourceColors[lead.source] ?? 'text-gray-400'}`}>
                          {lead.source}
                        </span>
                        {lead.estimated_value > 0 && (
                          <span className="text-xs text-gray-500 font-medium">{fmt(lead.estimated_value)}</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
