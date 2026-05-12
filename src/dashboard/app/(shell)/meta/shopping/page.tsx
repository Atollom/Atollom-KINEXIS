import type { Metadata } from 'next'
import { mockIGShoppingProducts, mockIGShoppingStats } from '@/lib/mockData'

export const metadata: Metadata = {
  title: 'Instagram Shopping — KINEXIS',
  description: 'Catálogo de productos etiquetados en Instagram con métricas de conversión.',
}

export default function IGShoppingPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-black tight-tracking" style={{ color: 'var(--text-primary)' }}>
              Instagram Shopping
            </h1>
            <span className="px-2 py-1 rounded-full bg-pink-400/10 border border-pink-400/20 text-[9px] font-black label-tracking text-pink-400">
              META
            </span>
          </div>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Catálogo de productos etiquetados en posts y stories
          </p>
        </div>
        <button
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all hover:opacity-90 active:scale-[0.97]"
          style={{ backgroundColor: 'var(--accent-primary)', color: '#000' }}
        >
          <span className="material-symbols-outlined !text-[14px]">add</span>
          Etiquetar producto
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {[
          { label: 'Productos', value: mockIGShoppingStats.total_products, color: 'var(--text-primary)' },
          { label: 'Activos', value: mockIGShoppingStats.active, color: '#4ade80' },
          { label: 'Pausados', value: mockIGShoppingStats.paused, color: '#facc15' },
          { label: 'Vistas totales', value: mockIGShoppingStats.total_views.toLocaleString(), color: '#f472b6' },
          { label: 'Revenue total', value: `$${mockIGShoppingStats.total_revenue.toLocaleString()}`, color: '#CCFF00' },
          { label: 'CTR prom.', value: `${mockIGShoppingStats.avg_ctr}%`, color: '#fb923c' },
        ].map(s => (
          <div key={s.label} className="glass-card p-4 rounded-2xl">
            <p className="text-[10px] label-tracking mb-1" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
            <p className="text-lg font-black" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Product table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
          <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Productos en catálogo IG Shopping</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                {['Producto', 'Precio', 'Posts', 'Vistas', 'Clics', 'CTR', 'Compras', 'Revenue', 'Estado'].map(h => (
                  <th key={h} className="px-5 py-3 text-left font-bold label-tracking text-[10px]" style={{ color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mockIGShoppingProducts.map(p => (
                <tr key={p.id} className="border-b transition-colors hover:bg-white/[0.02] cursor-pointer" style={{ borderColor: 'var(--border-color)' }}>
                  <td className="px-5 py-3 font-bold max-w-[200px] truncate" style={{ color: 'var(--text-primary)' }}>{p.product_name}</td>
                  <td className="px-5 py-3 font-bold" style={{ color: 'var(--text-secondary)' }}>${p.price.toLocaleString()}</td>
                  <td className="px-5 py-3 text-center text-pink-400 font-bold">{p.tagged_posts}</td>
                  <td className="px-5 py-3" style={{ color: 'var(--text-secondary)' }}>{p.product_views.toLocaleString()}</td>
                  <td className="px-5 py-3" style={{ color: 'var(--text-secondary)' }}>{p.clicks.toLocaleString()}</td>
                  <td className="px-5 py-3 font-bold" style={{ color: '#fb923c' }}>{p.ctr}%</td>
                  <td className="px-5 py-3 font-bold" style={{ color: '#CCFF00' }}>{p.purchases}</td>
                  <td className="px-5 py-3 font-bold text-green-400">${p.revenue.toLocaleString()}</td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${p.status === 'active' ? 'bg-green-400/10 text-green-400' : 'bg-yellow-400/10 text-yellow-400'}`}>
                      {p.status === 'active' ? 'Activo' : 'Pausado'}
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
