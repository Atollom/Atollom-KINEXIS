'use client'

import { useState } from 'react'
import { ShoppingCart, MessageSquare, Receipt, Check } from 'lucide-react'
import { createBrowserClient } from '@supabase/ssr'
import type { ModuleId } from './SamanthaIntro'

interface Plan {
  id: string
  name: string
  price: number | null
  period: string
  description: string
  features: string[]
  highlighted?: boolean
  badge?: string
  cta: string
}

const PLANS: Plan[] = [
  {
    id: 'trial',
    name: 'Prueba Gratuita',
    price: null,
    period: '14 días',
    description: 'Acceso completo por 14 días, sin tarjeta.',
    features: ['Todos los módulos', 'Samantha IA', 'Hasta 3 usuarios'],
    cta: 'Comenzar prueba',
  },
  {
    id: 'starter',
    name: 'Starter',
    price: 6500,
    period: 'mes',
    description: 'Para negocios en 1 plataforma de venta.',
    features: ['1 módulo principal', 'Samantha — 500 consultas/mes', 'Hasta 5 usuarios', 'CFDI 4.0'],
    cta: 'Elegir Starter',
  },
  {
    id: 'growth',
    name: 'Growth',
    price: 10500,
    period: 'mes',
    badge: 'Más popular',
    description: 'E-commerce + CRM para escalar.',
    features: ['2 módulos', 'Samantha — 2,000 consultas/mes', 'Hasta 15 usuarios', 'Pipeline de ventas'],
    highlighted: true,
    cta: 'Elegir Growth',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 16500,
    period: 'mes',
    description: 'Plataforma completa: ERP + CRM + E-commerce.',
    features: ['Todos los módulos', 'Samantha — ilimitado', 'Usuarios ilimitados', 'Onboarding dedicado'],
    badge: 'Todo incluido',
    cta: 'Elegir Pro',
  },
]

const MODULE_META: Record<ModuleId, { label: string; icon: React.ReactNode; color: string }> = {
  ecommerce: { label: 'E-commerce', icon: <ShoppingCart className="w-3 h-3" />, color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20' },
  crm: { label: 'CRM', icon: <MessageSquare className="w-3 h-3" />, color: 'text-blue-400 bg-blue-400/10 border-blue-400/20' },
  erp: { label: 'ERP', icon: <Receipt className="w-3 h-3" />, color: 'text-[#CCFF00] bg-[#CCFF00]/10 border-[#CCFF00]/20' },
}

function getRecommendedPlan(modules: ModuleId[]): string {
  if (modules.includes('erp') || modules.length === 3) return 'pro'
  if (modules.length === 2) return 'growth'
  return 'starter'
}

interface Props {
  selectedModules: ModuleId[]
  onTrialSelect: () => void
}

export function InlinePlanSelector({ selectedModules, onTrialSelect }: Props) {
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const recommended = getRecommendedPlan(selectedModules)

  async function handleSelect(plan: Plan) {
    setLoading(plan.id)
    setError(null)
    try {
      if (plan.id === 'trial') {
        onTrialSelect()
        return
      }

      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      const { data: { session } } = await supabase.auth.getSession()

      const successUrl = `${window.location.origin}/onboarding?checkout=success`
      const cancelUrl = `${window.location.origin}/onboarding?checkout=cancel`

      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          plan_type: plan.id,
          email: session?.user?.email,
          success_url: successUrl,
          cancel_url: cancelUrl,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? `Error ${res.status}`)
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error('No se recibió URL de pago')
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error inesperado. Intenta de nuevo.')
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-[#040f1b] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="fixed top-[-20%] right-[-10%] w-[800px] h-[800px] bg-[#CCFF00]/4 blur-[200px] -z-10 rounded-full pointer-events-none" />
      <div className="fixed bottom-[-10%] left-[-10%] w-[700px] h-[700px] bg-blue-500/4 blur-[200px] -z-10 rounded-full pointer-events-none" />

      <div className="w-full max-w-5xl py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-[#CCFF00] shadow-[0_0_10px_#CCFF00] animate-pulse" />
            <span className="text-[10px] font-bold text-[#CCFF00] uppercase tracking-[0.4em]">KINEXIS Setup · Paso 2 de 3</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Elige tu plan</h1>
          <p className="text-sm text-white/40 mt-2">Todos los planes incluyen los módulos que seleccionaste</p>

          {/* Module chips */}
          {selectedModules.length > 0 && (
            <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
              <span className="text-[10px] text-white/30 uppercase tracking-widest">Módulos:</span>
              {selectedModules.map(id => {
                const m = MODULE_META[id]
                return (
                  <span key={id} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold ${m.color}`}>
                    {m.icon}
                    {m.label}
                  </span>
                )
              })}
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 px-4 py-3 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center gap-3 max-w-2xl mx-auto">
            <span className="text-red-400 text-sm">⚠</span>
            <p className="text-xs text-red-400 flex-1">{error}</p>
            <button onClick={() => setError(null)} className="text-red-400/50 hover:text-red-400 text-xs">✕</button>
          </div>
        )}

        {/* Plans grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PLANS.map(plan => {
            const isRecommended = plan.id === recommended && plan.id !== 'trial'
            const isHighlighted = plan.highlighted || isRecommended

            return (
              <div
                key={plan.id}
                className={`relative flex flex-col rounded-3xl p-5 border backdrop-blur-sm transition-all duration-200 ${
                  isHighlighted
                    ? 'bg-[#CCFF00]/6 border-[#CCFF00]/30 shadow-[0_0_40px_rgba(204,255,0,0.08)]'
                    : 'bg-white/3 border-white/8 hover:border-white/16'
                }`}
              >
                {/* Badges */}
                <div className="flex gap-2 mb-3 flex-wrap min-h-[24px]">
                  {isRecommended && (
                    <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-[#CCFF00]/15 text-[#CCFF00] border border-[#CCFF00]/30">
                      Recomendado para ti
                    </span>
                  )}
                  {plan.badge && !isRecommended && (
                    <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-white/5 text-white/40 border border-white/10">
                      {plan.badge}
                    </span>
                  )}
                </div>

                <h2 className={`text-base font-black tracking-tight mb-2 ${isHighlighted ? 'text-[#CCFF00]' : 'text-white'}`}>
                  {plan.name}
                </h2>

                {/* Price */}
                <div className="mb-3">
                  {plan.price === null ? (
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-black text-white">Gratis</span>
                      <span className="text-xs text-white/30">{plan.period}</span>
                    </div>
                  ) : (
                    <div className="flex items-baseline gap-1">
                      <span className="text-[10px] text-white/30 mb-1">MXN</span>
                      <span className="text-2xl font-black text-white">${plan.price.toLocaleString('es-MX')}</span>
                      <span className="text-xs text-white/30">/{plan.period}</span>
                    </div>
                  )}
                </div>

                <p className="text-[11px] text-white/35 mb-4 leading-relaxed">{plan.description}</p>

                {/* Features */}
                <ul className="space-y-2 flex-1 mb-5">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className={`w-3 h-3 mt-0.5 shrink-0 ${isHighlighted ? 'text-[#CCFF00]' : 'text-white/30'}`} />
                      <span className="text-[11px] text-white/55 leading-relaxed">{f}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <button
                  onClick={() => handleSelect(plan)}
                  disabled={loading !== null}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                    isHighlighted
                      ? 'bg-[#CCFF00] text-black hover:bg-[#d4ff1a] shadow-[0_0_20px_rgba(204,255,0,0.25)] active:scale-[0.98]'
                      : plan.id === 'trial'
                      ? 'bg-white/8 border border-white/12 text-white hover:bg-white/12'
                      : 'bg-white/6 border border-white/10 text-white hover:bg-white/10'
                  }`}
                >
                  {loading === plan.id ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Procesando...
                    </span>
                  ) : plan.cta}
                </button>
              </div>
            )
          })}
        </div>

        <p className="text-center text-[10px] text-white/15 mt-6 uppercase tracking-widest">
          Pagos procesados por Stripe · Facturación en MXN · Cancela cuando quieras
        </p>
      </div>
    </div>
  )
}
