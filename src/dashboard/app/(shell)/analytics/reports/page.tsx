'use client'

import { useState } from 'react'
import { FileText, Download, BarChart3 } from 'lucide-react'

const reports = [
  { id: 'sales_monthly', title: 'Reporte de Ventas Mensual', description: 'Revenue, pedidos y canales del mes', category: 'ventas', api: '/api/analytics/sales?days=30' },
  { id: 'sales_quarterly', title: 'Reporte de Ventas Trimestral', description: 'Análisis de 90 días con tendencias', category: 'ventas', api: '/api/analytics/sales?days=90' },
  { id: 'crm_pipeline', title: 'Pipeline CRM', description: 'Estado actual del pipeline de ventas', category: 'crm', api: '/api/crm/stats' },
  { id: 'crm_deals', title: 'Deals Cerrados', description: 'Revenue y deals ganados del periodo', category: 'crm', api: '/api/crm/deals' },
  { id: 'inventory_status', title: 'Valuación de Inventario', description: 'Costo, valor y margen por SKU', category: 'inventario', api: '/api/erp/inventory/valuation' },
  { id: 'inventory_movements', title: 'Movimientos de Inventario', description: 'Entradas, salidas y ajustes (30d)', category: 'inventario', api: '/api/erp/inventory/movements' },
  { id: 'finance_receivables', title: 'Cuentas por Cobrar', description: 'Facturas pendientes y vencidas', category: 'finanzas', api: '/api/erp/finance/receivables' },
  { id: 'finance_payables', title: 'Cuentas por Pagar', description: 'OC pendientes con proveedores', category: 'finanzas', api: '/api/erp/finance/payables' },
  { id: 'cfdi_billing', title: 'Historial CFDI', description: 'Todos los comprobantes fiscales', category: 'fiscal', api: '/api/erp/cfdi/billing' },
  { id: 'cfdi_compliance', title: 'Reporte de Cumplimiento SAT', description: 'Verificación de requisitos CFDI 4.0', category: 'fiscal', api: '/api/erp/cfdi/compliance' },
  { id: 'suppliers', title: 'Evaluación de Proveedores', description: 'Score y desempeño por proveedor', category: 'compras', api: '/api/erp/purchases/suppliers' },
  { id: 'shipping', title: 'Envíos y Guías', description: 'Historial de etiquetas Skydropx', category: 'logística', api: '/api/erp/logistics/shipping' },
]

const categories = ['todos', 'ventas', 'crm', 'inventario', 'finanzas', 'fiscal', 'compras', 'logística']

const categoryColors: Record<string, string> = {
  ventas: 'bg-green-100 text-green-700',
  crm: 'bg-blue-100 text-blue-700',
  inventario: 'bg-orange-100 text-orange-700',
  finanzas: 'bg-purple-100 text-purple-700',
  fiscal: 'bg-indigo-100 text-indigo-700',
  compras: 'bg-yellow-100 text-yellow-700',
  'logística': 'bg-cyan-100 text-cyan-700',
}

export default function ReportsPage() {
  const [filter, setFilter] = useState('todos')
  const [downloading, setDownloading] = useState<string | null>(null)

  const filtered = filter === 'todos' ? reports : reports.filter(r => r.category === filter)

  async function downloadJSON(report: typeof reports[0]) {
    setDownloading(report.id)
    try {
      const res = await fetch(report.api)
      const data = await res.json()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `kinexis_${report.id}_${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error(e)
    } finally {
      setDownloading(null)
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reportes</h1>
          <p className="text-sm text-gray-500 mt-1">Exporta datos en tiempo real de todos los módulos</p>
        </div>
        <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">Analytics</span>
      </div>

      {/* Category filters */}
      <div className="flex gap-2 flex-wrap">
        {categories.map(c => (
          <button key={c} onClick={() => setFilter(c)} className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-colors ${filter === c ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {c}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(report => (
          <div key={report.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex flex-col">
            <div className="flex items-start justify-between mb-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <BarChart3 className="w-4 h-4 text-gray-500" />
              </div>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${categoryColors[report.category] ?? 'bg-gray-100 text-gray-500'}`}>
                {report.category}
              </span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">{report.title}</h3>
            <p className="text-sm text-gray-500 flex-1">{report.description}</p>
            <button
              onClick={() => downloadJSON(report)}
              disabled={downloading === report.id}
              className="mt-4 flex items-center justify-center gap-2 w-full py-2 border border-green-200 text-green-700 hover:bg-green-50 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {downloading === report.id ? 'Descargando...' : 'Exportar JSON'}
            </button>
          </div>
        ))}
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700">
        <div className="flex items-center gap-2 font-semibold mb-1">
          <FileText className="w-4 h-4" />
          Próximamente: Exportación en Excel y PDF
        </div>
        <p className="text-xs text-blue-600">Los reportes se exportan actualmente en formato JSON. La integración con Excel/CSV estará disponible en la siguiente actualización.</p>
      </div>
    </div>
  )
}
