'use client'

import { useEffect, useState } from 'react'
import { Trophy, TrendingUp, Calendar, DollarSign } from 'lucide-react'

interface Deal {
  id: string
  name: string
  company: string
  channel: string
  score: number
  value: number
  quote_number: string | null
  closed_at: string
}

interface Stats {
  total: number
  total_revenue: number
  avg_deal_size: number
  this_month: number
}

function fmt(n: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n)
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'Hoy'
  if (days === 1) return 'Ayer'
  if (days < 30) return `Hace ${days}d`
  return new Date(iso).toLocaleDateString('es-MX')
}

const channelConfig: Record<string, string> = {
  whatsapp: 'bg-green-100 text-green-700',
  instagram: 'bg-pink-100 text-pink-700',
  facebook: 'bg-blue-100 text-blue-700',
  web: 'bg-gray-100 text-gray-600',
  email: 'bg-yellow-100 text-yellow-700',
}

export default function DealsPage() {
  const [deals, setDeals] = useState<Deal[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/crm/deals')
      .then(r => r.json())
      .then(d => {
        setDeals(d.deals ?? [])
        setStats(d.stats ?? null)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Deals Cerrados</h1>
          <p className="text-sm text-gray-500 mt-1">Ventas ganadas y revenue generado</p>
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
            <div className="flex items-center gap-2 mb-2"><Trophy className="w-4 h-4 text-yellow-500" /><span className="text-xs text-gray-500">Deals cerrados</span></div>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-2"><DollarSign className="w-4 h-4 text-green-500" /><span className="text-xs text-gray-500">Revenue total</span></div>
            <p className="text-xl font-bold text-green-700">{fmt(stats.total_revenue)}</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-2"><TrendingUp className="w-4 h-4 text-blue-500" /><span className="text-xs text-gray-500">Deal promedio</span></div>
            <p className="text-xl font-bold text-blue-700">{fmt(stats.avg_deal_size)}</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-2"><Calendar className="w-4 h-4 text-purple-500" /><span className="text-xs text-gray-500">Este mes</span></div>
            <p className="text-2xl font-bold text-purple-700">{stats.this_month}</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-14 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        ) : deals.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <Trophy className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Sin deals cerrados todavía</p>
            <p className="text-xs mt-1">Los leads ganados aparecerán aquí</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Cliente</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Canal</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Cotización</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">Valor</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">Score</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Cierre</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {deals.map(deal => (
                <tr key={deal.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{deal.name}</p>
                    {deal.company !== 'Individual' && <p className="text-xs text-gray-400">{deal.company}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${channelConfig[deal.channel] ?? 'bg-gray-100 text-gray-500'}`}>
                      {deal.channel}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{deal.quote_number ?? '—'}</td>
                  <td className="px-4 py-3 text-right font-bold text-gray-900">{fmt(deal.value)}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`font-semibold ${deal.score >= 70 ? 'text-green-600' : deal.score >= 40 ? 'text-yellow-600' : 'text-gray-500'}`}>
                      {deal.score}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{relativeTime(deal.closed_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
