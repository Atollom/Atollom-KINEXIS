'use client'

import { useState } from 'react'
import { Download, FileJson, CheckCircle } from 'lucide-react'

const exportOptions = [
  { id: 'leads', label: 'Leads CRM', api: '/api/crm/leads', description: 'Todos los leads con score y etapa' },
  { id: 'deals', label: 'Deals cerrados', api: '/api/crm/deals', description: 'Revenue y clientes ganados' },
  { id: 'tickets', label: 'Tickets de soporte', api: '/api/crm/tickets', description: 'Historial de casos' },
  { id: 'inventory', label: 'Valuación inventario', api: '/api/erp/inventory/valuation', description: 'Costo y valor por SKU' },
  { id: 'movements', label: 'Movimientos inventario', api: '/api/erp/inventory/movements', description: 'Entradas, salidas y ajustes' },
  { id: 'suppliers', label: 'Proveedores', api: '/api/erp/purchases/suppliers', description: 'Evaluación y compras por proveedor' },
  { id: 'receivables', label: 'Por cobrar', api: '/api/erp/finance/receivables', description: 'Facturas pendientes y vencidas' },
  { id: 'payables', label: 'Por pagar', api: '/api/erp/finance/payables', description: 'OC pendientes con proveedores' },
  { id: 'cfdi', label: 'CFDIs', api: '/api/erp/cfdi/billing', description: 'Comprobantes fiscales timbrados' },
  { id: 'shipping', label: 'Envíos', api: '/api/erp/logistics/shipping', description: 'Guías Skydropx generadas' },
  { id: 'chart', label: 'Catálogo contable', api: '/api/erp/accounting/chart', description: 'Plan de cuentas con saldos' },
  { id: 'journal', label: 'Libro diario', api: '/api/erp/accounting/journal', description: 'Asientos contables' },
]

export default function ExportPage() {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [downloading, setDownloading] = useState(false)
  const [done, setDone] = useState<Set<string>>(new Set())

  function toggle(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function exportSelected() {
    if (selected.size === 0) return
    setDownloading(true)
    const newDone = new Set<string>()

    for (const id of selected) {
      const opt = exportOptions.find(o => o.id === id)
      if (!opt) continue
      try {
        const res = await fetch(opt.api)
        const data = await res.json()
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `kinexis_${id}_${new Date().toISOString().slice(0, 10)}.json`
        a.click()
        URL.revokeObjectURL(url)
        newDone.add(id)
      } catch (e) {
        console.error(e)
      }
    }
    setDone(newDone)
    setDownloading(false)
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Exportar Datos</h1>
          <p className="text-sm text-gray-500 mt-1">Selecciona los módulos a exportar en JSON</p>
        </div>
        <button
          onClick={exportSelected}
          disabled={selected.size === 0 || downloading}
          className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          {downloading ? 'Exportando...' : `Exportar (${selected.size})`}
        </button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <button onClick={() => setSelected(new Set(exportOptions.map(o => o.id)))} className="text-sm text-green-600 hover:text-green-800 font-medium">Seleccionar todos</button>
        <span className="text-gray-300">|</span>
        <button onClick={() => setSelected(new Set())} className="text-sm text-gray-500 hover:text-gray-700 font-medium">Limpiar</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {exportOptions.map(opt => {
          const isSelected = selected.has(opt.id)
          const isDone = done.has(opt.id)
          return (
            <button
              key={opt.id}
              onClick={() => toggle(opt.id)}
              className={`text-left p-4 rounded-xl border-2 transition-all ${
                isSelected ? 'border-green-500 bg-green-50' : 'border-gray-100 bg-white hover:border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  {isDone ? <CheckCircle className="w-4 h-4 text-green-500" /> : <FileJson className="w-4 h-4 text-gray-400" />}
                  <span className={`font-medium text-sm ${isSelected ? 'text-green-800' : 'text-gray-900'}`}>{opt.label}</span>
                </div>
                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}>
                  {isSelected && <span className="text-white text-xs">✓</span>}
                </div>
              </div>
              <p className={`text-xs ${isSelected ? 'text-green-700' : 'text-gray-500'}`}>{opt.description}</p>
            </button>
          )
        })}
      </div>
    </div>
  )
}
