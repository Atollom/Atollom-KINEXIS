'use client'

import { useEffect, useState } from 'react'
import { Users, Star, Building2, Zap } from 'lucide-react'

interface CustomerStats {
  total_leads: number
  hot_leads: number
  avg_score: number
  by_source: Record<string, number>
  by_stage: Record<string, number>
  b2b_accounts: number
  b2b_active: number
}

interface Lead {
  id: string; name: string; company: string; source: string
  score: number; stage: string; value: number; created_at: string
}

interface B2BAccount {
  id: string; name: string; industry: string; contact: string
  email: string; monthly_volume: number; status: string; created_at: string
}

function fmt(n: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n)
}

const stageLabels: Record<string, string> = {
  new: 'Nuevo', contacted: 'Contactado', quote_sent: 'Cotización',
  negotiating: 'Negociando', won: 'Ganado', lost: 'Perdido',
}

export default function CustomersAnalyticsPage() {
  const [stats, setStats] = useState<CustomerStats | null>(null)
  const [leads, setLeads] = useState<Lead[]>([])
  const [b2b, setB2b] = useState<B2BAccount[]>([])
  const [tab, setTab] = useState<'leads' | 'b2b'>('leads')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/analytics/customers')
      .then(r => r.json())
      .then(d => {
        setStats(d.stats)
        setLeads(d.leads ?? [])
        setB2b(d.b2b ?? [])
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const totalSource = Object.values(stats?.by_source ?? {}).reduce((s, v) => s + v, 0) || 1

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics de Clientes</h1>
          <p className="text-sm text-gray-500 mt-1">Leads, cuentas B2B y segmentación</p>
        </div>
        <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">CRM · Analytics</span>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-5 animate-pulse h-24 border border-gray-100" />
          ))}
        </div>
      ) : stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-2"><Users className="w-4 h-4 text-blue-500" /><span className="text-xs text-gray-500">Total leads</span></div>
            <p className="text-2xl font-bold text-blue-700">{stats.total_leads}</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-2"><Zap className="w-4 h-4 text-green-500" /><span className="text-xs text-gray-500">Hot leads</span></div>
            <p className="text-2xl font-bold text-green-700">{stats.hot_leads}</p>
            <p className="text-xs text-gray-400">Score ≥ 70</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-2"><Star className="w-4 h-4 text-yellow-500" /><span className="text-xs text-gray-500">Score promedio</span></div>
            <p className="text-2xl font-bold text-yellow-600">{stats.avg_score}</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-2"><Building2 className="w-4 h-4 text-purple-500" /><span className="text-xs text-gray-500">Cuentas B2B</span></div>
            <p className="text-2xl font-bold text-purple-700">{stats.b2b_accounts}</p>
            <p className="text-xs text-gray-400">{stats.b2b_active} activas</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Source breakdown */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Por fuente</h2>
          {loading ? (
            <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-8 bg-gray-100 rounded animate-pulse" />)}</div>
          ) : (
            <div className="space-y-3">
              {Object.entries(stats?.by_source ?? {}).sort((a, b) => b[1] - a[1]).map(([src, count]) => (
                <div key={src}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="capitalize text-gray-700">{src}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(count / totalSource) * 100}%` }} />
                  </div>
                </div>
              ))}
              {Object.keys(stats?.by_source ?? {}).length === 0 && <p className="text-sm text-gray-400">Sin datos</p>}
            </div>
          )}
        </div>

        {/* Stage breakdown */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Por etapa</h2>
          {loading ? (
            <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-8 bg-gray-100 rounded animate-pulse" />)}</div>
          ) : (
            <div className="space-y-2">
              {Object.entries(stats?.by_stage ?? {}).map(([stage, count]) => (
                <div key={stage} className="flex items-center justify-between py-1.5 border-b border-gray-50">
                  <span className="text-sm text-gray-700">{stageLabels[stage] ?? stage}</span>
                  <span className="font-bold text-gray-900">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top leads */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Top leads por score</h2>
          {loading ? (
            <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />)}</div>
          ) : (
            <div className="space-y-2">
              {leads.slice(0, 8).map(lead => (
                <div key={lead.id} className="flex items-center justify-between py-1.5">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{lead.name}</p>
                    <p className="text-xs text-gray-400 capitalize">{lead.source}</p>
                  </div>
                  <span className={`font-bold text-sm ${lead.score >= 70 ? 'text-green-600' : lead.score >= 40 ? 'text-yellow-600' : 'text-gray-400'}`}>
                    {lead.score}
                  </span>
                </div>
              ))}
              {leads.length === 0 && <p className="text-sm text-gray-400">Sin leads</p>}
            </div>
          )}
        </div>
      </div>

      {/* Tabs: leads / b2b */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex border-b border-gray-100">
          <button onClick={() => setTab('leads')} className={`px-5 py-3 text-sm font-medium transition-colors ${tab === 'leads' ? 'border-b-2 border-green-600 text-green-700' : 'text-gray-500 hover:text-gray-700'}`}>
            Leads ({leads.length})
          </button>
          <button onClick={() => setTab('b2b')} className={`px-5 py-3 text-sm font-medium transition-colors ${tab === 'b2b' ? 'border-b-2 border-green-600 text-green-700' : 'text-gray-500 hover:text-gray-700'}`}>
            Cuentas B2B ({b2b.length})
          </button>
        </div>

        {tab === 'leads' ? (
          loading ? <div className="p-6 space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />)}</div> :
          <table className="w-full text-sm">
            <thead className="bg-gray-50"><tr>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Nombre</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Fuente</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Etapa</th>
              <th className="text-right px-4 py-3 font-medium text-gray-500">Score</th>
              <th className="text-right px-4 py-3 font-medium text-gray-500">Valor</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-50">
              {leads.map(l => (
                <tr key={l.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{l.name}</td>
                  <td className="px-4 py-3 text-gray-500 capitalize">{l.source}</td>
                  <td className="px-4 py-3 text-gray-500">{stageLabels[l.stage] ?? l.stage}</td>
                  <td className="px-4 py-3 text-right font-bold text-gray-900">{l.score}</td>
                  <td className="px-4 py-3 text-right text-gray-600">{l.value > 0 ? fmt(l.value) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          loading ? <div className="p-6 space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />)}</div> :
          b2b.length === 0 ? <div className="p-8 text-center text-gray-400"><Building2 className="w-8 h-8 mx-auto mb-2 opacity-30" /><p>Sin cuentas B2B</p></div> :
          <table className="w-full text-sm">
            <thead className="bg-gray-50"><tr>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Empresa</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Industria</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Contacto</th>
              <th className="text-right px-4 py-3 font-medium text-gray-500">Vol. mensual</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Estado</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-50">
              {b2b.map(a => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{a.name}</td>
                  <td className="px-4 py-3 text-gray-500">{a.industry}</td>
                  <td className="px-4 py-3 text-gray-500">{a.contact}</td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900">{a.monthly_volume > 0 ? fmt(a.monthly_volume) : '—'}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${a.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{a.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
