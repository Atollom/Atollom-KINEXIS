'use client'

import { useState, useEffect, type ElementType } from 'react'
import { Star, Trophy, TrendingUp, Users } from 'lucide-react'

interface LoyaltySegment {
  label: string
  count: number
  value: number
  color: string
  icon: ElementType
  range: string
}

interface AnalyticsData {
  leads?: { stage: string; pipeline_value: number; score: number }[]
  b2b_accounts?: unknown[]
  total_leads?: number
}

function fmt(n: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n)
}

export default function LoyaltyPage() {
  const [segments, setSegments] = useState<LoyaltySegment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/analytics/customers')
      .then(r => r.json())
      .then((data: AnalyticsData) => {
        const leads = data.leads ?? []

        const won = leads.filter(l => l.stage === 'won')
        const highValue = won.filter(l => (l.pipeline_value ?? 0) >= 50000)
        const midValue = won.filter(l => (l.pipeline_value ?? 0) >= 10000 && (l.pipeline_value ?? 0) < 50000)
        const newWon = won.filter(l => (l.pipeline_value ?? 0) < 10000)

        setSegments([
          {
            label: 'Clientes Premium',
            count: highValue.length,
            value: highValue.reduce((s, l) => s + (l.pipeline_value ?? 0), 0),
            color: 'text-yellow-600',
            icon: Trophy,
            range: '+$50,000',
          },
          {
            label: 'Clientes Frecuentes',
            count: midValue.length,
            value: midValue.reduce((s, l) => s + (l.pipeline_value ?? 0), 0),
            color: 'text-blue-600',
            icon: Star,
            range: '$10,000–$50,000',
          },
          {
            label: 'Clientes Nuevos',
            count: newWon.length,
            value: newWon.reduce((s, l) => s + (l.pipeline_value ?? 0), 0),
            color: 'text-green-600',
            icon: TrendingUp,
            range: 'Hasta $10,000',
          },
        ])
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Lealtad de Clientes</h1>
        <p className="text-sm text-gray-500 mt-1">Agente #20 · Segmentación — clasificación por valor y frecuencia</p>
      </div>

      {/* Tier cards */}
      {loading ? (
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-36 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {segments.map(seg => {
            const Icon = seg.icon
            return (
              <div key={seg.label} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <div className="flex items-center gap-3 mb-3">
                  <Icon className={`w-6 h-6 ${seg.color}`} />
                  <div>
                    <h3 className="font-semibold text-gray-900">{seg.label}</h3>
                    <p className="text-xs text-gray-400">{seg.range}</p>
                  </div>
                </div>
                <p className={`text-3xl font-black ${seg.color} mb-1`}>{seg.count}</p>
                <p className="text-sm text-gray-500">Valor total: <span className="font-semibold text-gray-700">{fmt(seg.value)}</span></p>
              </div>
            )
          })}
        </div>
      )}

      {/* Info card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Users className="w-4 h-4 text-gray-400" />
          Programa de lealtad
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          El módulo de programa de puntos y beneficios está planificado para la siguiente fase. Actualmente puedes ver la segmentación automática por valor de compra.
        </p>
        <div className="flex gap-3 flex-wrap">
          {[
            { label: 'Ver segmentos completos', href: '/crm/segments' },
            { label: 'Análisis de clientes', href: '/analytics/customers' },
            { label: 'NPS y satisfacción', href: '/crm/support/nps' },
          ].map(link => (
            <a key={link.href} href={link.href} className="px-3 py-2 border border-gray-200 hover:border-green-400 hover:text-green-700 text-gray-600 text-sm font-medium rounded-lg transition-colors">
              {link.label} →
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
