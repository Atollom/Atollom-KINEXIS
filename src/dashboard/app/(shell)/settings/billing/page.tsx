'use client'

import { CreditCard, Zap, Check, ExternalLink } from 'lucide-react'
import Link from 'next/link'

export default function BillingSettingsPage() {
  return (
    <div className="flex flex-col gap-6 p-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Facturación</h1>
        <p className="text-sm text-gray-500 mt-1">Plan activo, uso y métodos de pago</p>
      </div>

      {/* Current plan */}
      <div className="bg-white rounded-xl shadow-sm border border-green-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-green-100 rounded-xl"><Zap className="w-5 h-5 text-green-600" /></div>
            <div>
              <p className="font-bold text-gray-900">Plan Growth</p>
              <p className="text-sm text-gray-500">Renovación mensual</p>
            </div>
          </div>
          <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">Activo</span>
        </div>
        <div className="text-3xl font-bold text-gray-900 mb-4">$2,499 <span className="text-base font-normal text-gray-400">MXN/mes</span></div>
        <div className="grid grid-cols-2 gap-3 mb-4">
          {['2,000 mensajes Samantha', '10 usuarios', 'ERP + CRM completo', '43 agentes IA'].map(feat => (
            <div key={feat} className="flex items-center gap-2 text-sm text-gray-600">
              <Check className="w-4 h-4 text-green-500 shrink-0" />
              {feat}
            </div>
          ))}
        </div>
        <Link href="/billing/pricing" className="text-sm text-green-600 hover:text-green-800 font-medium">Ver todos los planes →</Link>
      </div>

      {/* Usage */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Uso este mes</h2>
        <div className="space-y-4">
          {[
            { label: 'Mensajes Samantha', used: 127, limit: 2000 },
            { label: 'Usuarios activos', used: 3, limit: 10 },
            { label: 'Agentes ejecutados', used: 89, limit: null },
          ].map(item => (
            <div key={item.label}>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-gray-600">{item.label}</span>
                <span className="font-medium text-gray-900">
                  {item.used}{item.limit ? ` / ${item.limit}` : ''}
                </span>
              </div>
              {item.limit && (
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full"
                    style={{ width: `${Math.min((item.used / item.limit) * 100, 100)}%` }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Payment method */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-gray-400" />
          Método de pago
        </h2>
        <p className="text-sm text-gray-500 mb-3">Gestionado de forma segura a través de Stripe.</p>
        <a
          href="https://billing.stripe.com/p/login"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 hover:border-green-500 text-gray-700 text-sm font-medium rounded-lg transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          Gestionar en Stripe
        </a>
      </div>
    </div>
  )
}
