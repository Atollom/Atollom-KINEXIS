'use client'

import React from 'react'
import { 
  Building2, 
  MessageSquare, 
  Ticket, 
  Globe, 
  Activity, 
  Shield, 
  Network,
  Bell,
  MoreHorizontal
} from 'lucide-react'
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine
} from 'recharts'

const MOCK_GROWTH = [
  { month: 'Ene', tenants: 12, health: 98 },
  { month: 'Feb', tenants: 15, health: 95 },
  { month: 'Mar', tenants: 18, health: 99 },
  { month: 'Abr', tenants: 24, health: 97 },
  { month: 'May', tenants: 31, health: 94 },
  { month: 'Jun', tenants: 42, health: 98 },
]

const TICKETS = [
  { id: 'TK-101', tenant: 'Orthocardio', subject: 'Falla en syncing ML', priority: 'High', status: 'Open', time: '5m ago' },
  { id: 'TK-105', tenant: 'TechFlow', subject: 'Error en API Key', priority: 'Medium', status: 'In Progress', time: '12m ago' },
  { id: 'TK-108', tenant: 'Comercial Norte', subject: 'Nueva integración WA', priority: 'Low', status: 'Open', time: '1h ago' },
  { id: 'TK-110', tenant: 'SkyNet Ops', subject: 'Update Samantha V4', priority: 'High', status: 'Blocked', time: '2h ago' },
  { id: 'TK-112', tenant: 'Global Bio', subject: 'Reinicio servidor', priority: 'Critical', status: 'Resolved', time: '4h ago' },
]

export default function DashboardAtollom() {
  return (
    <div className="flex flex-col gap-6 animate-in zoom-in-95 duration-700">
      {/* HEADER */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tighter uppercase italic">
            Global <span className="text-[#CCFF00]">Command</span>
          </h1>
          <p className="text-white/30 font-bold uppercase tracking-[0.4em] text-[9px] mt-1 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#CCFF00] animate-pulse shadow-[0_0_8px_#CCFF00]" />
            Atollom Infrastructure <span className="text-white font-black">/ System Root</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex -space-x-3 mr-4">
            {[1,2,3,4].map(i => (
              <div key={i} className="w-8 h-8 rounded-full border-2 border-[#040f1b] bg-white/10 flex items-center justify-center text-[10px] font-black text-white">
                {String.fromCharCode(64 + i)}
              </div>
            ))}
            <div className="w-8 h-8 rounded-full border-2 border-[#040f1b] bg-[#CCFF00] flex items-center justify-center text-[10px] font-black text-black">
              +8
            </div>
          </div>
          <button className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-all text-white/40 hover:text-[#CCFF00] relative">
            <Bell size={18} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-[#FF0055] rounded-full border-2 border-[#040f1b]" />
          </button>
        </div>
      </header>

      {/* KPI GRID */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Tenants Activos', val: '42', sub: 'Growth +12%', icon: Building2, color: '#CCFF00' },
          { label: 'Tickets Abiertos', val: '08', sub: '2 críticos', icon: Ticket, color: '#FF0055' },
          { label: 'Chats Samantha', val: '156', sub: 'Autonomía 94%', icon: MessageSquare, color: '#00D1FF' },
          { label: 'Uptime Global', val: '99.98%', sub: 'Latency 1.2ms', icon: Globe, color: '#CCFF00' },
        ].map((kpi, i) => (
          <div key={i} className="bg-white/5 rounded-[2rem] p-6 border border-white/5 relative group hover:scale-[1.02] transition-all duration-300 overflow-hidden">
             <div className="absolute right-0 top-0 p-3 opacity-20 group-hover:opacity-100 transition-opacity">
               <div className="w-2 h-2 rounded-full bg-[#CCFF00] shadow-[0_0_10px_#CCFF00]" />
             </div>
             <kpi.icon size={18} className="text-white/20 mb-4" />
             <h2 className="text-3xl font-black text-white tracking-tighter">{kpi.val}</h2>
             <div className="flex items-center justify-between mt-1">
               <p className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em]">{kpi.label}</p>
               <span className="text-[7px] font-black text-[#CCFF00]">{kpi.sub}</span>
             </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* CHART AREA */}
        <div className="lg:col-span-8 bg-white/5 rounded-[2.5rem] p-8 border border-white/5 flex flex-col min-h-[450px]">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#CCFF00]/10 flex items-center justify-center">
                <Network className="text-[#CCFF00] w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-widest leading-tight">Escalabilidad de Plataforma</h3>
                <p className="text-[10px] text-white/30 font-bold uppercase italic">Metric: Total Tenants Active</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
               <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-[#CCFF00]" />
                 <span className="text-[9px] font-black text-white/40 uppercase">Growth</span>
               </div>
               <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-[#00D1FF]" />
                 <span className="text-[9px] font-black text-white/40 uppercase">Health %</span>
               </div>
            </div>
          </div>
          
          <div className="flex-1 w-full min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={MOCK_GROWTH}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: 'rgba(255,255,255,0.2)', fontSize: 10, fontWeight: 700}}
                />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#040f1b',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '16px',
                    fontSize: '10px',
                    fontWeight: 'black'
                  }}
                />
                <Line 
                  type="stepAfter" 
                  dataKey="tenants" 
                  stroke="#CCFF00" 
                  strokeWidth={4} 
                  dot={{ r: 4, fill: '#CCFF00', strokeWidth: 0 }}
                  activeDot={{ r: 8, stroke: '#CCFF00', strokeWidth: 2, fill: '#040f1b' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="health" 
                  stroke="#00D1FF" 
                  strokeWidth={2} 
                  strokeDasharray="5 5"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* FEED AREA */}
        <div className="lg:col-span-4 bg-white/5 rounded-[2.5rem] p-7 border border-white/5 flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Support Command Center</h3>
            <div className="px-3 py-1 bg-white/5 rounded-full text-[8px] font-black text-white/40 uppercase tracking-widest border border-white/5">
              LIVE FEED
            </div>
          </div>

          <div className="space-y-4 overflow-y-auto custom-scrollbar flex-1 pr-1">
            {TICKETS.map((tk) => (
              <div key={tk.id} className="group relative">
                <div className="flex justify-between items-start mb-1">
                  <div className="flex items-center gap-2">
                    <p className="text-[10px] font-black text-[#CCFF00]">{tk.tenant}</p>
                    <span className="text-white/10 text-[10px]">•</span>
                    <p className="text-[8px] font-black text-white/30 uppercase">{tk.time}</p>
                  </div>
                  <span className={`text-[7px] font-black px-1.5 py-0.5 rounded uppercase ${tk.priority === 'High' || tk.priority === 'Critical' ? 'bg-[#FF0055]/10 text-[#FF0055]' : 'bg-white/5 text-white/30'}`}>
                    {tk.priority}
                  </span>
                </div>
                <p className="text-[11px] font-bold text-white leading-tight mb-2 group-hover:text-[#CCFF00] transition-colors">{tk.subject}</p>
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                   <p className="text-[8px] font-black text-white/10 uppercase">{tk.id}</p>
                   <div className="flex items-center gap-1.5">
                      <div className={`w-1 h-1 rounded-full ${tk.status === 'Open' ? 'bg-[#FF0055] animate-pulse' : 'bg-white/20'}`} />
                      <p className="text-[8px] font-black text-white/20 uppercase tracking-widest">{tk.status}</p>
                   </div>
                </div>
              </div>
            ))}
          </div>

          <button className="mt-8 w-full py-4 rounded-2xl bg-[#CCFF00]/5 hover:bg-[#CCFF00]/10 transition-all border border-[#CCFF00]/20 text-[9px] font-black uppercase tracking-widest text-[#CCFF00]">
            Ir a Panel de Administración
          </button>
        </div>
      </div>
    </div>
  )
}
