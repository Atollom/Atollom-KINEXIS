'use client'

import { useState } from 'react'
import { mockCostAnalysis, mockCostStats } from '@/lib/mockData'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { useToast } from '@/components/ToastProvider'

const PERIOD_OPTIONS = [{ label: 'Enero', value: 0 }, { label: 'Febrero', value: 1 }, { label: 'Marzo', value: 2 }] as const
const tooltipStyle = { backgroundColor: '#0c1a2e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, color: '#fff', fontSize: 11 }

export default function CostAnalysisPage() {
  const { showToast } = useToast()
  const [periodIdx, setPeriodIdx] = useState(mockCostAnalysis.length - 1)
  const analysis = mockCostAnalysis[periodIdx]

  const marginColor = (pct: number) =>
    pct >= 50 ? '#4ade80' : pct >= 30 ? '#CCFF00' : pct >= 15 ? '#facc15' : '#f87171'

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-black tight-tracking" style={{ color: 'var(--text-primary)' }}>Análisis de Costos</h1>
            <span className="px-2 py-1 rounded-full bg-[#CCFF00]/10 border border-[#CCFF00]/20 text-[9px] font-black label-tracking text-[#CCFF00]">ERP</span>
          </div>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Estructura de costos, márgenes por categoría y rentabilidad por producto</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 p-1 rounded-xl" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            {PERIOD_OPTIONS.map(opt => (
              <button key={opt.value} onClick={() => setPeriodIdx(opt.value)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                style={periodIdx === opt.value ? { backgroundColor: 'var(--accent-primary)', color: '#000' } : { color: 'var(--text-muted)' }}
              >{opt.label}</button>
            ))}
          </div>
          <button onClick={() => showToast({ type: 'info', title: 'Exportar', message: 'Reporte de costos exportado.' })}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all hover:opacity-80"
            style={{ backgroundColor: 'rgba(204,255,0,0.1)', color: '#CCFF00', border: '1px solid rgba(204,255,0,0.2)' }}>
            <span className="material-symbols-outlined !text-[14px]">download</span>
            Exportar
          </button>
        </div>
      </div>

      {/* Global summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Avg. Margen Bruto', value: `${mockCostStats.avg_gross_margin}%`, color: '#4ade80' },
          { label: 'Mejor categoría',   value: mockCostStats.best_category,          color: '#CCFF00' },
          { label: 'Menor margen',      value: mockCostStats.worst_category,         color: '#f87171' },
          { label: 'Productos análisis', value: mockCostStats.products_analyzed,     color: '#60a5fa' },
        ].map(s => (
          <div key={s.label} className="glass-card p-4 rounded-2xl">
            <p className="text-[10px] label-tracking mb-1" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
            <p className="text-lg font-black truncate" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Period financials + Pie */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Key metrics */}
        <div className="glass-card rounded-2xl p-5 space-y-4">
          <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Período: {analysis.period}</h2>
          {[
            { label: 'Ingresos totales', value: `$${(analysis.total_revenue / 1000).toFixed(0)}K`,    color: '#CCFF00' },
            { label: 'COGS',             value: `$${(analysis.total_cogs / 1000).toFixed(0)}K`,       color: '#f87171' },
            { label: 'Utilidad bruta',   value: `$${(analysis.gross_profit / 1000).toFixed(0)}K`,     color: '#4ade80' },
            { label: 'Margen bruto',     value: `${analysis.gross_margin_pct.toFixed(1)}%`,           color: marginColor(analysis.gross_margin_pct) },
          ].map(r => (
            <div key={r.label} className="flex items-center justify-between py-2 border-b last:border-0"
              style={{ borderColor: 'var(--border-color)' }}>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{r.label}</p>
              <p className="text-sm font-black" style={{ color: r.color }}>{r.value}</p>
            </div>
          ))}
        </div>

        {/* Cost breakdown donut */}
        <div className="glass-card rounded-2xl p-5">
          <h2 className="text-sm font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Distribución de costos</h2>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={analysis.categories} dataKey="amount" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3}>
                {analysis.categories.map((cat, i) => <Cell key={i} fill={cat.color} />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`$${v.toLocaleString()}`, 'Costo']} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {analysis.categories.map((cat, i) => (
              <div key={i} className="flex items-center justify-between text-[10px]">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                  <span style={{ color: 'var(--text-muted)' }}>{cat.name}</span>
                </div>
                <span className="font-bold" style={{ color: cat.color }}>{cat.percentage}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Margin summary */}
        <div className="glass-card rounded-2xl p-5 space-y-3">
          <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Categorías por margen</h2>
          {analysis.categories.map((cat, i) => (
            <div key={i} className="space-y-1">
              <div className="flex items-center justify-between text-[10px]">
                <span style={{ color: 'var(--text-muted)' }}>{cat.name}</span>
                <span className="font-bold" style={{ color: cat.color }}>{cat.percentage}% del costo</span>
              </div>
              <div className="h-1.5 rounded-full" style={{ backgroundColor: 'var(--border-color)' }}>
                <div className="h-full rounded-full transition-all" style={{ width: `${cat.percentage}%`, backgroundColor: cat.color }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top products table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
          <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Rentabilidad por producto</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                {['SKU', 'Producto', 'Revenue', 'COGS', 'Utilidad Bruta', 'Margen %'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-black label-tracking" style={{ color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {analysis.top_products.map(prod => (
                <tr key={prod.sku} className="hover:bg-white/[0.02] transition-colors" style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td className="px-4 py-3 text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>{prod.sku}</td>
                  <td className="px-4 py-3 text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{prod.name}</td>
                  <td className="px-4 py-3 text-xs font-bold" style={{ color: '#CCFF00' }}>${prod.revenue.toLocaleString()}</td>
                  <td className="px-4 py-3 text-xs font-bold" style={{ color: '#f87171' }}>${prod.cogs.toLocaleString()}</td>
                  <td className="px-4 py-3 text-xs font-bold" style={{ color: '#4ade80' }}>${prod.gross_margin.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full max-w-[60px]" style={{ backgroundColor: 'var(--border-color)' }}>
                        <div className="h-full rounded-full" style={{ width: `${Math.min(prod.gross_margin_pct, 100)}%`, backgroundColor: marginColor(prod.gross_margin_pct) }} />
                      </div>
                      <span className="text-xs font-black" style={{ color: marginColor(prod.gross_margin_pct) }}>{prod.gross_margin_pct.toFixed(1)}%</span>
                    </div>
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
