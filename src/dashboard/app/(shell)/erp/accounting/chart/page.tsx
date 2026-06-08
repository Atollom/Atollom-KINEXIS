'use client'

import { useEffect, useState } from 'react'
import { BookOpen, TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface AccountEntry {
  code: string
  name: string
  type: 'asset' | 'liability' | 'equity' | 'income' | 'expense'
  balance: number
  movement_count: number
}

interface ChartData {
  accounts: AccountEntry[]
  summary: {
    total_assets: number
    total_liabilities: number
    total_income: number
    total_expenses: number
    net_income: number
  }
}

function fmt(n: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n)
}

const typeConfig: Record<string, { label: string; color: string; bg: string }> = {
  asset: { label: 'Activo', color: 'text-blue-700', bg: 'bg-blue-50' },
  liability: { label: 'Pasivo', color: 'text-red-700', bg: 'bg-red-50' },
  equity: { label: 'Capital', color: 'text-purple-700', bg: 'bg-purple-50' },
  income: { label: 'Ingreso', color: 'text-green-700', bg: 'bg-green-50' },
  expense: { label: 'Gasto', color: 'text-orange-700', bg: 'bg-orange-50' },
}

export default function ChartOfAccountsPage() {
  const [data, setData] = useState<ChartData | null>(null)
  const [filter, setFilter] = useState<string>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/erp/accounting/chart')
      .then(r => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const accounts = data?.accounts ?? []
  const filtered = filter === 'all' ? accounts : accounts.filter(a => a.type === filter)

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Catálogo de Cuentas</h1>
          <p className="text-sm text-gray-500 mt-1">Plan de cuentas contables del tenant</p>
        </div>
        <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">ERP · Contabilidad</span>
      </div>

      {/* Summary cards */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-4 animate-pulse h-20 border border-gray-100" />
          ))}
        </div>
      ) : data?.summary && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: 'Activos', value: data.summary.total_assets, positive: true },
            { label: 'Pasivos', value: data.summary.total_liabilities, positive: false },
            { label: 'Ingresos', value: data.summary.total_income, positive: true },
            { label: 'Gastos', value: data.summary.total_expenses, positive: false },
            { label: 'Utilidad Neta', value: data.summary.net_income, positive: data.summary.net_income >= 0 },
          ].map(card => (
            <div key={card.label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <p className="text-xs text-gray-500 mb-1">{card.label}</p>
              <p className={`text-lg font-bold ${card.positive ? 'text-green-700' : 'text-red-600'}`}>
                {fmt(card.value)}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Type filters */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setFilter('all')} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${filter === 'all' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
          Todas
        </button>
        {Object.entries(typeConfig).map(([key, cfg]) => (
          <button key={key} onClick={() => setFilter(key)} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${filter === key ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {cfg.label} ({accounts.filter(a => a.type === key).length})
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Sin cuentas registradas</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Código</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Cuenta</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Tipo</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">Saldo</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">Movimientos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(acc => {
                const cfg = typeConfig[acc.type]
                return (
                  <tr key={acc.code} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{acc.code}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{acc.name}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cfg?.bg} ${cfg?.color}`}>
                        {cfg?.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">{fmt(acc.balance)}</td>
                    <td className="px-4 py-3 text-right text-gray-500">{acc.movement_count}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
