'use client'

import { useState } from 'react'
import { useToast } from '@/components/ToastProvider'
import { useRouter } from 'next/navigation'

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: 6500,
    description: 'Perfecto para iniciar con automatización',
    color: '#60a5fa',
    features: [
      '1 Módulo a elegir',
      '500 conversaciones Samantha/mes',
      '100 Timbres CFDI',
      '3 usuarios',
      'Soporte email 48h',
    ],
    limits: { modules: 1, ai_tokens: 500, timbres: 100, users: 3 },
    popular: false,
  },
  {
    id: 'growth',
    name: 'Growth',
    price: 10500,
    description: 'Para negocios en crecimiento',
    color: '#CCFF00',
    features: [
      '2 Módulos a elegir',
      '750 conversaciones Samantha/mes',
      '200 Timbres CFDI',
      '10 usuarios',
      'Soporte chat 24h',
      'Onboarding incluido',
    ],
    limits: { modules: 2, ai_tokens: 750, timbres: 200, users: 10 },
    popular: true,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 16500,
    description: 'Suite completa para empresas',
    color: '#a78bfa',
    features: [
      'Todos los módulos',
      'IA y timbres ilimitados',
      'Usuarios ilimitados',
      'Soporte WhatsApp 24/7',
      'Account manager dedicado',
      'Sesión intensiva 90 min',
    ],
    limits: { modules: '∞', ai_tokens: '∞', timbres: '∞', users: '∞' },
    popular: false,
  },
]

const ADD_ONS = [
  { id: 'tokens_100', name: '100 Tokens IA Extra', price: 500, description: 'Pack adicional de interacciones con Samantha', icon: 'psychology' },
  { id: 'timbres_50', name: '50 Timbres CFDI', price: 300, description: 'Pack adicional de timbres fiscales SAT', icon: 'receipt_long' },
]

export default function PricingPage() {
  const { showToast } = useToast()
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  const handleSubscribe = async (planId: string) => {
    setLoading(planId)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan_type: planId }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        showToast({ type: 'error', title: 'Error', message: data.error || 'No se pudo iniciar el checkout' })
      }
    } catch {
      showToast({ type: 'error', title: 'Error de red', message: 'Intenta de nuevo' })
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-3 mb-2">
          <h1 className="text-3xl font-black tight-tracking" style={{ color: 'var(--text-primary)' }}>Planes KINEXIS</h1>
          <span className="px-2 py-1 rounded-full bg-[#CCFF00]/10 border border-[#CCFF00]/20 text-[9px] font-black label-tracking text-[#CCFF00]">BILLING</span>
        </div>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Precios en MXN · IVA no incluido · Cancela cuando quieras</p>
      </div>

      {/* Plans grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {PLANS.map(plan => (
          <div key={plan.id}
            className="relative glass-card rounded-2xl p-6 flex flex-col"
            style={plan.popular ? { border: `1px solid ${plan.color}40`, boxShadow: `0 0 30px ${plan.color}12` } : {}}
          >
            {plan.popular && (
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                <span className="px-3 py-1 rounded-full text-[9px] font-black label-tracking"
                  style={{ backgroundColor: plan.color, color: '#000' }}>
                  MÁS POPULAR
                </span>
              </div>
            )}

            {/* Plan header */}
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${plan.color}15` }}>
                  <span className="material-symbols-outlined !text-[16px]" style={{ color: plan.color }}>workspace_premium</span>
                </div>
                <h3 className="text-lg font-black" style={{ color: 'var(--text-primary)' }}>{plan.name}</h3>
              </div>
              <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>{plan.description}</p>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black" style={{ color: plan.color }}>
                  ${plan.price.toLocaleString('es-MX')}
                </span>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>MXN/mes</span>
              </div>
            </div>

            {/* Limits strip */}
            <div className="grid grid-cols-2 gap-2 mb-5 p-3 rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)' }}>
              {[
                { label: 'Módulos', value: plan.limits.modules },
                { label: 'Tokens IA', value: plan.limits.ai_tokens },
                { label: 'Timbres', value: plan.limits.timbres },
                { label: 'Usuarios', value: plan.limits.users },
              ].map(l => (
                <div key={l.label} className="text-center">
                  <p className="text-sm font-black" style={{ color: plan.color }}>{l.value}</p>
                  <p className="text-[9px] label-tracking" style={{ color: 'var(--text-muted)' }}>{l.label}</p>
                </div>
              ))}
            </div>

            {/* Features */}
            <ul className="space-y-2 mb-6 flex-1">
              {plan.features.map((f, i) => (
                <li key={i} className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                  <span className="material-symbols-outlined !text-[14px]" style={{ color: plan.color }}>check_circle</span>
                  {f}
                </li>
              ))}
            </ul>

            {/* CTA */}
            <button
              onClick={() => handleSubscribe(plan.id)}
              disabled={loading !== null}
              className="w-full py-3 rounded-xl text-xs font-black label-tracking transition-all hover:opacity-90 active:scale-[0.97] disabled:opacity-50"
              style={plan.popular
                ? { backgroundColor: plan.color, color: '#000' }
                : { backgroundColor: `${plan.color}15`, color: plan.color, border: `1px solid ${plan.color}30` }}
            >
              {loading === plan.id ? 'Redirigiendo...' : `Suscribirse a ${plan.name}`}
            </button>
          </div>
        ))}
      </div>

      {/* Add-ons */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Add-ons disponibles</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ADD_ONS.map(addon => (
            <div key={addon.id} className="glass-card rounded-2xl p-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(204,255,0,0.1)' }}>
                  <span className="material-symbols-outlined !text-[18px] text-[#CCFF00]">{addon.icon}</span>
                </div>
                <div>
                  <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{addon.name}</p>
                  <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{addon.description}</p>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-lg font-black text-[#CCFF00]">${addon.price}</p>
                <button
                  onClick={() => handleSubscribe(addon.id)}
                  disabled={loading !== null}
                  className="mt-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:opacity-80 disabled:opacity-50"
                  style={{ backgroundColor: 'rgba(204,255,0,0.1)', color: '#CCFF00', border: '1px solid rgba(204,255,0,0.2)' }}
                >
                  Comprar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer note */}
      <p className="text-center text-xs" style={{ color: 'var(--text-muted)' }}>
        ¿Necesitas un plan personalizado?{' '}
        <a href="mailto:contacto@atollom.com" className="text-[#CCFF00] hover:underline">
          Contáctanos
        </a>
      </p>
    </div>
  )
}
