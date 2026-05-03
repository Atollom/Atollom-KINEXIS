'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { ShieldCheck, ArrowRight } from 'lucide-react'
import { useToast } from './ToastProvider'

interface Urgency {
  type: string
  severity: 'critical' | 'high' | 'medium'
  title: string
  description: string
  suggested_action: string
  agent_id: string
}

interface UrgenciesData {
  urgencies: Urgency[]
  total_issues: number
  error?: string
}

const SEVERITY_CONFIG = {
  critical: {
    dotClass: 'bg-[#FF0055] shadow-[0_0_6px_#FF0055]',
    borderClass: 'border-[#FF0055]/20 hover:border-[#FF0055]/40',
  },
  high: {
    dotClass: 'bg-[#CCFF00] shadow-[0_0_6px_#CCFF00] animate-pulse',
    borderClass: 'border-[#CCFF00]/20 hover:border-[#CCFF00]/40',
  },
  medium: {
    dotClass: 'bg-white/40',
    borderClass: 'border-white/5 hover:border-white/20',
  },
} as const

export default function UrgencyPanel() {
  const [data, setData] = useState<UrgenciesData>({ urgencies: [], total_issues: 0 })
  const [loading, setLoading] = useState(true)
  const { showToast } = useToast()

  const handleAction = useCallback((u: Urgency) => {
    showToast({
      type: u.severity === 'critical' ? 'error' : u.severity === 'high' ? 'warning' : 'info',
      title: 'Enviado a Samantha',
      message: u.suggested_action,
      duration: 4000,
    })
  }, [showToast])

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/dashboard/urgencies')
        if (res.ok) setData(await res.json())
      } catch (err) {
        console.error('[UrgencyPanel] load failed:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="md:col-span-2 bg-white/5 rounded-[2.5rem] p-8 border border-white/5 flex flex-col h-full">
        <div className="flex items-center justify-between mb-6">
          <div className="h-3 w-36 bg-white/10 rounded animate-pulse" />
          <div className="h-3 w-16 bg-white/10 rounded animate-pulse" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-4 py-4 px-4 rounded-2xl border border-white/5">
              <div className="w-2.5 h-2.5 rounded-full bg-white/10 animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-44 bg-white/10 rounded animate-pulse" />
                <div className="h-2 w-28 bg-white/5 rounded animate-pulse" />
              </div>
              <div className="w-7 h-7 rounded-lg bg-white/5 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (data.urgencies.length === 0) {
    return (
      <div className="md:col-span-2 bg-white/5 rounded-[2.5rem] p-8 border border-white/5 flex flex-col items-center justify-center gap-4 min-h-[200px]">
        <div className="w-14 h-14 rounded-full bg-[#CCFF00]/10 flex items-center justify-center">
          <ShieldCheck className="w-7 h-7 text-[#CCFF00]" />
        </div>
        <div className="text-center">
          <p className="text-sm font-black text-white uppercase tracking-widest">Todo bajo control</p>
          <p className="text-[9px] font-bold text-white/20 uppercase tracking-[0.3em] mt-1">Sin alertas activas</p>
        </div>
      </div>
    )
  }

  const criticalCount = data.urgencies.filter(u => u.severity === 'critical').length

  return (
    <div className="md:col-span-2 bg-white/5 rounded-[2.5rem] p-8 border border-white/5 flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h3 className="text-xs font-black text-white uppercase tracking-[0.3em]">Alertas Activas</h3>
          {criticalCount > 0 && (
            <span className="px-2 py-0.5 bg-[#FF0055]/10 border border-[#FF0055]/30 rounded-full text-[9px] font-black text-[#FF0055] uppercase tracking-widest">
              {criticalCount} CRÍTICA{criticalCount > 1 ? 'S' : ''}
            </span>
          )}
        </div>
        <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">
          {data.total_issues} total
        </span>
      </div>

      <div className="space-y-3">
        {data.urgencies.slice(0, 6).map((u, idx) => {
          const cfg = SEVERITY_CONFIG[u.severity]
          return (
            <div
              key={idx}
              className={`flex items-center justify-between py-4 px-4 rounded-2xl border bg-white/[0.02] transition-all group ${cfg.borderClass}`}
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${cfg.dotClass}`} />
                <div className="min-w-0">
                  <p className="text-[11px] font-black text-white uppercase truncate">{u.title}</p>
                  <p className="text-[9px] font-bold text-white/20 uppercase mt-0.5 truncate">{u.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                <p className="text-[9px] font-bold text-white/30 uppercase hidden md:block max-w-[140px] truncate">
                  {u.suggested_action}
                </p>
                <button
                  onClick={() => handleAction(u)}
                  className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer"
                  aria-label={u.suggested_action}
                >
                  <ArrowRight className="w-3.5 h-3.5 text-white/20 group-hover:text-white/60 transition-colors" />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
