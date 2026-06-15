'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { CheckCircle, AlertCircle, Loader2, Link2, Link2Off, ExternalLink } from 'lucide-react'

// ── types ──────────────────────────────────────────────────────────────────────

interface PlatformStatus {
  connected:     boolean
  label?:        string
  detail?:       string
  ml_nickname?:  string
  fb_name?:      string
  seller_id?:    string
  [key: string]: unknown
}

interface AllStatuses {
  ml:     PlatformStatus
  meta:   PlatformStatus
  amazon: PlatformStatus
}

// ── static platform config ────────────────────────────────────────────────────

const OAUTH_PLATFORMS = [
  {
    key: 'ml' as const,
    name: 'Mercado Libre',
    category: 'E-commerce',
    description: 'Sincroniza productos, pedidos y preguntas. Un solo clic conecta tu cuenta de vendedor.',
    icon: '🛒',
    docs: 'https://developers.mercadolibre.com.mx',
    successParam: 'ml',
    connectedLabel: (s: PlatformStatus) => s.label || 'Cuenta MercadoLibre conectada',
  },
  {
    key: 'meta' as const,
    name: 'Meta Business',
    category: 'Mensajería',
    description: 'Conecta WhatsApp Business, Instagram DMs y Facebook Messenger en un solo flujo de autorización.',
    icon: '💬',
    docs: 'https://developers.facebook.com/docs',
    successParam: 'meta',
    connectedLabel: (s: PlatformStatus) => s.label || 'WhatsApp + Instagram + Facebook conectados',
  },
  {
    key: 'amazon' as const,
    name: 'Amazon SP-API',
    category: 'E-commerce',
    description: 'Autoriza el acceso a tu cuenta de Seller Central. Gestiona FBA, inventario y reportes.',
    icon: '📦',
    docs: 'https://developer-docs.amazon.com/sp-api',
    successParam: 'amazon',
    connectedLabel: (s: PlatformStatus) => s.label || `Seller ${s.detail || ''} conectado`,
  },
]

const STATIC_SERVICES = [
  { name: 'Supabase',         category: 'Base de datos', desc: 'PostgreSQL + RLS + Auth.', active: true  },
  { name: 'FacturAPI (CFDI)', category: 'Fiscal',        desc: 'Timbrado CFDI 4.0 ante el SAT.', active: true  },
  { name: 'Stripe',           category: 'Pagos',         desc: 'Suscripciones KINEXIS.', active: true  },
  { name: 'Skydropx',         category: 'Logística',     desc: 'Generación de guías de envío.', active: true  },
  { name: 'Google Gemini',    category: 'IA',            desc: 'LLM principal de Samantha.', active: true  },
  { name: 'Resend',           category: 'Email',         desc: 'Transaccional y notificaciones.', active: true  },
]

// ── component ─────────────────────────────────────────────────────────────────

export default function IntegrationsPage() {
  const searchParams  = useSearchParams()
  const router        = useRouter()
  const [statuses,    setStatuses]    = useState<AllStatuses | null>(null)
  const [loading,     setLoading]     = useState(true)
  const [connecting,  setConnecting]  = useState<string | null>(null)
  const [toast,       setToast]       = useState<{ msg: string; ok: boolean } | null>(null)

  const showToast = useCallback((msg: string, ok: boolean) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 4000)
  }, [])

  // Detect OAuth callback result from URL params
  useEffect(() => {
    const checks: Array<[string, string]> = [
      ['ml',     'MercadoLibre'],
      ['meta',   'Meta Business'],
      ['amazon', 'Amazon'],
    ]
    for (const [param, label] of checks) {
      const val = searchParams.get(param)
      if (val === 'connected') { showToast(`${label} conectado correctamente`, true);  break }
      if (val === 'error')     { showToast(`Error al conectar ${label}`, false);        break }
      if (val === 'invalid_state') { showToast('Sesión expirada, intenta de nuevo', false); break }
    }
    if (searchParams.size > 0) {
      router.replace('/settings/integrations', { scroll: false })
    }
  }, [searchParams, showToast, router])

  // Fetch real connection statuses
  const fetchStatuses = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/integrations/status')
      if (res.ok) {
        const data: AllStatuses = await res.json()
        // Map backend fields to display labels
        if (data.ml?.connected)     data.ml.label     = `@${data.ml?.['ml_nickname'] || 'cuenta ML'}`
        if (data.meta?.connected)   data.meta.label   = data.meta?.['fb_name'] || 'Cuenta Meta'
        if (data.amazon?.connected) data.amazon.label  = `Seller ${data.amazon?.['seller_id'] || ''}`
        setStatuses(data)
      }
    } catch { /* backend offline — show all as not connected */ }
    finally  { setLoading(false) }
  }, [])

  useEffect(() => { fetchStatuses() }, [fetchStatuses])

  const handleConnect = async (platform: string) => {
    setConnecting(platform)
    try {
      const res  = await fetch(`/api/integrations/connect?platform=${platform}`)
      const data = await res.json()
      if (data.auth_url) {
        window.location.href = data.auth_url
      } else {
        showToast(data.detail || 'No se pudo iniciar la conexión', false)
        setConnecting(null)
      }
    } catch {
      showToast('Error de conexión', false)
      setConnecting(null)
    }
  }

  const handleDisconnect = async (platform: string, name: string) => {
    if (!confirm(`¿Desconectar ${name}? Se eliminarán las credenciales guardadas.`)) return
    try {
      await fetch(`/api/integrations/disconnect?platform=${platform}`, { method: 'DELETE' })
      showToast(`${name} desconectado`, true)
      fetchStatuses()
    } catch {
      showToast('Error al desconectar', false)
    }
  }

  const statusOf = (key: 'ml' | 'meta' | 'amazon'): PlatformStatus =>
    statuses?.[key] ?? { connected: false }

  return (
    <div className="flex flex-col gap-8 p-6 max-w-5xl">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white transition-all
          ${toast.ok ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.ok ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Integraciones</h1>
        <p className="text-sm text-gray-500 mt-1">Conecta tus canales de venta y mensajería — las credenciales se guardan automáticamente</p>
      </div>

      {/* OAuth platforms */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Conectar con OAuth</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {OAUTH_PLATFORMS.map(p => {
            const st       = statusOf(p.key)
            const isConn   = st.connected
            const isBusy   = connecting === p.key
            return (
              <div key={p.key}
                className={`bg-white rounded-xl border p-5 flex flex-col gap-4 shadow-sm transition-all
                  ${isConn ? 'border-green-200 bg-green-50/30' : 'border-gray-100'}`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{p.icon}</span>
                      <div>
                        <h3 className="font-semibold text-gray-900 leading-tight">{p.name}</h3>
                        <span className="text-xs text-gray-400">{p.category}</span>
                      </div>
                    </div>
                  </div>
                  {loading ? (
                    <Loader2 className="w-4 h-4 text-gray-300 animate-spin mt-1" />
                  ) : isConn ? (
                    <span className="flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                      <CheckCircle className="w-3 h-3" /> Activo
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Sin conectar</span>
                  )}
                </div>

                <p className="text-sm text-gray-500 flex-1">{p.description}</p>

                {isConn && (
                  <p className="text-xs text-green-700 font-medium bg-green-100 rounded-lg px-3 py-1.5">
                    {p.connectedLabel(st)}
                  </p>
                )}

                <div className="flex items-center gap-2 mt-auto pt-1">
                  {isConn ? (
                    <button
                      onClick={() => handleDisconnect(p.key, p.name)}
                      className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-600 font-medium transition-colors"
                    >
                      <Link2Off className="w-3.5 h-3.5" /> Desconectar
                    </button>
                  ) : (
                    <button
                      onClick={() => handleConnect(p.key)}
                      disabled={isBusy}
                      className="flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      {isBusy
                        ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Redirigiendo…</>
                        : <><Link2 className="w-3.5 h-3.5" /> Conectar</>
                      }
                    </button>
                  )}
                  <a href={p.docs} target="_blank" rel="noreferrer"
                    className="ml-auto text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">
                    <ExternalLink className="w-3 h-3" /> Docs
                  </a>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Static services */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Servicios configurados</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {STATIC_SERVICES.map(s => (
            <div key={s.name} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3 shadow-sm">
              <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-gray-900">{s.name}</p>
                <p className="text-xs text-gray-400">{s.desc}</p>
              </div>
              <span className="ml-auto text-xs text-green-700 bg-green-100 px-2 py-0.5 rounded-full font-medium shrink-0">Activo</span>
            </div>
          ))}
        </div>
      </section>

    </div>
  )
}
