'use client'

import { useState, useEffect } from 'react'
import type { Metadata } from 'next'

// metadata can't be exported from client components — moved to layout if needed

const FALLBACK_STATS = { total_spend: 1181.90, total_sales: 4961, avg_acos: 24.3, avg_roas: 4.12, total_impressions: 163400, total_clicks: 4876 }
const FALLBACK_CAMPAIGNS = [
  { id: 'ac1', name: 'SP - Herramientas Exact Match', type: 'SP', status: 'enabled', budget: 500, spend: 312.40, impressions: 28400, clicks: 892,  acos: 18.2, roas: 5.49, sales: 1716 },
  { id: 'ac2', name: 'SB - Marca KapTools',           type: 'SB', status: 'enabled', budget: 300, spend: 201.80, impressions: 54200, clicks: 1203, acos: 22.4, roas: 4.46, sales: 900  },
  { id: 'ac3', name: 'SP - Compresores Broad',        type: 'SP', status: 'enabled', budget: 400, spend: 389.10, impressions: 61000, clicks: 2140, acos: 31.5, roas: 3.17, sales: 1235 },
  { id: 'ac4', name: 'SD - Retargeting Visitantes',   type: 'SD', status: 'paused',  budget: 200, spend: 0,      impressions: 0,     clicks: 0,    acos: 0,    roas: 0,    sales: 0    },
  { id: 'ac5', name: 'SP - Taladros Automatch',       type: 'SP', status: 'enabled', budget: 350, spend: 278.60, impressions: 19800, clicks: 641,  acos: 25.1, roas: 3.98, sales: 1110 },
]

export default function AmazonAdvertisingPage() {
  const [stats, setStats]       = useState(FALLBACK_STATS)
  const [campaigns, setCampaigns] = useState(FALLBACK_CAMPAIGNS)

  useEffect(() => {
    fetch('/api/amazon/advertising')
      .then(r => r.json())
      .then(d => {
        if (d.stats)     setStats(d.stats)
        if (d.campaigns) setCampaigns(d.campaigns)
      })
      .catch(() => {})
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-black tight-tracking" style={{ color: 'var(--text-primary)' }}>
              Amazon Advertising
            </h1>
            <span className="px-2 py-1 rounded-full bg-orange-400/10 border border-orange-400/20 text-[9px] font-black label-tracking text-orange-400">
              AGENTE #8
            </span>
          </div>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Campañas Sponsored Products, Brands y Display
          </p>
        </div>
        <button
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all hover:opacity-90 active:scale-[0.97]"
          style={{ backgroundColor: 'var(--accent-primary)', color: '#000' }}
        >
          <span className="material-symbols-outlined !text-[14px]">add</span>
          Nueva campaña
        </button>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Inversión total', value: `$${stats.total_spend.toLocaleString()}`,     color: '#fb923c' },
          { label: 'Ventas totales',  value: `$${stats.total_sales.toLocaleString()}`,     color: '#4ade80' },
          { label: 'ACOS prom.',      value: `${stats.avg_acos}%`,                         color: stats.avg_acos < 25 ? '#4ade80' : '#facc15' },
          { label: 'ROAS prom.',      value: `${stats.avg_roas}x`,                         color: '#CCFF00' },
          { label: 'Impresiones',     value: stats.total_impressions.toLocaleString(),     color: 'var(--text-primary)' },
          { label: 'Clics',           value: stats.total_clicks.toLocaleString(),          color: '#60a5fa' },
        ].map(s => (
          <div key={s.label} className="glass-card p-4 rounded-2xl">
            <p className="text-[10px] label-tracking mb-1" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
            <p className="text-lg font-black" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Campaigns table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
          <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Campañas activas</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                {['Campaña', 'Tipo', 'Presupuesto', 'Gasto', 'Impresiones', 'Clics', 'ACOS', 'ROAS', 'Ventas', 'Estado'].map(h => (
                  <th key={h} className="px-5 py-3 text-left font-bold label-tracking text-[10px]" style={{ color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {campaigns.map(c => (
                <tr key={c.id} className="border-b transition-colors hover:bg-white/[0.02] cursor-pointer" style={{ borderColor: 'var(--border-color)' }}>
                  <td className="px-5 py-3 font-bold" style={{ color: 'var(--text-primary)', maxWidth: 200 }}>{c.name}</td>
                  <td className="px-5 py-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-orange-400/10 text-orange-400">{c.type}</span>
                  </td>
                  <td className="px-5 py-3" style={{ color: 'var(--text-secondary)' }}>${c.budget}</td>
                  <td className="px-5 py-3 font-bold" style={{ color: '#fb923c' }}>{c.spend > 0 ? `$${c.spend.toFixed(2)}` : '—'}</td>
                  <td className="px-5 py-3" style={{ color: 'var(--text-secondary)' }}>{c.impressions > 0 ? c.impressions.toLocaleString() : '—'}</td>
                  <td className="px-5 py-3" style={{ color: 'var(--text-secondary)' }}>{c.clicks > 0 ? c.clicks.toLocaleString() : '—'}</td>
                  <td className="px-5 py-3 font-bold" style={{ color: c.acos > 0 && c.acos < 25 ? '#4ade80' : c.acos >= 25 ? '#facc15' : 'var(--text-muted)' }}>
                    {c.acos > 0 ? `${c.acos}%` : '—'}
                  </td>
                  <td className="px-5 py-3 font-bold" style={{ color: '#CCFF00' }}>{c.roas > 0 ? `${c.roas}x` : '—'}</td>
                  <td className="px-5 py-3 font-bold" style={{ color: '#4ade80' }}>{c.sales > 0 ? `$${c.sales.toLocaleString()}` : '—'}</td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${c.status === 'enabled' ? 'bg-green-400/10 text-green-400' : 'bg-yellow-400/10 text-yellow-400'}`}>
                      {c.status === 'enabled' ? 'Activa' : 'Pausada'}
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
