'use client'

import { useEffect, useState } from 'react'
import { Zap, Star, TrendingUp, AlertTriangle, RefreshCw } from 'lucide-react'

interface Lead {
  id: string
  name: string
  company: string
  source: string
  score: number
  stage: string
  estimated_value: number
  updated_at: string
}

function ScoreRing({ score }: { score: number }) {
  const color = score >= 70 ? '#16a34a' : score >= 40 ? '#ca8a04' : '#ef4444'
  const radius = 28
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  return (
    <div className="relative w-16 h-16 flex items-center justify-center">
      <svg width="64" height="64" className="-rotate-90">
        <circle cx="32" cy="32" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="4" />
        <circle
          cx="32" cy="32" r={radius} fill="none"
          stroke={color} strokeWidth="4"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700"
        />
      </svg>
      <span className="absolute text-sm font-bold text-gray-900">{score}</span>
    </div>
  )
}

const sourceConfig: Record<string, string> = {
  whatsapp: 'bg-green-100 text-green-700',
  instagram: 'bg-pink-100 text-pink-700',
  facebook: 'bg-blue-100 text-blue-700',
  web: 'bg-gray-100 text-gray-600',
  email: 'bg-yellow-100 text-yellow-700',
  b2b: 'bg-purple-100 text-purple-700',
}

const stageLabels: Record<string, string> = {
  new: 'Nuevo',
  contacted: 'Contactado',
  quote_sent: 'Cotiz. Enviada',
  negotiating: 'Negociando',
  won: 'Ganado',
  lost: 'Perdido',
}

function fmt(n: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n)
}

export default function LeadScorerPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'cards' | 'table'>('cards')
  const [filterScore, setFilterScore] = useState<'all' | 'hot' | 'warm' | 'cold'>('all')

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/crm/leads')
      const data = await res.json()
      setLeads(data.leads ?? [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const filtered = leads.filter(l => {
    if (filterScore === 'hot') return l.score >= 70
    if (filterScore === 'warm') return l.score >= 40 && l.score < 70
    if (filterScore === 'cold') return l.score < 40
    return true
  })

  const hot = leads.filter(l => l.score >= 70).length
  const warm = leads.filter(l => l.score >= 40 && l.score < 70).length
  const cold = leads.filter(l => l.score < 40).length

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lead Scorer</h1>
          <p className="text-sm text-gray-500 mt-1">Priorización automática por score de conversión</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">Agente #31 · CRM</span>
          <button onClick={load} className="p-2 rounded-lg text-gray-400 hover:text-green-600 hover:bg-gray-100 transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Score bands */}
      {!loading && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-sm font-semibold text-gray-700">Hot (70-100)</span>
            </div>
            <p className="text-3xl font-bold text-green-600">{hot}</p>
            <p className="text-xs text-gray-400 mt-1">Prioridad alta — contactar hoy</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <span className="text-sm font-semibold text-gray-700">Warm (40-69)</span>
            </div>
            <p className="text-3xl font-bold text-yellow-600">{warm}</p>
            <p className="text-xs text-gray-400 mt-1">Seguimiento esta semana</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 rounded-full bg-gray-400" />
              <span className="text-sm font-semibold text-gray-700">Cold (0-39)</span>
            </div>
            <p className="text-3xl font-bold text-gray-500">{cold}</p>
            <p className="text-xs text-gray-400 mt-1">Nurturing o descarte</p>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          {(['all', 'hot', 'warm', 'cold'] as const).map(f => (
            <button key={f} onClick={() => setFilterScore(f)} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${filterScore === f ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {f === 'all' ? `Todos (${leads.length})` : f === 'hot' ? `🔥 Hot (${hot})` : f === 'warm' ? `⚡ Warm (${warm})` : `🧊 Cold (${cold})`}
            </button>
          ))}
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          <button onClick={() => setView('cards')} className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${view === 'cards' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}>Cards</button>
          <button onClick={() => setView('table')} className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${view === 'table' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}>Tabla</button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className={view === 'cards' ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4' : 'space-y-2'}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-5 animate-pulse h-28 border border-gray-100" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center text-gray-400 border border-gray-100">
          <Star className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Sin leads en esta categoría</p>
        </div>
      ) : view === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(lead => (
            <div key={lead.id} className={`bg-white rounded-xl shadow-sm border transition-all hover:shadow-md ${lead.score >= 70 ? 'border-green-200' : lead.score >= 40 ? 'border-yellow-200' : 'border-gray-100'}`}>
              <div className="p-5 flex items-start gap-4">
                <ScoreRing score={lead.score} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900 truncate">{lead.name}</h3>
                    {lead.score >= 70 && <Zap className="w-3.5 h-3.5 text-green-500 shrink-0" />}
                    {lead.score < 40 && <AlertTriangle className="w-3.5 h-3.5 text-gray-400 shrink-0" />}
                  </div>
                  {lead.company !== 'Individual' && <p className="text-xs text-gray-500 truncate">{lead.company}</p>}
                  <div className="flex gap-2 mt-2 flex-wrap">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${sourceConfig[lead.source] ?? 'bg-gray-100 text-gray-500'}`}>
                      {lead.source}
                    </span>
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
                      {stageLabels[lead.stage] ?? lead.stage}
                    </span>
                  </div>
                  {lead.estimated_value > 0 && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                      <TrendingUp className="w-3 h-3" />
                      {fmt(lead.estimated_value)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Score</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Lead</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Fuente</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Etapa</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">Valor est.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(lead => (
                <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center justify-center w-10 h-7 rounded-lg text-sm font-bold ${lead.score >= 70 ? 'bg-green-100 text-green-700' : lead.score >= 40 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500'}`}>
                      {lead.score}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{lead.name}</p>
                    {lead.company !== 'Individual' && <p className="text-xs text-gray-400">{lead.company}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${sourceConfig[lead.source] ?? 'bg-gray-100 text-gray-500'}`}>
                      {lead.source}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{stageLabels[lead.stage] ?? lead.stage}</td>
                  <td className="px-4 py-3 text-right font-medium text-gray-700">{lead.estimated_value > 0 ? fmt(lead.estimated_value) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
