'use client'

import { useEffect, useState } from 'react'
import { ShoppingCart, DollarSign, TrendingUp, XCircle } from 'lucide-react'

interface SalesStats {
  total_revenue: number
  total_orders: number
  avg_order: number
  cancelled: number
  period_days: number
}

interface DailyEntry { date: string; revenue: number; orders: number }

function fmt(n: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n)
}

export default function SalesAnalyticsPage() {
  const [stats, setStats] = useState<SalesStats | null>(null)
  const [daily, setDaily] = useState<DailyEntry[]>([])
  const [byChannel, setByChannel] = useState<Record<string, number>>({})
  const [period, setPeriod] = useState(30)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/analytics/sales?days=${period}`)
      .then(r => r.json())
      .then(d => {
        setStats(d.stats)
        setDaily(d.daily ?? [])
        setByChannel(d.by_channel ?? {})
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [period])

  const maxRevenue = Math.max(...daily.map(d => d.revenue), 1)
  const totalChannel = Object.values(byChannel).reduce((s, v) => s + v, 0) || 1

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics de Ventas</h1>
          <p className="text-sm text-gray-500 mt-1">Revenue, pedidos y canales de venta</p>
        </div>
        <div className="flex gap-2">
          {[7, 30, 90].map(d => (
            <button key={d} onClick={() => setPeriod(d)} className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${period === d ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {d}d
            </button>
          ))}
        </div>
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
            <div className="flex items-center gap-2 mb-2"><DollarSign className="w-4 h-4 text-green-500" /><span className="text-xs text-gray-500">Revenue ({period}d)</span></div>
            <p className="text-xl font-bold text-green-700">{fmt(stats.total_revenue)}</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-2"><ShoppingCart className="w-4 h-4 text-blue-500" /><span className="text-xs text-gray-500">Pedidos</span></div>
            <p className="text-2xl font-bold text-blue-700">{stats.total_orders}</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-2"><TrendingUp className="w-4 h-4 text-purple-500" /><span className="text-xs text-gray-500">Ticket promedio</span></div>
            <p className="text-xl font-bold text-purple-700">{fmt(stats.avg_order)}</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-2"><XCircle className="w-4 h-4 text-red-400" /><span className="text-xs text-gray-500">Cancelados</span></div>
            <p className="text-2xl font-bold text-red-500">{stats.cancelled}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Daily chart */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Revenue diario</h2>
          {loading ? (
            <div className="h-40 bg-gray-100 rounded animate-pulse" />
          ) : daily.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-gray-400 text-sm">Sin datos en este período</div>
          ) : (
            <div className="flex items-end gap-1 h-40">
              {daily.map(d => (
                <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group">
                  <div
                    className="w-full bg-green-500 rounded-t opacity-80 group-hover:opacity-100 transition-opacity cursor-pointer relative"
                    style={{ height: `${Math.max((d.revenue / maxRevenue) * 130, d.revenue > 0 ? 4 : 0)}px` }}
                    title={`${d.date}: ${fmt(d.revenue)} (${d.orders} pedidos)`}
                  />
                  {daily.length <= 14 && (
                    <span className="text-xs text-gray-400 rotate-45 origin-left" style={{ fontSize: '9px' }}>
                      {d.date.slice(5)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* By channel */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Por canal</h2>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-8 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          ) : Object.keys(byChannel).length === 0 ? (
            <p className="text-sm text-gray-400">Sin datos de canal</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(byChannel).sort((a, b) => b[1] - a[1]).map(([ch, rev]) => (
                <div key={ch}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="capitalize text-gray-700">{ch}</span>
                    <span className="font-medium text-gray-900">{fmt(rev)}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full" style={{ width: `${(rev / totalChannel) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
