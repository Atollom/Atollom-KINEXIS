'use client'

import { useState } from 'react'
import { Search, Truck, MapPin, Clock, Package } from 'lucide-react'

interface TrackingEvent {
  status: string
  location: string
  timestamp: string
  description: string
}

interface TrackingResult {
  tracking_number: string
  carrier: string
  status: string
  estimated_delivery: string | null
  events: TrackingEvent[]
}

const statusColors: Record<string, string> = {
  DELIVERED: 'bg-green-100 text-green-700',
  IN_TRANSIT: 'bg-blue-100 text-blue-700',
  OUT_FOR_DELIVERY: 'bg-yellow-100 text-yellow-700',
  EXCEPTION: 'bg-red-100 text-red-700',
  PENDING: 'bg-gray-100 text-gray-500',
}

export default function TrackingPage() {
  const [query, setQuery] = useState('')
  const [result, setResult] = useState<TrackingResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch(`/api/erp/logistics/tracking?tracking=${encodeURIComponent(query.trim())}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error al rastrear')
      setResult(data)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rastreo de Envíos</h1>
          <p className="text-sm text-gray-500 mt-1">Consulta el estado de cualquier guía</p>
        </div>
        <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">ERP · Logística</span>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-3 max-w-xl">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Número de guía o tracking..."
            className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
        >
          {loading ? 'Rastreando...' : 'Rastrear'}
        </button>
      </form>

      {error && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-red-600 text-sm">
          {error}
        </div>
      )}

      {!result && !loading && !error && (
        <div className="bg-white rounded-xl p-12 text-center text-gray-400 border border-gray-100">
          <Truck className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="font-medium text-gray-500">Ingresa un número de guía para rastrear</p>
          <p className="text-xs mt-1">Compatible con guías de Skydropx y paqueterías integradas</p>
        </div>
      )}

      {result && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="font-bold text-gray-900 font-mono">{result.tracking_number}</h2>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[result.status] ?? 'bg-gray-100 text-gray-500'}`}>
                    {result.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="flex gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Truck className="w-4 h-4" />
                    {result.carrier}
                  </div>
                  {result.estimated_delivery && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      Entrega estimada: {new Date(result.estimated_delivery).toLocaleDateString('es-MX')}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {result.events.length > 0 && (
            <div className="p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Historial de eventos</h3>
              <div className="relative pl-6">
                <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-gray-200" />
                {result.events.map((ev, idx) => (
                  <div key={idx} className="relative mb-4 last:mb-0">
                    <div className="absolute -left-4 top-1 w-2.5 h-2.5 rounded-full border-2 border-green-500 bg-white" />
                    <div className="ml-2">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-medium text-gray-900">{ev.status}</p>
                        <span className="text-xs text-gray-400">{new Date(ev.timestamp).toLocaleString('es-MX')}</span>
                      </div>
                      <p className="text-sm text-gray-600">{ev.description}</p>
                      {ev.location && (
                        <div className="flex items-center gap-1 mt-0.5 text-xs text-gray-400">
                          <MapPin className="w-3 h-3" />
                          {ev.location}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
