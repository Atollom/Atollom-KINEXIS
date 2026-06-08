'use client'

import Link from 'next/link'
import { BarChart2, Users, TrendingUp, Star, Bell, FileText } from 'lucide-react'

const REPORTS = [
  {
    title: 'Reporte de pipeline',
    desc: 'Leads por etapa, tasa de cierre y valor del pipeline',
    href: '/crm/page',
    icon: TrendingUp,
    category: 'Ventas',
    bg: 'bg-green-50',
    color: 'text-green-600',
  },
  {
    title: 'Análisis de clientes',
    desc: 'Segmentación, fuente de leads y comportamiento de compra',
    href: '/analytics/customers',
    icon: Users,
    category: 'Clientes',
    bg: 'bg-blue-50',
    color: 'text-blue-600',
  },
  {
    title: 'Deals y oportunidades',
    desc: 'Negocios ganados, valor y velocidad de cierre',
    href: '/crm/sales/deals',
    icon: BarChart2,
    category: 'Ventas',
    bg: 'bg-purple-50',
    color: 'text-purple-600',
  },
  {
    title: 'NPS y satisfacción',
    desc: 'Score de promotores, detractores y tendencia temporal',
    href: '/crm/support/nps',
    icon: Star,
    category: 'Soporte',
    bg: 'bg-yellow-50',
    color: 'text-yellow-600',
  },
  {
    title: 'Follow-ups pendientes',
    desc: 'Leads sin contacto, tiempo de respuesta promedio',
    href: '/crm/sales/follow-ups',
    icon: Bell,
    category: 'Ventas',
    bg: 'bg-orange-50',
    color: 'text-orange-600',
  },
  {
    title: 'Cotizaciones enviadas',
    desc: 'Tasa de aceptación, valor promedio y tiempos',
    href: '/crm/sales/quotes',
    icon: FileText,
    category: 'Ventas',
    bg: 'bg-pink-50',
    color: 'text-pink-600',
  },
  {
    title: 'Reporte consolidado',
    desc: 'Vista unificada de todas las métricas del negocio',
    href: '/analytics/consolidated',
    icon: BarChart2,
    category: 'General',
    bg: 'bg-gray-50',
    color: 'text-gray-600',
  },
  {
    title: 'Exportar datos CRM',
    desc: 'Descarga leads, cotizaciones y tickets en CSV/JSON',
    href: '/analytics/export',
    icon: FileText,
    category: 'Exportar',
    bg: 'bg-teal-50',
    color: 'text-teal-600',
  },
]

const CATEGORIES = ['Todos', 'Ventas', 'Clientes', 'Soporte', 'General', 'Exportar']

export default function CrmReportsPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reportes CRM</h1>
        <p className="text-sm text-gray-500 mt-1">Análisis y métricas de ventas, clientes y soporte</p>
      </div>

      {/* Category chips */}
      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map(cat => (
          <span key={cat} className="px-3 py-1.5 bg-gray-100 text-gray-600 text-sm font-medium rounded-lg">
            {cat}
          </span>
        ))}
      </div>

      {/* Report cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {REPORTS.map(report => {
          const Icon = report.icon
          return (
            <Link key={report.href} href={report.href} className="group bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:border-green-200 hover:shadow-md transition-all">
              <div className="flex items-start gap-3 mb-3">
                <div className={`p-2.5 rounded-xl ${report.bg}`}>
                  <Icon className={`w-5 h-5 ${report.color}`} />
                </div>
                <div className="flex-1">
                  <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">{report.category}</span>
                  <h3 className="font-semibold text-gray-900 group-hover:text-green-700 transition-colors leading-tight mt-0.5">{report.title}</h3>
                </div>
              </div>
              <p className="text-sm text-gray-500 ml-[52px]">{report.desc}</p>
              <p className="text-xs text-green-600 font-medium ml-[52px] mt-2">Ver reporte →</p>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
