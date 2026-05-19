'use client'

import { useState, useEffect } from 'react'
import { useToast } from '@/components/ToastProvider'
import { authenticatedFetch } from '@/lib/api-client'

interface VaultKeys { [key: string]: boolean }

interface Integration {
  id: string
  name: string
  description: string
  icon: string
  color: string
  keys: string[]
  type: 'oauth' | 'apikey'
  authUrl?: string
  docsUrl: string
}

const INTEGRATIONS: Integration[] = [
  { id: 'amazon', name: 'Amazon SP-API', description: 'Sincroniza productos, inventario y órdenes Amazon', icon: 'inventory_2', color: '#fb923c', keys: ['amazon_sp_api_key', 'amazon_seller_id'], type: 'oauth', authUrl: '/api/integrations/amazon/authorize', docsUrl: 'https://developer.amazon.com/SP-API' },
  { id: 'ml', name: 'Mercado Libre', description: 'Gestión completa de listings y fulfillment ML', icon: 'storefront', color: '#facc15', keys: ['ml_access_token', 'ml_client_id'], type: 'oauth', authUrl: '/api/integrations/ml/authorize', docsUrl: 'https://developers.mercadolibre.com.mx' },
  { id: 'shopify', name: 'Shopify', description: 'Tienda en línea propia — productos, pedidos, clientes', icon: 'shopping_bag', color: '#4ade80', keys: ['shopify_api_key', 'shopify_store_url'], type: 'apikey', docsUrl: 'https://shopify.dev/docs/api/admin' },
  { id: 'whatsapp', name: 'WhatsApp Business', description: 'Atención al cliente y notificaciones automáticas', icon: 'chat', color: '#4ade80', keys: ['meta_access_token'], type: 'apikey', docsUrl: 'https://developers.facebook.com/docs/whatsapp' },
  { id: 'facturapi', name: 'FacturAPI', description: 'Timbrado CFDI 4.0 — facturas, notas de crédito', icon: 'receipt_long', color: '#60a5fa', keys: ['facturapi_api_key'], type: 'apikey', docsUrl: 'https://www.facturapi.io/docs' },
  { id: 'skydropx', name: 'Skydropx', description: 'Guías multi-carrier: FedEx, DHL, Estafeta, J&T', icon: 'local_shipping', color: '#a78bfa', keys: ['skydrop_api_key'], type: 'apikey', docsUrl: 'https://developers.skydropx.com' },
  { id: 'stripe', name: 'Stripe', description: 'Pagos, suscripciones y facturación recurrente', icon: 'credit_card', color: '#60a5fa', keys: ['stripe_secret_key', 'stripe_webhook_secret'], type: 'oauth', authUrl: '/api/integrations/stripe/authorize', docsUrl: 'https://stripe.com/docs' },
]

function statusFor(integration: Integration, keys: VaultKeys) {
  const configured = integration.keys.filter(k => keys[k]).length
  if (configured === 0) return 'pending'
  if (configured < integration.keys.length) return 'partial'
  return 'connected'
}

const STATUS_CFG = {
  connected: { label: 'Conectado',  color: 'text-[#CCFF00]',  bg: 'bg-[#CCFF00]/10',  border: 'border-[#CCFF00]/20', icon: 'check_circle'   },
  partial:   { label: 'Incompleto', color: 'text-amber-400',   bg: 'bg-amber-400/10',   border: 'border-amber-400/20', icon: 'warning'        },
  pending:   { label: 'Pendiente',  color: 'text-on-surface/40', bg: 'bg-white/5',       border: 'border-white/10',    icon: 'radio_button_unchecked' },
}

export default function IntegrationsPage() {
  const { showToast } = useToast()
  const [keys, setKeys] = useState<VaultKeys>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [editId, setEditId] = useState<string | null>(null)
  const [keyInputs, setKeyInputs] = useState<Record<string, string>>({})

  useEffect(() => {
    authenticatedFetch('/api/settings/vault')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.keys) setKeys(d.keys) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async (integration: Integration) => {
    setSaving(integration.id)
    try {
      const payload: Record<string, string> = {}
      for (const k of integration.keys) {
        if (keyInputs[k]) payload[k] = keyInputs[k]
      }
      const res = await authenticatedFetch('/api/settings/vault', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keys: payload }),
      })
      if (res.ok) {
        setKeys(prev => {
          const next = { ...prev }
          for (const k of Object.keys(payload)) next[k] = true
          return next
        })
        setKeyInputs({})
        setEditId(null)
        showToast({ type: 'success', title: 'Integración guardada', message: `${integration.name} configurada correctamente` })
      } else {
        showToast({ type: 'error', title: 'Error', message: 'No se pudo guardar. Verifica el rol.' })
      }
    } finally {
      setSaving(null)
    }
  }

  const connected = INTEGRATIONS.filter(i => statusFor(i, keys) === 'connected').length

  return (
    <div className="space-y-10 animate-in">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <span className="text-[0.75rem] font-bold label-tracking text-primary drop-shadow-[0_0_8px_rgba(204,255,0,0.2)]">
            Configuración / Integraciones
          </span>
          <h1 className="text-4xl md:text-5xl font-black tight-tracking text-on-surface">Integraciones</h1>
          <p className="text-sm text-on-surface-variant">
            {loading ? '…' : `${connected} de ${INTEGRATIONS.length} integraciones activas`}
          </p>
        </div>
        <div className="flex gap-3 items-center">
          <span className={`px-3 py-1.5 rounded-full text-[9px] font-black label-tracking border ${
            loading ? 'border-white/10 text-white/30' :
            connected === INTEGRATIONS.length ? 'border-[#CCFF00]/30 bg-[#CCFF00]/10 text-[#CCFF00]' :
            'border-amber-400/30 bg-amber-400/10 text-amber-400'
          }`}>
            {loading ? 'CARGANDO' : connected === INTEGRATIONS.length ? 'TODO ACTIVO' : `${INTEGRATIONS.length - connected} PENDIENTE${INTEGRATIONS.length - connected !== 1 ? 'S' : ''}`}
          </span>
        </div>
      </header>

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Conectadas',  value: connected,                           color: 'text-[#CCFF00]' },
          { label: 'Pendientes',  value: INTEGRATIONS.length - connected,     color: 'text-amber-400' },
          { label: 'Total',       value: INTEGRATIONS.length,                 color: 'text-on-surface' },
        ].map(s => (
          <div key={s.label} className="glass-card rounded-[1.5rem] border border-white/5 p-6">
            <p className="text-[9px] font-black label-tracking text-on-surface/40 uppercase mb-2">{s.label}</p>
            <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Integration cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {INTEGRATIONS.map(integration => {
          const status = loading ? 'pending' : statusFor(integration, keys)
          const sCfg = STATUS_CFG[status]
          const isEditing = editId === integration.id

          return (
            <div key={integration.id} className={`glass-card rounded-[2rem] border p-6 space-y-4 transition-colors ${
              status === 'connected' ? 'border-[#CCFF00]/10' : 'border-white/5 hover:border-white/10'
            }`}>
              {/* Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${integration.color}15` }}>
                    <span className="material-symbols-outlined !text-[20px]" style={{ color: integration.color }}>{integration.icon}</span>
                  </div>
                  <div>
                    <p className="font-black text-sm text-on-surface">{integration.name}</p>
                    <p className="text-[10px] text-on-surface/40 mt-0.5">{integration.description}</p>
                  </div>
                </div>
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black border ${sCfg.color} ${sCfg.bg} ${sCfg.border} flex-shrink-0`}>
                  <span className="material-symbols-outlined !text-[10px]">{sCfg.icon}</span>
                  {sCfg.label.toUpperCase()}
                </span>
              </div>

              {/* Key status */}
              <div className="flex flex-wrap gap-2">
                {integration.keys.map(k => (
                  <span key={k} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-mono border ${
                    keys[k] ? 'bg-[#CCFF00]/10 border-[#CCFF00]/20 text-[#CCFF00]' : 'bg-white/5 border-white/10 text-on-surface/30'
                  }`}>
                    <span className="material-symbols-outlined !text-[9px]">{keys[k] ? 'lock' : 'key_off'}</span>
                    {k}
                  </span>
                ))}
              </div>

              {/* Edit form */}
              {isEditing && (
                <div className="space-y-2 pt-2 border-t border-white/5">
                  {integration.keys.map(k => (
                    <div key={k}>
                      <label className="text-[9px] font-black label-tracking text-on-surface/40 uppercase block mb-1">{k}</label>
                      <input
                        type="password"
                        placeholder={`Ingresa ${k}`}
                        value={keyInputs[k] ?? ''}
                        onChange={e => setKeyInputs(prev => ({ ...prev, [k]: e.target.value }))}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs font-mono text-on-surface placeholder:text-on-surface/20 focus:border-primary/50 outline-none"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                {isEditing ? (
                  <>
                    <button
                      onClick={() => handleSave(integration)}
                      disabled={saving === integration.id}
                      className="flex-1 px-3 py-2 rounded-xl bg-primary text-black text-[9px] font-black label-tracking hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                      {saving === integration.id ? 'GUARDANDO…' : 'GUARDAR KEYS'}
                    </button>
                    <button
                      onClick={() => { setEditId(null); setKeyInputs({}) }}
                      className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-on-surface/40 text-[9px] font-black"
                    >
                      CANCELAR
                    </button>
                  </>
                ) : (
                  <>
                    {integration.type === 'oauth' && status !== 'connected' ? (
                      <button
                        onClick={() => showToast({ type: 'info', title: `Conectar ${integration.name}`, message: 'Redirigiendo a OAuth…' })}
                        className="flex-1 px-3 py-2 rounded-xl text-[9px] font-black label-tracking transition-colors"
                        style={{ backgroundColor: `${integration.color}20`, color: integration.color, border: `1px solid ${integration.color}30` }}
                      >
                        CONECTAR VÍA OAUTH
                      </button>
                    ) : (
                      <button
                        onClick={() => setEditId(integration.id)}
                        className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-on-surface/60 text-[9px] font-black hover:bg-white/10 transition-colors flex items-center justify-center gap-1"
                      >
                        <span className="material-symbols-outlined !text-[11px]">{status === 'connected' ? 'edit' : 'add'}</span>
                        {status === 'connected' ? 'EDITAR KEYS' : 'INGRESAR KEYS'}
                      </button>
                    )}
                    <a
                      href={integration.docsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-on-surface/40 text-[9px] font-black hover:bg-white/10 transition-colors flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined !text-[11px]">open_in_new</span>
                      DOCS
                    </a>
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="h-10" />
    </div>
  )
}
