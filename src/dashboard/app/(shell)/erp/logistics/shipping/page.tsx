'use client'

import { useEffect, useState } from 'react'
import { Truck, Package, AlertTriangle, ExternalLink } from 'lucide-react'

interface Shipment {
  id: string
  tracking: string
  carrier: string
  order_ref: string
  label_url: string | null
  shipment_id: string | null
  expires_at: string | null
  expired: boolean
  created_at: string
}

interface Stats {
  total: number
  active: number
  by_carrier: Record<string, number>
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'Hoy'
  if (days === 1) return 'Ayer'
  return `Hace ${days}d`
}

export default function ShippingPage() {
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [filter, setFilter] = useState<'all' | 'active' | 'expired'>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/erp/logistics/shipping')
      .then(r => r.json())
      .then(d => {
        setShipments(d.shipments ?? [])
        setStats(d.stats ?? null)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const filtered = filter === 'all' ? shipments
    : filter === 'active' ? shipments.filter(s => !s.expired)
    : shipments.filter(s => s.expired)

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Envíos y Etiquetas</h1>
          <p className="text-sm text-gray-500 mt-1">Guías generadas vía Skydropx</p>
        </div>
        <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">ERP · Logística</span>
      </div>

      {loading ? (
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-5 animate-pulse h-20 border border-gray-100" />
          ))}
        </div>
      ) : stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-1"><Package className="w-4 h-4 text-gray-400" /><span className="text-xs text-gray-500">Total guías</span></div>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-1"><Truck className="w-4 h-4 text-green-500" /><span className="text-xs text-gray-500">Activas</span></div>
            <p className="text-2xl font-bold text-green-600">{stats.active}</p>
          </div>
          {Object.entries(stats.by_carrier).map(([carrier, count]) => (
            <div key={carrier} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-1"><Truck className="w-4 h-4 text-blue-400" /><span className="text-xs text-gray-500">{carrier}</span></div>
              <p className="text-2xl font-bold text-blue-600">{count}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        {(['all', 'active', 'expired'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${filter === f ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {f === 'all' ? `Todas (${shipments.length})` : f === 'active' ? `Activas (${shipments.filter(s => !s.expired).length})` : `Vencidas (${shipments.filter(s => s.expired).length})`}
          </button>
        ))}
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
            <Truck className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Sin envíos en esta categoría</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Tracking</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Paquetería</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Pedido</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Vencimiento</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Estado</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Fecha</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Guía</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(s => (
                <tr key={s.id} className={`hover:bg-gray-50 transition-colors ${s.expired ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-3 font-mono text-xs text-gray-700">{s.tracking}</td>
                  <td className="px-4 py-3 text-gray-600">{s.carrier}</td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">{s.order_ref}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {s.expires_at ? new Date(s.expires_at).toLocaleDateString('es-MX') : '—'}
                  </td>
                  <td className="px-4 py-3">
                    {s.expired ? (
                      <span className="flex items-center gap-1 text-xs text-red-600"><AlertTriangle className="w-3 h-3" />Vencida</span>
                    ) : (
                      <span className="text-xs text-green-600 font-medium">Activa</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{relativeTime(s.created_at)}</td>
                  <td className="px-4 py-3">
                    {s.label_url ? (
                      <a href={s.label_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-green-600 hover:text-green-800 text-xs">
                        <ExternalLink className="w-3.5 h-3.5" />
                        Descargar
                      </a>
                    ) : <span className="text-gray-400 text-xs">—</span>}
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
