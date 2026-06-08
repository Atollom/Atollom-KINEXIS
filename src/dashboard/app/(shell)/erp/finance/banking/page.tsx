'use client'

import { Landmark, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react'
import Link from 'next/link'

const ACCOUNTS = [
  { name: 'Cuenta principal operativa', bank: 'BBVA', type: 'Corriente', currency: 'MXN', balance: null, status: 'pending' },
  { name: 'Cuenta de nómina', bank: 'Banorte', type: 'Corriente', currency: 'MXN', balance: null, status: 'pending' },
  { name: 'Cuenta USD', bank: 'HSBC', type: 'Corriente', currency: 'USD', balance: null, status: 'pending' },
]

export default function BankingPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Cuentas Bancarias</h1>
        <p className="text-sm text-gray-500 mt-1">Gestión de cuentas y conciliación bancaria</p>
      </div>

      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
        <div className="flex items-start gap-3">
          <Landmark className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-blue-900">Integración bancaria en configuración</p>
            <p className="text-sm text-blue-700 mt-1">
              La sincronización automática de saldos y movimientos bancarios requiere configurar las credenciales de Open Banking de cada institución.
              Mientras tanto, puedes consultar el flujo de caja calculado a partir de órdenes y compras.
            </p>
            <Link href="/erp/finance/cashflow" className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium mt-2">
              Ver flujo de caja →
            </Link>
          </div>
        </div>
      </div>

      {/* Account cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {ACCOUNTS.map(acc => (
          <div key={acc.name} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 opacity-70">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                <Landmark className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">{acc.name}</h3>
                <p className="text-xs text-gray-400">{acc.bank} · {acc.type} · {acc.currency}</p>
              </div>
            </div>
            <div className="mb-3">
              <p className="text-xs text-gray-400 mb-1">Saldo disponible</p>
              <p className="text-2xl font-bold text-gray-300">— {acc.currency}</p>
            </div>
            <div className="flex gap-3 text-xs text-gray-400">
              <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Entradas: —</span>
              <span className="flex items-center gap-1"><TrendingDown className="w-3 h-3" /> Salidas: —</span>
            </div>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h2 className="font-semibold text-gray-900 mb-3">Módulos relacionados</h2>
        <div className="flex flex-wrap gap-3">
          {[
            { label: 'Flujo de caja', href: '/erp/finance/cashflow' },
            { label: 'Cuentas por cobrar', href: '/erp/finance/receivables' },
            { label: 'Cuentas por pagar', href: '/erp/finance/payables' },
            { label: 'Facturas CFDI', href: '/erp/cfdi/invoices' },
          ].map(link => (
            <Link
              key={link.href}
              href={link.href}
              className="px-3 py-2 border border-gray-200 hover:border-green-400 text-gray-600 hover:text-green-700 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
