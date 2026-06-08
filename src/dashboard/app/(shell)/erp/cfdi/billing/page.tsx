'use client'

import { useEffect, useState } from 'react'
import { FileText, CheckCircle, AlertCircle, Clock, Download } from 'lucide-react'

interface CFDIRecord {
  id: string
  folio: string
  series: string | null
  uuid: string | null
  receptor_name: string
  receptor_rfc: string
  total: number
  status: 'valid' | 'cancelled' | 'pending'
  type: string
  issued_at: string
  xml_url: string | null
  pdf_url: string | null
}

interface Stats {
  total: number
  valid: number
  cancelled: number
  pending: number
  total_invoiced: number
}

function fmt(n: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n)
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'Hoy'
  if (days === 1) return 'Ayer'
  return `Hace ${days}d`
}

const statusConfig = {
  valid: { label: 'Vigente', color: 'bg-green-100 text-green-700', icon: <CheckCircle className="w-3.5 h-3.5" /> },
  cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-700', icon: <AlertCircle className="w-3.5 h-3.5" /> },
  pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-700', icon: <Clock className="w-3.5 h-3.5" /> },
}

export default function CFDIBillingPage() {
  const [invoices, setInvoices] = useState<CFDIRecord[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [filter, setFilter] = useState<'all' | 'valid' | 'cancelled' | 'pending'>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/erp/cfdi/billing')
      .then(r => r.json())
      .then(d => {
        setInvoices(d.invoices ?? [])
        setStats(d.stats ?? null)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const filtered = filter === 'all' ? invoices : invoices.filter(i => i.status === filter)

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Facturación CFDI</h1>
          <p className="text-sm text-gray-500 mt-1">Comprobantes fiscales digitales timbrados ante el SAT</p>
        </div>
        <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">Agente #13 · ERP</span>
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
            <div className="flex items-center gap-2 mb-2"><FileText className="w-4 h-4 text-gray-400" /><span className="text-xs text-gray-500">Total CFDIs</span></div>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-2"><CheckCircle className="w-4 h-4 text-green-500" /><span className="text-xs text-gray-500">Vigentes</span></div>
            <p className="text-2xl font-bold text-green-700">{stats.valid}</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-2"><AlertCircle className="w-4 h-4 text-red-500" /><span className="text-xs text-gray-500">Cancelados</span></div>
            <p className="text-2xl font-bold text-red-600">{stats.cancelled}</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-2"><FileText className="w-4 h-4 text-blue-500" /><span className="text-xs text-gray-500">Facturado total</span></div>
            <p className="text-xl font-bold text-blue-700">{fmt(stats.total_invoiced)}</p>
          </div>
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        {(['all', 'valid', 'cancelled', 'pending'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${filter === f ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {f === 'all' ? 'Todos' : statusConfig[f]?.label}
            {f !== 'all' && !loading && <span className="ml-1 opacity-70">({invoices.filter(i => i.status === f).length})</span>}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-14 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Sin CFDIs en esta categoría</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Folio</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Receptor</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">RFC</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">UUID</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">Total</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Estado</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Fecha</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Descarga</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(inv => {
                const sc = statusConfig[inv.status]
                return (
                  <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs font-bold text-gray-700">{inv.series ? `${inv.series}-` : ''}{inv.folio}</td>
                    <td className="px-4 py-3 font-medium text-gray-900 max-w-xs truncate">{inv.receptor_name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{inv.receptor_rfc}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-400 max-w-xs truncate">{inv.uuid ? inv.uuid.slice(0, 8) + '...' : '—'}</td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900">{fmt(inv.total)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${sc?.color}`}>
                        {sc?.icon}
                        {sc?.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{relativeTime(inv.issued_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {inv.pdf_url && (
                          <a href={inv.pdf_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-green-600 hover:text-green-800">
                            <Download className="w-3 h-3" />PDF
                          </a>
                        )}
                        {inv.xml_url && (
                          <a href={inv.xml_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800">
                            <Download className="w-3 h-3" />XML
                          </a>
                        )}
                        {!inv.pdf_url && !inv.xml_url && <span className="text-gray-300 text-xs">—</span>}
                      </div>
                    </td>
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
