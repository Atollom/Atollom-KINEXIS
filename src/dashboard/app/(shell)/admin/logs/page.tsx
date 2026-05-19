'use client'

import { useState, useEffect } from 'react'
import { authenticatedFetch } from '@/lib/api-client'

interface LogEntry {
  id: string
  tenant_id: string
  tenant_name: string
  field: string
  previous_value: string
  new_value: string
  created_at: string
}

function getActionMeta(field: string) {
  if (field.startsWith('vault.'))     return { label: 'API Key',      color: 'text-amber-400',  icon: 'key' }
  if (field.startsWith('profile.'))   return { label: 'Perfil',        color: 'text-blue-400',   icon: 'manage_accounts' }
  if (field.startsWith('user_role.')) return { label: 'Rol',           color: 'text-purple-400', icon: 'shield' }
  return                                     { label: field,            color: 'text-on-surface/60', icon: 'history' }
}

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    authenticatedFetch('/api/admin/logs')
      .then(r => {
        if (r.status === 403) throw new Error('forbidden')
        return r.ok ? r.json() : null
      })
      .then(d => { if (d?.logs) setLogs(d.logs) })
      .catch(e => setError(e.message === 'forbidden' ? 'Acceso restringido a Super Admin' : 'Error cargando logs'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = logs.filter(l =>
    !search ||
    l.tenant_name?.toLowerCase().includes(search.toLowerCase()) ||
    l.field?.toLowerCase().includes(search.toLowerCase())
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
      <header className="space-y-2">
        <span className="text-[0.75rem] font-bold label-tracking text-red-400">
          Admin / Audit Log Global
        </span>
        <div className="flex items-center gap-3">
          <h1 className="text-4xl md:text-5xl font-black tight-tracking text-on-surface">Audit Log</h1>
          <span className="px-2 py-1 rounded-full text-[9px] font-black label-tracking border border-red-400/30 bg-red-400/10 text-red-400">
            SUPER ADMIN
          </span>
          <span className="px-2 py-1 rounded-full text-[9px] font-black label-tracking border border-blue-400/30 bg-blue-400/10 text-blue-400">
            {loading ? '…' : `${logs.length} eventos`}
          </span>
        </div>
        <p className="text-sm text-on-surface-variant">Registro de cambios cross-tenant (últimos 200 eventos)</p>
      </header>

      {/* Search */}
      <div className="relative w-72">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface/30 !text-[16px]">search</span>
        <input
          type="text"
          placeholder="Filtrar por tenant o campo…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-[11px] font-medium text-on-surface placeholder:text-on-surface/30 focus:border-primary/50 outline-none w-full"
        />
      </div>

      <div className="glass-card rounded-[2rem] border border-white/5 overflow-hidden">
        <div className="divide-y divide-white/5">
          {loading ? (
            <div className="p-12 text-center text-sm text-on-surface/40">Cargando…</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <span className="material-symbols-outlined !text-[32px] text-on-surface/20">history</span>
              <p className="text-sm text-on-surface/40 mt-2">Sin eventos registrados</p>
            </div>
          ) : filtered.map(log => {
            const action = getActionMeta(log.field)
            return (
              <div key={log.id} className="flex items-center gap-4 px-8 py-4 hover:bg-white/[0.02] transition-colors">
                <span className={`material-symbols-outlined !text-[16px] ${action.color}`}>{action.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`text-xs font-bold ${action.color}`}>{action.label}</p>
                    <span className="text-[9px] text-on-surface/30 font-mono">{log.field}</span>
                  </div>
                  <p className="text-[9px] text-on-surface/40">
                    <span className="font-bold text-on-surface/60">{log.tenant_name}</span>
                    {log.previous_value && log.new_value && (
                      <span> · {log.previous_value} → {log.new_value}</span>
                    )}
                  </p>
                </div>
                <p className="text-[9px] text-on-surface/30 flex-shrink-0">
                  {new Date(log.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            )
          })}
        </div>
      </div>

      <div className="h-10" />
    </div>
  )
}
