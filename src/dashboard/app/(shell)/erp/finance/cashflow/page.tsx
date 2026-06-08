'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, DollarSign, Calendar } from 'lucide-react'

interface DailyEntry {
  date: string
  inflow: number
  outflow: number
  balance: number
}

interface UpcomingPayable {
  id: string
  amount: number
  due_date: string
}

interface CashflowData {
  inflows_30d: number
  outflows_30d: number
  net_30d: number
  current_balance: number
  daily_cashflow: DailyEntry[]
  upcoming_payables: UpcomingPayable[]
}

function fmt(n: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n)
}

export default function CashflowPage() {
  const [data, setData] = useState<CashflowData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/erp/finance/cashflow')
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false))
  }, [])

  const maxBar = data ? Math.max(...data.daily_cashflow.map(d => Math.max(d.inflow, d.outflow, 1))) : 1

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Flujo de Caja</h1>
        <p className="text-sm text-gray-500 mt-1">Agente #17 · Proyección de tesorería — últimos 30 días</p>
      </div>

      {/* KPI strip */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Entradas 30d', value: fmt(data.inflows_30d), icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
            { label: 'Salidas 30d', value: fmt(data.outflows_30d), icon: TrendingDown, color: 'text-red-500', bg: 'bg-red-50' },
            { label: 'Neto 30d', value: fmt(data.net_30d), icon: DollarSign, color: data.net_30d >= 0 ? 'text-green-600' : 'text-red-500', bg: data.net_30d >= 0 ? 'bg-green-50' : 'bg-red-50' },
            { label: 'Balance acumulado', value: fmt(data.current_balance), icon: DollarSign, color: 'text-gray-700', bg: 'bg-gray-50' },
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

      {/* Daily bar chart */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Entradas vs Salidas diarias</h2>
        {loading ? (
          <div className="h-40 bg-gray-100 rounded animate-pulse" />
        ) : data && (
          <div className="flex items-end gap-1 h-40 overflow-x-auto">
            {data.daily_cashflow.map(d => (
              <div key={d.date} className="flex flex-col items-center gap-0.5 flex-1 min-w-[8px]" title={`${d.date}\nEntradas: ${fmt(d.inflow)}\nSalidas: ${fmt(d.outflow)}`}>
                <div className="w-full flex flex-col justify-end gap-px" style={{ height: '128px' }}>
                  <div
                    className="w-full bg-green-400 rounded-sm opacity-80"
                    style={{ height: `${(d.inflow / maxBar) * 100}%` }}
                  />
                  <div
                    className="w-full bg-red-400 rounded-sm opacity-70"
                    style={{ height: `${(d.outflow / maxBar) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="flex items-center gap-4 mt-3">
          <div className="flex items-center gap-1.5 text-xs text-gray-500"><div className="w-3 h-3 bg-green-400 rounded-sm" /> Entradas</div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500"><div className="w-3 h-3 bg-red-400 rounded-sm" /> Salidas</div>
        </div>
      </div>

      {/* Upcoming payables */}
      {data && data.upcoming_payables.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            Próximos pagos programados
          </h2>
          <div className="space-y-2">
            {data.upcoming_payables.map(p => (
              <div key={p.id} className="flex items-center justify-between p-3 bg-orange-50 border border-orange-100 rounded-lg">
                <div className="flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-orange-500" />
                  <span className="text-sm text-gray-700 font-mono">OC {p.id.slice(0, 8)}</span>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-orange-700">{fmt(p.amount)}</p>
                  <p className="text-xs text-gray-400">{new Date(p.due_date).toLocaleDateString('es-MX')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
