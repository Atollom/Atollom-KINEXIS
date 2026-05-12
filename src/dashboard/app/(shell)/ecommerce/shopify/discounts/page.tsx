import type { Metadata } from 'next'
import { mockShopifyDiscounts, mockShopifyDiscountStats } from '@/lib/mockData'

export const metadata: Metadata = {
  title: 'Shopify Discounts — KINEXIS',
  description: 'Gestiona códigos de descuento y promociones en Shopify.',
}

const TYPE_LABELS: Record<string, string> = {
  percentage: 'Porcentaje', fixed: 'Monto fijo', free_shipping: 'Envío gratis', bxgy: 'Compra X lleva Y',
}

export default function ShopifyDiscountsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-black tight-tracking" style={{ color: 'var(--text-primary)' }}>
              Discounts
            </h1>
            <span className="px-2 py-1 rounded-full bg-[#CCFF00]/10 border border-[#CCFF00]/20 text-[9px] font-black label-tracking text-[#CCFF00]">
              SHOPIFY
            </span>
          </div>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Códigos de descuento y promociones activas
          </p>
        </div>
        <button
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all hover:opacity-90 active:scale-[0.97]"
          style={{ backgroundColor: 'var(--accent-primary)', color: '#000' }}
        >
          <span className="material-symbols-outlined !text-[14px]">add</span>
          Nuevo descuento
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Activos', value: mockShopifyDiscountStats.active, color: '#4ade80' },
          { label: 'Expirados', value: mockShopifyDiscountStats.expired, color: 'var(--text-muted)' },
          { label: 'Programados', value: mockShopifyDiscountStats.scheduled, color: '#60a5fa' },
          { label: 'Usos totales', value: mockShopifyDiscountStats.total_usage.toLocaleString(), color: 'var(--text-primary)' },
          { label: 'Ahorros totales', value: `$${mockShopifyDiscountStats.total_saved.toLocaleString()}`, color: '#CCFF00' },
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
          <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Códigos de descuento</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                {['Código', 'Tipo', 'Valor', 'Usos', 'Límite', 'Ahorro total', 'Vigencia', 'Estado'].map(h => (
                  <th key={h} className="px-5 py-3 text-left font-bold label-tracking text-[10px]" style={{ color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mockShopifyDiscounts.map(d => (
                <tr key={d.id} className="border-b transition-colors hover:bg-white/[0.02] cursor-pointer" style={{ borderColor: 'var(--border-color)' }}>
                  <td className="px-5 py-3">
                    <span className="font-mono font-black text-[#CCFF00] px-2 py-0.5 rounded-md bg-[#CCFF00]/10">{d.code}</span>
                  </td>
                  <td className="px-5 py-3" style={{ color: 'var(--text-secondary)' }}>{TYPE_LABELS[d.type]}</td>
                  <td className="px-5 py-3 font-bold" style={{ color: 'var(--text-primary)' }}>
                    {d.type === 'percentage' ? `${d.value}%` : d.type === 'fixed' ? `$${d.value}` : '—'}
                  </td>
                  <td className="px-5 py-3" style={{ color: 'var(--text-secondary)' }}>{d.usage_count}</td>
                  <td className="px-5 py-3" style={{ color: 'var(--text-muted)' }}>{d.usage_limit ?? '∞'}</td>
                  <td className="px-5 py-3 font-bold" style={{ color: '#4ade80' }}>{d.total_saved > 0 ? `$${d.total_saved.toLocaleString()}` : '—'}</td>
                  <td className="px-5 py-3" style={{ color: 'var(--text-muted)' }}>
                    {d.ends_at ? `${d.starts_at} → ${d.ends_at}` : `Desde ${d.starts_at}`}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${d.status === 'active' ? 'bg-green-400/10 text-green-400' : d.status === 'scheduled' ? 'bg-blue-400/10 text-blue-400' : 'bg-white/5 text-white/30'}`}>
                      {d.status === 'active' ? 'Activo' : d.status === 'scheduled' ? 'Programado' : 'Expirado'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
