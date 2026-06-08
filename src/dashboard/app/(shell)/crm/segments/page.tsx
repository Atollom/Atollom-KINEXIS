'use client'

import { useEffect, useState } from 'react'
import { Users, Zap, Target, TrendingDown } from 'lucide-react'

interface Segment { label: string; count: number; value: number; description: string; icon: 'hot' | 'warm' | 'cold' | 'won' | 'lost' }

function fmt(n: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n)
}

export default function SegmentsPage() {
  const [segments, setSegments] = useState<Segment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/crm/leads')
      .then(r => r.json())
      .then(d => {
        const leads = d.leads ?? []
        setSegments([
          {
            label: 'Hot Leads',
            count: leads.filter((l: { score: number }) => l.score >= 70).length,
            value: leads.filter((l: { score: number }) => l.score >= 70).reduce((s: number, l: { estimated_value: number }) => s + l.estimated_value, 0),
            description: 'Score ≥ 70 — Prioridad alta, contactar hoy',
            icon: 'hot',
          },
          {
            label: 'Warm Leads',
            count: leads.filter((l: { score: number }) => l.score >= 40 && l.score < 70).length,
            value: leads.filter((l: { score: number }) => l.score >= 40 && l.score < 70).reduce((s: number, l: { estimated_value: number }) => s + l.estimated_value, 0),
            description: 'Score 40-69 — Seguimiento esta semana',
            icon: 'warm',
          },
          {
            label: 'Cold Leads',
            count: leads.filter((l: { score: number }) => l.score < 40).length,
            value: leads.filter((l: { score: number }) => l.score < 40).reduce((s: number, l: { estimated_value: number }) => s + l.estimated_value, 0),
            description: 'Score < 40 — Nurturing o descarte',
            icon: 'cold',
          },
          {
            label: 'Cerrados (Ganados)',
            count: leads.filter((l: { stage: string }) => l.stage === 'won').length,
            value: leads.filter((l: { stage: string }) => l.stage === 'won').reduce((s: number, l: { estimated_value: number }) => s + l.estimated_value, 0),
            description: 'Deals ganados — base de clientes activa',
            icon: 'won',
          },
          {
            label: 'Perdidos',
            count: leads.filter((l: { stage: string }) => l.stage === 'lost').length,
            value: leads.filter((l: { stage: string }) => l.stage === 'lost').reduce((s: number, l: { estimated_value: number }) => s + l.estimated_value, 0),
            description: 'Oportunidades perdidas — potencial de reactivación',
            icon: 'lost',
          },
        ])
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const iconMap = {
    hot: <Zap className="w-6 h-6 text-green-600" />,
    warm: <Target className="w-6 h-6 text-yellow-600" />,
    cold: <Users className="w-6 h-6 text-gray-400" />,
    won: <Users className="w-6 h-6 text-blue-600" />,
    lost: <TrendingDown className="w-6 h-6 text-red-500" />,
  }
  const colorMap = {
    hot: 'border-green-200 bg-green-50',
    warm: 'border-yellow-200 bg-yellow-50',
    cold: 'border-gray-200 bg-gray-50',
    won: 'border-blue-200 bg-blue-50',
    lost: 'border-red-100 bg-red-50',
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Segmentos de Leads</h1>
          <p className="text-sm text-gray-500 mt-1">Agrupación automática por score y etapa de ciclo</p>
        </div>
        <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">CRM · Analytics</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {loading ? Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl p-6 animate-pulse h-32 border border-gray-100" />
        )) : segments.map(seg => (
          <div key={seg.label} className={`rounded-xl border-2 p-5 ${colorMap[seg.icon]}`}>
            <div className="flex items-start justify-between mb-3">
              <div className="p-2 bg-white bg-opacity-70 rounded-xl">
                {iconMap[seg.icon]}
              </div>
              <p className="text-3xl font-bold text-gray-900">{seg.count}</p>
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">{seg.label}</h3>
            <p className="text-xs text-gray-500 mb-2">{seg.description}</p>
            {seg.value > 0 && <p className="text-sm font-semibold text-gray-700">{fmt(seg.value)}</p>}
          </div>
        ))}
      </div>
    </div>
  )
}
