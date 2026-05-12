import type { Metadata } from 'next'
import { mockMCInventory, mockMCInventoryStats } from '@/lib/mockData'

export const metadata: Metadata = {
  title: 'Inventario Multi-Canal — KINEXIS',
  description: 'Stock en tiempo real a través de todos los canales de venta.',
}

const STATUS_CONFIG = {
  ok: { label: 'OK', color: '#4ade80', bg: 'bg-green-400/10' },
  low: { label: 'Bajo', color: '#facc15', bg: 'bg-yellow-400/10' },
  critical: { label: 'Crítico', color: '#fb923c', bg: 'bg-orange-400/10' },
  out: { label: 'Agotado', color: '#f87171', bg: 'bg-red-400/10' },
}

export default function MCInventoryPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-black tight-tracking" style={{ color: 'var(--text-primary)' }}>
              Inventario Multi-Canal
            </h1>
            <span className="px-2 py-1 rounded-full bg-[#CCFF00]/10 border border-[#CCFF00]/20 text-[9px] font-black label-tracking text-[#CCFF00]">
              AGENTE #7
            </span>
          </div>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Stock distribuido en ML, Amazon, Shopify y almacén
          </p>
        </div>
        <button
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all hover:opacity-90 active:scale-[0.97]"
          style={{ backgroundColor: 'var(--accent-primary)', color: '#000' }}
        >
          <span className="material-symbols-outlined !text-[14px]">sync</span>
          Sincronizar stock
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {[
          { label: 'Total SKUs', value: mockMCInventoryStats.total_skus, color: 'var(--text-primary)' },
          { label: 'OK', value: mockMCInventoryStats.ok, color: '#4ade80' },
          { label: 'Stock bajo', value: mockMCInventoryStats.low, color: '#facc15' },
          { label: 'Crítico', value: mockMCInventoryStats.critical, color: '#fb923c' },
          { label: 'Agotado', value: mockMCInventoryStats.out, color: '#f87171' },
          { label: 'Valor total', value: `$${mockMCInventoryStats.total_value.toLocaleString()}`, color: '#CCFF00' },
        ].map(s => (
          <div key={s.label} className="glass-card p-4 rounded-2xl">
            <p className="text-[10px] label-tracking mb-1" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
            <p className="text-xl font-black" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
          <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>SKUs por canal</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                {['Producto', 'SKU', 'Total', 'ML', 'Amazon', 'Shopify', 'Almacén', 'Reorden', 'Estado'].map(h => (
                  <th key={h} className="px-5 py-3 text-left font-bold label-tracking text-[10px]" style={{ color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mockMCInventory.map(item => {
                const sc = STATUS_CONFIG[item.status]
                return (
                  <tr key={item.id} className="border-b transition-colors hover:bg-white/[0.02]" style={{ borderColor: 'var(--border-color)' }}>
                    <td className="px-5 py-3 font-bold text-xs max-w-[180px] truncate" style={{ color: 'var(--text-primary)' }}>{item.title}</td>
                    <td className="px-5 py-3 font-mono text-[10px]" style={{ color: 'var(--text-muted)' }}>{item.sku}</td>
                    <td className="px-5 py-3 font-black" style={{ color: 'var(--text-primary)' }}>{item.total_stock}</td>
                    <td className="px-5 py-3 text-yellow-400 font-bold">{item.ml_stock}</td>
                    <td className="px-5 py-3 text-orange-400 font-bold">{item.amazon_stock}</td>
                    <td className="px-5 py-3 font-bold" style={{ color: '#CCFF00' }}>{item.shopify_stock}</td>
                    <td className="px-5 py-3 font-bold" style={{ color: 'var(--text-secondary)' }}>{item.warehouse_stock}</td>
                    <td className="px-5 py-3" style={{ color: 'var(--text-muted)' }}>{item.reorder_point}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${sc.bg}`} style={{ color: sc.color }}>
                        {sc.label}
                      </span>
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
