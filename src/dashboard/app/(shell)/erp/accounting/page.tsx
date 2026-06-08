'use client'

import { useEffect, useState } from 'react'
import { BookOpen, TrendingUp, TrendingDown, Scale, FileText } from 'lucide-react'
import Link from 'next/link'

interface AccountingSummary {
  total_assets: number
  total_liabilities: number
  total_income: number
  total_expenses: number
  net_income: number
}

function fmt(n: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n)
}

export default function AccountingPage() {
  const [summary, setSummary] = useState<AccountingSummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/erp/accounting/chart')
      .then(r => r.json())
      .then(d => setSummary(d.summary ?? null))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const modules = [
    { title: 'Catálogo de Cuentas', description: 'Plan contable del tenant con saldos por tipo', href: '/erp/accounting/chart', icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'Libro Diario', description: 'Registro cronológico de asientos contables', href: '/erp/accounting/journal', icon: FileText, color: 'text-purple-600', bg: 'bg-purple-50' },
    { title: 'Reportes', description: 'Estados financieros y reportes de periodo', href: '/erp/accounting/reports', icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
  ]

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contabilidad</h1>
          <p className="text-sm text-gray-500 mt-1">Registro contable, catálogos y estados financieros</p>
        </div>
        <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">ERP · Contabilidad</span>
      </div>

      {/* Financial position */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-4 animate-pulse h-20 border border-gray-100" />
          ))}
        </div>
      ) : summary && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: 'Activos', value: summary.total_assets, color: 'text-blue-700', icon: <Scale className="w-4 h-4 text-blue-400" /> },
            { label: 'Pasivos', value: summary.total_liabilities, color: 'text-red-600', icon: <TrendingDown className="w-4 h-4 text-red-400" /> },
            { label: 'Ingresos', value: summary.total_income, color: 'text-green-700', icon: <TrendingUp className="w-4 h-4 text-green-400" /> },
            { label: 'Gastos', value: summary.total_expenses, color: 'text-orange-600', icon: <TrendingDown className="w-4 h-4 text-orange-400" /> },
            { label: 'Utilidad Neta', value: summary.net_income, color: summary.net_income >= 0 ? 'text-green-700' : 'text-red-600', icon: <Scale className="w-4 h-4 text-gray-400" /> },
          ].map(card => (
            <div key={card.label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-1.5 mb-1">
                {card.icon}
                <span className="text-xs text-gray-500">{card.label}</span>
              </div>
              <p className={`text-lg font-bold ${card.color}`}>{fmt(card.value)}</p>
            </div>
          ))}
        </div>
      )}

      {/* Sub-modules */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {modules.map(mod => {
          const Icon = mod.icon
          return (
            <Link key={mod.href} href={mod.href} className="group bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:border-green-200 hover:shadow-md transition-all">
              <div className={`inline-flex p-3 rounded-xl ${mod.bg} mb-4`}>
                <Icon className={`w-6 h-6 ${mod.color}`} />
              </div>
              <h2 className="font-semibold text-gray-900 group-hover:text-green-700 transition-colors mb-1">{mod.title}</h2>
              <p className="text-sm text-gray-500">{mod.description}</p>
              <p className="text-xs text-green-600 mt-3 font-medium">Ir al módulo →</p>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
