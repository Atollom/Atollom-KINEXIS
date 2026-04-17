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
  const [role, setRole] = useState<UserRole>('viewer');

  useEffect(() => {
     const interval = setInterval(() => {
        const savedRole = localStorage.getItem('kinexis_role') as UserRole;
        if (savedRole && savedRole !== role) setRole(savedRole);
     }, 1000);
     return () => clearInterval(interval);
  }, [role]);

  return (
    <div className="flex flex-col h-full gap-6">
      <header className="flex justify-between items-center px-2">
        <div>
           <h1 className="text-3xl font-black text-white tracking-tighter uppercase">
             KINEXIS <span className="text-[#CCFF00]">COMMAND</span>
           </h1>
           <p className="text-white/30 font-bold uppercase tracking-[0.4em] text-[9px] mt-1 flex items-center gap-2">
             <span className="w-1.5 h-1.5 rounded-full bg-[#CCFF00] animate-pulse shadow-[0_0_8px_#CCFF00]" />
             Control Central <span className="text-white font-black">/ {role}</span>
           </p>
        </div>
        <div className="bg-white/5 px-5 py-2.5 rounded-full flex items-center gap-4">
           <div className="text-right">
              <p className="text-[7px] font-black text-white/20 uppercase tracking-widest">Latencia Global</p>
              <p className="text-xs font-black text-[#CCFF00]">1.2ms <span className="opacity-20 text-white">V4</span></p>
           </div>
           <div className="w-8 h-8 rounded-full bg-[#CCFF00]/10 flex items-center justify-center">
              <Activity className="w-4 h-4 text-[#CCFF00]" />
           </div>
        </div>
      </header>

      {/* BENTO GRID (2 COLUMNS) */}
      <div className="grid grid-cols-2 gap-5 flex-1 min-h-0">
        
        {/* PANEL 1: REVENUE */}
        <div className="bg-white/5 rounded-[2rem] p-7 flex flex-col justify-between group hover:bg-white/[0.07] transition-all duration-500 relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 opacity-[0.03] pointer-events-none">
            <span className="text-[12rem] font-black text-white leading-none">$</span>
          </div>
          <div className="flex justify-between items-start relative z-10">
             <div>
                <p className="text-[9px] font-black text-[#CCFF00] uppercase tracking-[0.4em] mb-3">Ingresos Consolidados</p>
                <h3 className="text-4xl font-black text-white tracking-tighter leading-none">$1,242,800</h3>
                <p className="text-xs font-medium text-white/30 mt-3 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-[#CCFF00]" />
                  +24.2% vs Período Anterior
                </p>
             </div>
             <div className="px-4 py-1.5 bg-[#CCFF00] rounded-full text-[9px] font-black text-black tracking-widest uppercase">
                LIVE
             </div>
          </div>
          <div className="flex items-center gap-4 mt-6 relative z-10">
             <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-[#CCFF00]" />
             </div>
             <div>
                <p className="text-[7px] font-black text-white/20 uppercase tracking-widest">Cartera en Tránsito</p>
                <p className="text-lg font-black text-white">$42,300</p>
             </div>
          </div>
        </div>

        {/* PANEL 2: OPERATIONAL STATUS + ACTIVE ORDERS */}
        <div className="grid grid-rows-2 gap-5">
           <div className="bg-white/5 rounded-[2rem] p-6 flex items-center justify-between border border-white/5 hover:border-[#CCFF00]/20 transition-all group">
              <div>
                 <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] mb-1.5">Estado del Sistema</p>
                 <h4 className="text-2xl font-black text-white tracking-tighter">OPERATIVO <span className="text-[#CCFF00] animate-pulse">ONLINE</span></h4>
              </div>
              <div className="w-12 h-12 rounded-full bg-[#CCFF00]/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                 <Zap className="w-6 h-6 text-[#CCFF00]" />
              </div>
           </div>
           <div className="bg-white/5 rounded-[2rem] p-6 flex items-center justify-between">
              <div>
                 <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] mb-1.5">Órdenes Activas</p>
                 <h4 className="text-4xl font-black text-white tracking-tighter">142<span className="text-base text-white/20 ml-1.5">units</span></h4>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center">
                 <Package className="w-6 h-6 text-[#CCFF00]" />
              </div>
           </div>
        </div>

        {/* PANEL 3: PENDING ORDERS */}
        <div className="bg-white/5 rounded-[2rem] p-6 flex flex-col min-h-0">
           <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                 <Clock className="w-4 h-4 text-[#CCFF00]" />
                 <h3 className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Órdenes Pendientes</h3>
              </div>
              <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest">Audit Q2</span>
           </div>
           <div className="space-y-2.5 flex-1 overflow-y-auto pr-1 custom-scrollbar">
              {[
                { id: "F101", customer: "Cliente X", warehouse: "Almacén A", status: "Ready", icon: CheckCircle2 },
                { id: "F102", customer: "Cliente Y", warehouse: "Almacén B", status: "Picking", icon: Package },
                { id: "F103", customer: "Cliente Z", warehouse: "Almacén A", status: "In Transit", icon: Truck },
                { id: "F104", customer: "Cliente W", warehouse: "Almacén C", status: "Pending", icon: Clock },
              ].map((order, idx) => (
                <div key={idx} className="bg-white/3 rounded-2xl px-4 py-3 flex items-center justify-between hover:bg-white/5 transition-colors border border-transparent hover:border-white/5 group">
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                        <order.icon className="w-3.5 h-3.5 text-[#CCFF00]" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-white tracking-wider">ORDER #{order.id}</p>
                        <p className="text-[9px] font-bold text-white/30 uppercase">{order.customer}</p>
                      </div>
                   </div>
                   <div className="text-right">
                      <p className="text-[9px] font-black text-[#CCFF00] uppercase">{order.warehouse}</p>
                      <p className="text-[8px] text-white/10 uppercase">{order.status}</p>
                   </div>
                </div>
              ))}
           </div>
        </div>

        {/* PANEL 4: CRITICAL LOGISTICS */}
        <div className="bg-white/5 rounded-[2rem] p-6 flex flex-col min-h-0">
           <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                 <Activity className="w-4 h-4 text-[#CCFF00]" />
                 <h3 className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Logística Crítica</h3>
              </div>
              <div className="bg-[#CCFF00]/10 px-2.5 py-1 rounded-full">
                 <p className="text-[8px] font-black text-[#CCFF00] uppercase">Live</p>
              </div>
           </div>
           <div className="space-y-2.5 flex-1 overflow-y-auto pr-1 custom-scrollbar">
              {[
                { loc: "Almacén C", event: "Validado", time: "10m", info: "In Transit", icon: CheckCircle2 },
                { loc: "Andén 04", event: "Carga Lista", time: "22m", info: "Adicionales", icon: ClipboardCheck },
                { loc: "Distribución", event: "Ruta Activa", time: "1h", info: "Normal", icon: MapPin },
                { loc: "Almacén B", event: "Auditado", time: "2h", info: "Completo", icon: ShieldCheck },
              ].map((item, idx) => (
                <div key={idx} className="bg-white/3 rounded-2xl px-4 py-3 flex items-center justify-between hover:bg-white/5 transition-colors">
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center">
                        <item.icon className="w-3.5 h-3.5 text-[#CCFF00]" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-white flex items-center gap-1.5">
                           <span className="w-1 h-1 rounded-full bg-[#CCFF00]" />
                           {item.loc}
                        </p>
                        <p className="text-[9px] font-bold text-white/30 uppercase">{item.event}</p>
                      </div>
                   </div>
                   <div className="text-right">
                      <p className="text-[9px] font-black text-white/40 flex items-center justify-end gap-1">
                         <Clock className="w-2.5 h-2.5" />
                         {item.time}
                      </p>
                      <p className="text-[8px] text-white/10 uppercase">{item.info}</p>
                   </div>
                </div>
              ))}
           </div>
        </div>

      </div>
    </div>
  );
}
