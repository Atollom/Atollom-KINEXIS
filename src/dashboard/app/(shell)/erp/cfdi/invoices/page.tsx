'use client'

import { useState, useEffect } from 'react'
import { FileText, Download, Search, CheckCircle, XCircle, Clock } from 'lucide-react'

interface CfdiRecord {
  id: string
  uuid: string | null
  folio: string | null
  receptor_rfc: string | null
  receptor_name: string | null
  total: number
  status: string
  tipo_comprobante: string | null
  created_at: string
}

const STATUS_COLORS: Record<string, string> = {
  valid: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-600',
  pending: 'bg-yellow-100 text-yellow-700',
}

const STATUS_LABELS: Record<string, string> = {
  valid: 'Vigente',
  cancelled: 'Cancelado',
  pending: 'Pendiente',
}

function fmt(n: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n)
}

export default function CfdiInvoicesPage() {
  const [invoices, setInvoices] = useState<CfdiRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    const url = filter === 'all' ? '/api/erp/cfdi/billing' : `/api/erp/cfdi/billing?status=${filter}`
    fetch(url)
      .then(r => r.json())
      .then(data => setInvoices(data.invoices ?? []))
      .finally(() => setLoading(false))
  }, [filter])

  const filtered = invoices.filter(inv =>
    search === '' ||
    inv.receptor_name?.toLowerCase().includes(search.toLowerCase()) ||
    inv.receptor_rfc?.toLowerCase().includes(search.toLowerCase()) ||
    inv.folio?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Facturas CFDI</h1>
        <p className="text-sm text-gray-500 mt-1">Agente #13 · CFDI 4.0 — comprobantes fiscales emitidos</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por RFC, nombre o folio..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 focus:border-green-400 focus:outline-none rounded-lg text-sm"
          />
        </div>
        <div className="flex gap-2">
          {[
            { key: 'all', label: 'Todos', icon: FileText },
            { key: 'valid', label: 'Vigentes', icon: CheckCircle },
            { key: 'pending', label: 'Pendientes', icon: Clock },
            { key: 'cancelled', label: 'Cancelados', icon: XCircle },
          ].map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${filter === tab.key ? 'bg-green-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <FileText className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <p className="font-medium text-gray-500">Sin facturas</p>
            <p className="text-sm text-gray-400 mt-1">Los CFDI emitidos aparecerán aquí</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left font-semibold text-gray-500 px-4 py-3">Folio / UUID</th>
                  <th className="text-left font-semibold text-gray-500 px-4 py-3">Receptor</th>
                  <th className="text-left font-semibold text-gray-500 px-4 py-3">Estado</th>
                  <th className="text-right font-semibold text-gray-500 px-4 py-3">Total</th>
                  <th className="text-left font-semibold text-gray-500 px-4 py-3">Fecha</th>
                  <th className="text-center font-semibold text-gray-500 px-4 py-3">Archivos</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(inv => (
                  <tr key={inv.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{inv.folio ?? '—'}</p>
                      {inv.uuid && (
                        <p className="text-xs text-gray-400 font-mono truncate max-w-[120px]">{inv.uuid.slice(0, 16)}…</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 truncate max-w-[160px]">{inv.receptor_name ?? '—'}</p>
                      <p className="text-xs text-gray-400">{inv.receptor_rfc ?? '—'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[inv.status] ?? 'bg-gray-100 text-gray-500'}`}>
                        {STATUS_LABELS[inv.status] ?? inv.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900">{fmt(inv.total ?? 0)}</td>
                    <td className="px-4 py-3 text-gray-400">
                      {new Date(inv.created_at).toLocaleDateString('es-MX')}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {inv.uuid ? (
                        <div className="flex items-center justify-center gap-2">
                          <a href={`/api/erp/cfdi/billing/${inv.id}/pdf`} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1">
                            <Download className="w-3 h-3" /> PDF
                          </a>
                          <a href={`/api/erp/cfdi/billing/${inv.id}/xml`} className="text-xs text-blue-500 hover:text-blue-700 flex items-center gap-1">
                            <Download className="w-3 h-3" /> XML
                          </a>
                        </div>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-xs text-gray-400">{filtered.length} factura{filtered.length !== 1 ? 's' : ''} mostrada{filtered.length !== 1 ? 's' : ''}</p>
    </div>
  )
}
