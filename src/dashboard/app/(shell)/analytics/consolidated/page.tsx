'use client'

import { useEffect, useState } from 'react'
import { RefreshCw, DollarSign, TrendingUp, Package, Users, FileText, Truck } from 'lucide-react'

interface ConsolidatedData {
  revenue_30d: number; orders_30d: number; avg_order: number
  pipeline_value: number; active_leads: number; close_rate: number
  total_value: number; low_stock: number; skus: number
  receivables: number; payables: number; overdue: number
  cfdi_count: number; cfdi_total: number
  active_shipments: number
}

function fmt(n: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n)
}

export default function ConsolidatedPage() {
  const [data, setData] = useState<ConsolidatedData | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  async function load() {
    setLoading(true)
    try {
      const [dash, sales, crm, recv, pay, inv, ship, cfdi] = await Promise.allSettled([
        fetch('/api/dashboard/stats').then(r => r.json()),
        fetch('/api/analytics/sales?days=30').then(r => r.json()),
        fetch('/api/crm/stats').then(r => r.json()),
        fetch('/api/erp/finance/receivables').then(r => r.json()),
        fetch('/api/erp/finance/payables').then(r => r.json()),
        fetch('/api/analytics/inventory').then(r => r.json()),
        fetch('/api/erp/logistics/shipping').then(r => r.json()),
        fetch('/api/erp/cfdi/billing').then(r => r.json()),
      ])

      const d = (dash as PromiseFulfilledResult<{ revenue_30d?: number; orders_30d?: number; avg_lead_score?: number }>).status === 'fulfilled' ? (dash as PromiseFulfilledResult<{ revenue_30d?: number; orders_30d?: number; avg_lead_score?: number }>).value : {}
      const s = (sales as PromiseFulfilledResult<{ stats?: { total_revenue?: number; total_orders?: number; avg_order?: number } }>).status === 'fulfilled' ? (sales as PromiseFulfilledResult<{ stats?: { total_revenue?: number; total_orders?: number; avg_order?: number } }>).value.stats ?? {} : {}
      const c = (crm as PromiseFulfilledResult<{ pipeline_value?: number; active_leads?: number; close_rate?: number }>).status === 'fulfilled' ? (crm as PromiseFulfilledResult<{ pipeline_value?: number; active_leads?: number; close_rate?: number }>).value : {}
      const r = (recv as PromiseFulfilledResult<{ stats?: { total_receivables?: number; overdue_amount?: number } }>).status === 'fulfilled' ? (recv as PromiseFulfilledResult<{ stats?: { total_receivables?: number; overdue_amount?: number } }>).value.stats ?? {} : {}
      const p = (pay as PromiseFulfilledResult<{ stats?: { total_payables?: number } }>).status === 'fulfilled' ? (pay as PromiseFulfilledResult<{ stats?: { total_payables?: number } }>).value.stats ?? {} : {}
      const i = (inv as PromiseFulfilledResult<{ stats?: { total_value?: number; total_skus?: number; low_stock_count?: number } }>).status === 'fulfilled' ? (inv as PromiseFulfilledResult<{ stats?: { total_value?: number; total_skus?: number; low_stock_count?: number } }>).value.stats ?? {} : {}
      const sh = (ship as PromiseFulfilledResult<{ stats?: { active?: number } }>).status === 'fulfilled' ? (ship as PromiseFulfilledResult<{ stats?: { active?: number } }>).value.stats ?? {} : {}
      const cf = (cfdi as PromiseFulfilledResult<{ stats?: { total_invoiced?: number; total?: number } }>).status === 'fulfilled' ? (cfdi as PromiseFulfilledResult<{ stats?: { total_invoiced?: number; total?: number } }>).value.stats ?? {} : {}

      setData({
        revenue_30d: (s as { total_revenue?: number }).total_revenue ?? (d as { revenue_30d?: number }).revenue_30d ?? 0,
        orders_30d: (s as { total_orders?: number }).total_orders ?? (d as { orders_30d?: number }).orders_30d ?? 0,
        avg_order: (s as { avg_order?: number }).avg_order ?? 0,
        pipeline_value: (c as { pipeline_value?: number }).pipeline_value ?? 0,
        active_leads: (c as { active_leads?: number }).active_leads ?? 0,
        close_rate: (c as { close_rate?: number }).close_rate ?? 0,
        total_value: (i as { total_value?: number }).total_value ?? 0,
        low_stock: (i as { low_stock_count?: number }).low_stock_count ?? 0,
        skus: (i as { total_skus?: number }).total_skus ?? 0,
        receivables: (r as { total_receivables?: number }).total_receivables ?? 0,
        payables: (p as { total_payables?: number }).total_payables ?? 0,
        overdue: (r as { overdue_amount?: number }).overdue_amount ?? 0,
        cfdi_count: (cf as { total?: number }).total ?? 0,
        cfdi_total: (cf as { total_invoiced?: number }).total_invoiced ?? 0,
        active_shipments: (sh as { active?: number }).active ?? 0,
      })
      setLastUpdated(new Date())
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const sections = data ? [
    { title: 'Ventas (30d)', icon: DollarSign, color: 'text-green-700', metrics: [
      { label: 'Revenue', value: fmt(data.revenue_30d) },
      { label: 'Pedidos', value: data.orders_30d },
      { label: 'Ticket prom.', value: fmt(data.avg_order) },
    ]},
    { title: 'CRM', icon: Users, color: 'text-blue-700', metrics: [
      { label: 'Pipeline', value: fmt(data.pipeline_value) },
      { label: 'Leads activos', value: data.active_leads },
      { label: 'Tasa cierre', value: `${data.close_rate}%` },
    ]},
    { title: 'Inventario', icon: Package, color: 'text-orange-700', metrics: [
      { label: 'Valor', value: fmt(data.total_value) },
      { label: 'SKUs', value: data.skus },
      { label: 'Bajo stock', value: data.low_stock },
    ]},
    { title: 'Finanzas', icon: TrendingUp, color: 'text-purple-700', metrics: [
      { label: 'Por cobrar', value: fmt(data.receivables) },
      { label: 'Por pagar', value: fmt(data.payables) },
      { label: 'Vencido', value: fmt(data.overdue) },
    ]},
    { title: 'CFDI', icon: FileText, color: 'text-indigo-700', metrics: [
      { label: 'Facturas', value: data.cfdi_count },
      { label: 'Facturado', value: fmt(data.cfdi_total) },
    ]},
    { title: 'Logística', icon: Truck, color: 'text-cyan-700', metrics: [
      { label: 'Envíos activos', value: data.active_shipments },
    ]},
  ] : []

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vista Consolidada</h1>
          <p className="text-sm text-gray-500 mt-1">
            {lastUpdated ? `Actualizado ${lastUpdated.toLocaleTimeString('es-MX')}` : 'Cargando datos de todos los módulos...'}
          </p>
        </div>
        <button onClick={load} disabled={loading} className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {loading ? Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl p-5 animate-pulse h-36 border border-gray-100" />
        )) : sections.map(sec => {
          const Icon = sec.icon
          return (
            <div key={sec.title} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center gap-2 mb-4">
                <Icon className={`w-4 h-4 ${sec.color}`} />
                <h3 className="font-semibold text-gray-900">{sec.title}</h3>
              </div>
              <div className="space-y-2">
                {sec.metrics.map(m => (
                  <div key={m.label} className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">{m.label}</span>
                    <span className={`font-bold text-sm ${sec.color}`}>{m.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
