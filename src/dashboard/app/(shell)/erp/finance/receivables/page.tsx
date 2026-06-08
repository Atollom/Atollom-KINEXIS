'use client'

import { useEffect, useState } from 'react'
import { DollarSign, Clock, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react'

interface Receivable {
  id: string
  order_ref: string
  client: string
  total: number
  status: 'paid' | 'invoiced' | 'overdue' | 'pending'
  due_date: string | null
  invoice_number: string | null
  created_at: string
  days_overdue?: number
}

interface Stats {
  total_receivables: number
  overdue_amount: number
  paid_amount: number
  pending_amount: number
  overdue_count: number
}

function fmt(n: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n)
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'Hoy'
  if (days === 1) return 'Ayer'
  return `Hace ${days} días`
}

const statusConfig = {
  paid: { label: 'Pagado', color: 'bg-green-100 text-green-700' },
  invoiced: { label: 'Facturado', color: 'bg-blue-100 text-blue-700' },
  overdue: { label: 'Vencido', color: 'bg-red-100 text-red-700' },
  pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-700' },
}

export default function ReceivablesPage() {
  const [items, setItems] = useState<Receivable[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [filter, setFilter] = useState<'all' | 'overdue' | 'invoiced' | 'pending' | 'paid'>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/erp/finance/receivables')
      .then(r => r.json())
      .then(d => {
        setItems(d.receivables ?? [])
        setStats(d.stats ?? null)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const filtered = filter === 'all' ? items : items.filter(i => i.status === filter)

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cuentas por Cobrar</h1>
          <p className="text-sm text-gray-500 mt-1">Seguimiento de facturas y pagos pendientes</p>
        </div>
        <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">ERP · Finanzas</span>
      </div>

      {/* KPIs */}
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
              <DollarSign className="w-4 h-4 text-green-600" />
              <span className="text-xs text-gray-500">Total por cobrar</span>
            </div>
            <p className="text-xl font-bold text-gray-900">{fmt(stats.total_receivables)}</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <span className="text-xs text-gray-500">Vencido</span>
            </div>
            <p className="text-xl font-bold text-red-600">{fmt(stats.overdue_amount)}</p>
            <p className="text-xs text-gray-400">{stats.overdue_count} facturas</p>
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
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-xs text-gray-500">Cobrado</span>
            </div>
            <p className="text-xl font-bold text-green-600">{fmt(stats.paid_amount)}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'overdue', 'invoiced', 'pending', 'paid'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === f ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f === 'all' ? 'Todos' : statusConfig[f]?.label ?? f}
            {f !== 'all' && !loading && (
              <span className="ml-1 text-xs opacity-70">({items.filter(i => i.status === f).length})</span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <CheckCircle className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Sin registros en esta categoría</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Cliente</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Pedido</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Factura</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">Monto</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Vencimiento</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Estado</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(item => (
                <tr key={item.id} className={`hover:bg-gray-50 transition-colors ${item.status === 'overdue' ? 'bg-red-50/30' : ''}`}>
                  <td className="px-4 py-3 font-medium text-gray-900">{item.client}</td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">{item.order_ref}</td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">{item.invoice_number ?? '—'}</td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900">{fmt(item.total)}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {item.due_date ? (
                      <span className={item.status === 'overdue' ? 'text-red-600 font-medium' : ''}>
                        {new Date(item.due_date).toLocaleDateString('es-MX')}
                        {item.days_overdue ? ` (+${item.days_overdue}d)` : ''}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig[item.status]?.color}`}>
                      {statusConfig[item.status]?.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{relativeTime(item.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
