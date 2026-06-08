'use client'

import { useEffect, useState } from 'react'
import { DollarSign, ShoppingCart, Users, Package, FileText, Headphones, TrendingUp, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

interface DashboardStats {
  revenue_30d: number
  orders_30d: number
  orders_7d: number
  active_leads: number
  pipeline_value: number
  cfdi_total_30d: number
  cfdi_count_30d: number
  low_stock_alerts: number
  open_tickets: number
  avg_lead_score: number
}

function fmt(n: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n)
}

const quickActions = [
  { label: 'Ver Leads', href: '/crm/leads', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
  { label: 'Pipeline', href: '/crm/pipeline', icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
  { label: 'Por Cobrar', href: '/erp/finance/receivables', icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50' },
  { label: 'Inventario', href: '/erp/inventory/warehouses', icon: Package, color: 'text-orange-600', bg: 'bg-orange-50' },
  { label: 'Facturación', href: '/erp/cfdi/billing', icon: FileText, color: 'text-purple-600', bg: 'bg-purple-50' },
  { label: 'Soporte', href: '/crm/support/tickets', icon: Headphones, color: 'text-cyan-600', bg: 'bg-cyan-50' },
]

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard/stats')
      .then(r => r.json())
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const kpis = stats ? [
    { label: 'Ventas 30 días', value: fmt(stats.revenue_30d), sub: `${stats.orders_30d} pedidos`, icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Pipeline CRM', value: fmt(stats.pipeline_value), sub: `${stats.active_leads} leads activos`, icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'CFDI 30 días', value: fmt(stats.cfdi_total_30d), sub: `${stats.cfdi_count_30d} facturas`, icon: FileText, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Alertas', value: String(stats.low_stock_alerts + stats.open_tickets), sub: `${stats.low_stock_alerts} bajo stock · ${stats.open_tickets} tickets`, icon: AlertTriangle, color: stats.low_stock_alerts + stats.open_tickets > 0 ? 'text-red-600' : 'text-gray-400', bg: stats.low_stock_alerts + stats.open_tickets > 0 ? 'bg-red-50' : 'bg-gray-50' },
  ] : []

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Panel Principal</h1>
        <p className="text-sm text-gray-500 mt-1">Resumen ejecutivo de tu operación</p>
      </div>

      {/* KPI cards */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-5 animate-pulse h-28 border border-gray-100" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {kpis.map(kpi => {
            const Icon = kpi.icon
            return (
              <div key={kpi.label} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-3">
                  <div className={`p-1.5 rounded-lg ${kpi.bg}`}>
                    <Icon className={`w-4 h-4 ${kpi.color}`} />
                  </div>
                  <span className="text-xs text-gray-500">{kpi.label}</span>
                </div>
                <p className={`text-xl font-bold ${kpi.color}`}>{kpi.value}</p>
                <p className="text-xs text-gray-400 mt-1">{kpi.sub}</p>
              </div>
            )
          })}
        </div>
      )}

      {/* Metrics row */}
      {!loading && stats && (
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {[
            { label: 'Pedidos (7d)', value: stats.orders_7d },
            { label: 'Score promedio', value: stats.avg_lead_score },
            { label: 'Leads activos', value: stats.active_leads },
            { label: 'Bajo stock', value: stats.low_stock_alerts, alert: stats.low_stock_alerts > 0 },
            { label: 'Tickets abiertos', value: stats.open_tickets, alert: stats.open_tickets > 0 },
            { label: 'Facturas (30d)', value: stats.cfdi_count_30d },
          ].map(m => (
            <div key={m.label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
              <p className={`text-2xl font-bold ${(m as { alert?: boolean }).alert ? 'text-red-600' : 'text-gray-900'}`}>{m.value}</p>
              <p className="text-xs text-gray-400 mt-1">{m.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Quick actions */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Acceso rápido</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          {quickActions.map(action => {
            const Icon = action.icon
            return (
              <Link key={action.href} href={action.href} className="group bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:border-green-200 hover:shadow-md transition-all text-center">
                <div className={`inline-flex p-2.5 rounded-xl ${action.bg} mb-3`}>
                  <Icon className={`w-5 h-5 ${action.color}`} />
                </div>
                <p className="text-xs font-medium text-gray-700 group-hover:text-green-700 transition-colors">{action.label}</p>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Modules overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            title: 'E-commerce', href: '/ecommerce', desc: 'Pedidos, productos y marketplaces',
            links: [{ label: 'Pedidos', href: '/ecommerce/orders' }, { label: 'Catálogo', href: '/ecommerce/catalog' }, { label: 'Precios', href: '/ecommerce/prices' }],
          },
          {
            title: 'CRM', href: '/crm', desc: 'Leads, pipeline y comunicación',
            links: [{ label: 'Pipeline', href: '/crm/pipeline' }, { label: 'Oportunidades', href: '/crm/sales/opportunities' }, { label: 'Inbox', href: '/crm/inbox' }],
          },
          {
            title: 'ERP', href: '/erp', desc: 'Finanzas, inventario y logística',
            links: [{ label: 'Por Cobrar', href: '/erp/finance/receivables' }, { label: 'Inventario', href: '/erp/inventory/warehouses' }, { label: 'Logística', href: '/erp/logistics/shipping' }],
          },
        ].map(mod => (
          <div key={mod.title} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">{mod.title}</h3>
              <Link href={mod.href} className="text-xs text-green-600 hover:text-green-800 font-medium">Ver todo →</Link>
            </div>
            <p className="text-xs text-gray-400 mb-3">{mod.desc}</p>
            <div className="space-y-1.5">
              {mod.links.map(link => (
                <Link key={link.href} href={link.href} className="block text-sm text-gray-600 hover:text-green-700 hover:pl-1 transition-all py-0.5">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
