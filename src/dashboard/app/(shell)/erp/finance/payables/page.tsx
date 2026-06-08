'use client'

import { useEffect, useState } from 'react'
import { ShoppingCart, Clock, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react'

interface Payable {
  id: string
  folio: string
  supplier: string
  total: number
  status: string
  status_label: string
  due_date: string | null
  days_overdue: number
  overdue: boolean
  created_at: string
}

interface Stats {
  total_payables: number
  overdue_amount: number
  pending_amount: number
  approved_amount: number
  overdue_count: number
}

function fmt(n: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n)
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  APPROVED: 'bg-blue-100 text-blue-700',
  SENT: 'bg-purple-100 text-purple-700',
  RECEIVED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-gray-100 text-gray-500',
}

export default function PayablesPage() {
  const [items, setItems] = useState<Payable[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [filter, setFilter] = useState<'all' | 'overdue'>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/erp/finance/payables')
      .then(r => r.json())
      .then(d => {
        setItems(d.payables ?? [])
        setStats(d.stats ?? null)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const filtered = filter === 'overdue' ? items.filter(i => i.overdue) : items

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cuentas por Pagar</h1>
          <p className="text-sm text-gray-500 mt-1">Órdenes de compra y obligaciones con proveedores</p>
        </div>
        <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">ERP · Finanzas</span>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 animate-pulse h-24" />
          ))}
        </div>
      ) : stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-xs text-gray-500">Total a pagar</span>
            </div>
            <p className="text-xl font-bold text-gray-900">{fmt(stats.total_payables)}</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <span className="text-xs text-gray-500">Vencido</span>
            </div>
            <p className="text-xl font-bold text-red-600">{fmt(stats.overdue_amount)}</p>
            <p className="text-xs text-gray-400">{stats.overdue_count} OC</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-yellow-500" />
              <span className="text-xs text-gray-500">Pendiente</span>
            </div>
            <p className="text-xl font-bold text-yellow-600">{fmt(stats.pending_amount)}</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-blue-500" />
              <span className="text-xs text-gray-500">Aprobado</span>
            </div>
            <p className="text-xl font-bold text-blue-600">{fmt(stats.approved_amount)}</p>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <button onClick={() => setFilter('all')} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${filter === 'all' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
          Todos ({items.length})
        </button>
        <button onClick={() => setFilter('overdue')} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${filter === 'overdue' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
          Vencidos ({items.filter(i => i.overdue).length})
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <ShoppingCart className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Sin órdenes en esta categoría</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Folio</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Proveedor</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">Total</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Vencimiento</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(item => (
                <tr key={item.id} className={`hover:bg-gray-50 transition-colors ${item.overdue ? 'bg-red-50/30' : ''}`}>
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">{item.folio}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{item.supplier}</td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900">{fmt(item.total)}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {item.due_date ? (
                      <span className={item.overdue ? 'text-red-600 font-medium' : ''}>
                        {new Date(item.due_date).toLocaleDateString('es-MX')}
                        {item.days_overdue > 0 ? ` (+${item.days_overdue}d)` : ''}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[item.status] ?? 'bg-gray-100 text-gray-500'}`}>
                      {item.status_label}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
