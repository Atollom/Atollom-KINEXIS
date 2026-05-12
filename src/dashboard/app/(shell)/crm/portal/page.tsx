import type { Metadata } from 'next'
import { mockPortalUsers, mockPortalStats } from '@/lib/mockData'

export const metadata: Metadata = {
  title: 'Customer Portal — KINEXIS',
  description: 'Gestiona el acceso de clientes al portal de autogestión.',
}

const PLAN_CONFIG = {
  basic: { label: 'Basic', color: '#94a3b8', bg: 'bg-white/5' },
  premium: { label: 'Premium', color: '#60a5fa', bg: 'bg-blue-400/10' },
  enterprise: { label: 'Enterprise', color: '#CCFF00', bg: 'bg-[#CCFF00]/10' },
}

export default function CustomerPortalPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-black tight-tracking" style={{ color: 'var(--text-primary)' }}>
              Customer Portal
            </h1>
            <span className="px-2 py-1 rounded-full bg-purple-400/10 border border-purple-400/20 text-[9px] font-black label-tracking text-purple-400">
              CRM
            </span>
          </div>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Acceso de clientes a documentos, órdenes y soporte
          </p>
        </div>
        <button
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all hover:opacity-90 active:scale-[0.97]"
          style={{ backgroundColor: 'var(--accent-primary)', color: '#000' }}
        >
          <span className="material-symbols-outlined !text-[14px]">person_add</span>
          Invitar cliente
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Total clientes', value: mockPortalStats.total, color: 'var(--text-primary)' },
          { label: 'Con acceso', value: mockPortalStats.with_access, color: '#4ade80' },
          { label: 'Sin acceso', value: mockPortalStats.no_access, color: '#facc15' },
          { label: 'Tickets abiertos', value: mockPortalStats.open_tickets, color: '#f87171' },
          { label: 'Documentos', value: mockPortalStats.total_docs, color: '#60a5fa' },
        ].map(s => (
          <div key={s.label} className="glass-card p-4 rounded-2xl">
            <p className="text-[10px] label-tracking mb-1" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
            <p className="text-xl font-black" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Portal users table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
          <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Clientes con portal</h2>
        </div>
        <div className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
          {mockPortalUsers.map(u => {
            const pc = PLAN_CONFIG[u.plan]
            return (
              <div key={u.id} className="px-5 py-4 flex flex-col md:flex-row md:items-center gap-4 hover:bg-white/[0.02] transition-colors cursor-pointer">
                {/* Avatar + info */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-black text-sm" style={{ backgroundColor: 'rgba(167,139,250,0.1)', color: '#a78bfa' }}>
                    {u.company.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm truncate" style={{ color: 'var(--text-primary)' }}>{u.company}</p>
                    <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{u.contact_name} · {u.email}</p>
                  </div>
                </div>
                {/* Plan + access */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${pc.bg}`} style={{ color: pc.color }}>{pc.label}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${u.portal_access ? 'bg-green-400/10 text-green-400' : 'bg-yellow-400/10 text-yellow-400'}`}>
                    {u.portal_access ? 'Acceso activo' : 'Sin acceso'}
                  </span>
                </div>
                {/* Metrics */}
                <div className="flex items-center gap-6 flex-shrink-0">
                  <div className="text-center">
                    <p className="text-[10px] label-tracking" style={{ color: 'var(--text-muted)' }}>Docs</p>
                    <p className="text-sm font-bold" style={{ color: '#60a5fa' }}>{u.documents_shared}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] label-tracking" style={{ color: 'var(--text-muted)' }}>Tickets</p>
                    <p className="text-sm font-bold" style={{ color: u.open_tickets > 0 ? '#f87171' : 'var(--text-muted)' }}>{u.open_tickets}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] label-tracking" style={{ color: 'var(--text-muted)' }}>Órdenes</p>
                    <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{u.total_orders}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] label-tracking" style={{ color: 'var(--text-muted)' }}>Gastado</p>
                    <p className="text-sm font-bold" style={{ color: '#CCFF00' }}>${u.total_spent.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
