'use client'

import { useState } from 'react'
import { mockCashFlowMonths, mockCashFlowStats } from '@/lib/mockData'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts'
import { useToast } from '@/components/ToastProvider'

const tooltipStyle = { backgroundColor: '#0c1a2e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, color: '#fff', fontSize: 11 }

export default function CashFlowPage() {
  const { showToast } = useToast()
  const [view, setView] = useState<'bars' | 'balance'>('bars')

  const balanceData = mockCashFlowMonths.map(m => ({ ...m, balance: m.balance }))

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-black tight-tracking" style={{ color: 'var(--text-primary)' }}>Cash Flow</h1>
            <span className="px-2 py-1 rounded-full bg-[#CCFF00]/10 border border-[#CCFF00]/20 text-[9px] font-black label-tracking text-[#CCFF00]">ERP</span>
          </div>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Proyección de flujo de efectivo a 6 meses con alertas de liquidez</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 p-1 rounded-xl" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            {[{ label: 'Flujos', value: 'bars' as const }, { label: 'Balance', value: 'balance' as const }].map(opt => (
              <button key={opt.value} onClick={() => setView(opt.value)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                style={view === opt.value ? { backgroundColor: 'var(--accent-primary)', color: '#000' } : { color: 'var(--text-muted)' }}
              >{opt.label}</button>
            ))}
          </div>
          <button onClick={() => showToast({ type: 'info', title: 'Exportar', message: 'Flujo de caja exportado a XLSX.' })}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all hover:opacity-80"
            style={{ backgroundColor: 'rgba(204,255,0,0.1)', color: '#CCFF00', border: '1px solid rgba(204,255,0,0.2)' }}>
            <span className="material-symbols-outlined !text-[14px]">download</span>
            Exportar
          </button>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Saldo actual',        value: `$${(mockCashFlowStats.current_balance / 1000).toFixed(0)}K`,   color: '#CCFF00' },
          { label: 'Flujo neto prom.',    value: `$${(mockCashFlowStats.avg_monthly_net / 1000).toFixed(0)}K`,  color: mockCashFlowStats.avg_monthly_net >= 0 ? '#4ade80' : '#f87171' },
          { label: 'Saldo mínimo (6m)',   value: `$${(mockCashFlowStats.min_balance / 1000).toFixed(0)}K`,      color: mockCashFlowStats.min_balance < 50000 ? '#f87171' : '#facc15' },
          { label: 'Meses positivos',     value: `${mockCashFlowStats.months_positive} / ${mockCashFlowMonths.length}`, color: '#60a5fa' },
        ].map(s => (
          <div key={s.label} className="glass-card p-4 rounded-2xl">
            <p className="text-[10px] label-tracking mb-1" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
            <p className="text-xl font-black" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Main chart */}
      <div className="glass-card rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
            {view === 'bars' ? 'Entradas vs Salidas mensuales' : 'Evolución del saldo de caja'}
          </h2>
          <div className="flex items-center gap-3 text-[10px]" style={{ color: 'var(--text-muted)' }}>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-sm inline-block bg-[#CCFF00]" />
              {view === 'bars' ? 'Entradas' : 'Balance real'}
            </span>
            {view === 'bars' && (
              <>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-sm inline-block bg-[#f87171]" />
                  Salidas
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-sm inline-block bg-[#60a5fa]" />
                  Neto
                </span>
              </>
            )}
            <span className="flex items-center gap-1">
              <span className="w-4 border-t-2 border-dashed inline-block" style={{ borderColor: '#a78bfa' }} />
              Proyección
            </span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          {view === 'bars' ? (
            <BarChart data={mockCashFlowMonths} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}K`} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => `$${Number(v ?? 0).toLocaleString()}`} />
              <ReferenceLine y={0} stroke="rgba(255,255,255,0.15)" />
              <Bar dataKey="inflows" name="Entradas" fill="#CCFF00" radius={[4, 4, 0, 0]} opacity={0.85} />
              <Bar dataKey="outflows" name="Salidas" fill="#f87171" radius={[4, 4, 0, 0]} opacity={0.85} />
              <Bar dataKey="net" name="Neto" fill="#60a5fa" radius={[4, 4, 0, 0]} opacity={0.85} />
            </BarChart>
          ) : (
            <LineChart data={balanceData} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}K`} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => `$${Number(v ?? 0).toLocaleString()}`} />
              <ReferenceLine y={0} stroke="rgba(248,113,113,0.4)" strokeDasharray="4 4" />
              <Line type="monotone" dataKey="balance" name="Saldo" stroke="#CCFF00" strokeWidth={2.5}
                dot={(d: any) => d.payload.forecast ? null : <circle key={d.index} cx={d.cx} cy={d.cy} r={3} fill="#CCFF00" />} />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Monthly detail table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
          <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Detalle mensual</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                {['Mes', 'Entradas', 'Salidas', 'Flujo neto', 'Saldo', 'Tipo'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-black label-tracking" style={{ color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mockCashFlowMonths.map(m => {
                const netColor = m.net >= 0 ? '#4ade80' : '#f87171'
                return (
                  <tr key={m.month} className="hover:bg-white/[0.02] transition-colors" style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td className="px-4 py-3 text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{m.month}</td>
                    <td className="px-4 py-3 text-xs font-bold" style={{ color: '#4ade80' }}>${m.inflows.toLocaleString()}</td>
                    <td className="px-4 py-3 text-xs font-bold" style={{ color: '#f87171' }}>${m.outflows.toLocaleString()}</td>
                    <td className="px-4 py-3 text-xs font-black" style={{ color: netColor }}>{m.net >= 0 ? '+' : ''}${m.net.toLocaleString()}</td>
                    <td className="px-4 py-3 text-xs font-bold" style={{ color: '#CCFF00' }}>${m.balance.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${m.forecast ? 'bg-purple-400/10 text-[#a78bfa]' : 'bg-green-400/10 text-[#4ade80]'}`}>
                        {m.forecast ? 'Proyección' : 'Real'}
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
