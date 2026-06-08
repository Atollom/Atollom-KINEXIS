'use client'

import { useEffect, useState } from 'react'
import { Users, TrendingUp, DollarSign, Trophy, MessageSquare, Headphones, Target, Star } from 'lucide-react'
import Link from 'next/link'

interface CRMStats {
  active_leads: number
  pipeline_value: number
  close_rate: number
  won_count: number
  total_leads: number
  stage_counts: Record<string, number>
  stage_values: Record<string, number>
  recent_activity: {
    id: string
    name: string
    company: string
    stage: string
    value: number
    updated_at: string
  }[]
}

function fmt(n: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n)
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const hours = Math.floor(diff / 3600000)
  if (hours < 1) return 'Hace menos de 1h'
  if (hours < 24) return `Hace ${hours}h`
  return `Hace ${Math.floor(hours / 24)}d`
}

const stageOrder = ['new', 'contacted', 'quote_sent', 'negotiating', 'won', 'lost']
const stageLabels: Record<string, string> = {
  new: 'Nuevo', contacted: 'Contactado', quote_sent: 'Cotiz.', negotiating: 'Negociando', won: 'Ganado', lost: 'Perdido',
}
const stageColors: Record<string, string> = {
  new: 'bg-gray-200', contacted: 'bg-blue-400', quote_sent: 'bg-yellow-400',
  negotiating: 'bg-purple-400', won: 'bg-green-500', lost: 'bg-red-400',
}

const quickLinks = [
  { label: 'Pipeline Kanban', href: '/crm/pipeline', icon: Target, color: 'text-purple-600', bg: 'bg-purple-50' },
  { label: 'Lead Scorer', href: '/crm/pipeline/scorer', icon: Star, color: 'text-yellow-600', bg: 'bg-yellow-50' },
  { label: 'Oportunidades', href: '/crm/sales/opportunities', icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50' },
  { label: 'Deals Cerrados', href: '/crm/sales/deals', icon: Trophy, color: 'text-green-600', bg: 'bg-green-50' },
  { label: 'Inbox Unificado', href: '/crm/inbox/unified', icon: MessageSquare, color: 'text-pink-600', bg: 'bg-pink-50' },
  { label: 'Soporte / Tickets', href: '/crm/support/tickets', icon: Headphones, color: 'text-cyan-600', bg: 'bg-cyan-50' },
]

export default function CRMPage() {
  const [stats, setStats] = useState<CRMStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/crm/stats')
      .then(r => r.json())
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const maxStageValue = stats
    ? Math.max(...stageOrder.map(s => stats.stage_values[s] ?? 0), 1)
    : 1

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">CRM — Gestión de Relaciones</h1>
        <p className="text-sm text-gray-500 mt-1">Pipeline, leads, comunicación y soporte al cliente</p>
      </div>

      {/* KPIs */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-5 animate-pulse h-24 border border-gray-100" />
          ))}
        </div>
      ) : stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-2"><Users className="w-4 h-4 text-blue-500" /><span className="text-xs text-gray-500">Leads activos</span></div>
            <p className="text-2xl font-bold text-blue-700">{stats.active_leads}</p>
            <p className="text-xs text-gray-400">{stats.total_leads} totales</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-2"><DollarSign className="w-4 h-4 text-green-500" /><span className="text-xs text-gray-500">Pipeline</span></div>
            <p className="text-xl font-bold text-green-700">{fmt(stats.pipeline_value)}</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-2"><TrendingUp className="w-4 h-4 text-purple-500" /><span className="text-xs text-gray-500">Tasa de cierre</span></div>
            <p className="text-2xl font-bold text-purple-700">{stats.close_rate}%</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-2"><Trophy className="w-4 h-4 text-yellow-500" /><span className="text-xs text-gray-500">Deals ganados</span></div>
            <p className="text-2xl font-bold text-yellow-600">{stats.won_count}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Funnel */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Funnel de Ventas</h2>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-8 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          ) : stats ? (
            <div className="space-y-2">
              {stageOrder.map(stage => {
                const count = stats.stage_counts[stage] ?? 0
                const value = stats.stage_values[stage] ?? 0
                const pct = Math.round((value / maxStageValue) * 100)
                return (
                  <div key={stage} className="flex items-center gap-3">
                    <span className="w-24 text-xs text-gray-500 shrink-0">{stageLabels[stage]}</span>
                    <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden relative">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${stageColors[stage]}`}
                        style={{ width: `${Math.max(pct, count > 0 ? 4 : 0)}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-400 w-6 text-right shrink-0">{count}</span>
                    <span className="text-xs font-medium text-gray-700 w-24 text-right shrink-0">{value > 0 ? fmt(value) : '—'}</span>
                  </div>
                )
              })}
            </div>
          ) : null}
        </div>

        {/* Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Actividad Reciente</h2>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          ) : (stats?.recent_activity ?? []).length === 0 ? (
            <p className="text-sm text-gray-400">Sin actividad reciente</p>
          ) : (
            <div className="space-y-3">
              {stats!.recent_activity.map(item => (
                <div key={item.id} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-400 mt-1.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                    <p className="text-xs text-gray-400">{stageLabels[item.stage] ?? item.stage} · {relativeTime(item.updated_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {quickLinks.map(link => {
          const Icon = link.icon
          return (
            <Link key={link.href} href={link.href} className="group bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:border-green-200 hover:shadow-md transition-all text-center">
              <div className={`inline-flex p-2.5 rounded-xl ${link.bg} mb-3`}>
                <Icon className={`w-5 h-5 ${link.color}`} />
              </div>
              <p className="text-xs font-medium text-gray-700 group-hover:text-green-700 transition-colors">{link.label}</p>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
