'use client'

import { useState, useEffect } from 'react'
import { authenticatedFetch } from '@/lib/api-client'

interface Movement {
  id: string
  sku: string
  product_name: string
  movement_type: string
  qty_change: number
  qty_after: number
  platform: string
  created_at: string
}

const TYPE_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  in:       { label: 'Entrada',    color: '#4ade80', bg: 'bg-green-400/10',  icon: 'arrow_downward' },
  out:      { label: 'Salida',     color: '#f87171', bg: 'bg-red-400/10',    icon: 'arrow_upward'   },
  sale:     { label: 'Venta',      color: '#60a5fa', bg: 'bg-blue-400/10',   icon: 'shopping_cart'  },
  return:   { label: 'Devolución', color: '#fbbf24', bg: 'bg-amber-400/10',  icon: 'undo'           },
  adjust:   { label: 'Ajuste',     color: '#CCFF00', bg: 'bg-[#CCFF00]/10',  icon: 'tune'           },
  transfer: { label: 'Traslado',   color: '#c084fc', bg: 'bg-purple-400/10', icon: 'swap_horiz'     },
}

const MOCK_MOVEMENTS: Movement[] = [
  { id: '1', sku: 'KNX-001', product_name: 'Herramienta Industrial A', movement_type: 'sale',   qty_change: -2, qty_after: 48, platform: 'mercadolibre', created_at: '2026-05-19T10:30:00Z' },
  { id: '2', sku: 'KNX-002', product_name: 'Componente B',             movement_type: 'in',     qty_change: 50, qty_after: 95, platform: 'manual',       created_at: '2026-05-19T09:00:00Z' },
  { id: '3', sku: 'KNX-003', product_name: 'Dispositivo C',            movement_type: 'return', qty_change: 1,  qty_after: 22, platform: 'shopify',      created_at: '2026-05-18T16:45:00Z' },
  { id: '4', sku: 'KNX-001', product_name: 'Herramienta Industrial A', movement_type: 'sale',   qty_change: -1, qty_after: 50, platform: 'amazon',       created_at: '2026-05-18T14:20:00Z' },
  { id: '5', sku: 'KNX-004', product_name: 'Equipo D',                 movement_type: 'adjust', qty_change: -3, qty_after: 17, platform: 'manual',       created_at: '2026-05-17T11:00:00Z' },
]

export default function MovementsPage() {
  const [movements, setMovements] = useState<Movement[]>([])
  const [loading, setLoading] = useState(true)
  const [source, setSource] = useState<'live' | 'mock'>('mock')

  useEffect(() => {
    authenticatedFetch('/api/erp/inventory/movements?days=30')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setMovements(data as Movement[])
          setSource('live')
        } else {
          setMovements(MOCK_MOVEMENTS)
        }
      })
      .catch(() => setMovements(MOCK_MOVEMENTS))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-black tight-tracking" style={{ color: 'var(--text-primary)' }}>
              Movimientos de Inventario
            </h1>
            <span className="px-2 py-1 rounded-full bg-[#CCFF00]/10 border border-[#CCFF00]/20 text-[9px] font-black label-tracking text-[#CCFF00]">
              AGENTE #5
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
            Entradas · Salidas · Ajustes · Devoluciones — últimos 30 días
          </p>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Entradas', count: movements.filter(m => m.movement_type === 'in').length,   color: '#4ade80' },
          { label: 'Ventas',   count: movements.filter(m => m.movement_type === 'sale').length,  color: '#60a5fa' },
          { label: 'Ajustes',  count: movements.filter(m => m.movement_type === 'adjust').length, color: '#CCFF00' },
          { label: 'Total',    count: movements.length,                                           color: 'var(--text-primary)' },
        ].map(s => (
          <div key={s.label} className="glass-card p-4 rounded-2xl">
            <p className="text-[10px] label-tracking mb-1" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
            <p className="text-xl font-black" style={{ color: s.color }}>{s.count}</p>
          </div>
        ))}
      </div>

      {/* Movements table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-color)' }}>
          <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Historial de movimientos</h2>
          <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{movements.length} registros</span>
        </div>
        {loading ? (
          <div className="p-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>Cargando movimientos...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  {['Fecha', 'SKU', 'Producto', 'Tipo', 'Cambio', 'Stock final', 'Canal'].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-bold label-tracking text-[10px]" style={{ color: 'var(--text-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {movements.map(m => {
                  const tc = TYPE_CONFIG[m.movement_type] ?? TYPE_CONFIG['adjust']
                  const isNegative = m.qty_change < 0
                  return (
                    <tr key={m.id} className="border-b transition-colors hover:bg-white/[0.02]" style={{ borderColor: 'var(--border-color)' }}>
                      <td className="px-4 py-3" style={{ color: 'var(--text-muted)' }}>{m.created_at.slice(0, 16).replace('T', ' ')}</td>
                      <td className="px-4 py-3 font-mono font-black text-[10px]" style={{ color: '#CCFF00' }}>{m.sku}</td>
                      <td className="px-4 py-3 max-w-[180px] truncate font-medium" style={{ color: 'var(--text-primary)' }}>{m.product_name}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${tc.bg}`} style={{ color: tc.color }}>
                          <span className="material-symbols-outlined !text-[10px]">{tc.icon}</span>
                          {tc.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-black" style={{ color: isNegative ? '#f87171' : '#4ade80' }}>
                        {isNegative ? '' : '+'}{m.qty_change}
                      </td>
                      <td className="px-4 py-3 font-bold" style={{ color: 'var(--text-secondary)' }}>{m.qty_after}</td>
                      <td className="px-4 py-3 capitalize" style={{ color: 'var(--text-muted)' }}>{m.platform}</td>
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
