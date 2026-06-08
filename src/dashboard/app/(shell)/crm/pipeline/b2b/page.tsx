'use client'

import { useState, useEffect } from 'react'
import { Building2, TrendingUp, Search } from 'lucide-react'

interface B2BAccount {
  id: string
  name: string
  industry: string | null
  contact_name: string | null
  email: string | null
  monthly_volume: number | null
  stage: string
  score: number | null
}

function fmt(n: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n)
}

export default function B2BPipelinePage() {
  const [accounts, setAccounts] = useState<B2BAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/analytics/customers')
      .then(r => r.json())
      .then(data => setAccounts(data.b2b_accounts ?? []))
      .finally(() => setLoading(false))
  }, [])

  const filtered = accounts.filter(a =>
    search === '' ||
    a.name?.toLowerCase().includes(search.toLowerCase()) ||
    a.industry?.toLowerCase().includes(search.toLowerCase()) ||
    a.contact_name?.toLowerCase().includes(search.toLowerCase())
  )

  const totalVolume = filtered.reduce((sum, a) => sum + (a.monthly_volume ?? 0), 0)

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Cuentas B2B</h1>
        <p className="text-sm text-gray-500 mt-1">Agente #4 · B2B Collector — cuentas empresariales</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-xs text-gray-500 mb-1">Cuentas activas</p>
          <p className="text-2xl font-bold text-gray-900">{filtered.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-xs text-gray-500 mb-1">Volumen mensual total</p>
          <p className="text-2xl font-bold text-green-600">{fmt(totalVolume)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-xs text-gray-500 mb-1">Volumen promedio</p>
          <p className="text-2xl font-bold text-gray-700">{filtered.length > 0 ? fmt(totalVolume / filtered.length) : '—'}</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar empresa, industria o contacto..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 focus:border-green-400 focus:outline-none rounded-lg text-sm"
        />
      </div>

      {/* Cards grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-40 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-gray-100">
          <Building2 className="w-12 h-12 text-gray-200 mb-4" />
          <p className="font-medium text-gray-500">Sin cuentas B2B</p>
          <p className="text-sm text-gray-400 mt-1">Las cuentas empresariales aparecerán aquí</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(account => (
            <div key={account.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:border-green-200 hover:shadow-md transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{account.name}</h3>
                    <p className="text-xs text-gray-400">{account.industry ?? 'Sin industria'}</p>
                  </div>
                </div>
                {account.score != null && (
                  <div className="flex items-center gap-1 px-2 py-0.5 bg-green-50 rounded-full">
                    <TrendingUp className="w-3 h-3 text-green-500" />
                    <span className="text-xs font-bold text-green-600">{account.score}</span>
                  </div>
                )}
              </div>

              {account.contact_name && (
                <p className="text-sm text-gray-600 mb-2">Contacto: <span className="font-medium">{account.contact_name}</span></p>
              )}
              {account.email && (
                <p className="text-xs text-gray-400 mb-3 truncate">{account.email}</p>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                <div>
                  <p className="text-xs text-gray-400">Vol. mensual</p>
                  <p className="font-bold text-gray-900">{account.monthly_volume ? fmt(account.monthly_volume) : '—'}</p>
                </div>
                <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs font-medium rounded-full capitalize">
                  {account.stage ?? 'activo'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
