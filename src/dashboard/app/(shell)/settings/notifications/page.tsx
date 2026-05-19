'use client'

import { useState, useEffect } from 'react'
import { useToast } from '@/components/ToastProvider'
import { authenticatedFetch } from '@/lib/api-client'

interface NotifPrefs {
  new_orders: boolean
  low_stock: boolean
  critical_errors: boolean
  weekly_reports: boolean
  cfdi_expiry: boolean
  payment_received: boolean
  slack_webhook: string
  whatsapp_number: string
  email_enabled: boolean
}

const DEFAULT_PREFS: NotifPrefs = {
  new_orders: true,
  low_stock: true,
  critical_errors: true,
  weekly_reports: false,
  cfdi_expiry: true,
  payment_received: true,
  slack_webhook: '',
  whatsapp_number: '',
  email_enabled: true,
}

interface ToggleItem {
  key: keyof NotifPrefs
  label: string
  description: string
  icon: string
}

const EMAIL_TOGGLES: ToggleItem[] = [
  { key: 'new_orders',      label: 'Nuevas órdenes',      description: 'Notificación al recibir un pedido en cualquier canal', icon: 'shopping_cart' },
  { key: 'low_stock',       label: 'Stock bajo',           description: 'Alerta cuando un SKU cae por debajo del mínimo',       icon: 'inventory' },
  { key: 'critical_errors', label: 'Errores críticos',     description: 'Fallas en agentes, webhooks o sincronización',        icon: 'error' },
  { key: 'weekly_reports',  label: 'Reportes semanales',   description: 'Resumen de ventas, gastos y KPIs cada lunes',         icon: 'assessment' },
  { key: 'cfdi_expiry',     label: 'Vencimiento CFDI',     description: 'Aviso 5 días antes de que venza una factura',         icon: 'receipt_long' },
  { key: 'payment_received', label: 'Pagos recibidos',     description: 'Confirmación cuando se registra un pago',            icon: 'payments' },
]

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${checked ? 'bg-primary' : 'bg-white/10'}`}
    >
      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-black transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  )
}

export default function NotificationsPage() {
  const { showToast } = useToast()
  const [prefs, setPrefs] = useState<NotifPrefs>(DEFAULT_PREFS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    authenticatedFetch('/api/settings/profile')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.user?.preferences?.notifications) {
          setPrefs(p => ({ ...p, ...d.user.preferences.notifications }))
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const set = <K extends keyof NotifPrefs>(key: K, value: NotifPrefs[K]) =>
    setPrefs(p => ({ ...p, [key]: value }))

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await authenticatedFetch('/api/settings/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences: { notifications: prefs } }),
      })
      if (res.ok) showToast({ type: 'success', title: 'Guardado', message: 'Preferencias de notificación actualizadas' })
      else showToast({ type: 'error', title: 'Error', message: 'No se pudo guardar' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-10 animate-in">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <span className="text-[0.75rem] font-bold label-tracking text-primary drop-shadow-[0_0_8px_rgba(204,255,0,0.2)]">
            Configuración / Notificaciones
          </span>
          <h1 className="text-4xl md:text-5xl font-black tight-tracking text-on-surface">Notificaciones</h1>
          <p className="text-sm text-on-surface-variant">Controla qué alertas recibes y por qué canal</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || loading}
          className="px-8 py-3 rounded-2xl bg-primary text-black text-[10px] font-black label-tracking hover:bg-primary/90 transition-all disabled:opacity-50 self-start md:self-auto"
        >
          {saving ? 'GUARDANDO…' : 'GUARDAR CAMBIOS'}
        </button>
      </header>

      {/* Email notifications */}
      <div className="glass-card rounded-[2rem] border border-white/5 overflow-hidden">
        <div className="flex items-center justify-between px-8 py-5 border-b border-white/5">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined !text-[18px] text-blue-400">email</span>
            <div>
              <p className="font-black text-sm text-on-surface">Email</p>
              <p className="text-[10px] text-on-surface/40">Notificaciones al correo registrado</p>
            </div>
          </div>
          <Toggle checked={prefs.email_enabled} onChange={v => set('email_enabled', v)} />
        </div>
        <div className={`divide-y divide-white/5 transition-opacity ${prefs.email_enabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
          {EMAIL_TOGGLES.map(item => (
            <div key={item.key} className="flex items-center justify-between px-8 py-5 hover:bg-white/[0.02] transition-colors">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined !text-[16px] text-on-surface/30">{item.icon}</span>
                <div>
                  <p className="text-xs font-bold text-on-surface">{item.label}</p>
                  <p className="text-[10px] text-on-surface/40 mt-0.5">{item.description}</p>
                </div>
              </div>
              <Toggle checked={prefs[item.key] as boolean} onChange={v => set(item.key, v)} />
            </div>
          ))}
        </div>
      </div>

      {/* Slack */}
      <div className="glass-card rounded-[2rem] border border-white/5 p-8 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <span className="material-symbols-outlined !text-[18px] text-purple-400">forum</span>
          <div>
            <p className="font-black text-sm text-on-surface">Slack</p>
            <p className="text-[10px] text-on-surface/40">Webhook para alertas en tu canal de Slack</p>
          </div>
        </div>
        <input
          type="url"
          placeholder="https://hooks.slack.com/services/..."
          value={prefs.slack_webhook}
          onChange={e => set('slack_webhook', e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs font-mono text-on-surface placeholder:text-on-surface/20 focus:border-primary/50 outline-none"
        />
        <button
          onClick={() => showToast({ type: 'info', title: 'Test enviado', message: 'Mensaje de prueba enviado al webhook' })}
          className="px-4 py-2 rounded-xl bg-purple-400/10 border border-purple-400/20 text-purple-400 text-[9px] font-black hover:bg-purple-400/20 transition-colors"
        >
          ENVIAR TEST
        </button>
      </div>

      {/* WhatsApp */}
      <div className="glass-card rounded-[2rem] border border-white/5 p-8 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <span className="material-symbols-outlined !text-[18px] text-[#CCFF00]">chat</span>
          <div>
            <p className="font-black text-sm text-on-surface">WhatsApp</p>
            <p className="text-[10px] text-on-surface/40">Número para recibir notificaciones críticas vía WA</p>
          </div>
        </div>
        <input
          type="tel"
          placeholder="+52 55 1234 5678"
          value={prefs.whatsapp_number}
          onChange={e => set('whatsapp_number', e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-on-surface placeholder:text-on-surface/20 focus:border-primary/50 outline-none"
        />
      </div>

      <div className="h-10" />
    </div>
  )
}
