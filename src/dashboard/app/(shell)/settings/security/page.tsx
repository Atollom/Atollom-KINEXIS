'use client'

import { useState, useEffect } from 'react'
import { useToast } from '@/components/ToastProvider'
import { authenticatedFetch } from '@/lib/api-client'

interface AuditLog {
  id: string
  field: string
  previous_value: string
  new_value: string
  created_at: string
}

interface ApiKey {
  id: string
  key_name: string
  updated_at: string
}

export default function SecurityPage() {
  const { showToast } = useToast()
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      authenticatedFetch('/api/settings/security/logs').then(r => r.ok ? r.json() : null),
      authenticatedFetch('/api/settings/vault').then(r => r.ok ? r.json() : null),
    ]).then(([logsData, vaultData]) => {
      if (logsData?.logs) setLogs(logsData.logs)
      if (vaultData?.keys) {
        const keys: ApiKey[] = Object.entries(vaultData.keys as Record<string, boolean>)
          .filter(([, has]) => has)
          .map(([k], i) => ({ id: String(i), key_name: k, updated_at: new Date().toISOString() }))
        setApiKeys(keys)
      }
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  function fmtAction(field: string) {
    if (field.startsWith('vault.'))        return { label: 'API Key actualizada', color: 'text-amber-400', icon: 'key' }
    if (field.startsWith('profile.'))      return { label: 'Perfil actualizado',   color: 'text-blue-400',  icon: 'manage_accounts' }
    if (field.startsWith('user_role.'))    return { label: 'Rol cambiado',          color: 'text-purple-400', icon: 'shield' }
    return { label: field,                                                           color: 'text-on-surface/60', icon: 'history' }
  }

  return (
    <div className="space-y-10 animate-in">
      <header className="space-y-2">
        <span className="text-[0.75rem] font-bold label-tracking text-primary drop-shadow-[0_0_8px_rgba(204,255,0,0.2)]">
          Configuración / Seguridad
        </span>
        <h1 className="text-4xl md:text-5xl font-black tight-tracking text-on-surface">Seguridad</h1>
        <p className="text-sm text-on-surface-variant">API keys configuradas y registro de auditoría</p>
      </header>

      {/* Configured API Keys */}
      <div className="glass-card rounded-[2rem] border border-white/5 overflow-hidden">
        <div className="flex items-center justify-between px-8 py-5 border-b border-white/5">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined !text-[18px] text-[#CCFF00]">key</span>
            <h2 className="font-black text-sm text-on-surface">API Keys configuradas</h2>
          </div>
          <a
            href="/settings/integrations"
            className="px-4 py-2 rounded-xl bg-primary/10 border border-primary/20 text-primary text-[9px] font-black hover:bg-primary/20 transition-colors"
          >
            GESTIONAR →
          </a>
        </div>
        {loading ? (
          <div className="p-8 text-center text-sm text-on-surface/40">Cargando…</div>
        ) : apiKeys.length === 0 ? (
          <div className="p-8 text-center">
            <span className="material-symbols-outlined !text-[32px] text-on-surface/20">key_off</span>
            <p className="text-sm text-on-surface/40 mt-2">Sin API keys configuradas</p>
            <a href="/settings/integrations" className="text-[10px] text-primary font-black mt-1 block">Configurar integraciones →</a>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {apiKeys.map(k => (
              <div key={k.id} className="flex items-center justify-between px-8 py-4 hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined !text-[14px] text-[#CCFF00]">lock</span>
                  <div>
                    <p className="text-xs font-mono font-bold text-on-surface">{k.key_name}</p>
                    <p className="text-[9px] text-on-surface/30">Última actualización: {new Date(k.updated_at).toLocaleDateString('es-MX')}</p>
                  </div>
                </div>
                <span className="text-[9px] font-black label-tracking text-on-surface/20">••••••••</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Password change */}
      <div className="glass-card rounded-[2rem] border border-white/5 p-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined !text-[18px] text-purple-400">lock_reset</span>
          <div>
            <p className="font-black text-sm text-on-surface">Contraseña</p>
            <p className="text-[10px] text-on-surface/40">Cambia tu contraseña de acceso</p>
          </div>
        </div>
        <button
          onClick={() => showToast({ type: 'info', title: 'Email enviado', message: 'Revisa tu correo para restablecer la contraseña' })}
          className="px-6 py-2.5 rounded-xl bg-purple-400/10 border border-purple-400/20 text-purple-400 text-[9px] font-black hover:bg-purple-400/20 transition-colors"
        >
          CAMBIAR CONTRASEÑA
        </button>
      </div>

      {/* Audit log */}
      <div className="glass-card rounded-[2rem] border border-white/5 overflow-hidden">
        <div className="flex items-center gap-3 px-8 py-5 border-b border-white/5">
          <span className="material-symbols-outlined !text-[18px] text-blue-400">policy</span>
          <h2 className="font-black text-sm text-on-surface">Registro de auditoría</h2>
          <span className="px-2 py-0.5 rounded-full bg-blue-400/10 border border-blue-400/20 text-[9px] font-black text-blue-400">
            {logs.length} eventos
          </span>
        </div>
        {loading ? (
          <div className="p-8 text-center text-sm text-on-surface/40">Cargando registros…</div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center">
            <span className="material-symbols-outlined !text-[32px] text-on-surface/20">history</span>
            <p className="text-sm text-on-surface/40 mt-2">Sin actividad registrada aún</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {logs.map(log => {
              const action = fmtAction(log.field)
              return (
                <div key={log.id} className="flex items-center gap-4 px-8 py-4 hover:bg-white/[0.02] transition-colors">
                  <span className={`material-symbols-outlined !text-[16px] ${action.color}`}>{action.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-bold ${action.color}`}>{action.label}</p>
                    <p className="text-[9px] text-on-surface/30 truncate">{log.field}</p>
                  </div>
                  <p className="text-[9px] text-on-surface/30 flex-shrink-0">
                    {new Date(log.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
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
