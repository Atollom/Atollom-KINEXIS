'use client'

import { useState, useEffect } from 'react'
import { authenticatedFetch } from '@/lib/api-client'

interface CustomerData {
  kpis: {
    total_customers: number
    avg_ltv: number
    new_leads_30d: number
    hot_leads: number
    b2b_accounts: number
    b2b_mrr: number
    avg_b2b_health: number
  }
  by_platform: { platform: string; count: number }[]
}

const mockCustomers: CustomerData = {
  kpis: {
    total_customers: 0, avg_ltv: 0, new_leads_30d: 0,
    hot_leads: 0, b2b_accounts: 0, b2b_mrr: 0, avg_b2b_health: 0,
  },
  by_platform: [],
}

const PLATFORM_COLORS: Record<string, string> = {
  ml: '#facc15', amazon: '#fb923c', shopify: '#CCFF00', b2b: '#60a5fa',
}

export default function CustomersAnalyticsPage() {
  const [data, setData] = useState<CustomerData>(mockCustomers)
  const [loading, setLoading] = useState(true)
  const [dataSource, setDataSource] = useState<'live' | 'mock'>('mock')

  useEffect(() => {
    let mounted = true
    authenticatedFetch('/api/analytics/customers')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (mounted && d?.kpis) {
          setData(d)
          setDataSource('live')
        }
      })
      .catch(() => {})
      .finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [])

  const fmt = (v: number) => v >= 1000 ? `$${(v / 1000).toFixed(0)}K` : `$${Math.round(v)}`

  return (
    <div className="space-y-8 animate-in">
      <header className="space-y-2">
        <span className="text-[0.75rem] font-bold label-tracking text-primary drop-shadow-[0_0_8px_rgba(204,255,0,0.2)]">
          Analytics / Clientes
        </span>
        <div className="flex items-center gap-3">
          <h1 className="text-4xl md:text-5xl font-black tight-tracking text-on-surface">Analytics Clientes</h1>
          <span className={`px-2 py-1 rounded-full text-[9px] font-black label-tracking border ${
            loading ? 'border-white/10 text-white/30' :
            dataSource === 'live' ? 'border-green-500/30 bg-green-500/10 text-green-400' :
            'border-amber-500/30 bg-amber-500/10 text-amber-400'
          }`}>
            {loading ? 'CARGANDO' : dataSource === 'live' ? 'LIVE' : 'SANDBOX'}
          </span>
        </div>
        <p className="text-sm text-on-surface-variant">Clientes únicos, leads, LTV y cuentas B2B</p>
      </header>

      {/* B2C KPIs */}
      <div>
        <p className="text-[9px] font-black label-tracking text-on-surface/40 uppercase mb-3">B2C — E-commerce</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Clientes Únicos', value: data.kpis.total_customers.toLocaleString(), color: 'text-on-surface' },
            { label: 'LTV Promedio', value: fmt(data.kpis.avg_ltv), color: 'text-primary' },
            { label: 'Leads 30d', value: data.kpis.new_leads_30d, color: 'text-blue-400' },
            { label: 'Leads Calientes', value: data.kpis.hot_leads, color: 'text-amber-400' },
          ].map(k => (
            <div key={k.label} className="glass-card rounded-[1.5rem] border border-white/5 p-6">
              <p className="text-[9px] font-black label-tracking text-on-surface/40 uppercase mb-2">{k.label}</p>
              <p className={`text-3xl font-black ${k.color}`}>{loading ? '—' : k.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* B2B KPIs */}
      <div>
        <p className="text-[9px] font-black label-tracking text-on-surface/40 uppercase mb-3">B2B — Cuentas Corporativas</p>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {[
            { label: 'Cuentas B2B', value: data.kpis.b2b_accounts, color: 'text-blue-400' },
            { label: 'MRR B2B', value: fmt(data.kpis.b2b_mrr), color: 'text-purple-400' },
            { label: 'Salud Promedio', value: `${data.kpis.avg_b2b_health}%`, color: data.kpis.avg_b2b_health >= 70 ? 'text-green-400' : 'text-amber-400' },
          ].map(k => (
            <div key={k.label} className="glass-card rounded-[1.5rem] border border-white/5 p-6">
              <p className="text-[9px] font-black label-tracking text-on-surface/40 uppercase mb-2">{k.label}</p>
              <p className={`text-3xl font-black ${k.color}`}>{loading ? '—' : k.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Platform breakdown */}
      <div className="glass-card rounded-[2rem] border border-white/5 overflow-hidden">
        <div className="px-8 py-5 border-b border-white/5">
          <h2 className="text-sm font-black text-on-surface">Órdenes por Canal</h2>
        </div>
        {loading ? (
          <div className="p-8 text-center text-sm text-on-surface/40">Cargando…</div>
        ) : data.by_platform.length === 0 ? (
          <div className="p-8 text-center">
            <span className="material-symbols-outlined !text-[32px] text-on-surface/20">people</span>
            <p className="text-sm text-on-surface/40 mt-2">Sin datos de clientes aún</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {data.by_platform.sort((a, b) => b.count - a.count).map(p => {
              const total = Math.max(data.by_platform.reduce((s, x) => s + x.count, 0), 1)
              const pct = Math.round((p.count / total) * 100)
              return (
                <div key={p.platform} className="flex items-center gap-4 px-8 py-4">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: PLATFORM_COLORS[p.platform] ?? '#60a5fa' }} />
                  <p className="text-xs font-bold text-on-surface uppercase w-20">{p.platform}</p>
                  <div className="flex-1 h-1.5 rounded-full bg-white/5">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: PLATFORM_COLORS[p.platform] ?? '#60a5fa' }} />
                  </div>
                  <p className="text-xs font-black text-on-surface w-16 text-right">{p.count} órd.</p>
                  <p className="text-[10px] text-on-surface/40 w-12 text-right">{pct}%</p>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="h-10" />
    </div>
  )
}
