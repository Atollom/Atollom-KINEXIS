'use client'

import React, { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import {
  TrendingUp,
  Package,
  Zap,
  Wallet,
  Activity,
  CheckCircle2,
  Clock,
  ShieldCheck,
  ClipboardCheck,
  MapPin,
  Truck,
  ArrowUpRight
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

const MOCK_REVENUE = [
  { day: '01', revenue: 42000 },
  { day: '05', revenue: 38000 },
  { day: '10', revenue: 65000 },
  { day: '15', revenue: 59000 },
  { day: '20', revenue: 82000 },
  { day: '25', revenue: 74000 },
  { day: '30', revenue: 95000 },
]

export default function DashboardOwner() {
  const { resolvedTheme } = useTheme()
  const [stats, setStats] = useState({ products: 0, orders: 0, invoices: 0, revenue_30d: 0 })
  const [loading, setLoading] = useState(true)

  const tooltipBg     = resolvedTheme === 'dark' ? '#040f1b' : '#ffffff'
  const tooltipBorder = resolvedTheme === 'dark' ? 'rgba(255,255,255,0.06)' : '#e5e5e5'
  const tooltipText   = resolvedTheme === 'dark' ? '#ffffff' : '#1a1a1a'

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch('/api/dashboard/stats')
        if (res.ok) {
          const data = await res.json()
          setStats({
            products: data.products || 0,
            orders: data.orders || 0,
            invoices: data.invoices || 0,
            revenue_30d: data.revenue_30d || 0
          })
        }
      } catch (err) {
        console.error('Failed to load stats:', err)
      } finally {
        setLoading(false)
      }
    }
    loadStats()
  }, [])

  return (
    <div className="flex flex-col h-full gap-6 animate-in fade-in zoom-in-95 duration-1000">
      <header className="flex justify-between items-center px-2">
        <div>
           <h1 className="text-3xl font-black text-white tracking-tighter uppercase italic">
             Kinexis <span className="text-[#CCFF00]">Command</span>
           </h1>
           <p className="text-white/30 font-bold uppercase tracking-[0.4em] text-[10px] mt-1 flex items-center gap-2">
             <span className="w-1.5 h-1.5 rounded-full bg-[#CCFF00] animate-pulse shadow-[0_0_8px_#CCFF00]" />
             Supervisión Ejecutiva <span className="text-white font-black">/ Vista del Propietario</span>
           </p>
        </div>
        <div className="bg-white/5 px-6 py-3 rounded-2xl flex items-center gap-4 border border-white/5 shadow-2xl backdrop-blur-xl">
           <div className="text-right">
              <p className="text-[8px] font-black text-white/20 uppercase tracking-widest">Plataforma Sync</p>
              <p className="text-xs font-black text-[#CCFF00]">ACTIVA <span className="opacity-20 text-white">V4.2</span></p>
           </div>
           <div className="w-10 h-10 rounded-full bg-[#CCFF00]/10 flex items-center justify-center">
              <Activity className="w-5 h-5 text-[#CCFF00] animate-pulse" />
           </div>
        </div>
      </header>

      {/* BENTO GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
        
        {/* PANEL 1: REVENUE (With RECHARTS) */}
        <div className="bg-white/5 rounded-[3rem] p-8 flex flex-col justify-between group hover:bg-white/[0.08] transition-all duration-700 relative overflow-hidden border border-white/5">
          <div className="absolute -right-10 -bottom-10 opacity-[0.02] pointer-events-none group-hover:opacity-[0.05] transition-opacity">
            <span className="text-[20rem] font-black text-white leading-none">$</span>
          </div>
          
          <div className="relative z-10 flex justify-between items-start mb-4">
             <div>
                <p className="text-[10px] font-black text-[#CCFF00] uppercase tracking-[0.4em] mb-4">Ingresos Consolidados (30d)</p>
                {loading ? (
                  <div className="h-12 w-48 bg-white/10 animate-pulse rounded-lg mt-2"></div>
                ) : (
                  <h3 className="text-5xl font-black text-white tracking-tighter leading-none">
                    ${stats.revenue_30d.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </h3>
                )}
                <p className="text-xs font-medium text-white/40 mt-4 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#CCFF00]" />
                  <span className="text-white font-black">+24.2%</span> rendimiento vs trimestre anterior
                </p>
             </div>
             <div className="px-5 py-2 bg-[#CCFF00]/10 border border-[#CCFF00]/20 rounded-full flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#CCFF00] animate-ping" />
                <span className="text-[9px] font-black text-[#CCFF00] tracking-widest uppercase">ANÁLISIS EN VIVO</span>
             </div>
          </div>

          {/* Area Chart Integration */}
          <div className="flex-1 w-full min-h-[180px] mt-4 relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MOCK_REVENUE}>
                <defs>
                  <linearGradient id="ownerRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#CCFF00" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#CCFF00" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#CCFF00" 
                  strokeWidth={3} 
                  fill="url(#ownerRevenue)" 
                  animationDuration={2000}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: tooltipBg,
                    border: `1px solid ${tooltipBorder}`,
                    borderRadius: '12px',
                    color: tooltipText,
                  }}
                  cursor={{ stroke: tooltipBorder, strokeWidth: 1 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center gap-6 mt-8 relative z-10 pt-6 border-t border-white/5">
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center">
                  <Package className="w-5 h-5 text-[#CCFF00]" />
               </div>
               <div>
                  <p className="text-[8px] font-black text-white/20 uppercase tracking-widest">Catálogo</p>
                  {loading ? <div className="h-6 w-16 bg-white/10 animate-pulse rounded mt-1"></div> : <p className="text-xl font-black text-white">{stats.products}</p>}
               </div>
             </div>
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-white/40" />
               </div>
               <div>
                  <p className="text-[8px] font-black text-white/20 uppercase tracking-widest">Órdenes Totales</p>
                  {loading ? <div className="h-6 w-16 bg-white/10 animate-pulse rounded mt-1"></div> : <p className="text-xl font-black text-white">{stats.orders}</p>}
               </div>
             </div>
          </div>
        </div>

        {/* PANEL 2: SYSTEM HEALTH & METRICS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           {/* Row 1 */}
           <div className="bg-white/5 rounded-[2.5rem] p-8 flex flex-col justify-between border border-white/5 hover:border-[#CCFF00]/30 transition-all group overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#CCFF00]/5 blur-[60px] rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="relative z-10 flex justify-between items-start">
                <div>
                   <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] mb-2">Estado del Sistema</p>
                   <h4 className="text-2xl font-black text-white tracking-tighter leading-tight uppercase">Plataforma <br/><span className="text-[#CCFF00]">Estable</span></h4>
                </div>
                <div className="w-12 h-12 rounded-full bg-[#CCFF00]/10 flex items-center justify-center group-hover:scale-110 transition-transform shadow-[0_0_20px_rgba(204,255,0,0.1)]">
                   <Zap className="w-6 h-6 text-[#CCFF00]" />
                </div>
              </div>
              <div className="relative z-10 mt-6 flex items-center gap-2">
                 {[1,2,3,4,5,6].map(i => (
                   <div key={i} className="flex-1 h-1 rounded-full bg-[#CCFF00] opacity-30 shadow-[0_0_5px_#CCFF00]" />
                 ))}
                 <span className="text-[8px] font-black text-[#CCFF00]">SYNC</span>
              </div>
           </div>

           <div className="bg-white/5 rounded-[2.5rem] p-8 flex flex-col justify-between border border-white/5 hover:bg-white/[0.08] transition-all group">
              <div className="flex justify-between items-start">
                <div>
                   <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] mb-2">Facturas CFDI</p>
                   {loading ? (
                     <div className="h-10 w-24 bg-white/10 animate-pulse rounded-lg mt-1"></div>
                   ) : (
                     <h4 className="text-4xl font-black text-white tracking-tighter">{stats.invoices}<span className="text-base text-white/20 ml-2 font-black italic">TIMBRADAS</span></h4>
                   )}
                </div>
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center group-hover:rotate-12 transition-transform">
                   <ClipboardCheck className="w-6 h-6 text-[#CCFF00]" />
                </div>
              </div>
              <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mt-4 flex items-center gap-2">
                <ShieldCheck className="w-3 h-3" />
                100% Validadas
              </p>
           </div>

           {/* Row 2: Recent Activity List (Simplified) */}
           <div className="md:col-span-2 bg-white/5 rounded-[2.5rem] p-8 border border-white/5 flex flex-col h-full">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xs font-black text-white uppercase tracking-[0.3em]">Operaciones Críticas</h3>
                <button className="text-[9px] font-black text-[#CCFF00] uppercase tracking-widest hover:underline transition-all flex items-center gap-2">
                  AUDITORÍA COMPLETA <ArrowUpRight size={14} />
                </button>
              </div>
              <div className="space-y-4">
                 {[
                   { id: "A-801", label: "Auditoría de Inventario", val: "Cumplimiento", info: "Almacén A", icon: ShieldCheck, color: "text-[#CCFF00]" },
                   { id: "L-224", label: "Sincronización Logística", val: "Activo", info: "Ruta 04", icon: MapPin, color: "text-white/40" },
                   { id: "P-109", label: "Autorización de Compras", val: "Pendiente", info: "$12.4k sol.", icon: Clock, color: "text-[#FF0055]" },
                 ].map((item, idx) => (
                   <div key={idx} className="flex items-center justify-between py-4 border-b border-white/5 last:border-0 group cursor-pointer">
                      <div className="flex items-center gap-4">
                         <div className="w-10 h-10 rounded-xl bg-white/3 flex items-center justify-center group-hover:bg-[#CCFF00]/10 transition-colors">
                            <item.icon className="w-4 h-4 text-white/30 group-hover:text-[#CCFF00] transition-colors" />
                         </div>
                         <div>
                            <p className="text-[11px] font-black text-white uppercase">{item.label}</p>
                            <p className="text-[9px] font-bold text-white/20 uppercase">{item.info}</p>
                         </div>
                      </div>
                      <div className="text-right">
                         <p className={`text-[10px] font-black uppercase ${item.color}`}>{item.val}</p>
                         <p className="text-[8px] font-bold text-white/10">{item.id}</p>
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        </div>

      </div>
    </div>
  )
}

