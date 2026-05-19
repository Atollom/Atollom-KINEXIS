'use client'

import { useState, useEffect } from 'react'
import { CheckCircle } from 'lucide-react'
import { authenticatedFetch } from '@/lib/api-client'
import { useToast } from '@/components/ToastProvider'

interface BillingData {
  plan: string
  price: number
  active_modules: string[]
  has_stripe: boolean
  tenant_name: string
  member_since: string | null
}

const PLANS = [
  {
    id: 'Starter',
    price: '$6,500',
    features: [
      '1 Módulo a elegir',
      '500 conversaciones Samantha/mes',
      '100 Timbres CFDI',
      '3 usuarios',
      '50 GB almacenamiento',
      'Soporte email 48h',
    ],
  },
  {
    id: 'Growth',
    price: '$10,500',
    featured: true,
    features: [
      '2 Módulos a elegir',
      '750 conversaciones Samantha/mes',
      '150 Timbres CFDI',
      '5 usuarios',
      '100 GB almacenamiento',
      'Soporte chat 24h',
    ],
  },
  {
    id: 'Pro',
    price: '$16,500',
    features: [
      'Suite Completa (3 módulos)',
      '1,000 conversaciones Samantha/mes',
      '200 Timbres CFDI',
      'Usuarios ilimitados',
      '200 GB almacenamiento',
      'Soporte WhatsApp 12h',
    ],
  },
]

export default function BillingPage() {
  const { showToast } = useToast()
  const [billing, setBilling] = useState<BillingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    authenticatedFetch('/api/settings/billing')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setBilling(d) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleUpgrade = async (planId: string) => {
    setActionLoading(planId)
    try {
      const res = await authenticatedFetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan_type: planId.toLowerCase() }),
      })
      const data = await res.json() as { url?: string; error?: string }
      if (data.url) {
        window.location.href = data.url
      } else {
        showToast({ type: 'error', title: 'Error', message: data.error ?? 'No se pudo iniciar el pago' })
      }
    } catch {
      showToast({ type: 'error', title: 'Error de red', message: 'Intenta de nuevo' })
    } finally {
      setActionLoading(null)
    }
  }

  const handlePortal = async () => {
    setActionLoading('portal')
    try {
      const res = await authenticatedFetch('/api/stripe/portal', { method: 'POST' })
      const data = await res.json() as { url?: string }
      if (data.url) window.location.href = data.url
    } catch {
      showToast({ type: 'error', title: 'Error', message: 'No se pudo abrir el portal' })
    } finally {
      setActionLoading(null)
    }
  }

  const currentPlan = billing?.plan ?? 'Growth'

  return (
    <div className="space-y-10 animate-in">
      <header className="space-y-2">
        <span className="text-[0.75rem] font-bold label-tracking text-primary drop-shadow-[0_0_8px_rgba(204,255,0,0.2)]">
          Configuración / Facturación
        </span>
        <div className="flex items-center gap-3">
          <h1 className="text-4xl md:text-5xl font-black tight-tracking text-on-surface">Facturación & Planes</h1>
          <span className={`px-2 py-1 rounded-full text-[9px] font-black label-tracking border ${
            loading ? 'border-white/10 text-white/30' : 'border-green-500/30 bg-green-500/10 text-green-400'
          }`}>
            {loading ? 'CARGANDO' : 'LIVE'}
          </span>
        </div>
        <p className="text-sm text-on-surface-variant">Gestiona tu suscripción y plan activo</p>
      </header>

      {/* Current plan card */}
      <div className="glass-card rounded-[2rem] border border-primary/20 p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-3xl">workspace_premium</span>
          </div>
          <div>
            <p className="text-[9px] font-black label-tracking text-on-surface/40 uppercase mb-1">Plan Actual</p>
            <h2 className="text-2xl font-black text-on-surface">
              {loading ? '…' : `Plan ${currentPlan}`}
            </h2>
            <p className="text-sm text-primary font-black mt-1">
              {loading ? '' : `$${(billing?.price ?? 0).toLocaleString()} MXN/mes`}
            </p>
            {billing?.member_since && (
              <p className="text-[9px] text-on-surface/30 mt-1">
                Desde {new Date(billing.member_since).toLocaleDateString('es-MX', { year: 'numeric', month: 'long' })}
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          {billing?.active_modules?.map(mod => (
            <span key={mod} className="px-3 py-1 rounded-xl bg-white/5 border border-white/10 text-[9px] font-black text-on-surface/60 uppercase">
              {mod}
            </span>
          ))}
          <button
            onClick={handlePortal}
            disabled={actionLoading === 'portal'}
            className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-black text-on-surface hover:bg-white/10 transition-all disabled:opacity-50"
          >
            {actionLoading === 'portal' ? 'Cargando…' : 'Portal de Facturación →'}
          </button>
        </div>
      </div>

      {/* Plan cards */}
      <div>
        <h3 className="text-sm font-black text-on-surface mb-1">Cambiar de Plan</h3>
        <p className="text-[10px] text-on-surface/40 uppercase label-tracking mb-6">Precios en MXN · IVA no incluido</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map(plan => {
            const isActive = currentPlan === plan.id
            return (
              <div
                key={plan.id}
                className={`relative glass-card rounded-[2rem] p-6 flex flex-col border ${
                  isActive ? 'border-primary/40 bg-primary/5' : plan.featured ? 'border-white/10' : 'border-white/5'
                }`}
              >
                {isActive && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-black text-[9px] font-black px-3 py-1 rounded-full uppercase label-tracking">
                    Plan Activo
                  </span>
                )}
                {plan.featured && !isActive && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white/10 text-on-surface text-[9px] font-black px-3 py-1 rounded-full uppercase label-tracking">
                    Más Popular
                  </span>
                )}

                <h4 className="text-lg font-black text-on-surface mb-1">{plan.id}</h4>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-3xl font-black text-on-surface">{plan.price}</span>
                  <span className="text-sm text-on-surface/40">MXN/mes</span>
                </div>

                <ul className="space-y-2.5 flex-1 mb-6">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-[11px] text-on-surface/60">
                      <CheckCircle className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => !isActive && handleUpgrade(plan.id)}
                  disabled={isActive || actionLoading !== null}
                  className={`w-full py-3 rounded-xl text-[10px] font-black uppercase label-tracking transition-all disabled:opacity-50 ${
                    isActive
                      ? 'bg-primary/10 text-primary cursor-default'
                      : 'bg-white/5 border border-white/10 text-on-surface hover:bg-white/10'
                  }`}
                >
                  {isActive ? 'Plan Actual' : actionLoading === plan.id ? 'Redirigiendo…' : `Cambiar a ${plan.id}`}
                </button>
              </div>
            )
          })}
        </div>

        <p className="text-[10px] text-on-surface/30 text-center mt-6">
          ¿Plan personalizado?{' '}
          <a href="mailto:contacto@atollom.com" className="text-primary hover:underline">
            Contáctanos
          </a>
        </p>
      </div>

      <div className="h-10" />
    </div>
  )
}
