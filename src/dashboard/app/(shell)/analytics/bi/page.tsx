'use client'

import { useEffect, useState } from 'react'
import { BarChart3, DollarSign, Users, Package, TrendingUp } from 'lucide-react'
import Link from 'next/link'

interface BIData {
  revenue_30d: number
  active_leads: number
  pipeline_value: number
  low_stock: number
  open_tickets: number
  total_skus: number
  total_value: number
  total_orders: number
  avg_order: number
}

function fmt(n: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n)
}

export default function BIPage() {
  const [data, setData] = useState<BIData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.allSettled([
      fetch('/api/dashboard/stats').then(r => r.json()),
      fetch('/api/analytics/inventory').then(r => r.json()),
      fetch('/api/analytics/sales?days=30').then(r => r.json()),
    ]).then(([dash, inv, sales]) => {
      const d = dash.status === 'fulfilled' ? dash.value : {}
      const i = inv.status === 'fulfilled' ? inv.value : {}
      const s = sales.status === 'fulfilled' ? sales.value : {}
      setData({
        revenue_30d: d.revenue_30d ?? 0,
        active_leads: d.active_leads ?? 0,
        pipeline_value: d.pipeline_value ?? 0,
        low_stock: d.low_stock_alerts ?? 0,
        open_tickets: d.open_tickets ?? 0,
        total_skus: i.stats?.total_skus ?? 0,
        total_value: i.stats?.total_value ?? 0,
        total_orders: s.stats?.total_orders ?? 0,
        avg_order: s.stats?.avg_order ?? 0,
      })
    }).finally(() => setLoading(false))
  }, [])

  const sections = [
    {
      title: 'Ventas', icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50',
      href: '/analytics/sales',
      metrics: data ? [
        { label: 'Revenue 30d', value: fmt(data.revenue_30d) },
        { label: 'Pedidos', value: data.total_orders },
        { label: 'Ticket promedio', value: fmt(data.avg_order) },
      ] : [],
    },
    {
      title: 'Clientes', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50',
      href: '/analytics/customers',
      metrics: data ? [
        { label: 'Leads activos', value: data.active_leads },
        { label: 'Pipeline', value: fmt(data.pipeline_value) },
        { label: 'Tickets abiertos', value: data.open_tickets },
      ] : [],
    },
    {
      title: 'Inventario', icon: Package, color: 'text-orange-600', bg: 'bg-orange-50',
      href: '/analytics/inventory',
      metrics: data ? [
        { label: 'SKUs activos', value: data.total_skus },
        { label: 'Valor inventario', value: fmt(data.total_value) },
        { label: 'Bajo stock', value: data.low_stock },
      ] : [],
    },
  ]

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Business Intelligence</h1>
          <p className="text-sm text-gray-500 mt-1">Vista consolidada de métricas clave del negocio</p>
        </div>
        <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">Analytics · BI</span>
      </div>

      {/* Navigation cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {sections.map(sec => {
          const Icon = sec.icon
          return (
            <Link key={sec.title} href={sec.href} className="group bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:border-green-200 hover:shadow-md transition-all">
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2.5 rounded-xl ${sec.bg}`}>
                  <Icon className={`w-5 h-5 ${sec.color}`} />
                </div>
                <h2 className="font-semibold text-gray-900 group-hover:text-green-700 transition-colors">{sec.title}</h2>
              </div>
              {loading ? (
                <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-6 bg-gray-100 rounded animate-pulse" />)}</div>
              ) : (
                <div className="space-y-2">
                  {sec.metrics.map(m => (
                    <div key={m.label} className="flex justify-between text-sm">
                      <span className="text-gray-500">{m.label}</span>
                      <span className="font-semibold text-gray-900">{m.value}</span>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-green-600 mt-4 font-medium">Ver detalles →</p>
            </Link>
          )
        })}
      </div>

      {/* Combined quick stats */}
      {!loading && data && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-green-600" />
            <h2 className="font-semibold text-gray-900">Resumen ejecutivo — últimos 30 días</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-700">{fmt(data.revenue_30d)}</p>
              <p className="text-sm text-gray-500 mt-1">Revenue generado</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-700">{data.active_leads}</p>
              <p className="text-sm text-gray-500 mt-1">Leads en pipeline</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-orange-700">{fmt(data.total_value)}</p>
              <p className="text-sm text-gray-500 mt-1">Valor inventario</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-purple-700">{fmt(data.pipeline_value)}</p>
              <p className="text-sm text-gray-500 mt-1">Pipeline CRM</p>
            </div>
          </div>
        </div>
      )}

      {/* Analytics sub-links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Ventas detalladas', href: '/analytics/sales' },
          { label: 'Clientes y leads', href: '/analytics/customers' },
          { label: 'Inventario', href: '/analytics/inventory' },
          { label: 'Consolidado', href: '/analytics/consolidated' },
        ].map(link => (
          <Link key={link.href} href={link.href} className="bg-white rounded-xl p-4 text-sm font-medium text-gray-700 border border-gray-100 hover:border-green-200 hover:text-green-700 transition-all text-center shadow-sm">
            {link.label} →
          </Link>
        ))}
      </div>
    </div>
  )
}
