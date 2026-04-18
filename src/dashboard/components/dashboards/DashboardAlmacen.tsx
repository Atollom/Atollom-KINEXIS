'use client'

import React from 'react'
import { 
  Package, 
  Warehouse, 
  ArrowDownLeft, 
  ArrowUpRight, 
  AlertTriangle,
  MoveHorizontal,
  ClipboardList,
  Clock,
  CheckCircle2
} from 'lucide-react'
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts'

const MOCK_MOVEMENTS = [
  { time: '08:00', movements: 12 },
  { time: '10:00', movements: 45 },
  { time: '12:00', movements: 82 },
  { time: '14:00', movements: 64 },
  { time: '16:00', movements: 38 },
  { time: '18:00', movements: 21 },
]

const ORDERS_TO_PICK = [
  { id: 'F-902', client: 'Orthopedics SA', items: 12, priority: 'Alta', status: 'Picking' },
  { id: 'F-905', client: 'Hospital San Jose', items: 5, priority: 'Media', status: 'Pending' },
  { id: 'F-908', client: 'Clinica Real', items: 28, priority: 'Alta', status: 'Pre-check' },
  { id: 'F-910', client: 'Dr. Mendez', items: 2, priority: 'Baja', status: 'Pending' },
  { id: 'F-912', client: 'Farmacias Global', items: 110, priority: 'Alta', status: 'Ready' },
]

export default function DashboardAlmacen() {
  return (
    <div className="flex flex-col gap-6 animate-in slide-in-from-bottom-4 duration-700">
      {/* HEADER */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tighter uppercase italic">
            Logistics <span className="text-[#CCFF00]">Control</span>
          </h1>
          <p className="text-white/30 font-bold uppercase tracking-[0.4em] text-[9px] mt-1 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#CCFF00] animate-pulse shadow-[0_0_8px_#CCFF00]" />
            Supply Chain Hub <span className="text-white font-black">/ Almacenista</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 transition-all text-[10px] font-black uppercase tracking-widest text-white/60">
            Inventario Cíclico
          </button>
          <button className="px-4 py-2 bg-[#CCFF00] hover:scale-105 transition-all rounded-xl text-[10px] font-black uppercase tracking-widest text-black shadow-[0_0_20px_rgba(204,255,0,0.3)]">
            Nueva Recepción
          </button>
        </div>
      </header>

      {/* KPI GRID */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Stock Crítico', val: '12', sub: 'SKUs bajo mínimo', icon: AlertTriangle, color: '#FF0055' },
          { label: 'Órdenes Hoy', val: '42', sub: 'Pendientes por surtir', icon: Package, color: '#CCFF00' },
          { label: 'Recibido', val: '156', sub: 'Items hoy', icon: ArrowDownLeft, color: '#00D1FF' },
          { label: 'Surtido', val: '128', sub: 'Items hoy', icon: ArrowUpRight, color: '#CCFF00' },
        ].map((kpi, i) => (
          <div key={i} className="bg-white/5 rounded-[2rem] p-5 border border-white/5 group hover:bg-white/10 transition-all duration-300">
            <div className="flex justify-between items-start mb-3">
              <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center">
                <kpi.icon size={20} color={kpi.color} />
              </div>
              <span className="text-[10px] font-black text-white/10 group-hover:text-white/40 transition-colors uppercase">Real Time</span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tighter">{kpi.val}</h2>
            <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mt-1">{kpi.label}</p>
            <p className="text-[7px] font-medium text-white/20 mt-0.5">{kpi.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* CHART AREA */}
        <div className="xl:col-span-3 bg-white/5 rounded-[2.5rem] p-8 border border-white/5 flex flex-col min-h-[400px]">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-widest">Flujo de Inventario</h3>
              <p className="text-[10px] text-white/30 font-bold uppercase italic">Peak hours analysis</p>
            </div>
            <div className="flex gap-2">
              <div className="px-3 py-1 bg-white/5 rounded-lg text-[8px] font-black text-[#CCFF00] uppercase tracking-widest border border-[#CCFF00]/20">HOY</div>
              <div className="px-3 py-1 bg-transparent rounded-lg text-[8px] font-black text-white/20 uppercase tracking-widest hover:bg-white/5 cursor-pointer transition-colors">7 DÍAS</div>
            </div>
          </div>
          
          <div className="flex-1 w-full min-h-[250px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MOCK_MOVEMENTS}>
                <defs>
                  <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#CCFF00" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#CCFF00" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="5 5" stroke="#ffffff03" vertical={false} />
                <XAxis 
                  dataKey="time" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: 'rgba(255,255,255,0.2)', fontSize: 9, fontWeight: 700}}
                />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#040f1b',
                    border: '1px solid rgba(255,255,255,0.05)',
                    borderRadius: '12px',
                    fontSize: '10px',
                    fontWeight: 'black'
                  }}
                  cursor={{stroke: '#CCFF00', strokeWidth: 1, strokeDasharray: '5 5'}}
                />
                <Area 
                  type="monotone" 
                  dataKey="movements" 
                  stroke="#CCFF00" 
                  strokeWidth={3}
                  fill="url(#areaGradient)" 
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* LIST AREA */}
        <div className="xl:col-span-2 bg-white/5 rounded-[2.5rem] p-7 border border-white/5 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#CCFF00]/10 flex items-center justify-center">
                <ClipboardList className="w-4 h-4 text-[#CCFF00]" />
              </div>
              <h3 className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Órdenes para Surtir</h3>
            </div>
            <span className="text-[8px] font-black text-white/20 uppercase">5 Priority Pack</span>
          </div>

          <div className="space-y-3 overflow-y-auto custom-scrollbar flex-1 pr-1">
            {ORDERS_TO_PICK.map((order) => (
              <div key={order.id} className="bg-white/3 hover:bg-white/5 rounded-2xl p-4 transition-all border border-transparent hover:border-white/5 group relative overflow-hidden">
                {order.priority === 'Alta' && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#FF0055]" />
                )}
                <div className="flex justify-between items-start mb-1">
                  <div>
                    <p className="text-[10px] font-black text-white">ID: {order.id}</p>
                    <p className="text-[9px] font-bold text-white/40 uppercase">{order.client}</p>
                  </div>
                  <div className="flex flex-col items-end">
                    <p className="text-[10px] font-black text-white">{order.items} <span className="text-[8px] text-white/30">units</span></p>
                    <p className={`text-[7px] font-black uppercase px-1.5 rounded-full ${order.priority === 'Alta' ? 'bg-[#FF0055]/10 text-[#FF0055]' : 'bg-white/5 text-white/20'}`}>
                      {order.priority}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-[#CCFF00]" style={{width: order.status === 'Ready' ? '100%' : order.status === 'Picking' ? '40%' : '10%'}} />
                  </div>
                  <span className="text-[8px] font-black text-white/40 uppercase">{order.status}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex gap-3">
            <button className="flex-1 py-4 rounded-full bg-white/5 hover:bg-white/10 transition-all text-[9px] font-black uppercase tracking-widest text-white/60">
              Ver Historial
            </button>
            <button className="flex-1 py-4 rounded-full bg-[#CCFF00] hover:scale-105 transition-all text-[9px] font-black uppercase tracking-widest text-black shadow-lg">
              Empezar Picking
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
