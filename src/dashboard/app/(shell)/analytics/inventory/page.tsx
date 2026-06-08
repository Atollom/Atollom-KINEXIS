'use client'

import { useEffect, useState } from 'react'
import { Package, AlertTriangle, TrendingUp, TrendingDown, Warehouse } from 'lucide-react'

interface InventoryStats {
  total_skus: number
  total_units: number
  low_stock_count: number
  out_of_stock_count: number
  total_value: number
  entries_30d: number
  exits_30d: number
  net_movement_30d: number
}

interface LowStockItem { sku: string; quantity: number; threshold: number; warehouse: string }

function fmt(n: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n)
}

export default function InventoryAnalyticsPage() {
  const [stats, setStats] = useState<InventoryStats | null>(null)
  const [lowStock, setLowStock] = useState<LowStockItem[]>([])
  const [byWarehouse, setByWarehouse] = useState<Record<string, { skus: number; units: number }>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/analytics/inventory')
      .then(r => r.json())
      .then(d => {
        setStats(d.stats)
        setLowStock(d.low_stock_items ?? [])
        setByWarehouse(d.by_warehouse ?? {})
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics de Inventario</h1>
          <p className="text-sm text-gray-500 mt-1">Stock, movimientos y alertas de reabastecimiento</p>
        </div>
        <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">ERP · Analytics</span>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-5 animate-pulse h-24 border border-gray-100" />
          ))}
        </div>
      ) : stats && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-2"><Package className="w-4 h-4 text-blue-500" /><span className="text-xs text-gray-500">SKUs activos</span></div>
              <p className="text-2xl font-bold text-blue-700">{stats.total_skus}</p>
              <p className="text-xs text-gray-400">{stats.total_units.toLocaleString()} unidades</p>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-2"><AlertTriangle className="w-4 h-4 text-red-500" /><span className="text-xs text-gray-500">Bajo stock</span></div>
              <p className="text-2xl font-bold text-red-600">{stats.low_stock_count}</p>
              <p className="text-xs text-gray-400">{stats.out_of_stock_count} sin stock</p>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-2"><Warehouse className="w-4 h-4 text-orange-500" /><span className="text-xs text-gray-500">Valor total</span></div>
              <p className="text-xl font-bold text-orange-700">{fmt(stats.total_value)}</p>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                {stats.net_movement_30d >= 0 ? <TrendingUp className="w-4 h-4 text-green-500" /> : <TrendingDown className="w-4 h-4 text-red-500" />}
                <span className="text-xs text-gray-500">Movimiento neto (30d)</span>
              </div>
              <p className={`text-xl font-bold ${stats.net_movement_30d >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                {stats.net_movement_30d >= 0 ? '+' : ''}{stats.net_movement_30d}
              </p>
              <p className="text-xs text-gray-400">+{stats.entries_30d} entradas / -{stats.exits_30d} salidas</p>
            </div>
          </div>
        </>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* By warehouse */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Por almacén</h2>
          {loading ? (
            <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />)}</div>
          ) : Object.entries(byWarehouse).length === 0 ? (
            <p className="text-sm text-gray-400">Sin almacenes registrados</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(byWarehouse).map(([wh, data]) => (
                <div key={wh} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Warehouse className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-gray-900">{wh}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">{data.units} uds</p>
                    <p className="text-xs text-gray-400">{data.skus} SKUs</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Low stock alerts */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            Alertas de stock bajo
          </h2>
          {loading ? (
            <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />)}</div>
          ) : lowStock.length === 0 ? (
            <div className="text-center py-6">
              <Package className="w-8 h-8 mx-auto mb-2 text-green-400 opacity-50" />
              <p className="text-sm text-gray-500">Sin alertas de stock bajo</p>
            </div>
          ) : (
            <div className="space-y-2">
              {lowStock.map(item => (
                <div key={item.sku} className="flex items-center justify-between py-2 border-b border-gray-50">
                  <div>
                    <p className="font-mono text-xs text-gray-600">{item.sku}</p>
                    <p className="text-xs text-gray-400">{item.warehouse}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold text-sm ${item.quantity === 0 ? 'text-red-600' : 'text-orange-500'}`}>{item.quantity}</p>
                    <p className="text-xs text-gray-400">mín {item.threshold}</p>
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
