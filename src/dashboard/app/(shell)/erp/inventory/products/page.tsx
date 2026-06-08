'use client'

import { useState, useEffect } from 'react'
import { Package, Search, AlertTriangle } from 'lucide-react'

interface Product {
  id: string
  sku: string
  name: string
  quantity: number
  min_stock: number | null
  cost: number | null
  price: number | null
  warehouse_id: string | null
}

function fmt(n: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n)
}

export default function InventoryProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [lowStockOnly, setLowStockOnly] = useState(false)

  useEffect(() => {
    fetch('/api/erp/inventory/valuation')
      .then(r => r.json())
      .then(data => setProducts(data.items ?? []))
      .finally(() => setLoading(false))
  }, [])

  const filtered = products.filter(p => {
    const matchesSearch = search === '' ||
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.sku?.toLowerCase().includes(search.toLowerCase())
    const matchesLow = !lowStockOnly || (p.min_stock != null && p.quantity <= p.min_stock)
    return matchesSearch && matchesLow
  })

  const lowStockCount = products.filter(p => p.min_stock != null && p.quantity <= p.min_stock).length

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Productos en Inventario</h1>
        <p className="text-sm text-gray-500 mt-1">Catálogo de productos con existencias actuales</p>
      </div>

      {/* Alert */}
      {!loading && lowStockCount > 0 && (
        <div className="flex items-center gap-3 bg-orange-50 border border-orange-100 rounded-xl p-4">
          <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0" />
          <p className="text-sm text-orange-800">
            <span className="font-semibold">{lowStockCount} producto{lowStockCount !== 1 ? 's' : ''}</span> {lowStockCount !== 1 ? 'tienen' : 'tiene'} stock bajo el mínimo
          </p>
          <button
            onClick={() => setLowStockOnly(!lowStockOnly)}
            className="ml-auto text-xs font-medium text-orange-600 hover:text-orange-800 underline"
          >
            {lowStockOnly ? 'Ver todos' : 'Filtrar'}
          </button>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por nombre o SKU..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 focus:border-green-400 focus:outline-none rounded-lg text-sm"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <Package className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <p className="font-medium text-gray-500">Sin productos</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left font-semibold text-gray-500 px-4 py-3">SKU</th>
                  <th className="text-left font-semibold text-gray-500 px-4 py-3">Producto</th>
                  <th className="text-right font-semibold text-gray-500 px-4 py-3">Existencia</th>
                  <th className="text-right font-semibold text-gray-500 px-4 py-3">Mínimo</th>
                  <th className="text-right font-semibold text-gray-500 px-4 py-3">Costo</th>
                  <th className="text-right font-semibold text-gray-500 px-4 py-3">Precio</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => {
                  const isLow = p.min_stock != null && p.quantity <= p.min_stock
                  return (
                    <tr key={p.id} className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${isLow ? 'bg-orange-50/30' : ''}`}>
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">{p.sku}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {isLow && <AlertTriangle className="w-3.5 h-3.5 text-orange-400 shrink-0" />}
                          <span className="font-medium text-gray-900">{p.name}</span>
                        </div>
                      </td>
                      <td className={`px-4 py-3 text-right font-bold ${isLow ? 'text-orange-600' : 'text-gray-900'}`}>
                        {p.quantity}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-400">{p.min_stock ?? '—'}</td>
                      <td className="px-4 py-3 text-right text-gray-600">{p.cost ? fmt(p.cost) : '—'}</td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900">{p.price ? fmt(p.price) : '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
