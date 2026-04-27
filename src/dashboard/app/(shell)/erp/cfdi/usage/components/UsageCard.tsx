'use client'

import { Receipt, AlertTriangle, CheckCircle } from 'lucide-react'

interface UsageCardProps {
  limit: number
  used: number
  remaining: number
  percentage: number
  status: 'ok' | 'warning' | 'critical'
}

const STATUS_COLOR = {
  ok: 'text-[#CCFF00]',
  warning: 'text-yellow-400',
  critical: 'text-red-400',
}

const BAR_COLOR = {
  ok: 'bg-[#CCFF00]',
  warning: 'bg-yellow-400',
  critical: 'bg-red-500',
}

const ALERT_STYLE = {
  warning: 'bg-yellow-500/10 border border-yellow-500/30 text-yellow-300',
  critical: 'bg-red-500/10 border border-red-500/30 text-red-300',
}

export function UsageCard({ limit, used, remaining, percentage, status }: UsageCardProps) {
  const rounded = Math.round(percentage * 10) / 10

  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-[#CCFF00]/10 rounded-xl flex items-center justify-center">
            <Receipt className="w-5 h-5 text-[#CCFF00]" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">Timbres CFDI</h3>
            <p className="text-xs text-white/40">Cuota mensual · plan activo</p>
          </div>
        </div>

        <div className={`flex items-center gap-1.5 text-sm font-medium ${STATUS_COLOR[status]}`}>
          {status === 'ok'
            ? <CheckCircle className="w-4 h-4" />
            : <AlertTriangle className="w-4 h-4" />
          }
          {status === 'ok' ? 'Normal' : status === 'warning' ? 'Atención' : 'Crítico'}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        {[
          { label: 'Usados',       value: used,      color: 'text-white' },
          { label: 'Límite',       value: limit,     color: 'text-white/60' },
          { label: 'Disponibles',  value: remaining, color: 'text-[#CCFF00]' },
        ].map(({ label, value, color }) => (
          <div key={label}>
            <p className="text-xs text-white/40 mb-1">{label}</p>
            <p className={`text-3xl font-bold tabular-nums ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-white/40 mb-2">
          <span>Progreso del mes</span>
          <span className="font-mono text-white/70">{rounded}%</span>
        </div>
        <div className="h-2.5 bg-white/10 rounded-full overflow-hidden" data-testid="usage-progress-bar">
          <div
            className={`h-full rounded-full transition-all duration-500 ${BAR_COLOR[status]}`}
            style={{ width: `${Math.min(rounded, 100)}%` }}
          />
        </div>
      </div>

      {/* Alert banner */}
      {status !== 'ok' && (
        <div className={`p-3 rounded-xl text-sm ${ALERT_STYLE[status]}`}>
          {status === 'warning'
            ? `⚠️ Has usado el ${rounded}% de tu cuota mensual. Considera ampliar tu plan.`
            : `🚨 Cuota casi agotada (${rounded}%). Contacta a soporte para aumentar tu límite.`
          }
        </div>
      )}
    </div>
  )
}
