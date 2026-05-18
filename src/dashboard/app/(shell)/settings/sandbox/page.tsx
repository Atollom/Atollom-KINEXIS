'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { authenticatedFetch } from '@/lib/api-client'
import { useToast } from '@/components/ToastProvider'

interface IntegrationState {
  status: 'connected' | 'error' | 'disconnected'
  last_sync: string
  api_calls_today: number
  rate_limit: number
}

interface SandboxStatus {
  mode: string
  integrations: Record<string, IntegrationState>
  sync_log_count: number
}

interface AmazonConnectionStatus {
  connected: boolean
  seller_id: string | null
  marketplace_id?: string
  environment?: string
  connected_at?: string | null
  note?: string
}

const INTEGRATION_CFG: Record<
  string,
  { label: string; color: string; icon: string; description: string }
> = {
  mercadolibre: {
    label: 'Mercado Libre',
    color: 'text-yellow-400',
    icon: 'storefront',
    description: 'SP-API · productos, órdenes, preguntas, métricas',
  },
  amazon: {
    label: 'Amazon',
    color: 'text-orange-400',
    icon: 'inventory_2',
    description: 'SP-API · listings, órdenes, FBA, fees',
  },
  shopify: {
    label: 'Shopify',
    color: 'text-[#CCFF00]',
    icon: 'shopping_bag',
    description: 'Admin API 2024-01 · productos, órdenes, analytics',
  },
  meta: {
    label: 'Meta Business',
    color: 'text-blue-400',
    icon: 'groups',
    description: 'Graph API · WhatsApp, Instagram, Facebook Ads',
  },
}

function RateBar({ calls, limit }: { calls: number; limit: number }) {
  const pct = Math.min((calls / limit) * 100, 100)
  const color = pct > 80 ? 'bg-red-500' : pct > 50 ? 'bg-yellow-400' : 'bg-[#CCFF00]'
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-[10px] label-tracking text-white/40">LLAMADAS HOY</span>
        <span className="text-[10px] font-mono text-white/60">
          {calls.toLocaleString()} / {limit.toLocaleString()}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

function StatusDot({ status }: { status: string }) {
  const cfg: Record<string, string> = {
    connected: 'bg-[#CCFF00] shadow-[0_0_6px_#CCFF00]',
    error: 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.8)]',
    disconnected: 'bg-white/20',
  }
  return (
    <span className={`inline-block w-2 h-2 rounded-full ${cfg[status] ?? cfg.disconnected}`} />
  )
}

const MARKETPLACE_LABELS: Record<string, string> = {
  'A1AM78C64UM0Y8': 'Amazon México (MX)',
  'ATVPDKIKX0DER':  'Amazon EE.UU. (US)',
}

export default function SandboxPage() {
  const { showToast } = useToast()
  const searchParams = useSearchParams()

  const [status, setStatus] = useState<SandboxStatus | null>(null)
  const [syncing, setSyncing] = useState<Record<string, boolean>>({})
  const [resetting, setResetting] = useState(false)
  const [loading, setLoading] = useState(true)

  const [amazonStatus, setAmazonStatus] = useState<AmazonConnectionStatus | null>(null)
  const [amazonLoading, setAmazonLoading] = useState(true)
  const [amazonConnecting, setAmazonConnecting] = useState(false)
  const [amazonDisconnecting, setAmazonDisconnecting] = useState(false)

  async function fetchStatus() {
    try {
      const res = await authenticatedFetch('/api/sandbox/status')
      const data = await res.json()
      setStatus(data)
    } catch {
      showToast({ type: 'error', title: 'Error', message: 'No se pudo cargar el estado del sandbox' })
    } finally {
      setLoading(false)
    }
  }

  async function fetchAmazonStatus() {
    try {
      const res = await authenticatedFetch('/api/integrations/amazon/status')
      const data = await res.json()
      setAmazonStatus(data)
    } catch {
      setAmazonStatus({ connected: false, seller_id: null })
    } finally {
      setAmazonLoading(false)
    }
  }

  useEffect(() => {
    fetchStatus()
    fetchAmazonStatus()

    // Handle redirect back from Amazon OAuth
    const result = searchParams.get('amazon')
    if (result === 'connected') {
      showToast({ type: 'success', title: 'Amazon conectado', message: 'Cuenta de vendedor vinculada correctamente' })
      // Clean the query param from the URL without reload
      window.history.replaceState({}, '', window.location.pathname)
    } else if (result === 'error') {
      showToast({ type: 'error', title: 'Error al conectar Amazon', message: 'No se pudo completar la autorización. Intenta nuevamente.' })
      window.history.replaceState({}, '', window.location.pathname)
    } else if (result === 'invalid_state') {
      showToast({ type: 'error', title: 'Sesión expirada', message: 'La solicitud de autorización expiró. Intenta nuevamente.' })
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  async function handleSync(integration: string) {
    setSyncing(s => ({ ...s, [integration]: true }))
    try {
      const res = await authenticatedFetch(`/api/sandbox/sync/${integration}`, { method: 'POST' })
      const result = await res.json()
      showToast({
        type: 'success',
        title: 'Sincronización completa',
        message: `${INTEGRATION_CFG[integration]?.label}: ${result.items_synced ?? 'N/A'} registros sincronizados`,
      })
      await fetchStatus()
    } catch (err: any) {
      showToast({ type: 'error', title: 'Error de sincronización', message: err?.message ?? 'Intenta nuevamente' })
    } finally {
      setSyncing(s => ({ ...s, [integration]: false }))
    }
  }

  async function handleReset() {
    setResetting(true)
    try {
      await authenticatedFetch('/api/sandbox/reset', { method: 'POST' })
      showToast({ type: 'success', title: 'Sandbox reiniciado', message: 'Todos los contadores han sido limpiados' })
      await fetchStatus()
    } catch (err: any) {
      showToast({ type: 'error', title: 'Error', message: err?.message ?? 'Solo owner/admin puede hacer reset' })
    } finally {
      setResetting(false)
    }
  }

  async function handleAmazonConnect() {
    setAmazonConnecting(true)
    try {
      const res = await authenticatedFetch('/api/integrations/amazon/connect?marketplace_id=A1AM78C64UM0Y8')
      const data = await res.json()
      if (data.auth_url) {
        window.location.href = data.auth_url
      } else {
        showToast({ type: 'error', title: 'Error', message: data.detail ?? 'No se pudo obtener la URL de autorización' })
        setAmazonConnecting(false)
      }
    } catch {
      showToast({ type: 'error', title: 'Error de red', message: 'No se pudo contactar el servidor' })
      setAmazonConnecting(false)
    }
  }

  async function handleAmazonDisconnect() {
    setAmazonDisconnecting(true)
    try {
      await authenticatedFetch('/api/integrations/amazon/disconnect', { method: 'DELETE' })
      showToast({ type: 'success', title: 'Amazon desconectado', message: 'Las credenciales han sido eliminadas' })
      setAmazonStatus({ connected: false, seller_id: null })
    } catch {
      showToast({ type: 'error', title: 'Error', message: 'No se pudo desconectar. Intenta nuevamente.' })
    } finally {
      setAmazonDisconnecting(false)
    }
  }

  return (
    <div className="min-h-screen p-6 space-y-8 animate-in fade-in duration-300">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="material-symbols-outlined !text-[28px] text-[#CCFF00]">science</span>
            <h1 className="tight-tracking text-2xl font-black text-white">Sandbox</h1>
            <span className="px-2 py-1 rounded-full bg-[#CCFF00]/10 border border-[#CCFF00]/20 text-[9px] font-black label-tracking text-[#CCFF00]">
              MODO PRUEBAS
            </span>
          </div>
          <p className="text-sm text-white/50">
            Simula integraciones reales sin credenciales. Los datos son ficticios — idénticos en forma a los de producción.
          </p>
        </div>
        <button
          onClick={handleReset}
          disabled={resetting || loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-semibold hover:bg-red-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <span className="material-symbols-outlined !text-[16px]">
            {resetting ? 'hourglass_empty' : 'restart_alt'}
          </span>
          {resetting ? 'Reiniciando...' : 'Reset Sandbox'}
        </button>
      </div>

      {/* Mode banner */}
      {status && (
        <div className="glass-card p-4 flex items-center gap-3 border-[#CCFF00]/20">
          <span className="material-symbols-outlined !text-[20px] text-[#CCFF00]">info</span>
          <div className="flex-1">
            <span className="text-sm text-white/70">
              Modo activo:{' '}
              <span className="font-bold text-[#CCFF00]">{status.mode}</span>
              {' · '}
              <span className="text-white/50">{status.sync_log_count} eventos en el log</span>
            </span>
          </div>
        </div>
      )}

      {/* Integration cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="glass-card p-6 animate-pulse h-48" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(INTEGRATION_CFG).map(([key, cfg]) => {
            const state = status?.integrations[key]
            const isSyncing = syncing[key]
            return (
              <div key={key} className="glass-card p-6 space-y-4 group hover:border-white/10 transition-all">
                {/* Card header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center`}>
                      <span className={`material-symbols-outlined !text-[22px] ${cfg.color}`}>
                        {cfg.icon}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className={`font-bold text-sm tight-tracking ${cfg.color}`}>{cfg.label}</h3>
                        {state && <StatusDot status={state.status} />}
                      </div>
                      <p className="text-[11px] text-white/40 mt-0.5">{cfg.description}</p>
                    </div>
                  </div>
                  {state && (
                    <span className={`text-[10px] label-tracking px-2 py-0.5 rounded-full font-bold
                      ${state.status === 'connected'
                        ? 'bg-[#CCFF00]/10 text-[#CCFF00]'
                        : state.status === 'error'
                        ? 'bg-red-500/10 text-red-400'
                        : 'bg-white/5 text-white/30'}`}>
                      {state.status.toUpperCase()}
                    </span>
                  )}
                </div>

                {/* Rate bar */}
                {state && (
                  <RateBar calls={state.api_calls_today} limit={state.rate_limit} />
                )}

                {/* Last sync */}
                {state && (
                  <div className="flex items-center gap-2 text-[11px] text-white/30">
                    <span className="material-symbols-outlined !text-[13px]">schedule</span>
                    Último sync: {new Date(state.last_sync).toLocaleString('es-MX')}
                  </div>
                )}

                {/* Sync button */}
                <button
                  onClick={() => handleSync(key)}
                  disabled={isSyncing || !state}
                  className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-semibold transition-all
                    disabled:opacity-40 disabled:cursor-not-allowed
                    ${cfg.color === 'text-[#CCFF00]'
                      ? 'bg-[#CCFF00]/10 border-[#CCFF00]/20 text-[#CCFF00] hover:bg-[#CCFF00]/20'
                      : cfg.color === 'text-yellow-400'
                      ? 'bg-yellow-400/10 border-yellow-400/20 text-yellow-400 hover:bg-yellow-400/20'
                      : cfg.color === 'text-orange-400'
                      ? 'bg-orange-400/10 border-orange-400/20 text-orange-400 hover:bg-orange-400/20'
                      : 'bg-blue-400/10 border-blue-400/20 text-blue-400 hover:bg-blue-400/20'
                    }`}
                >
                  <span className={`material-symbols-outlined !text-[16px] ${isSyncing ? 'animate-spin' : ''}`}>
                    {isSyncing ? 'progress_activity' : 'sync'}
                  </span>
                  {isSyncing ? 'Sincronizando...' : 'Simular Sync'}
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Amazon SP-API Real Connection */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="material-symbols-outlined !text-[16px] text-orange-400">link</span>
          <h2 className="text-sm font-bold label-tracking text-white/60">CONEXIÓN AMAZON SP-API REAL</h2>
        </div>

        <div className="glass-card p-6">
          {amazonLoading ? (
            <div className="animate-pulse h-24 rounded-lg bg-white/5" />
          ) : amazonStatus?.connected ? (
            /* Connected state */
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-400/10 flex items-center justify-center">
                    <span className="material-symbols-outlined !text-[22px] text-orange-400">inventory_2</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-orange-400 tight-tracking">Amazon</span>
                      <span className="w-2 h-2 rounded-full bg-[#CCFF00] shadow-[0_0_6px_#CCFF00]" />
                    </div>
                    <p className="text-[11px] text-white/40 mt-0.5">SP-API · acceso real a tu cuenta de vendedor</p>
                  </div>
                </div>
                <span className="text-[10px] label-tracking px-2 py-0.5 rounded-full font-bold bg-[#CCFF00]/10 text-[#CCFF00]">
                  CONECTADO
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="bg-white/5 rounded-xl p-3">
                  <p className="text-[10px] label-tracking text-white/30 mb-1">SELLER ID</p>
                  <p className="text-sm font-mono font-bold text-white/80">{amazonStatus.seller_id}</p>
                </div>
                <div className="bg-white/5 rounded-xl p-3">
                  <p className="text-[10px] label-tracking text-white/30 mb-1">MARKETPLACE</p>
                  <p className="text-sm font-bold text-white/80">
                    {MARKETPLACE_LABELS[amazonStatus.marketplace_id ?? ''] ?? amazonStatus.marketplace_id}
                  </p>
                </div>
                {amazonStatus.connected_at && (
                  <div className="bg-white/5 rounded-xl p-3 col-span-2">
                    <p className="text-[10px] label-tracking text-white/30 mb-1">CONECTADO EL</p>
                    <p className="text-sm text-white/60">
                      {new Date(amazonStatus.connected_at).toLocaleString('es-MX')}
                    </p>
                  </div>
                )}
              </div>

              <button
                onClick={handleAmazonDisconnect}
                disabled={amazonDisconnecting}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 text-sm font-semibold hover:bg-red-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span className={`material-symbols-outlined !text-[16px] ${amazonDisconnecting ? 'animate-spin' : ''}`}>
                  {amazonDisconnecting ? 'progress_activity' : 'link_off'}
                </span>
                {amazonDisconnecting ? 'Desconectando...' : 'Desconectar cuenta Amazon'}
              </button>
            </div>
          ) : (
            /* Disconnected state */
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                  <span className="material-symbols-outlined !text-[22px] text-white/30">inventory_2</span>
                </div>
                <div>
                  <p className="font-bold text-sm text-white/50 tight-tracking">Amazon SP-API</p>
                  <p className="text-[11px] text-white/30 mt-0.5">Sin conexión — usando datos simulados</p>
                </div>
              </div>

              <p className="text-xs text-white/40 leading-relaxed">
                Conecta tu cuenta de vendedor de Amazon para que KINEXIS acceda a órdenes,
                inventario FBA y catálogo en tiempo real. Requiere credenciales LWA configuradas en el servidor.
              </p>

              <button
                onClick={handleAmazonConnect}
                disabled={amazonConnecting}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-orange-400/20 bg-orange-400/10 text-orange-400 text-sm font-semibold hover:bg-orange-400/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span className={`material-symbols-outlined !text-[16px] ${amazonConnecting ? 'animate-spin' : ''}`}>
                  {amazonConnecting ? 'progress_activity' : 'add_link'}
                </span>
                {amazonConnecting ? 'Redirigiendo a Amazon...' : 'Conectar cuenta Amazon'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Info footer */}
      <div className="glass-card p-5 border-white/5">
        <div className="flex items-start gap-3">
          <span className="material-symbols-outlined !text-[18px] text-white/30 mt-0.5">help_outline</span>
          <div className="space-y-1">
            <p className="text-xs font-semibold text-white/50 label-tracking">SOBRE EL SANDBOX</p>
            <p className="text-xs text-white/30 leading-relaxed">
              Los datos simulados reproducen fielmente la forma de las respuestas reales (mismos campos, tipos y estructuras).
              Al conectar credenciales reales en Ajustes → Integraciones, el sistema cambia automáticamente a PRODUCTION
              y los módulos consumen datos auténticos sin necesidad de cambios en el frontend.
            </p>
          </div>
        </div>
      </div>

    </div>
  )
}
