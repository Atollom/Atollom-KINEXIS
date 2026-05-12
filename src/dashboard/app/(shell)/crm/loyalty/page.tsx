import type { Metadata } from 'next'
import { mockLoyaltyPrograms, mockLoyaltyStats } from '@/lib/mockData'

export const metadata: Metadata = {
  title: 'Loyalty Programs — KINEXIS',
  description: 'Programas de fidelización: puntos, niveles y recompensas.',
}

const TIER_COLORS = ['#cd7f32', '#94a3b8', '#CCFF00', '#60a5fa']

export default function LoyaltyProgramsPage() {
  const totalPoints = mockLoyaltyStats.total_points_outstanding
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-black tight-tracking" style={{ color: 'var(--text-primary)' }}>
              Loyalty Programs
            </h1>
            <span className="px-2 py-1 rounded-full bg-purple-400/10 border border-purple-400/20 text-[9px] font-black label-tracking text-purple-400">
              CRM
            </span>
          </div>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Programas de fidelización con puntos, niveles y recompensas
          </p>
        </div>
        <button
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all hover:opacity-90 active:scale-[0.97]"
          style={{ backgroundColor: 'var(--accent-primary)', color: '#000' }}
        >
          <span className="material-symbols-outlined !text-[14px]">add</span>
          Nuevo programa
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Programas', value: mockLoyaltyStats.total_programs, color: 'var(--text-primary)' },
          { label: 'Miembros totales', value: mockLoyaltyStats.total_members.toLocaleString(), color: '#a78bfa' },
          { label: 'Puntos vigentes', value: totalPoints.toLocaleString(), color: '#CCFF00' },
          { label: 'Redención', value: `${mockLoyaltyStats.redemption_rate}%`, color: '#4ade80' },
        ].map(s => (
          <div key={s.label} className="glass-card p-4 rounded-2xl">
            <p className="text-[10px] label-tracking mb-1" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
            <p className="text-xl font-black" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Programs */}
      {mockLoyaltyPrograms.map(prog => (
        <div key={prog.id} className="glass-card rounded-2xl p-5 space-y-5" style={{ border: '1px solid var(--border-color)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(204,255,0,0.1)' }}>
                <span className="material-symbols-outlined !text-[18px] text-[#CCFF00]">
                  {prog.type === 'tiers' ? 'workspace_premium' : prog.type === 'cashback' ? 'payments' : 'stars'}
                </span>
              </div>
              <div>
                <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{prog.name}</p>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#CCFF00]/10 text-[#CCFF00]">
                    {prog.type === 'tiers' ? 'Niveles' : prog.type === 'cashback' ? 'Cashback' : 'Puntos'}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${prog.status === 'active' ? 'bg-green-400/10 text-green-400' : 'bg-yellow-400/10 text-yellow-400'}`}>
                    {prog.status === 'active' ? 'Activo' : 'Pausado'}
                  </span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black" style={{ color: '#a78bfa' }}>{prog.members.toLocaleString()}</p>
              <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>miembros</p>
            </div>
          </div>

          {/* Points bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[10px]" style={{ color: 'var(--text-muted)' }}>
              <span>Puntos emitidos</span>
              <span>{prog.points_issued.toLocaleString()} pts</span>
            </div>
            <div className="h-2 rounded-full" style={{ backgroundColor: 'var(--border-color)' }}>
              <div className="h-full rounded-full bg-[#CCFF00]" style={{ width: `${Math.min(100, (prog.points_redeemed / prog.points_issued) * 100).toFixed(1)}%` }} />
            </div>
            <div className="flex justify-between text-[10px]">
              <span style={{ color: '#4ade80' }}>{prog.points_redeemed.toLocaleString()} pts canjeados</span>
              <span style={{ color: 'var(--text-muted)' }}>{((prog.points_redeemed / prog.points_issued) * 100).toFixed(1)}%</span>
            </div>
          </div>

          {/* Tiers */}
          {prog.tiers && (
            <div>
              <p className="text-[10px] label-tracking mb-2" style={{ color: 'var(--text-muted)' }}>NIVELES</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {prog.tiers.map((tier, i) => (
                  <div key={tier.name} className="rounded-xl p-3 space-y-2" style={{ backgroundColor: 'var(--bg-card)', border: `1px solid ${tier.color}30` }}>
                    <div className="flex items-center justify-between">
                      <p className="font-black text-sm" style={{ color: tier.color }}>{tier.name}</p>
                      <p className="text-xs font-bold" style={{ color: 'var(--text-muted)' }}>{tier.members} miembros</p>
                    </div>
                    <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Desde ${tier.min_spent.toLocaleString()}</p>
                    <div className="flex flex-wrap gap-1">
                      {tier.benefits.map(b => (
                        <span key={b} className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: `${tier.color}15`, color: tier.color }}>{b}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rewards */}
          <div>
            <p className="text-[10px] label-tracking mb-2" style={{ color: 'var(--text-muted)' }}>RECOMPENSAS</p>
            <div className="space-y-2">
              {prog.rewards.map(r => (
                <div key={r.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined !text-[14px] text-[#CCFF00]">redeem</span>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{r.name}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {r.points_cost > 0 && <span className="text-[10px] font-bold text-[#CCFF00]">{r.points_cost.toLocaleString()} pts</span>}
                    <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{r.claimed} canjeados</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
