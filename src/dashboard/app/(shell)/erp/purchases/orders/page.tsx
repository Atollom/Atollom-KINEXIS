import type { Metadata } from 'next'
import { mockPurchaseOrders, mockPOStats } from '@/lib/mockData'

export const metadata: Metadata = {
  title: 'Órdenes de Compra — KINEXIS',
  description: 'Creación y seguimiento de órdenes de compra con proveedores.',
}

const STATUS_CONFIG = {
  draft: { label: 'Borrador', color: '#94a3b8', bg: 'bg-white/5' },
  sent: { label: 'Enviada', color: '#60a5fa', bg: 'bg-blue-400/10' },
  approved: { label: 'Aprobada', color: '#CCFF00', bg: 'bg-[#CCFF00]/10' },
  received: { label: 'Recibida', color: '#4ade80', bg: 'bg-green-400/10' },
  cancelled: { label: 'Cancelada', color: '#f87171', bg: 'bg-red-400/10' },
}

export default function PurchaseOrdersPage() {
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
          { label: 'Total', value: mockPOStats.total, color: 'var(--text-primary)' },
          { label: 'Borrador', value: mockPOStats.draft, color: '#94a3b8' },
          { label: 'Enviada', value: mockPOStats.sent, color: '#60a5fa' },
          { label: 'Aprobada', value: mockPOStats.approved, color: '#CCFF00' },
          { label: 'Recibida', value: mockPOStats.received, color: '#4ade80' },
          { label: 'Valor activo', value: `$${mockPOStats.total_value_active.toLocaleString()}`, color: '#CCFF00' },
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
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                {['N° Orden', 'Proveedor', 'Artículos', 'Subtotal', 'IVA', 'Total', 'Entrega esperada', 'Estado'].map(h => (
                  <th key={h} className="px-5 py-3 text-left font-bold label-tracking text-[10px]" style={{ color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mockPurchaseOrders.map(po => {
                const sc = STATUS_CONFIG[po.status]
                return (
                  <tr key={po.id} className="border-b transition-colors hover:bg-white/[0.02] cursor-pointer" style={{ borderColor: 'var(--border-color)' }}>
                    <td className="px-5 py-3 font-mono font-black text-[10px]" style={{ color: '#CCFF00' }}>{po.po_number}</td>
                    <td className="px-5 py-3 font-bold" style={{ color: 'var(--text-primary)' }}>{po.vendor_name}</td>
                    <td className="px-5 py-3 text-center" style={{ color: 'var(--text-secondary)' }}>{po.items_count}</td>
                    <td className="px-5 py-3" style={{ color: 'var(--text-secondary)' }}>${po.subtotal.toLocaleString()}</td>
                    <td className="px-5 py-3" style={{ color: 'var(--text-muted)' }}>${po.tax.toLocaleString()}</td>
                    <td className="px-5 py-3 font-black" style={{ color: 'var(--text-primary)' }}>${po.total.toLocaleString()}</td>
                    <td className="px-5 py-3" style={{ color: 'var(--text-muted)' }}>{po.expected_delivery}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${sc.bg}`} style={{ color: sc.color }}>{sc.label}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
