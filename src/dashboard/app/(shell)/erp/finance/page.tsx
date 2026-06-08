'use client'

import { useState, useEffect } from 'react'
import { DollarSign, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react'
import Link from 'next/link'

interface FinanceSummary {
  inflows_30d: number
  outflows_30d: number
  net_30d: number
  overdue_receivables?: number
  pending_payables?: number
}

function fmt(n: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n)
}

const MODULES = [
  { label: 'Cuentas por cobrar', href: '/erp/finance/receivables', icon: TrendingUp, desc: 'Facturas pendientes de pago' },
  { label: 'Cuentas por pagar', href: '/erp/finance/payables', icon: TrendingDown, desc: 'OC y gastos por liquidar' },
  { label: 'Flujo de caja', href: '/erp/finance/cashflow', icon: DollarSign, desc: 'Agente #17 · Proyección tesorería' },
  { label: 'Cuentas bancarias', href: '/erp/finance/banking', icon: AlertCircle, desc: 'Conciliación bancaria' },
]

export default function FinancePage() {
  const [summary, setSummary] = useState<FinanceSummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/erp/finance/cashflow')
      .then(r => r.json())
      .then(data => setSummary({
        inflows_30d: data.inflows_30d,
        outflows_30d: data.outflows_30d,
        net_30d: data.net_30d,
      }))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Finanzas</h1>
        <p className="text-sm text-gray-500 mt-1">Visión financiera unificada — cobros, pagos y tesorería</p>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-3 gap-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
          ))
        ) : summary && (
          <>
            <div className="bg-white rounded-xl shadow-sm border border-green-100 p-4">
              <p className="text-xs text-gray-500 mb-1">Entradas 30d</p>
              <p className="text-xl font-bold text-green-600">{fmt(summary.inflows_30d)}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-red-100 p-4">
              <p className="text-xs text-gray-500 mb-1">Salidas 30d</p>
              <p className="text-xl font-bold text-red-500">{fmt(summary.outflows_30d)}</p>
            </div>
            <div className={`bg-white rounded-xl shadow-sm border p-4 ${summary.net_30d >= 0 ? 'border-green-200' : 'border-red-200'}`}>
              <p className="text-xs text-gray-500 mb-1">Neto 30d</p>
              <p className={`text-xl font-bold ${summary.net_30d >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                {fmt(summary.net_30d)}
              </p>
            </div>
          </>
        )}
      </div>

      {/* Module links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {MODULES.map(mod => {
          const Icon = mod.icon
          return (
            <Link key={mod.href} href={mod.href} className="group bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:border-green-200 hover:shadow-md transition-all">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2.5 bg-green-50 rounded-xl">
                  <Icon className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-green-700 transition-colors">{mod.label}</h3>
                  <p className="text-xs text-gray-400">{mod.desc}</p>
                </div>
              </div>
              <p className="text-xs text-green-600 font-medium ml-[52px]">Ver detalle →</p>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
