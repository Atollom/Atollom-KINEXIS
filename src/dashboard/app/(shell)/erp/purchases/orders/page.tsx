'use client'

import { useState, useEffect } from 'react'
import { mockPurchaseOrders, mockPOStats } from '@/lib/mockData'
import { authenticatedFetch } from '@/lib/api-client'

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  DRAFT:            { label: 'Borrador',   color: '#94a3b8', bg: 'bg-white/5'         },
  PENDING_APPROVAL: { label: 'Revisión',   color: '#60a5fa', bg: 'bg-blue-400/10'     },
  APPROVED:         { label: 'Aprobada',   color: '#CCFF00', bg: 'bg-[#CCFF00]/10'    },
  RECEIVED:         { label: 'Recibida',   color: '#4ade80', bg: 'bg-green-400/10'    },
  REJECTED:         { label: 'Rechazada',  color: '#f87171', bg: 'bg-red-400/10'      },
  // Legacy lowercase keys for mock fallback
  draft:     { label: 'Borrador',  color: '#94a3b8', bg: 'bg-white/5'      },
  sent:      { label: 'Enviada',   color: '#60a5fa', bg: 'bg-blue-400/10'  },
  approved:  { label: 'Aprobada',  color: '#CCFF00', bg: 'bg-[#CCFF00]/10' },
  received:  { label: 'Recibida',  color: '#4ade80', bg: 'bg-green-400/10' },
  cancelled: { label: 'Cancelada', color: '#f87171', bg: 'bg-red-400/10'   },
}

interface PORow {
  id: string
  po_number: string
  vendor_name: string
  items_count: number
  total: number
  status: string
  created_at: string
}

function mapApiPO(po: Record<string, unknown>): PORow {
  const items = Array.isArray(po.items) ? po.items : []
  const id = String(po.po_id ?? po.id ?? '')
  return {
    id,
    po_number: 'PO-' + id.slice(0, 8).toUpperCase(),
    vendor_name: String(po.supplier ?? 'Proveedor'),
    items_count: items.length,
    total: Number(po.total ?? 0),
    status: String(po.status ?? 'DRAFT'),
    created_at: String(po.created_at ?? ''),
  }
}

export default function PurchaseOrdersPage() {
  const [orders, setOrders] = useState<PORow[]>([])
  const [loading, setLoading] = useState(true)
  const [source, setSource] = useState<'live' | 'mock'>('mock')

  useEffect(() => {
    authenticatedFetch('/api/erp/purchase-orders')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setOrders((data as Record<string, unknown>[]).map(mapApiPO))
          setSource('live')
        } else {
          // Fallback: map mock data to PORow shape
          setOrders(mockPurchaseOrders.map(po => ({
            id: po.id,
            po_number: po.po_number,
            vendor_name: po.vendor_name,
            items_count: po.items_count,
            total: po.total,
            status: po.status,
            created_at: po.created_at ?? '',
          })))
        }
      })
      .catch(() => {
        setOrders(mockPurchaseOrders.map(po => ({
          id: po.id,
          po_number: po.po_number,
          vendor_name: po.vendor_name,
          items_count: po.items_count,
          total: po.total,
          status: po.status,
          created_at: po.created_at ?? '',
        })))
      })
      .finally(() => setLoading(false))
  }, [])

  const stats = source === 'live'
    ? {
        total: orders.length,
        draft: orders.filter(o => o.status === 'DRAFT').length,
        sent: orders.filter(o => o.status === 'PENDING_APPROVAL').length,
        approved: orders.filter(o => o.status === 'APPROVED').length,
        received: orders.filter(o => o.status === 'RECEIVED').length,
        total_value_active: orders.reduce((s, o) => s + o.total, 0),
      }
    : mockPOStats

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-black tight-tracking" style={{ color: 'var(--text-primary)' }}>
              Órdenes de Compra
            </h1>
            <span className="px-2 py-1 rounded-full bg-[#CCFF00]/10 border border-[#CCFF00]/20 text-[9px] font-black label-tracking text-[#CCFF00]">
              AGENTE #30
            </span>
            <span className={`px-2 py-1 rounded-full text-[9px] font-black label-tracking border ${
              loading ? 'border-white/10 text-white/30' :
              source === 'live' ? 'border-green-500/30 bg-green-500/10 text-green-400' :
              'border-amber-500/30 bg-amber-500/10 text-amber-400'
            }`}>
              {loading ? 'CARGANDO' : source === 'live' ? 'LIVE' : 'SANDBOX'}
            </span>
          </div>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Generación y seguimiento de POs con proveedores
          </p>
        </div>
        <button
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all hover:opacity-90 active:scale-[0.97]"
          style={{ backgroundColor: 'var(--accent-primary)', color: '#000' }}
        >
          <span className="material-symbols-outlined !text-[14px]">add</span>
          Nueva orden
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {[
          { label: 'Total', value: stats.total, color: 'var(--text-primary)' },
          { label: 'Borrador', value: stats.draft, color: '#94a3b8' },
          { label: 'Revisión', value: stats.sent, color: '#60a5fa' },
          { label: 'Aprobada', value: stats.approved, color: '#CCFF00' },
          { label: 'Recibida', value: stats.received, color: '#4ade80' },
          { label: 'Valor activo', value: `$${stats.total_value_active.toLocaleString()}`, color: '#CCFF00' },
        ].map(s => (
          <div key={s.label} className="glass-card p-4 rounded-2xl">
            <p className="text-[10px] label-tracking mb-1" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
            <p className="text-lg font-black" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* PO list */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
          <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Órdenes recientes</h2>
        </div>
        {loading ? (
          <div className="p-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
            Cargando órdenes...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  {['N° Orden', 'Proveedor', 'Artículos', 'Total', 'Fecha', 'Estado'].map(h => (
                    <th key={h} className="px-5 py-3 text-left font-bold label-tracking text-[10px]" style={{ color: 'var(--text-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map(po => {
                  const sc = STATUS_CONFIG[po.status] ?? STATUS_CONFIG['DRAFT']
                  return (
                    <tr key={po.id} className="border-b transition-colors hover:bg-white/[0.02] cursor-pointer" style={{ borderColor: 'var(--border-color)' }}>
                      <td className="px-5 py-3 font-mono font-black text-[10px]" style={{ color: '#CCFF00' }}>{po.po_number}</td>
                      <td className="px-5 py-3 font-bold" style={{ color: 'var(--text-primary)' }}>{po.vendor_name}</td>
                      <td className="px-5 py-3 text-center" style={{ color: 'var(--text-secondary)' }}>{po.items_count}</td>
                      <td className="px-5 py-3 font-black" style={{ color: 'var(--text-primary)' }}>${po.total.toLocaleString()}</td>
                      <td className="px-5 py-3" style={{ color: 'var(--text-muted)' }}>{po.created_at.slice(0, 10)}</td>
                      <td className="px-5 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${sc.bg}`} style={{ color: sc.color }}>{sc.label}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
