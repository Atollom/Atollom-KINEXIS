'use client'

import React from 'react'
import { useTheme } from 'next-themes'
import {
  TrendingUp,
  Users,
  Target,
  DollarSign,
  BarChart3,
  History,
  ArrowUpRight,
  MoreVertical
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts'

const MOCK_DATA = [
  { name: 'Ene', sales: 4000 },
  { name: 'Feb', sales: 3000 },
  { name: 'Mar', sales: 5000 },
  { name: 'Abr', sales: 2780 },
  { name: 'May', sales: 4890 },
  { name: 'Jun', sales: 3390 },
]

const LEADS = [
  { id: '1', name: 'Alfonso Reyes', company: 'PharmaPlus', value: '$12,500', stage: 'Negociación', date: 'Hoy' },
  { id: '2', name: 'Beatriz Solis', company: 'Centro Med', value: '$8,200', stage: 'Propuesta', date: 'Ayer' },
  { id: '3', name: 'Carlos Diaz', company: 'Hosp. Central', value: '$45,000', stage: 'Cierre', date: '14 Abr' },
  { id: '4', name: 'Diana Ruiz', company: 'Lab Vida', value: '$3,100', stage: 'Contacto', date: '12 Abr' },
  { id: '5', name: 'Eduardo Mtz', company: 'Clínica Pro', value: '$15,000', stage: 'Negociación', date: '10 Abr' },
]

export default function DashboardVendedor() {
  const { resolvedTheme } = useTheme()
  const tooltipBg     = resolvedTheme === 'dark' ? '#0a1622' : '#ffffff'
  const tooltipBorder = resolvedTheme === 'dark' ? 'rgba(255,255,255,0.1)' : '#e5e5e5'
  const tooltipText   = resolvedTheme === 'dark' ? '#ffffff' : '#1a1a1a'
  const axisColor     = resolvedTheme === 'dark' ? 'rgba(255,255,255,0.3)' : '#999999'
  const gridColor     = resolvedTheme === 'dark' ? '#ffffff05' : '#e5e5e5'

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-700">
      {/* HEADER */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tighter uppercase italic">
            Sales <span className="text-[#CCFF00]">Intelligence</span>
          </h1>
          <p className="text-white/30 font-bold uppercase tracking-[0.4em] text-[9px] mt-1 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#CCFF00] animate-pulse shadow-[0_0_8px_#CCFF00]" />
            Pipeline Optimizer <span className="text-white font-black">/ Agente de Ventas</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 transition-all text-[10px] font-black uppercase tracking-widest text-white/60">
            Descargar Reporte
          </button>
          <button className="px-4 py-2 bg-[#CCFF00] hover:scale-105 transition-all rounded-xl text-[10px] font-black uppercase tracking-widest text-black shadow-[0_0_20px_rgba(204,255,0,0.3)]">
            Nueva Cotización
          </button>
        </div>
      </header>

      {/* KPI GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[
          { label: 'Ventas del Mes', val: '$142,300', change: '+12%', icon: DollarSign, color: '#CCFF00' },
          { label: 'Pipeline Activo', val: '$890,000', change: '84 deals', icon: Target, color: '#00D1FF' },
          { label: 'Tasa de Cierre', val: '64.2%', change: '+3.1%', icon: TrendingUp, color: '#FF0055' },
        ].map((kpi, i) => (
          <div key={i} className="bg-white/5 rounded-[2rem] p-6 border border-white/5 relative overflow-hidden group hover:bg-white/[0.08] transition-all duration-500">
            <div className="absolute -right-4 -top-4 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
              <kpi.icon size={120} />
            </div>
            <div className="relative z-10">
              <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em] mb-4">{kpi.label}</p>
              <div className="flex items-end justify-between">
                <h2 className="text-3xl font-black text-white tracking-tighter">{kpi.val}</h2>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-white/5 text-[#CCFF00]">
                  {kpi.change}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
        {/* CHART AREA */}
        <div className="lg:col-span-2 bg-white/5 rounded-[2.5rem] p-8 border border-white/5 flex flex-col min-h-[400px]">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-widest">Rendimiento Comercial</h3>
              <p className="text-[10px] text-white/30 font-bold uppercase">Consolidado Mensual 2026</p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center">
              <BarChart3 className="text-[#CCFF00] w-5 h-5" />
            </div>
          </div>
          
          <div className="flex-1 w-full min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={MOCK_DATA}>
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#CCFF00" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#CCFF00" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: axisColor, fontSize: 10, fontWeight: 700 }}
                  dy={10}
                />
                <YAxis hide />
                <Tooltip
                  cursor={{ fill: 'rgba(128,128,128,0.05)' }}
                  contentStyle={{
                    backgroundColor: tooltipBg,
                    border: `1px solid ${tooltipBorder}`,
                    borderRadius: '16px',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    color: tooltipText,
                  }}
                />
                <Bar 
                  dataKey="sales" 
                  radius={[12, 12, 0, 0]}
                  fill="url(#barGradient)"
                >
                  {MOCK_DATA.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === MOCK_DATA.length - 1 ? '#CCFF00' : 'url(#barGradient)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* LIST AREA */}
        <div className="bg-white/5 rounded-[2.5rem] p-7 border border-white/5 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#CCFF00]/10 flex items-center justify-center">
                <History className="w-4 h-4 text-[#CCFF00]" />
              </div>
              <h3 className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Actividad Reciente</h3>
            </div>
            <button className="text-white/20 hover:text-white transition-colors">
              <MoreVertical size={16} />
            </button>
          </div>

          <div className="space-y-3 overflow-y-auto custom-scrollbar flex-1 pr-1">
            {LEADS.map((lead) => (
              <div key={lead.id} className="bg-white/3 hover:bg-white/5 rounded-2xl p-4 transition-all duration-300 border border-transparent hover:border-white/5 group">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-[10px] font-black text-white">{lead.company}</p>
                    <p className="text-[9px] font-bold text-white/30 uppercase">{lead.name}</p>
                  </div>
                  <p className="text-[10px] font-black text-[#CCFF00]">{lead.value}</p>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[8px] font-black px-2 py-0.5 rounded bg-white/5 text-white/40 uppercase tracking-widest">
                    {lead.stage}
                  </span>
                  <p className="text-[8px] font-bold text-white/10 uppercase">{lead.date}</p>
                </div>
              </div>
            ))}
          </div>

          <button className="mt-6 w-full py-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-all text-[9px] font-black uppercase tracking-widest text-white flex items-center justify-center gap-2 group">
            Ver CRM Completo
            <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  )
}
