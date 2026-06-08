'use client'

import { useEffect, useState } from 'react'
import { ArrowUpCircle, ArrowDownCircle, RefreshCw, Package } from 'lucide-react'

interface Movement {
  id: string
  sku: string
  product_name: string
  type: string
  type_label: string
  quantity: number
  warehouse: string
  reference: string | null
  notes: string | null
  created_at: string
}

interface Stats {
  total: number
  entries: number
  exits: number
  adjustments: number
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const hours = Math.floor(diff / 3600000)
  if (hours < 1) return 'Hace menos de 1h'
  if (hours < 24) return `Hace ${hours}h`
  return `Hace ${Math.floor(hours / 24)}d`
}

const typeConfig: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  entry: { icon: <ArrowDownCircle className="w-4 h-4" />, color: 'text-green-700', bg: 'bg-green-50' },
  exit: { icon: <ArrowUpCircle className="w-4 h-4" />, color: 'text-red-700', bg: 'bg-red-50' },
  adjustment: { icon: <RefreshCw className="w-4 h-4" />, color: 'text-blue-700', bg: 'bg-blue-50' },
  transfer: { icon: <RefreshCw className="w-4 h-4" />, color: 'text-purple-700', bg: 'bg-purple-50' },
}

export default function MovementsPage() {
  const [movements, setMovements] = useState<Movement[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [filter, setFilter] = useState<string>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/erp/inventory/movements')
      .then(r => r.json())
      .then(d => {
        setMovements(d.movements ?? [])
        setStats(d.stats ?? null)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const filtered = filter === 'all' ? movements : movements.filter(m => m.type === filter)

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Movimientos de Inventario</h1>
          <p className="text-sm text-gray-500 mt-1">Historial de entradas, salidas y ajustes</p>
        </div>
        <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">ERP · Inventario</span>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-5 animate-pulse h-20 border border-gray-100" />
          ))}
        </div>
      ) : stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total', value: stats.total, color: 'text-gray-900' },
            { label: 'Entradas', value: stats.entries, color: 'text-green-700' },
            { label: 'Salidas', value: stats.exits, color: 'text-red-600' },
            { label: 'Ajustes', value: stats.adjustments, color: 'text-blue-600' },
          ].map(card => (
            <div key={card.label} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <p className="text-xs text-gray-500 mb-1">{card.label}</p>
              <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        {['all', 'entry', 'exit', 'adjustment', 'transfer'].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${filter === f ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {f === 'all' ? 'Todos' : f === 'entry' ? 'Entradas' : f === 'exit' ? 'Salidas' : f === 'adjustment' ? 'Ajustes' : 'Transferencias'}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Sin movimientos registrados</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Producto</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">SKU</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Tipo</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">Cantidad</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Almacén</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Ref</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Hora</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(mv => {
                const cfg = typeConfig[mv.type] ?? typeConfig.adjustment
                return (
                  <tr key={mv.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900 max-w-xs truncate">{mv.product_name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{mv.sku}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.color}`}>
                        {cfg.icon}
                        {mv.type_label}
                      </span>
                    </td>
                    <td className={`px-4 py-3 text-right font-bold ${mv.type === 'exit' ? 'text-red-600' : 'text-green-700'}`}>
                      {mv.type === 'exit' ? '-' : '+'}{mv.quantity}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{mv.warehouse}</td>
                    <td className="px-4 py-3 text-gray-400 font-mono text-xs">{mv.reference ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{relativeTime(mv.created_at)}</td>
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
