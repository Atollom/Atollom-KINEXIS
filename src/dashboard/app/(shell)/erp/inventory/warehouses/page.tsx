'use client'

import { useEffect, useState } from 'react'
import { Warehouse, Package, AlertCircle } from 'lucide-react'

interface WarehouseItem {
  warehouse: string
  sku_count: number
  total_stock: number
  low_stock_count: number
  total_value: number
  items: { sku: string; name: string; stock: number; low_stock_threshold: number }[]
}

function fmt(n: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n)
}

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState<WarehouseItem[]>([])
  const [expanded, setExpanded] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/erp/inventory/warehouses')
      .then(r => r.json())
      .then(d => setWarehouses(d.warehouses ?? []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Almacenes</h1>
          <p className="text-sm text-gray-500 mt-1">Vista consolidada por ubicación de inventario</p>
        </div>
        <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">ERP · Inventario</span>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-6 animate-pulse h-36 border border-gray-100" />
          ))}
        </div>
      ) : warehouses.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center text-gray-400 border border-gray-100">
          <Warehouse className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Sin almacenes registrados</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {warehouses.map(wh => (
            <div key={wh.warehouse} className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Warehouse className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{wh.warehouse}</h3>
                      <p className="text-xs text-gray-500">{wh.sku_count} SKUs · {wh.total_stock} unidades</p>
                    </div>
                  </div>
                  {wh.low_stock_count > 0 && (
                    <span className="flex items-center gap-1 px-2 py-1 bg-red-50 text-red-600 rounded-full text-xs font-medium">
                      <AlertCircle className="w-3 h-3" />
                      {wh.low_stock_count} bajo stock
                    </span>
                  )}
                </div>
                <div className="flex gap-4">
                  <div>
                    <p className="text-xs text-gray-400">Valor total</p>
                    <p className="font-bold text-gray-900">{fmt(wh.total_value)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Unidades</p>
                    <p className="font-bold text-gray-900">{wh.total_stock}</p>
                  </div>
                </div>
                <button
                  onClick={() => setExpanded(expanded === wh.warehouse ? null : wh.warehouse)}
                  className="mt-4 text-xs text-green-600 hover:text-green-800 font-medium"
                >
                  {expanded === wh.warehouse ? 'Ocultar productos' : `Ver ${wh.items.length} productos`}
                </button>
              </div>

              {expanded === wh.warehouse && (
                <div className="border-t border-gray-100">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left px-4 py-2 text-gray-500 font-medium">SKU</th>
                        <th className="text-left px-4 py-2 text-gray-500 font-medium">Producto</th>
                        <th className="text-right px-4 py-2 text-gray-500 font-medium">Stock</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {wh.items.map(item => (
                        <tr key={item.sku} className={item.stock <= item.low_stock_threshold ? 'bg-red-50/40' : ''}>
                          <td className="px-4 py-2 font-mono text-gray-500">{item.sku}</td>
                          <td className="px-4 py-2 text-gray-700">{item.name}</td>
                          <td className={`px-4 py-2 text-right font-bold ${item.stock <= item.low_stock_threshold ? 'text-red-600' : 'text-gray-900'}`}>
                            {item.stock}
                            {item.stock <= item.low_stock_threshold && <span className="ml-1">⚠</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
