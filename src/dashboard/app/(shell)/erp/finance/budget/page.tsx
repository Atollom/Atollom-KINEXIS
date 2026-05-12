import type { Metadata } from 'next'
import { mockBudgets, mockBudgetStats } from '@/lib/mockData'

export const metadata: Metadata = {
  title: 'Presupuesto — KINEXIS',
  description: 'Planeación y seguimiento de presupuestos por departamento.',
}

const STATUS_CONFIG = {
  on_track: { label: 'En control', color: '#4ade80', bg: 'bg-green-400/10' },
  warning: { label: 'Atención', color: '#facc15', bg: 'bg-yellow-400/10' },
  over_budget: { label: 'Excedido', color: '#f87171', bg: 'bg-red-400/10' },
}

const CAT_STATUS_CONFIG = {
  ok: { color: '#4ade80' },
  warning: { color: '#facc15' },
  over: { color: '#f87171' },
}

export default function BudgetPlanningPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-black tight-tracking" style={{ color: 'var(--text-primary)' }}>
              Presupuesto
            </h1>
            <span className="px-2 py-1 rounded-full bg-[#CCFF00]/10 border border-[#CCFF00]/20 text-[9px] font-black label-tracking text-[#CCFF00]">
              ERP
            </span>
          </div>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Planeación y control presupuestal por departamento
          </p>
        </div>
        <button
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all hover:opacity-90 active:scale-[0.97]"
          style={{ backgroundColor: 'var(--accent-primary)', color: '#000' }}
        >
          <span className="material-symbols-outlined !text-[14px]">add</span>
          Nuevo presupuesto
        </button>
      </div>

      {/* Global stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Departamentos', value: mockBudgetStats.departments, color: 'var(--text-primary)' },
          { label: 'Total presupuestado', value: `$${mockBudgetStats.total_budgeted.toLocaleString()}`, color: '#CCFF00' },
          { label: 'Total gastado', value: `$${mockBudgetStats.total_spent.toLocaleString()}`, color: '#fb923c' },
          { label: 'Burn rate', value: `${mockBudgetStats.burn_rate}%`, color: mockBudgetStats.burn_rate < 80 ? '#4ade80' : '#facc15' },
        ].map(s => (
          <div key={s.label} className="glass-card p-4 rounded-2xl">
            <p className="text-[10px] label-tracking mb-1" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
            <p className="text-xl font-black" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Budget cards per department */}
      {mockBudgets.map(budget => {
        const sc = STATUS_CONFIG[budget.status]
        const burnPct = ((budget.total_spent / budget.total_budgeted) * 100)
        return (
          <div key={budget.id} className="glass-card rounded-2xl p-5 space-y-5" style={{ border: '1px solid var(--border-color)' }}>
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>{budget.department}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{budget.period}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${sc.bg}`} style={{ color: sc.color }}>{sc.label}</span>
                <div className="text-right">
                  <p className="text-sm font-black" style={{ color: '#CCFF00' }}>${budget.total_remaining.toLocaleString()}</p>
                  <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>restante</p>
                </div>
              </div>
            </div>

            {/* Global bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px]" style={{ color: 'var(--text-muted)' }}>
                <span>Presupuesto total</span>
                <span className="font-bold">{burnPct.toFixed(1)}% utilizado</span>
              </div>
              <div className="h-2 rounded-full" style={{ backgroundColor: 'var(--border-color)' }}>
                <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, burnPct)}%`, backgroundColor: burnPct > 95 ? '#f87171' : burnPct > 80 ? '#facc15' : '#CCFF00' }} />
              </div>
              <div className="flex justify-between text-[10px]">
                <span style={{ color: '#fb923c' }}>${budget.total_spent.toLocaleString()} gastado</span>
                <span style={{ color: 'var(--text-muted)' }}>de ${budget.total_budgeted.toLocaleString()}</span>
              </div>
            </div>

            {/* Categories */}
            <div className="space-y-3">
              {budget.categories.map(cat => {
                const cc = CAT_STATUS_CONFIG[cat.status]
                return (
                  <div key={cat.name} className="space-y-1">
                    <div className="flex justify-between items-center">
                      <p className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>{cat.name}</p>
                      <div className="flex items-center gap-3">
                        <p className="text-xs" style={{ color: cc.color }}>{cat.pct.toFixed(1)}%</p>
                        <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>${cat.spent.toLocaleString()} / ${cat.budgeted.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full" style={{ backgroundColor: 'var(--border-color)' }}>
                      <div className="h-full rounded-full" style={{ width: `${Math.min(100, cat.pct)}%`, backgroundColor: cc.color }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
