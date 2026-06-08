'use client'

import { useEffect, useState } from 'react'
import { FileText, ArrowUpRight, ArrowDownLeft } from 'lucide-react'

interface JournalEntry {
  id: string
  date: string
  type: string
  type_label: string
  description: string
  reference: string | null
  debit: number
  credit: number
  account: string
}

function fmt(n: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n)
}

const typeColors: Record<string, string> = {
  order: 'bg-blue-50 text-blue-700',
  cfdi: 'bg-green-50 text-green-700',
  inventory: 'bg-orange-50 text-orange-700',
  purchase: 'bg-purple-50 text-purple-700',
}

export default function JournalPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [filter, setFilter] = useState<string>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/erp/accounting/journal')
      .then(r => r.json())
      .then(d => setEntries(d.entries ?? []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const types = ['all', ...Array.from(new Set(entries.map(e => e.type)))]
  const filtered = filter === 'all' ? entries : entries.filter(e => e.type === filter)
  const totalDebit = filtered.reduce((s, e) => s + e.debit, 0)
  const totalCredit = filtered.reduce((s, e) => s + e.credit, 0)

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Libro Diario</h1>
          <p className="text-sm text-gray-500 mt-1">Registro cronológico de transacciones contables</p>
        </div>
        <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">ERP · Contabilidad</span>
      </div>

      {/* Totals */}
      {!loading && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ArrowDownLeft className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Débitos</p>
              <p className="text-xl font-bold text-blue-700">{fmt(totalDebit)}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <ArrowUpRight className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Créditos</p>
              <p className="text-xl font-bold text-green-700">{fmt(totalCredit)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {types.map(t => (
          <button key={t} onClick={() => setFilter(t)} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${filter === t ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {t === 'all' ? 'Todos' : t === 'order' ? 'Pedidos' : t === 'cfdi' ? 'CFDI' : t === 'inventory' ? 'Inventario' : t === 'purchase' ? 'Compras' : t}
            {t !== 'all' && ` (${entries.filter(e => e.type === t).length})`}
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
            <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Sin asientos contables</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Fecha</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Descripción</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Tipo</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Cuenta</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">Débito</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">Crédito</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(entry => (
                <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-gray-500 text-xs">{new Date(entry.date).toLocaleDateString('es-MX')}</td>
                  <td className="px-4 py-3 font-medium text-gray-900 max-w-xs truncate">{entry.description}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeColors[entry.type] ?? 'bg-gray-100 text-gray-500'}`}>
                      {entry.type_label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{entry.account}</td>
                  <td className="px-4 py-3 text-right font-medium text-blue-700">{entry.debit > 0 ? fmt(entry.debit) : '—'}</td>
                  <td className="px-4 py-3 text-right font-medium text-green-700">{entry.credit > 0 ? fmt(entry.credit) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
