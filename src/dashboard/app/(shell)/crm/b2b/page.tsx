'use client'

import { useEffect, useState } from 'react'
import { Building2, TrendingUp, Mail, Phone, Star } from 'lucide-react'

interface B2BAccount {
  id: string; name: string; industry: string; contact: string
  email: string; monthly_volume: number; status: string; created_at: string
}

function fmt(n: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n)
}

export default function B2BPage() {
  const [accounts, setAccounts] = useState<B2BAccount[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/analytics/customers')
      .then(r => r.json())
      .then(d => setAccounts(d.b2b ?? []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const totalVolume = accounts.reduce((s, a) => s + a.monthly_volume, 0)
  const active = accounts.filter(a => a.status === 'active').length

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cuentas B2B</h1>
          <p className="text-sm text-gray-500 mt-1">Clientes empresariales y volumen mensual</p>
        </div>
        <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">Agente #4 · CRM</span>
      </div>

      {!loading && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-2"><Building2 className="w-4 h-4 text-blue-500" /><span className="text-xs text-gray-500">Total cuentas</span></div>
            <p className="text-2xl font-bold text-blue-700">{accounts.length}</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-2"><Star className="w-4 h-4 text-green-500" /><span className="text-xs text-gray-500">Activas</span></div>
            <p className="text-2xl font-bold text-green-700">{active}</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-2"><TrendingUp className="w-4 h-4 text-purple-500" /><span className="text-xs text-gray-500">Vol. mensual total</span></div>
            <p className="text-xl font-bold text-purple-700">{fmt(totalVolume)}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {loading ? Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl p-5 animate-pulse h-32 border border-gray-100" />
        )) : accounts.length === 0 ? (
          <div className="col-span-full bg-white rounded-xl p-12 text-center text-gray-400 border border-gray-100">
            <Building2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Sin cuentas B2B registradas</p>
            <p className="text-xs mt-1">Las cuentas empresariales aparecerán aquí</p>
          </div>
        ) : accounts.map(account => (
          <div key={account.id} className={`bg-white rounded-xl shadow-sm border p-5 ${account.status === 'active' ? 'border-gray-100' : 'border-gray-50 opacity-60'}`}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-gray-900">{account.name}</h3>
                <p className="text-xs text-gray-500">{account.industry}</p>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${account.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {account.status === 'active' ? 'Activa' : account.status}
              </span>
            </div>
            <div className="space-y-1.5 text-sm">
              <div className="flex items-center gap-1.5 text-gray-500">
                <Mail className="w-3.5 h-3.5" />
                <span className="truncate">{account.email || account.contact}</span>
              </div>
              {account.monthly_volume > 0 && (
                <div className="flex items-center gap-1.5 text-green-700 font-semibold">
                  <TrendingUp className="w-3.5 h-3.5" />
                  {fmt(account.monthly_volume)}/mes
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
