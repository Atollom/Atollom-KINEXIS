'use client'

import { useState, useEffect } from 'react'
import { authenticatedFetch } from '@/lib/api-client'
import { useToast } from '@/components/ToastProvider'

interface Order {
  id: string
  external_id: string | null
  platform: string
  status: string
  customer_name: string | null
  total: number
  created_at: string
}

interface FulfillData {
  orders: Order[]
  stats: {
    total_pending: number
    by_status: Record<string, number>
    by_platform: Record<string, number>
  }
}

const STATUS_CFG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  DRAFT:     { label: 'Borrador',    color: 'text-on-surface/50', bg: 'bg-white/5',     border: 'border-white/10'      },
  APPROVED:  { label: 'Aprobado',   color: 'text-amber-400',     bg: 'bg-amber-400/10', border: 'border-amber-400/20'  },
  SENT:      { label: 'Enviado',    color: 'text-blue-400',      bg: 'bg-blue-400/10',  border: 'border-blue-400/20'   },
  DELIVERED: { label: 'Entregado',  color: 'text-green-400',     bg: 'bg-green-400/10', border: 'border-green-400/20'  },
  CANCELLED: { label: 'Cancelado',  color: 'text-red-400',       bg: 'bg-red-400/10',   border: 'border-red-400/20'    },
}

const PLATFORM_COLORS: Record<string, string> = {
  ml: 'text-yellow-400', amazon: 'text-orange-400', shopify: 'text-primary', b2b: 'text-blue-400',
}

export default function OperationsFulfillmentPage() {
  const { showToast } = useToast()
  const [data, setData] = useState<FulfillData>({ orders: [], stats: { total_pending: 0, by_status: {}, by_platform: {} } })
  const [loading, setLoading] = useState(true)
  const [dataSource, setDataSource] = useState<'live' | 'mock'>('mock')
  const [updating, setUpdating] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    authenticatedFetch('/api/operations/fulfillment')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.orders) {
          setData(d)
          setDataSource('live')
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    let mounted = true
    setLoading(true)
    authenticatedFetch('/api/operations/fulfillment')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (mounted && d?.orders) {
          setData(d)
          setDataSource('live')
        }
      })
      .catch(() => {})
      .finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [])

  const handleStatusChange = async (orderId: string, status: string) => {
    setUpdating(orderId)
    try {
      const res = await authenticatedFetch('/api/operations/fulfillment', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId, status }),
      })
      if (res.ok) {
        showToast({ type: 'success', title: 'Estado actualizado', message: `Orden → ${STATUS_CFG[status]?.label ?? status}` })
        load()
      } else {
        showToast({ type: 'error', title: 'Error', message: 'No se pudo actualizar' })
      }
    } finally {
      setUpdating(null)
    }
  }

  return (
    <div className="space-y-10 animate-in">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <span className="text-[0.75rem] font-bold label-tracking text-primary drop-shadow-[0_0_8px_rgba(204,255,0,0.2)]">
            Operaciones / Fulfillment
          </span>
          <div className="flex items-center gap-3">
            <h1 className="text-4xl md:text-5xl font-black tight-tracking text-on-surface">Fulfillment</h1>
            <span className={`px-2 py-1 rounded-full text-[9px] font-black label-tracking border ${
              loading ? 'border-white/10 text-white/30' :
              dataSource === 'live' ? 'border-green-500/30 bg-green-500/10 text-green-400' :
              'border-amber-500/30 bg-amber-500/10 text-amber-400'
            }`}>
              {loading ? 'CARGANDO' : dataSource === 'live' ? 'LIVE' : 'SANDBOX'}
            </span>
          </div>
          <p className="text-sm text-on-surface-variant">
            {loading ? '…' : `${data.stats.total_pending} orden${data.stats.total_pending !== 1 ? 'es' : ''} pendientes`}
          </p>
        </div>
        <button onClick={load} className="px-5 py-2.5 rounded-2xl glass-card border border-white/10 text-[10px] font-black text-on-surface/60 hover:text-on-surface flex items-center gap-2 self-start">
          <span className="material-symbols-outlined !text-[14px]">refresh</span>
          ACTUALIZAR
        </button>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {(['DRAFT', 'APPROVED', 'SENT', 'DELIVERED'] as const).map(s => {
          const cfg = STATUS_CFG[s]
          const count = data.stats.by_status[s] ?? 0
          return (
            <div key={s} className={`glass-card rounded-[1.5rem] border ${cfg.border} p-5`}>
              <p className={`text-[9px] font-black label-tracking ${cfg.color} uppercase mb-2`}>{cfg.label}</p>
              <p className={`text-2xl font-black ${cfg.color}`}>{loading ? '—' : count}</p>
            </div>
          )
        })}
      </div>

      {/* Orders list */}
      <div className="glass-card rounded-[2rem] border border-white/5 overflow-hidden">
        <div className="divide-y divide-white/5">
          {loading ? (
            <div className="p-12 text-center text-sm text-on-surface/40">Cargando…</div>
          ) : data.orders.length === 0 ? (
            <div className="p-12 text-center">
              <span className="material-symbols-outlined !text-[48px] text-on-surface/20">done_all</span>
              <p className="text-sm text-on-surface/40 mt-2">Sin órdenes pendientes</p>
            </div>
          ) : data.orders.map(order => {
            const sCfg = STATUS_CFG[order.status] ?? STATUS_CFG.DRAFT
            const isUpdating = updating === order.id
            return (
              <div key={order.id} className="flex items-center gap-4 px-8 py-5 hover:bg-white/[0.02] transition-colors group">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${sCfg.bg} border ${sCfg.border}`}>
                  <span className={`material-symbols-outlined !text-[16px] ${sCfg.color}`}>package_2</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold text-on-surface">{order.external_id ?? order.id.slice(0, 8)}</p>
                    <span className={`text-[9px] font-black uppercase ${PLATFORM_COLORS[order.platform] ?? 'text-on-surface/40'}`}>
                      {order.platform}
                    </span>
                  </div>
                  <p className="text-[9px] text-on-surface/40 truncate">{order.customer_name ?? '—'}</p>
                </div>
                <p className="text-xs font-black text-on-surface">${order.total.toLocaleString()}</p>
                <span className={`inline-flex items-center px-2.5 py-1 rounded-xl text-[9px] font-black border ${sCfg.color} ${sCfg.bg} ${sCfg.border}`}>
                  {sCfg.label.toUpperCase()}
                </span>
                <p className="text-[9px] text-on-surface/30 w-20 text-right">
                  {new Date(order.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}
                </p>
                {order.status === 'APPROVED' && (
                  <button
                    onClick={() => handleStatusChange(order.id, 'SENT')}
                    disabled={isUpdating}
                    className="opacity-0 group-hover:opacity-100 transition-opacity px-3 py-1.5 rounded-xl bg-primary text-black text-[9px] font-black disabled:opacity-50"
                  >
                    {isUpdating ? '…' : 'DESPACHAR'}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="h-10" />
    </div>
  )
}
