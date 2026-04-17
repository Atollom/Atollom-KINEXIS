'use client'

import React, { useState, useEffect } from "react";
import { 
  TrendingUp, 
  Package, 
  ShieldCheck, 
  Truck, 
  BarChart3, 
  Users as UsersIcon, 
  Zap, 
  Wallet,
  MapPin,
  ClipboardCheck,
  Activity,
  CheckCircle2,
  Clock
} from "lucide-react";
import type { UserRole } from "@/types";

export default function DashboardPage() {
  const [role, setRole] = useState<UserRole>('ADMIN');

  useEffect(() => {
     const interval = setInterval(() => {
        const savedRole = localStorage.getItem('kinexis_role') as UserRole;
        if (savedRole && savedRole !== role) setRole(savedRole);
     }, 1000);
     return () => clearInterval(interval);
  }, [role]);

  return (
    <div className="flex flex-col h-full gap-10">
      <header className="flex justify-between items-end px-4">
        <div>
           <h1 className="text-5xl font-black text-white tracking-tighter uppercase">
             KINEXIS <span className="text-[#CCFF00]">COMMAND</span>
           </h1>
           <p className="text-white/30 font-bold uppercase tracking-[0.4em] text-[10px] mt-2 flex items-center gap-2">
             <span className="w-2 h-2 rounded-full bg-[#CCFF00] animate-pulse shadow-[0_0_10px_#CCFF00]" />
             Control Central <span className="text-white font-black">/ {role}</span>
           </p>
        </div>
        <div className="bg-white/5 backdrop-blur-3xl px-8 py-4 rounded-full shadow-ambient flex items-center gap-6">
           <div className="text-right">
              <p className="text-[8px] font-black text-white/20 uppercase tracking-widest">Latencia Global</p>
              <p className="text-sm font-black text-[#CCFF00]">1.2ms <span className="opacity-20 text-white">V4</span></p>
           </div>
           <div className="w-10 h-10 rounded-full bg-[#CCFF00]/10 flex items-center justify-center">
              <Activity className="w-5 h-5 text-[#CCFF00]" />
           </div>
        </div>
      </header>

      {/* RECONSTRUCTED BENTO GRID (2 COLUMNS) */}
      <div className="grid grid-cols-2 gap-8 flex-1">
        
        {/* PANEL 1: METRICS MASTER ($1.2M) */}
        <div className="bg-white/5 backdrop-blur-3xl rounded-[3.5rem] p-12 shadow-ambient flex flex-col justify-between group hover:bg-white/8 transition-all duration-700 relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 opacity-[0.03] pointer-events-none group-hover:opacity-[0.07] transition-opacity duration-1000">
            <span className="text-[20rem] font-black text-white">$</span>
          </div>
          
          <div className="flex justify-between items-start relative z-10">
             <div>
                <p className="text-[10px] font-black text-[#CCFF00] uppercase tracking-[0.5em] mb-4">Ingresos Consolidados</p>
                <h3 className="text-7xl font-black text-white tracking-tighter leading-none">$1,242,800.00</h3>
                <p className="text-sm font-medium text-white/30 mt-6 tracking-tight flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#CCFF00]" />
                  +24.2% Growth vs Last Period
                </p>
             </div>
             <div className="px-6 py-2 bg-[#CCFF00] rounded-full text-[10px] font-black text-black tracking-widest uppercase shadow-glow">
                REALTIME
             </div>
          </div>

          <div className="flex items-center gap-6 mt-12 relative z-10">
             <div className="w-14 h-14 rounded-[1.5rem] bg-white/5 flex items-center justify-center">
                <Wallet className="w-7 h-7 text-[#CCFF00]" />
             </div>
             <div>
                <p className="text-[8px] font-black text-white/20 uppercase tracking-widest">Cartera en Tránsito</p>
                <p className="text-2xl font-black text-white tracking-widest">$42,300</p>
             </div>
          </div>
        </div>

        {/* PANEL 2: OPERATIONAL STATUS & ACTIVE ORDERS */}
        <div className="grid grid-rows-2 gap-8">
           {/* Online Status */}
           <div className="bg-white/5 backdrop-blur-3xl rounded-[3.5rem] p-10 shadow-ambient flex flex-col justify-center border border-white/5 hover:border-[#CCFF00]/20 transition-all group">
              <div className="flex items-center justify-between">
                 <div>
                    <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mb-2">Estado del Sistema</p>
                    <h4 className="text-4xl font-black text-white tracking-tighter">OPERATIVO <span className="text-[#CCFF00] animate-pulse">ONLINE</span></h4>
                 </div>
                 <div className="w-16 h-16 rounded-full bg-[#CCFF00]/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Zap className="w-8 h-8 text-[#CCFF00]" />
                 </div>
              </div>
           </div>

           {/* Active Orders Metric */}
           <div className="bg-white/5 backdrop-blur-3xl rounded-[3.5rem] p-10 shadow-ambient flex flex-col justify-center">
              <div className="flex items-center justify-between">
                 <div>
                    <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mb-2">Órdenes Activas</p>
                    <h4 className="text-6xl font-black text-white tracking-tighter opacity-90">142<span className="text-xl text-white/20 ml-2">Units</span></h4>
                 </div>
                 <div className="w-16 h-16 rounded-[2rem] bg-white/5 flex items-center justify-center">
                    <Package className="w-8 h-8 text-[#CCFF00]" />
                 </div>
              </div>
           </div>
        </div>

        {/* PANEL 3: PENDING ORDERS LIST (DETAILED) */}
        <div className="bg-white/5 backdrop-blur-3xl rounded-[3.5rem] p-10 shadow-ambient flex flex-col">
           <div className="flex items-center justify-between mb-8 px-2">
              <div className="flex items-center gap-4">
                 <Clock className="w-5 h-5 text-[#CCFF00]" />
                 <h3 className="text-[11px] font-black text-white uppercase tracking-[0.3em]">ÓRDENES PENDIENTES</h3>
              </div>
              <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest">Audit Q2</span>
           </div>

           <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {[
                { id: "F101", customer: "Cliente X", warehouse: "Almacén A", status: "Ready", icon: CheckCircle2 },
                { id: "F102", customer: "Cliente Y", warehouse: "Almacén B", status: "Picking", icon: Package },
                { id: "F103", customer: "Cliente Z", warehouse: "Almacén A", status: "In Transit", icon: Truck },
                { id: "F104", customer: "Cliente W", warehouse: "Almacén C", status: "Pending", icon: Clock },
              ].map((order, idx) => (
                <div key={idx} className="bg-white/3 rounded-[2rem] p-6 flex items-center justify-between hover:bg-white/5 transition-colors border border-transparent hover:border-white/5 group">
                   <div className="flex items-center gap-5">
                      <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-95 transition-transform">
                        <order.icon className="w-4 h-4 text-[#CCFF00]" />
                      </div>
                      <div>
                        <p className="text-xs font-black text-white tracking-widest underline decoration-[#CCFF00]/50 underline-offset-4">ORDER #{order.id}</p>
                        <p className="text-[10px] font-bold text-white/30 uppercase mt-1">{order.customer}</p>
                      </div>
                   </div>
                   <div className="text-right">
                      <p className="text-[9px] font-black text-[#CCFF00] uppercase tracking-widest">{order.warehouse}</p>
                      <p className="text-[8px] font-medium text-white/10 uppercase mt-1">Status: {order.status}</p>
                   </div>
                </div>
              ))}
           </div>
        </div>

        {/* PANEL 4: CRITICAL LOGISTICS FEED */}
        <div className="bg-white/5 backdrop-blur-3xl rounded-[3.5rem] p-10 shadow-ambient flex flex-col">
           <div className="flex items-center justify-between mb-8 px-2">
              <div className="flex items-center gap-4">
                 <Activity className="w-5 h-5 text-[#CCFF00]" />
                 <h3 className="text-[11px] font-black text-white uppercase tracking-[0.3em]">LOGÍSTICA CRÍTICA</h3>
              </div>
              <div className="bg-[#CCFF00]/10 px-3 py-1 rounded-full">
                 <p className="text-[8px] font-black text-[#CCFF00] uppercase">Live Tracking</p>
              </div>
           </div>

           <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {[
                { loc: "Almacén C", event: "Validado", time: "10m ago", info: "In Transit", icon: CheckCircle2 },
                { loc: "Andén 04", event: "Carga Lista", time: "22m ago", info: "Adicionales", icon: ClipboardCheck },
                { loc: "Distribución", event: "Ruta Activa", time: "1h ago", info: "Normal", icon: MapPin },
                { loc: "Almacén B", event: "Auditado", time: "2h ago", info: "Completo", icon: ShieldCheck },
              ].map((item, idx) => (
                <div key={idx} className="bg-white/3 rounded-[2rem] p-6 flex items-center justify-between hover:bg-white/5 transition-colors group">
                   <div className="flex items-center gap-5">
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                        <item.icon className="w-4 h-4 text-[#CCFF00]" />
                      </div>
                      <div>
                        <p className="text-xs font-black text-white tracking-widest flex items-center gap-2">
                           <span className="w-1.5 h-1.5 rounded-full bg-[#CCFF00]" />
                           {item.loc}
                        </p>
                        <p className="text-[10px] font-bold text-white/30 uppercase mt-1">{item.event}</p>
                      </div>
                   </div>
                   <div className="text-right">
                      <p className="text-[9px] font-black text-white/40 uppercase tracking-widest flex items-center justify-end gap-1">
                         <Clock className="w-3 h-3" />
                         {item.time}
                      </p>
                      <p className="text-[8px] font-medium text-white/10 uppercase mt-1">{item.info}</p>
                   </div>
                </div>
              ))}
           </div>
        </div>

      </div>
    </div>
  );
}
