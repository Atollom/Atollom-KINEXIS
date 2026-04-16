'use client'

import React, { useState, useEffect } from "react";
import { TrendingUp, Package, ShieldCheck, Truck, BarChart3, Users as UsersIcon, Zap, Wallet } from "lucide-react";
import { UserRole } from "./DashboardShell";

export default function DashboardPage() {
  const [role, setRole] = useState<UserRole>('ADMIN');

  // Monitorizamos el cambio de rol (Simulación V4 para Auditoría)
  useEffect(() => {
     const interval = setInterval(() => {
        const savedRole = localStorage.getItem('kinexis_role') as UserRole;
        if (savedRole && savedRole !== role) setRole(savedRole);
     }, 1000);
     return () => clearInterval(interval);
  }, [role]);

  return (
    <div className="flex flex-col h-full gap-10">
      <header className="flex justify-between items-end">
        <div>
           <h1 className="text-5xl font-black text-white tracking-tighter uppercase">
             KINEXIS <span className="text-[#CCFF00]">COMMAND</span>
           </h1>
           <p className="text-white/30 font-bold uppercase tracking-[0.4em] text-[10px] mt-2 flex items-center gap-2">
             <span className="w-2 h-2 rounded-full bg-[#CCFF00] animate-pulse shadow-[0_0_10px_#CCFF00]" />
             Jerarquía: <span className="text-white">{role}</span>
           </p>
        </div>
        <div className="bg-white/5 backdrop-blur-3xl px-8 py-4 rounded-full shadow-ambient flex items-center gap-6">
           <div className="text-right">
              <p className="text-[8px] font-black text-white/20 uppercase tracking-widest">Estado Operativo</p>
              <p className="text-sm font-black text-[#CCFF00]">ONLINE</p>
           </div>
           <div className="w-10 h-10 rounded-full bg-[#CCFF00]/10 flex items-center justify-center">
              <Zap className="w-5 h-5 text-[#CCFF00]" />
           </div>
        </div>
      </header>

      {/* BENTO GRID CONTEXTUAL (V4) */}
      <div className="grid grid-cols-3 grid-rows-3 gap-8 flex-1">
        
        {/* WIDGET 1: DINÁMICO SEGÚN ROL */}
        {role === 'VENTAS' ? (
           <div className="col-span-2 row-span-2 bg-white/5 backdrop-blur-3xl rounded-[3.5rem] p-12 shadow-ambient flex flex-col justify-between hover:bg-white/8 transition-all duration-700">
             <div className="flex justify-between items-start">
                <div>
                   <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.5em] mb-4">Pipeline de Ventas</p>
                   <h3 className="text-6xl font-black text-white tracking-tighter">$2,450,000.00</h3>
                   <p className="text-sm font-medium text-white/30 mt-4 tracking-tight">Proyección de cierre Q2 (Ventas)</p>
                </div>
                <div className="px-6 py-2 bg-blue-500 rounded-full text-[10px] font-black text-white tracking-widest uppercase">
                   HOT LEADS
                </div>
             </div>
             <div className="h-48 flex items-end gap-3 mt-10">
                {[80, 60, 90, 40, 70, 85, 95, 100].map((h, i) => (
                   <div key={i} className="flex-1 bg-blue-500/10 rounded-full h-full relative overflow-hidden">
                      <div className="absolute bottom-0 w-full bg-blue-500/40 rounded-full" style={{ height: `${h}%` }} />
                   </div>
                ))}
             </div>
           </div>
        ) : role === 'ALMACEN' ? (
           <div className="col-span-2 row-span-2 bg-white/5 backdrop-blur-3xl rounded-[3.5rem] p-12 shadow-ambient flex flex-col justify-between hover:bg-white/8 transition-all duration-700">
              <div className="flex justify-between items-start">
                 <div>
                    <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.5em] mb-4">Eficiencia Logistics</p>
                    <h3 className="text-6xl font-black text-white tracking-tighter leading-none">842 <span className="text-2xl opacity-20">PKG</span></h3>
                    <p className="text-sm font-medium text-white/30 mt-4 tracking-tight">Paquetes por surtir hoy (Sincronización Warehouse)</p>
                 </div>
                 <div className="px-6 py-2 bg-emerald-500 rounded-full text-[10px] font-black text-white tracking-widest uppercase animate-pulse">
                    PRIORITY
                 </div>
              </div>
              <div className="grid grid-cols-4 gap-4 mt-10">
                 {[1,2,3,4].map(i => (
                    <div key={i} className="bg-white/5 rounded-[2rem] p-6 text-center space-y-2">
                       <p className="text-[8px] font-black text-white/20 uppercase">Andén 0{i}</p>
                       <p className="text-2xl font-black text-emerald-400 text-white leading-none">12</p>
                    </div>
                 ))}
              </div>
           </div>
        ) : (
           /* ADMIN: VISTA TOTAL (Standard V3 modificado) */
           <div className="col-span-2 row-span-2 bg-white/5 backdrop-blur-3xl rounded-[3.5rem] p-12 shadow-ambient flex flex-col justify-between group cursor-pointer hover:bg-white/8 transition-all duration-700">
             <div className="flex justify-between items-start">
                <div>
                   <p className="text-[10px] font-black text-[#CCFF00] uppercase tracking-[0.5em] mb-4">Telemetría Global (ADMIN)</p>
                   <h3 className="text-6xl font-black text-white tracking-tighter leading-none">$1,242,800.00</h3>
                   <p className="text-sm font-medium text-white/30 mt-4 tracking-tight">Ingresos Totales (Perfil Maestro)</p>
                </div>
                <div className="px-6 py-2 bg-[#CCFF00] rounded-full text-[10px] font-black text-black tracking-widest uppercase shadow-glow">
                   +24.2%
                </div>
             </div>
             <div className="h-48 flex items-end gap-3 mt-10">
                {[40, 70, 45, 90, 65, 80, 50, 60, 85, 95, 75, 100].map((h, i) => (
                   <div key={i} className="flex-1 bg-white/3 rounded-full relative overflow-hidden h-full group-hover:bg-white/5 transition-colors">
                      <div className="absolute bottom-0 w-full bg-[#CCFF00]/10 rounded-full transition-all duration-1000 delay-[100ms]" style={{ height: `${h}%` }} />
                   </div>
                ))}
             </div>
           </div>
        )}

        {/* MÉTRICAS SECUNDARIAS ROLE-AWARE */}
        <div className="col-span-1 row-span-1 bg-white/5 backdrop-blur-3xl rounded-[3.5rem] p-10 shadow-ambient flex flex-col justify-between">
           <div className="flex justify-between">
              <div className="w-14 h-14 rounded-[1.5rem] bg-white/5 flex items-center justify-center">
                 {role === 'VENTAS' ? <UsersIcon className="w-7 h-7 text-blue-400" /> : <Package className="w-7 h-7 text-[#CCFF00]" />}
              </div>
           </div>
           <div>
              <h4 className="text-4xl font-black text-white tracking-tighter leading-none">
                 {role === 'VENTAS' ? '12 Client.' : role === 'ALMACEN' ? '42 Sku.' : '142 Ord.'}
              </h4>
              <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mt-4">
                 {role === 'VENTAS' ? 'Cartera Activa' : role === 'ALMACEN' ? 'Stock Crítico' : 'Órdenes Activas'}
              </p>
           </div>
        </div>

        <div className="col-span-1 row-span-1 bg-white/5 backdrop-blur-3xl rounded-[3.5rem] p-10 shadow-ambient flex flex-col justify-between">
           <div className="w-14 h-14 rounded-[1.5rem] bg-white/5 flex items-center justify-center">
              <ShieldCheck className="w-7 h-7 text-[#CCFF00]" />
           </div>
           <div>
              <div className="flex items-end gap-2">
                 <h4 className="text-5xl font-black text-white tracking-tighter leading-none">98<span className="text-xl opacity-20">%</span></h4>
              </div>
              <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mt-4">Sincronización SAT</p>
           </div>
        </div>

        {/* LOGÍSTICA / CRM FEED (LARGO) */}
        <div className="col-span-3 row-span-1 bg-white/5 backdrop-blur-3xl rounded-[3.5rem] p-10 shadow-ambient flex flex-col justify-between">
           <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                 <Activity className="w-6 h-6 text-white/20" />
                 <h3 className="text-sm font-black text-white uppercase tracking-widest">
                    {role === 'VENTAS' ? 'Últimos Cierres de CRM' : 'Logística Crítica'}
                 </h3>
              </div>
           </div>
           <div className="grid grid-cols-4 gap-8">
              {[
                { label: role === 'VENTAS' ? "Contrato A" : "Despacho A", status: "Done", color: "bg-[#CCFF00]" },
                { label: role === 'VENTAS' ? "Presupuesto B" : "En Tránsito B", status: "Active", color: "bg-blue-400" },
                { label: role === 'VENTAS' ? "Lead C" : "Validado C", status: "Wait", color: "bg-white/10" },
                { label: role === 'VENTAS' ? "Factura D" : "Entregado D", status: "Done", color: "bg-emerald-400" },
              ].map((item, idx) => (
                <div key={idx} className="bg-white/3 rounded-[2rem] p-6 flex items-center justify-between">
                   <p className="text-[9px] font-black text-white uppercase tracking-widest">{item.label}</p>
                   <span className={`w-2 h-2 rounded-full ${item.color}`} />
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
}

function Activity(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  )
}
