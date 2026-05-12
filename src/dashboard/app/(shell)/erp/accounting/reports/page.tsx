import type { Metadata } from 'next'
import { mockTaxReports, mockTaxStats } from '@/lib/mockData'

export const metadata: Metadata = {
  title: 'Reportes Fiscales — KINEXIS',
  description: 'IVA, ISR, retenciones y DIOT — obligaciones fiscales del mes.',
}

const TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  iva: { label: 'IVA', color: '#CCFF00' },
  isr: { label: 'ISR', color: '#fb923c' },
  retenciones: { label: 'Retenciones', color: '#a78bfa' },
  diot: { label: 'DIOT', color: '#60a5fa' },
}

const STATUS_CONFIG = {
  draft: { label: 'Borrador', color: '#94a3b8', bg: 'bg-white/5' },
  filed: { label: 'Presentada', color: '#CCFF00', bg: 'bg-[#CCFF00]/10' },
  paid: { label: 'Pagada', color: '#4ade80', bg: 'bg-green-400/10' },
}

export default function TaxReportsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-black tight-tracking" style={{ color: 'var(--text-primary)' }}>
              Reportes Fiscales
            </h1>
            <span className="px-2 py-1 rounded-full bg-[#CCFF00]/10 border border-[#CCFF00]/20 text-[9px] font-black label-tracking text-[#CCFF00]">
              SAT / ERP
            </span>
          </div>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            IVA, ISR, retenciones y DIOT — cálculo y presentación SAT
          </p>
        </div>
        <button
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all hover:opacity-90 active:scale-[0.97]"
          style={{ backgroundColor: 'var(--accent-primary)', color: '#000' }}
        >
          <span className="material-symbols-outlined !text-[14px]">calculate</span>
          Calcular periodo
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {[
          { label: 'Reportes', value: mockTaxStats.total_reports, color: 'var(--text-primary)' },
          { label: 'Presentadas', value: mockTaxStats.filed, color: '#CCFF00' },
          { label: 'Pagadas', value: mockTaxStats.paid, color: '#4ade80' },
          { label: 'Borrador', value: mockTaxStats.draft, color: '#facc15' },
          { label: 'IVA a pagar', value: `$${mockTaxStats.total_iva_due.toLocaleString()}`, color: '#CCFF00' },
          { label: 'ISR a pagar', value: `$${mockTaxStats.total_isr_due.toLocaleString()}`, color: '#fb923c' },
        ].map(s => (
          <div key={s.label} className="glass-card p-4 rounded-2xl">
            <p className="text-[10px] label-tracking mb-1" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
            <p className="text-lg font-black" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tax report cards */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
          <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Declaraciones</h2>
        </div>
        <div className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
          {mockTaxReports.map(r => {
            const tc = TYPE_CONFIG[r.report_type]
            const sc = STATUS_CONFIG[r.status]
            return (
              <div key={r.id} className="px-5 py-4 flex flex-col md:flex-row md:items-center gap-4 hover:bg-white/[0.02] transition-colors cursor-pointer">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${tc.color}15` }}>
                    <span className="text-sm font-black" style={{ color: tc.color }}>{tc.label}</span>
                  </div>
                  <div>
                    <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                      {tc.label} {r.period}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      Vencimiento: {r.due_date}{r.filed_date ? ` · Presentada: ${r.filed_date}` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6 flex-shrink-0">
                  {r.sales_tax_collected > 0 && (
                    <div className="text-right">
                      <p className="text-[10px] label-tracking" style={{ color: 'var(--text-muted)' }}>IVA cobrado</p>
                      <p className="text-sm font-bold text-green-400">${r.sales_tax_collected.toLocaleString()}</p>
                    </div>
                  )}
                  {r.purchases_tax_paid > 0 && (
                    <div className="text-right">
                      <p className="text-[10px] label-tracking" style={{ color: 'var(--text-muted)' }}>IVA pagado</p>
                      <p className="text-sm font-bold text-red-400">${r.purchases_tax_paid.toLocaleString()}</p>
                    </div>
                  )}
                  {r.net_tax > 0 && (
                    <div className="text-right">
                      <p className="text-[10px] label-tracking" style={{ color: 'var(--text-muted)' }}>Neto a pagar</p>
                      <p className="text-sm font-black" style={{ color: tc.color }}>${r.net_tax.toLocaleString()}</p>
                    </div>
                  )}
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${sc.bg}`} style={{ color: sc.color }}>{sc.label}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
