'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

interface Plan {
  id: string
  name: string
  price: number | null
  period: string
  badge?: string
  badgeColor?: string
  description: string
  features: string[]
  highlight?: boolean
  cta: string
}

const PLANS: Plan[] = [
  {
    id: 'trial',
    name: 'Prueba Gratuita',
    price: null,
    period: '14 días',
    badge: 'Sin tarjeta',
    badgeColor: 'text-[#CCFF00] border-[#CCFF00]/30 bg-[#CCFF00]/5',
    description: 'Acceso completo por 14 días sin compromiso.',
    features: [
      'Todos los módulos desbloqueados',
      'Samantha IA incluida',
      'Hasta 3 usuarios',
      'Soporte por email',
      'Sin límite de productos',
    ],
    cta: 'Comenzar prueba',
  },
  {
    id: 'starter',
    name: 'Starter',
    price: 6500,
    period: 'mes',
    description: 'Para negocios que venden en 1 plataforma.',
    features: [
      'Módulo E-commerce (ML, Amazon o Shopify)',
      'Samantha IA — 500 consultas/mes',
      'Hasta 5 usuarios',
      'Facturación CFDI 4.0',
      'Soporte por email',
    ],
    cta: 'Elegir Starter',
  },
  {
    id: 'growth',
    name: 'Growth',
    price: 10500,
    period: 'mes',
    badge: 'Más popular',
    badgeColor: 'text-[#CCFF00] border-[#CCFF00]/40 bg-[#CCFF00]/10',
    description: 'E-commerce + CRM unificado para escalar.',
    features: [
      'Todo lo de Starter',
      'CRM multicanal (WhatsApp, IG, FB)',
      'Pipeline de ventas Kanban',
      'Samantha IA — 2,000 consultas/mes',
      'Hasta 15 usuarios',
      'Soporte prioritario',
    ],
    highlight: true,
    cta: 'Elegir Growth',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 16500,
    period: 'mes',
    badge: 'Todo incluido',
    badgeColor: 'text-purple-400 border-purple-400/30 bg-purple-400/5',
    description: 'Plataforma completa: ERP + CRM + E-commerce.',
    features: [
      'Todo lo de Growth',
      'ERP completo (contabilidad, finanzas)',
      'Gestión de inventario y compras',
      'Logística + Skydropx',
      'Samantha IA — ilimitado',
      'Usuarios ilimitados',
      'Onboarding dedicado',
    ],
    cta: 'Elegir Pro',
  },
]

export default function PlansPage() {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSelect(plan: Plan) {
    setLoading(plan.id)
    setError(null)

    try {
      // Trial: redirect directly — no API call needed, user isn't in users table yet
      if (plan.id === 'trial') {
        router.push('/onboarding')
        return
      }

      // Paid plans: get Supabase session to pass the JWT
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      const { data: { session } } = await supabase.auth.getSession()

      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          plan_type: plan.id,
          email: session?.user?.email,
          success_url: `${window.location.origin}/onboarding?plan=${plan.id}&checkout=ok`,
          cancel_url: `${window.location.origin}/onboarding/plans`,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? `Error ${res.status}`)
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error('No se recibió URL de pago. Intenta de nuevo.')
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error inesperado. Intenta de nuevo.')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-[#040f1b] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Ambient glows */}
      <div className="fixed top-[-20%] right-[-10%] w-[800px] h-[800px] bg-[#CCFF00]/4 blur-[200px] -z-10 rounded-full pointer-events-none" />
      <div className="fixed bottom-[-10%] left-[-10%] w-[700px] h-[700px] bg-blue-500/4 blur-[200px] -z-10 rounded-full pointer-events-none" />

      <div className="w-full max-w-6xl py-8">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 mb-4">
            <span className="w-2 h-2 rounded-full bg-[#CCFF00] shadow-[0_0_10px_#CCFF00] animate-pulse" />
            <span className="text-[10px] font-bold text-[#CCFF00] uppercase tracking-[0.4em]">
              KINEXIS Planes
            </span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            Elige tu plan
          </h1>
          <p className="text-sm text-white/40 mt-2 max-w-lg mx-auto">
            Todos los planes incluyen onboarding asistido y acceso a Samantha IA.
            Cancela cuando quieras.
          </p>
        </div>

        {/* Error banner — visible y prominente */}
        {error && (
          <div className="mb-6 px-4 py-4 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-start gap-3 max-w-2xl mx-auto">
            <span className="text-red-400 flex-shrink-0 text-lg">⚠</span>
            <div>
              <p className="text-sm text-red-400 font-semibold">Error al procesar</p>
              <p className="text-xs text-red-400/80 mt-0.5 leading-relaxed">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="ml-auto text-red-400/50 hover:text-red-400 text-xs">✕</button>
          </div>
        )}

        {/* Plans grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PLANS.map(plan => (
            <div
              key={plan.id}
              className={`relative flex flex-col rounded-3xl p-6 border backdrop-blur-sm transition-all duration-200 ${
                plan.highlight
                  ? 'bg-[#CCFF00]/6 border-[#CCFF00]/30 shadow-[0_0_40px_rgba(204,255,0,0.08)]'
                  : 'bg-white/3 border-white/8 hover:border-white/16'
              }`}
            >
              {/* Badge */}
              {plan.badge && (
                <span className={`self-start text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border mb-4 ${plan.badgeColor}`}>
                  {plan.badge}
                </span>
              )}

              {/* Plan name */}
              <h2 className={`text-lg font-black tracking-tight ${plan.highlight ? 'text-[#CCFF00]' : 'text-white'}`}>
                {plan.name}
              </h2>

              {/* Price */}
              <div className="mt-3 mb-4">
                {plan.price === null ? (
                  <div>
                    <span className="text-3xl font-black text-white">Gratis</span>
                    <span className="text-xs text-white/30 ml-2">{plan.period}</span>
                  </div>
                ) : (
                  <div>
                    <span className="text-[10px] text-white/30 uppercase tracking-widest">MXN</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-white">
                        ${plan.price.toLocaleString('es-MX')}
                      </span>
                      <span className="text-xs text-white/30">/{plan.period}</span>
                    </div>
                  </div>
                )}
              </div>

              <p className="text-xs text-white/40 mb-5 leading-relaxed">{plan.description}</p>

              {/* Features */}
              <ul className="space-y-2.5 flex-1 mb-6">
                {plan.features.map(feature => (
                  <li key={feature} className="flex items-start gap-2">
                    <span className={`text-[11px] mt-0.5 flex-shrink-0 ${plan.highlight ? 'text-[#CCFF00]' : 'text-white/40'}`}>
                      ✓
                    </span>
                    <span className="text-xs text-white/60 leading-relaxed">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <button
                onClick={() => handleSelect(plan)}
                disabled={loading !== null}
                className={`w-full py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                  plan.highlight
                    ? 'bg-[#CCFF00] text-black hover:bg-[#d4ff1a] shadow-[0_0_20px_rgba(204,255,0,0.3)]'
                    : plan.id === 'trial'
                    ? 'bg-white/8 border border-white/12 text-white hover:bg-white/12'
                    : 'bg-white/6 border border-white/10 text-white hover:bg-white/10'
                }`}
              >
                {loading === plan.id ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Procesando...
                  </span>
                ) : (
                  plan.cta
                )}
              </button>
            </div>
          ))}
        </div>

        {/* Footer */}
        <p className="text-center text-[10px] text-white/15 mt-8 uppercase tracking-widest">
          Pagos procesados por Stripe · Facturación en MXN · Cancela cuando quieras
        </p>
      </div>
    </div>
  )
}
