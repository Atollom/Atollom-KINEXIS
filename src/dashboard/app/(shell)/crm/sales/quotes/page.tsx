'use client'

import { useState, useEffect } from 'react'
import { FileText, DollarSign, TrendingUp, CheckCircle } from 'lucide-react'

interface Quote {
  id: string
  lead_id: string
  total_amount: number
  status: string
  created_at: string
  updated_at: string
}

interface QuoteStats {
  total: number
  pending: number
  total_sent: number
  total_accepted: number
  acceptance_rate: number
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  sent: 'bg-blue-100 text-blue-700',
  accepted: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-600',
  expired: 'bg-orange-100 text-orange-600',
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Borrador',
  sent: 'Enviada',
  accepted: 'Aceptada',
  rejected: 'Rechazada',
  expired: 'Expirada',
}

function fmt(n: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n)
}

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [stats, setStats] = useState<QuoteStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetch('/api/crm/quotes')
      .then(r => r.json())
      .then(data => {
        setQuotes(data.quotes ?? [])
        setStats(data.stats ?? null)
      })
      .finally(() => setLoading(false))
  }, [])

  const filtered = filter === 'all' ? quotes : quotes.filter(q => q.status === filter)

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Cotizaciones</h1>
        <p className="text-sm text-gray-500 mt-1">Agente #32 · Quote Generator — propuestas comerciales</p>
      </div>

      {/* KPIs */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total cotizaciones', value: stats.total.toString(), icon: FileText, color: 'text-gray-700', bg: 'bg-gray-50' },
            { label: 'Valor enviado', value: fmt(stats.total_sent), icon: DollarSign, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Valor aceptado', value: fmt(stats.total_accepted), icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
            { label: 'Tasa de aceptación', value: `${stats.acceptance_rate}%`, icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
          ].map(kpi => {
            const Icon = kpi.icon
            return (
              <div key={kpi.label} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div className={`inline-flex p-2 rounded-xl ${kpi.bg} mb-2`}>
                  <Icon className={`w-4 h-4 ${kpi.color}`} />
                </div>
                <p className="text-xs text-gray-500 mb-1">{kpi.label}</p>
                <p className={`text-xl font-bold ${kpi.color}`}>{kpi.value}</p>
              </div>
            )
          })}
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'draft', 'sent', 'accepted', 'rejected'].map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === s ? 'bg-green-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}
          >
            {s === 'all' ? 'Todas' : STATUS_LABELS[s]}
          </button>
        ))}
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
          <div className="py-20 text-center">
            <FileText className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <p className="font-medium text-gray-500">Sin cotizaciones</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left font-semibold text-gray-500 px-4 py-3">ID</th>
                  <th className="text-left font-semibold text-gray-500 px-4 py-3">Lead</th>
                  <th className="text-left font-semibold text-gray-500 px-4 py-3">Estado</th>
                  <th className="text-right font-semibold text-gray-500 px-4 py-3">Total</th>
                  <th className="text-left font-semibold text-gray-500 px-4 py-3">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(q => (
                  <tr key={q.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-gray-400">{q.id.slice(0, 8)}</td>
                    <td className="px-4 py-3 text-gray-600 font-mono text-xs">{q.lead_id.slice(0, 8)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[q.status] ?? 'bg-gray-100 text-gray-500'}`}>
                        {STATUS_LABELS[q.status] ?? q.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900">{fmt(q.total_amount ?? 0)}</td>
                    <td className="px-4 py-3 text-gray-400">{new Date(q.created_at).toLocaleDateString('es-MX')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
