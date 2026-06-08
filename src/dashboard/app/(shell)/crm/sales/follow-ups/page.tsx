'use client'

import { useState, useEffect } from 'react'
import { Bell, Clock, CheckCircle, AlertCircle } from 'lucide-react'

interface Lead {
  id: string
  name: string
  company: string | null
  stage: string
  score: number | null
  updated_at: string
}

const STAGE_COLORS: Record<string, string> = {
  contacted: 'bg-yellow-100 text-yellow-700',
  quote_sent: 'bg-purple-100 text-purple-700',
  negotiating: 'bg-orange-100 text-orange-700',
}

function daysSince(date: string) {
  return Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24))
}

export default function FollowUpsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch contacted + quote_sent + negotiating stages (need follow-up)
    Promise.all([
      fetch('/api/crm/leads?stage=contacted').then(r => r.json()),
      fetch('/api/crm/leads?stage=quote_sent').then(r => r.json()),
      fetch('/api/crm/leads?stage=negotiating').then(r => r.json()),
    ]).then(([a, b, c]) => {
      const all = [...(a.leads ?? []), ...(b.leads ?? []), ...(c.leads ?? [])]
      all.sort((x, y) => new Date(x.updated_at).getTime() - new Date(y.updated_at).getTime())
      setLeads(all)
    }).finally(() => setLoading(false))
  }, [])

  const overdue = leads.filter(l => daysSince(l.updated_at) >= 3)
  const upcoming = leads.filter(l => daysSince(l.updated_at) < 3)

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Follow-Ups</h1>
        <p className="text-sm text-gray-500 mt-1">Agente #33 · Follow-Up automático — leads que necesitan seguimiento</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-red-50 border border-red-100 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <p className="text-xs text-red-600 font-medium">Atrasados</p>
          </div>
          <p className="text-2xl font-bold text-red-700">{loading ? '—' : overdue.length}</p>
          <p className="text-xs text-red-400 mt-0.5">Sin contacto +3 días</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-yellow-500" />
            <p className="text-xs text-yellow-600 font-medium">Próximos</p>
          </div>
          <p className="text-2xl font-bold text-yellow-700">{loading ? '—' : upcoming.length}</p>
          <p className="text-xs text-yellow-400 mt-0.5">Contactado recientemente</p>
        </div>
        <div className="bg-green-50 border border-green-100 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Bell className="w-4 h-4 text-green-500" />
            <p className="text-xs text-green-600 font-medium">Total activos</p>
          </div>
          <p className="text-2xl font-bold text-green-700">{loading ? '—' : leads.length}</p>
          <p className="text-xs text-green-400 mt-0.5">En seguimiento</p>
        </div>
      </div>

      {/* Overdue section */}
      {!loading && overdue.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-red-600 uppercase tracking-wide mb-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Atrasados — requieren contacto inmediato
          </h2>
          <div className="space-y-2">
            {overdue.map(lead => {
              const days = daysSince(lead.updated_at)
              return (
                <div key={lead.id} className="bg-white border border-red-200 rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-red-100 rounded-full flex items-center justify-center text-red-700 font-bold text-sm">
                      {lead.name?.[0]?.toUpperCase() ?? '?'}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{lead.name}</p>
                      <p className="text-xs text-gray-400">{lead.company ?? 'Sin empresa'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STAGE_COLORS[lead.stage] ?? 'bg-gray-100 text-gray-500'}`}>
                      {lead.stage}
                    </span>
                    <span className="text-sm font-bold text-red-600">{days}d sin contacto</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Upcoming section */}
      {!loading && upcoming.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            Al día
          </h2>
          <div className="space-y-2">
            {upcoming.map(lead => (
              <div key={lead.id} className="bg-white border border-gray-100 rounded-xl p-4 flex items-center justify-between hover:border-green-200 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold text-sm">
                    {lead.name?.[0]?.toUpperCase() ?? '?'}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{lead.name}</p>
                    <p className="text-xs text-gray-400">{lead.company ?? 'Sin empresa'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STAGE_COLORS[lead.stage] ?? 'bg-gray-100 text-gray-500'}`}>
                    {lead.stage}
                  </span>
                  <span className="text-xs text-gray-400">{daysSince(lead.updated_at)}d</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading && (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      )}
    </div>
  )
}
