'use client'

import { useState, useEffect } from 'react'
import { authenticatedFetch } from '@/lib/api-client'

interface TenantRow {
  id: string
  name: string
  business_name: string
  plan: string
  active: boolean
  onboarding_complete: boolean
  user_count: number
  has_stripe: boolean
  created_at: string
}

const PLAN_CFG: Record<string, { color: string; bg: string; border: string }> = {
  Starter:    { color: 'text-amber-400',    bg: 'bg-amber-400/10',    border: 'border-amber-400/20'    },
  Growth:     { color: 'text-blue-400',     bg: 'bg-blue-400/10',     border: 'border-blue-400/20'     },
  Pro:        { color: 'text-primary',      bg: 'bg-primary/10',      border: 'border-primary/20'      },
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: '2-digit' })
}

export default function AdminTenantsPage() {
  const [tenants, setTenants] = useState<TenantRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    let mounted = true
    authenticatedFetch('/api/admin/tenants')
      .then(r => {
        if (r.status === 403) throw new Error('forbidden')
        return r.ok ? r.json() : null
      })
      .then(d => { if (mounted && d?.tenants) setTenants(d.tenants) })
      .catch(e => { if (mounted) setError(e.message === 'forbidden' ? 'Acceso restringido a Super Admin' : 'Error cargando datos') })
      .finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [])

  const filtered = tenants.filter(t =>
    !search ||
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.business_name.toLowerCase().includes(search.toLowerCase())
  )

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <span className="material-symbols-outlined !text-[48px] text-red-400/30">lock</span>
        <p className="text-sm font-black text-red-400">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-10 animate-in">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <span className="text-[0.75rem] font-bold label-tracking text-red-400">
            Admin / Tenants
          </span>
          <div className="flex items-center gap-3">
            <h1 className="text-4xl md:text-5xl font-black tight-tracking text-on-surface">Tenants</h1>
            <span className="px-2 py-1 rounded-full text-[9px] font-black label-tracking border border-red-400/30 bg-red-400/10 text-red-400">
              SUPER ADMIN
            </span>
          </div>
          <p className="text-sm text-on-surface-variant">
            {loading ? '…' : `${tenants.length} tenant${tenants.length !== 1 ? 's' : ''} registrados`}
          </p>
        </div>
      </header>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: tenants.length, color: 'text-on-surface' },
          { label: 'Activos', value: tenants.filter(t => t.active).length, color: 'text-green-400' },
          { label: 'Con Stripe', value: tenants.filter(t => t.has_stripe).length, color: 'text-purple-400' },
          { label: 'Onboarding OK', value: tenants.filter(t => t.onboarding_complete).length, color: 'text-primary' },
        ].map(k => (
          <div key={k.label} className="glass-card rounded-[1.5rem] border border-white/5 p-5">
            <p className="text-[9px] font-black label-tracking text-on-surface/40 uppercase mb-2">{k.label}</p>
            <p className={`text-2xl font-black ${k.color}`}>{loading ? '—' : k.value}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative w-72">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface/30 !text-[16px]">search</span>
        <input
          type="text"
          placeholder="Buscar tenant…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-[11px] font-medium text-on-surface placeholder:text-on-surface/30 focus:border-primary/50 outline-none w-full"
        />
      </div>

      {/* Table */}
      <div className="glass-card rounded-[2rem] border border-white/5 overflow-hidden">
        <div className="divide-y divide-white/5">
          {loading ? (
            <div className="p-12 text-center text-sm text-on-surface/40">Cargando…</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-sm text-on-surface/40">Sin resultados</div>
          ) : filtered.map(t => {
            const planCfg = PLAN_CFG[t.plan] ?? PLAN_CFG.Starter
            return (
              <div key={t.id} className="flex items-center gap-4 px-8 py-5 hover:bg-white/[0.02] transition-colors">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-[11px] font-black flex-shrink-0 ${planCfg.bg} ${planCfg.color} border ${planCfg.border}`}>
                  {(t.name || '??').slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-on-surface truncate">{t.name}</p>
                  <p className="text-[9px] text-on-surface/40 truncate">{t.business_name || '—'}</p>
                </div>
                <span className={`inline-flex items-center px-2.5 py-1 rounded-xl text-[9px] font-black border ${planCfg.color} ${planCfg.bg} ${planCfg.border}`}>
                  {t.plan.toUpperCase()}
                </span>
                <div className="flex items-center gap-1 text-[9px] text-on-surface/40">
                  <span className="material-symbols-outlined !text-[12px]">group</span>
                  {t.user_count}
                </div>
                {t.has_stripe && (
                  <span className="material-symbols-outlined !text-[14px] text-purple-400">credit_card</span>
                )}
                {t.onboarding_complete
                  ? <span className="material-symbols-outlined !text-[14px] text-green-400">check_circle</span>
                  : <span className="material-symbols-outlined !text-[14px] text-on-surface/20">radio_button_unchecked</span>
                }
                <p className="text-[9px] text-on-surface/30 w-20 text-right">{fmtDate(t.created_at)}</p>
              </div>
            )
          })}
        </div>
      </div>

      <div className="h-10" />
    </div>
  )
}
