'use client'

import { useEffect, useState } from 'react'
import { TrendingUp, Package, DollarSign, Percent } from 'lucide-react'

interface ValuationItem {
  sku: string
  name: string
  stock: number
  cost_price: number
  sale_price: number
  total_cost: number
  total_value: number
  margin: number
  margin_pct: number
  warehouse: string
}

interface ValuationStats {
  total_cost: number
  total_value: number
  total_margin: number
  avg_margin_pct: number
  sku_count: number
}

function fmt(n: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n)
}

export default function ValuationPage() {
  const [items, setItems] = useState<ValuationItem[]>([])
  const [stats, setStats] = useState<ValuationStats | null>(null)
  const [sort, setSort] = useState<'total_value' | 'margin_pct' | 'stock'>('total_value')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/erp/inventory/valuation')
      .then(r => r.json())
      .then(d => {
        setItems(d.items ?? [])
        setStats(d.stats ?? null)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const sorted = [...items].sort((a, b) => b[sort] - a[sort])

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Valuación de Inventario</h1>
          <p className="text-sm text-gray-500 mt-1">Costo, precio y margen por producto</p>
        </div>
        <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">ERP · Inventario</span>
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
            <div className="flex items-center gap-2 mb-2"><DollarSign className="w-4 h-4 text-gray-400" /><span className="text-xs text-gray-500">Costo total</span></div>
            <p className="text-xl font-bold text-gray-900">{fmt(stats.total_cost)}</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-2"><TrendingUp className="w-4 h-4 text-green-500" /><span className="text-xs text-gray-500">Valor venta</span></div>
            <p className="text-xl font-bold text-green-700">{fmt(stats.total_value)}</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-2"><Percent className="w-4 h-4 text-blue-500" /><span className="text-xs text-gray-500">Margen promedio</span></div>
            <p className="text-xl font-bold text-blue-700">{stats.avg_margin_pct.toFixed(1)}%</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-2"><Package className="w-4 h-4 text-purple-500" /><span className="text-xs text-gray-500">SKUs activos</span></div>
            <p className="text-xl font-bold text-purple-700">{stats.sku_count}</p>
          </div>
        </div>
      )}

      {/* Sort controls */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500">Ordenar por:</span>
        {([['total_value', 'Valor'], ['margin_pct', 'Margen %'], ['stock', 'Stock']] as const).map(([key, label]) => (
          <button key={key} onClick={() => setSort(key)} className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${sort === key ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {label}
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
        ) : sorted.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Sin productos en inventario</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Producto</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">Stock</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">Costo U.</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">Precio U.</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">Valor Total</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">Margen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sorted.map(item => (
                <tr key={`${item.sku}-${item.warehouse}`} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{item.name}</p>
                    <p className="text-xs text-gray-400 font-mono">{item.sku} · {item.warehouse}</p>
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-gray-700">{item.stock}</td>
                  <td className="px-4 py-3 text-right text-gray-500">{fmt(item.cost_price)}</td>
                  <td className="px-4 py-3 text-right text-gray-500">{fmt(item.sale_price)}</td>
                  <td className="px-4 py-3 text-right font-bold text-gray-900">{fmt(item.total_value)}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`font-bold ${item.margin_pct >= 30 ? 'text-green-600' : item.margin_pct >= 15 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {item.margin_pct.toFixed(1)}%
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
