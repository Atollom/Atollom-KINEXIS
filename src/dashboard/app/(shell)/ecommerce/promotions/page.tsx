'use client'

import { useState } from 'react'
import { useToast } from '@/components/ToastProvider'

interface Promotion {
  id: string
  name: string
  type: 'descuento' | 'envio_gratis' | '2x1' | 'cashback'
  discount: number
  channels: string[]
  status: 'activa' | 'pausada' | 'programada' | 'expirada'
  start_date: string
  end_date: string
  uses: number
  max_uses: number | null
}

const MOCK_PROMOS: Promotion[] = [
  {
    id: '1', name: 'Descuento Mayo 10%', type: 'descuento', discount: 10,
    channels: ['ml', 'shopify'], status: 'activa',
    start_date: '2026-05-01', end_date: '2026-05-31', uses: 47, max_uses: 200,
  },
  {
    id: '2', name: 'Envío Gratis B2B', type: 'envio_gratis', discount: 0,
    channels: ['b2b'], status: 'activa',
    start_date: '2026-05-01', end_date: '2026-06-30', uses: 12, max_uses: null,
  },
  {
    id: '3', name: 'Flash Sale Amazon 15%', type: 'descuento', discount: 15,
    channels: ['amazon'], status: 'programada',
    start_date: '2026-05-25', end_date: '2026-05-26', uses: 0, max_uses: 50,
  },
  {
    id: '4', name: 'Promo Abril 2x1', type: '2x1', discount: 50,
    channels: ['ml', 'shopify', 'amazon'], status: 'expirada',
    start_date: '2026-04-01', end_date: '2026-04-30', uses: 183, max_uses: 200,
  },
]

const STATUS_CFG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  activa:      { label: 'Activa',      color: 'text-green-400',  bg: 'bg-green-400/10',  border: 'border-green-400/20'  },
  pausada:     { label: 'Pausada',     color: 'text-amber-400',  bg: 'bg-amber-400/10',  border: 'border-amber-400/20'  },
  programada:  { label: 'Programada',  color: 'text-blue-400',   bg: 'bg-blue-400/10',   border: 'border-blue-400/20'   },
  expirada:    { label: 'Expirada',    color: 'text-on-surface/30', bg: 'bg-white/5',     border: 'border-white/10'      },
}

const TYPE_ICONS: Record<string, string> = {
  descuento: 'percent', envio_gratis: 'local_shipping', '2x1': 'redeem', cashback: 'payments',
}

const CHANNEL_LABELS: Record<string, string> = {
  ml: 'ML', amazon: 'AMZ', shopify: 'SHP', b2b: 'B2B',
}

export default function PromotionsPage() {
  const { showToast } = useToast()
  const [promos, setPromos] = useState<Promotion[]>(MOCK_PROMOS)
  const [filter, setFilter] = useState<'todas' | 'activa' | 'programada'>('todas')

  const filtered = promos.filter(p => filter === 'todas' || p.status === filter)

  const handleToggle = (id: string) => {
    setPromos(prev => prev.map(p => {
      if (p.id !== id) return p
      const next = p.status === 'activa' ? 'pausada' : 'activa'
      showToast({ type: 'success', title: `Promoción ${next}`, message: p.name })
      return { ...p, status: next }
    }))
  }

  return (
    <div className="space-y-10 animate-in">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <span className="text-[0.75rem] font-bold label-tracking text-primary drop-shadow-[0_0_8px_rgba(204,255,0,0.2)]">
            E-commerce / Promociones
          </span>
          <div className="flex items-center gap-3">
            <h1 className="text-4xl md:text-5xl font-black tight-tracking text-on-surface">Promociones</h1>
            <span className="px-2 py-1 rounded-full text-[9px] font-black label-tracking border border-amber-500/30 bg-amber-500/10 text-amber-400">
              SANDBOX
            </span>
          </div>
          <p className="text-sm text-on-surface-variant">{filtered.length} promoción{filtered.length !== 1 ? 'es' : ''}</p>
        </div>
        <button
          onClick={() => showToast({ type: 'info', title: 'Próximamente', message: 'Creación de promociones en desarrollo' })}
          className="px-6 py-3 rounded-2xl bg-primary text-black text-[10px] font-black label-tracking hover:bg-primary/90 transition-all flex items-center gap-2 self-start md:self-auto"
        >
          <span className="material-symbols-outlined !text-[16px]">add</span>
          NUEVA PROMOCIÓN
        </button>
      </header>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Activas', value: promos.filter(p => p.status === 'activa').length, color: 'text-green-400', border: 'border-green-400/20' },
          { label: 'Programadas', value: promos.filter(p => p.status === 'programada').length, color: 'text-blue-400', border: 'border-blue-400/20' },
          { label: 'Total Usos', value: promos.reduce((s, p) => s + p.uses, 0), color: 'text-primary', border: 'border-primary/20' },
          { label: 'Expiradas', value: promos.filter(p => p.status === 'expirada').length, color: 'text-on-surface/40', border: 'border-white/5' },
        ].map(k => (
          <div key={k.label} className={`glass-card rounded-[1.5rem] border ${k.border} p-5`}>
            <p className="text-[9px] font-black label-tracking text-on-surface/40 uppercase mb-2">{k.label}</p>
            <p className={`text-2xl font-black ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {(['todas', 'activa', 'programada'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-5 py-2.5 rounded-xl text-[10px] font-black label-tracking transition-all ${
              filter === f ? 'bg-primary text-black' : 'glass-card border border-white/5 text-on-surface-variant hover:border-primary/20'
            }`}
          >
            {f.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Promo cards */}
      <div className="space-y-4">
        {filtered.map(p => {
          const sCfg = STATUS_CFG[p.status]
          const usePct = p.max_uses ? Math.round((p.uses / p.max_uses) * 100) : null
          return (
            <div key={p.id} className="glass-card rounded-[2rem] border border-white/5 p-6">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${sCfg.bg} border ${sCfg.border}`}>
                  <span className={`material-symbols-outlined !text-[20px] ${sCfg.color}`}>
                    {TYPE_ICONS[p.type] ?? 'sell'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap mb-1">
                    <h3 className="text-sm font-black text-on-surface">{p.name}</h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[8px] font-black border ${sCfg.color} ${sCfg.bg} ${sCfg.border}`}>
                      {sCfg.label.toUpperCase()}
                    </span>
                    <div className="flex gap-1">
                      {p.channels.map(ch => (
                        <span key={ch} className="text-[8px] font-black label-tracking text-on-surface/50 bg-white/5 border border-white/10 px-1.5 py-0.5 rounded-lg">
                          {CHANNEL_LABELS[ch] ?? ch}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-[10px] text-on-surface/40">
                    <span>{p.start_date} → {p.end_date}</span>
                    {p.discount > 0 && <span className="text-primary font-black">{p.discount}% OFF</span>}
                  </div>
                  {usePct !== null && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-white/5">
                        <div className="h-full rounded-full bg-primary/60 transition-all" style={{ width: `${Math.min(usePct, 100)}%` }} />
                      </div>
                      <span className="text-[9px] text-on-surface/40">{p.uses}/{p.max_uses} usos</span>
                    </div>
                  )}
                  {usePct === null && <p className="text-[9px] text-on-surface/40 mt-1">{p.uses} usos · sin límite</p>}
                </div>
                {(p.status === 'activa' || p.status === 'pausada') && (
                  <button
                    onClick={() => handleToggle(p.id)}
                    className={`px-4 py-2 rounded-xl text-[9px] font-black border transition-all flex-shrink-0 ${
                      p.status === 'activa'
                        ? 'bg-amber-400/10 border-amber-400/20 text-amber-400 hover:bg-amber-400/20'
                        : 'bg-green-400/10 border-green-400/20 text-green-400 hover:bg-green-400/20'
                    }`}
                  >
                    {p.status === 'activa' ? 'PAUSAR' : 'ACTIVAR'}
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="h-10" />
    </div>
  )
}
