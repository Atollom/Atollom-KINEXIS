'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { PackageCheck, Clock, CheckCircle2, Truck } from 'lucide-react'

interface ReceivingItem {
  id: string
  folio: string
  supplier: string
  supplier_phone: string | null
  status: string
  total: number
  items_count: number
  items: { sku: string; qty: number; unit_cost: number }[]
  received: boolean
  created_at: string
  updated_at: string
}

interface Stats {
  pending: number
  received: number
  approved: number
}

function fmt(n: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n)
}

const statusConfig: Record<string, { label: string; color: string; icon: ReactNode }> = {
  APPROVED: { label: 'Aprobada', color: 'bg-blue-100 text-blue-700', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  SENT: { label: 'En tránsito', color: 'bg-yellow-100 text-yellow-700', icon: <Truck className="w-3.5 h-3.5" /> },
  RECEIVED: { label: 'Recibida', color: 'bg-green-100 text-green-700', icon: <PackageCheck className="w-3.5 h-3.5" /> },
}

export default function ReceivingPage() {
  const [items, setItems] = useState<ReceivingItem[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [marking, setMarking] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/erp/purchases/receiving')
      .then(r => r.json())
      .then(d => {
        setItems(d.items ?? [])
        setStats(d.stats ?? null)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  async function markReceived(poId: string) {
    setMarking(poId)
    try {
      const res = await fetch('/api/erp/purchases/receiving', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ po_id: poId }),
      })
      if (res.ok) {
        setItems(prev => prev.map(i => i.id === poId ? { ...i, status: 'RECEIVED', received: true } : i))
        setStats(prev => prev ? { ...prev, pending: prev.pending - 1, received: prev.received + 1 } : prev)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setMarking(null)
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Recepción de Mercancía</h1>
          <p className="text-sm text-gray-500 mt-1">Órdenes de compra pendientes de recibir</p>
        </div>
        <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">ERP · Compras</span>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-5 animate-pulse h-20 border border-gray-100" />
          ))}
        </div>
      ) : stats && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-1"><Truck className="w-4 h-4 text-yellow-500" /><span className="text-xs text-gray-500">En tránsito</span></div>
            <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-1"><Clock className="w-4 h-4 text-blue-500" /><span className="text-xs text-gray-500">Aprobadas</span></div>
            <p className="text-2xl font-bold text-blue-600">{stats.approved}</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-1"><CheckCircle2 className="w-4 h-4 text-green-500" /><span className="text-xs text-gray-500">Recibidas</span></div>
            <p className="text-2xl font-bold text-green-600">{stats.received}</p>
          </div>
        </div>
      )}

      {/* List */}
      <div className="space-y-3">
        {loading ? Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl p-5 animate-pulse h-28 border border-gray-100" />
        )) : items.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center text-gray-400 border border-gray-100">
            <PackageCheck className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Sin órdenes pendientes de recepción</p>
          </div>
        ) : items.map(item => {
          const sc = statusConfig[item.status] ?? { label: item.status, color: 'bg-gray-100 text-gray-500', icon: null }
          return (
            <div key={item.id} className={`bg-white rounded-xl shadow-sm border transition-all ${item.received ? 'border-green-100 opacity-60' : 'border-gray-100'}`}>
              <div className="p-5 flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-mono text-sm font-bold text-gray-700">{item.folio}</span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${sc.color}`}>
                      {sc.icon}
                      {sc.label}
                    </span>
                  </div>
                  <p className="font-semibold text-gray-900">{item.supplier}</p>
                  <div className="flex gap-4 mt-1 text-xs text-gray-500">
                    <span>{item.items_count} artículos</span>
                    <span className="font-medium text-gray-900">{fmt(item.total)}</span>
                    {item.supplier_phone && <span>{item.supplier_phone}</span>}
                  </div>
                </div>

                {!item.received && (
                  <button
                    onClick={() => markReceived(item.id)}
                    disabled={marking === item.id}
                    className="shrink-0 ml-4 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                  >
                    {marking === item.id ? 'Procesando...' : 'Marcar recibida'}
                  </button>
                )}
                {item.received && (
                  <div className="shrink-0 ml-4 flex items-center gap-1 text-green-600 text-sm">
                    <CheckCircle2 className="w-4 h-4" />
                    Recibida
                  </div>
                )}
              </div>

              {/* Items preview */}
              {item.items.length > 0 && (
                <div className="border-t border-gray-50 px-5 pb-3 pt-2">
                  <div className="flex gap-2 flex-wrap">
                    {item.items.slice(0, 4).map((it, idx) => (
                      <span key={idx} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                        {it.sku} ×{it.qty}
                      </span>
                    ))}
                    {item.items.length > 4 && (
                      <span className="text-xs text-gray-400">+{item.items.length - 4} más</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
