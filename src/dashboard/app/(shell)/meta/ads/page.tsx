import type { Metadata } from 'next'
import { mockMetaAdSets, mockMetaAdStats } from '@/lib/mockData'

export const metadata: Metadata = {
  title: 'Meta Ads Manager — KINEXIS',
  description: 'Campañas unificadas de Facebook e Instagram con métricas de ROAS.',
}

const PLATFORM_CONFIG = {
  facebook: { label: 'Facebook', color: '#60a5fa', icon: 'facebook' },
  instagram: { label: 'Instagram', color: '#f472b6', icon: 'photo_camera' },
  both: { label: 'FB + IG', color: '#a78bfa', icon: 'public' },
}

const OBJECTIVE_CONFIG: Record<string, string> = {
  awareness: 'Reconocimiento', traffic: 'Tráfico', engagement: 'Interacción',
  leads: 'Leads', sales: 'Ventas',
}

export default function MetaAdsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-black tight-tracking" style={{ color: 'var(--text-primary)' }}>
              Meta Ads Manager
            </h1>
            <span className="px-2 py-1 rounded-full bg-blue-400/10 border border-blue-400/20 text-[9px] font-black label-tracking text-blue-400">
              AGENTE #28
            </span>
          </div>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Campañas unificadas de Facebook e Instagram
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
          { label: 'Inversión total', value: `$${mockMetaAdStats.total_spend.toLocaleString()}`, color: '#f472b6' },
          { label: 'Revenue total', value: `$${mockMetaAdStats.total_revenue.toLocaleString()}`, color: '#4ade80' },
          { label: 'ROAS prom.', value: `${mockMetaAdStats.avg_roas}x`, color: '#CCFF00' },
          { label: 'Impresiones', value: `${(mockMetaAdStats.total_impressions / 1000).toFixed(0)}K`, color: 'var(--text-primary)' },
          { label: 'Conversiones', value: mockMetaAdStats.total_conversions, color: '#fb923c' },
          { label: 'Leads', value: mockMetaAdStats.total_leads, color: '#60a5fa' },
        ].map(s => (
          <div key={s.label} className="glass-card p-4 rounded-2xl">
            <p className="text-[10px] label-tracking mb-1" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
            <p className="text-lg font-black" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Ad sets table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
          <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Conjuntos de anuncios</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                {['Ad Set', 'Plataforma', 'Objetivo', 'Budget/día', 'Inversión', 'Impresiones', 'CTR', 'CPC', 'Conv.', 'ROAS', 'Estado'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-bold label-tracking text-[10px]" style={{ color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mockMetaAdSets.map(ad => {
                const pc = PLATFORM_CONFIG[ad.platform]
                return (
                  <tr key={ad.id} className="border-b transition-colors hover:bg-white/[0.02] cursor-pointer" style={{ borderColor: 'var(--border-color)' }}>
                    <td className="px-4 py-3">
                      <p className="font-bold" style={{ color: 'var(--text-primary)', maxWidth: 160 }}>{ad.ad_set_name}</p>
                      <p className="text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>{ad.campaign_name}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined !text-[14px]" style={{ color: pc.color }}>{pc.icon}</span>
                        <span className="text-[10px] font-bold" style={{ color: pc.color }}>{pc.label}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-muted)' }}>{OBJECTIVE_CONFIG[ad.objective]}</td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>${ad.budget_daily}</td>
                    <td className="px-4 py-3 font-bold" style={{ color: '#f472b6' }}>${ad.spent.toLocaleString()}</td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{ad.impressions.toLocaleString()}</td>
                    <td className="px-4 py-3 font-bold" style={{ color: '#fb923c' }}>{ad.ctr}%</td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-muted)' }}>${ad.cpc}</td>
                    <td className="px-4 py-3 font-bold" style={{ color: '#CCFF00' }}>{ad.conversions > 0 ? ad.conversions : ad.objective === 'leads' ? `${mockMetaAdStats.total_leads} leads` : '—'}</td>
                    <td className="px-4 py-3 font-black" style={{ color: ad.roas > 0 ? '#4ade80' : 'var(--text-muted)' }}>
                      {ad.roas > 0 ? `${ad.roas}x` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${ad.status === 'active' ? 'bg-green-400/10 text-green-400' : 'bg-yellow-400/10 text-yellow-400'}`}>
                        {ad.status === 'active' ? 'Activo' : 'Pausado'}
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
