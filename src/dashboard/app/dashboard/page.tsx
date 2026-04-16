import React from "react";
import { TrendingUp, Package, ShieldCheck, Truck } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="flex flex-col h-full gap-10">
      <header className="flex justify-between items-end">
        <div>
           <h1 className="text-5xl font-black text-white tracking-tighter uppercase">Nexus Terminal</h1>
           <p className="text-white/30 font-bold uppercase tracking-[0.4em] text-[10px] mt-2 flex items-center gap-2">
             <span className="w-2 h-2 rounded-full bg-[#CCFF00] animate-pulse shadow-[0_0_10px_#CCFF00]" />
             Estado del Sistema: <span className="text-white">Operativo</span>
           </p>
        </div>
        <div className="bg-white/5 backdrop-blur-3xl px-8 py-4 rounded-full shadow-ambient flex items-center gap-6">
           <div className="text-right">
              <p className="text-[8px] font-black text-white/20 uppercase tracking-widest">Global Sync</p>
              <p className="text-sm font-black text-white opacity-80">99.98%</p>
           </div>
           <div className="w-10 h-10 rounded-full bg-[#CCFF00]/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-[#CCFF00]" />
           </div>
        </div>
      </header>

      {/* BENTO GRID ESTRATÉGICO - RE-POBLADO */}
      <div className="grid grid-cols-3 grid-rows-3 gap-8 flex-1">
        
        {/* WIDGET 1: INGRESOS TOTALES (GRANDE) */}
        <div className="col-span-2 row-span-2 bg-white/5 backdrop-blur-3xl rounded-[3.5rem] p-12 shadow-ambient flex flex-col justify-between group cursor-pointer hover:bg-white/8 transition-all duration-700">
          <div className="flex justify-between items-start">
             <div>
                <p className="text-[10px] font-black text-[#CCFF00] uppercase tracking-[0.5em] mb-4">Métrica Principal</p>
                <h3 className="text-6xl font-black text-white tracking-tighter leading-none tracking-[-0.05em]">$1,242,800.00</h3>
                <p className="text-sm font-medium text-white/30 mt-4 tracking-tight">Ingresos Totales (Ciclo Fiscal Actual)</p>
             </div>
             <div className="px-6 py-2 bg-[#CCFF00] rounded-full text-[10px] font-black text-black tracking-widest uppercase shadow-glow">
                +24.2%
             </div>
          </div>
          
          {/* Chart Mockup (CSS-based high-fidelity) */}
          <div className="h-48 flex items-end gap-3 mt-10">
             {[40, 70, 45, 90, 65, 80, 50, 60, 85, 95, 75, 100].map((h, i) => (
                <div key={i} className="flex-1 bg-white/3 rounded-full relative overflow-hidden h-full group-hover:bg-white/5 transition-colors">
                   <div 
                     className="absolute bottom-0 w-full bg-[#CCFF00]/10 rounded-full transition-all duration-1000 delay-[100ms]" 
                     style={{ height: `${h}%`, transitionDelay: `${i * 50}ms` }}
                   >
                      <div className="absolute top-0 left-0 w-full h-1 bg-[#CCFF00] shadow-[0_0_15px_#CCFF00] opacity-0 group-hover:opacity-100 transition-opacity" />
                   </div>
                </div>
             ))}
          </div>
        </div>

        {/* WIDGET 2: ÓRDENES ACTIVAS (MEDIO) */}
        <div className="col-span-1 row-span-1 bg-white/5 backdrop-blur-3xl rounded-[3.5rem] p-10 shadow-ambient flex flex-col justify-between hover:scale-[1.02] transition-transform duration-500">
           <div className="flex justify-between">
              <div className="w-14 h-14 rounded-[1.5rem] bg-white/5 flex items-center justify-center">
                 <Package className="w-7 h-7 text-[#CCFF00]" />
              </div>
              <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_#ef4444]" />
           </div>
           <div>
              <h4 className="text-7xl font-black text-white tracking-tighter leading-none">142</h4>
              <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mt-4">Órdenes Activas</p>
           </div>
        </div>

        {/* WIDGET 3: CUMPLIMIENTO SAT (MEDIO) */}
        <div className="col-span-1 row-span-1 bg-white/5 backdrop-blur-3xl rounded-[3.5rem] p-10 shadow-ambient flex flex-col justify-between hover:scale-[1.02] transition-transform duration-500">
           <div className="w-14 h-14 rounded-[1.5rem] bg-white/5 flex items-center justify-center">
              <ShieldCheck className="w-7 h-7 text-blue-400" />
           </div>
           <div>
              <div className="flex items-end gap-2">
                 <h4 className="text-7xl font-black text-white tracking-tighter leading-none">98</h4>
                 <span className="text-2xl font-black text-white/20 mb-1">%</span>
              </div>
              <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mt-4">Cumplimiento SAT</p>
           </div>
        </div>

        {/* WIDGET 4: ÚLTIMOS MOVIMIENTOS LOGÍSTICA (LARGO) */}
        <div className="col-span-3 row-span-1 bg-white/5 backdrop-blur-3xl rounded-[3.5rem] p-10 shadow-ambient flex flex-col justify-between">
           <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                 <Truck className="w-6 h-6 text-white/20" />
                 <h3 className="text-sm font-black text-white uppercase tracking-widest">Últimos movimientos de Logística</h3>
              </div>
              <button className="text-[8px] font-black text-[#CCFF00] uppercase tracking-[0.4em] hover:opacity-100 opacity-40 transition-opacity">Ver Mapa Global</button>
           </div>
           <div className="grid grid-cols-4 gap-8">
              {[
                { id: "#LK-284", label: "Despachado", zone: "Almacén A", time: "12m", color: "bg-[#CCFF00]" },
                { id: "#LK-285", label: "En Tránsito", zone: "Zona Norte", time: "45m", color: "bg-blue-400" },
                { id: "#LK-286", label: "Validación", zone: "Aduana MX", time: "1h", color: "bg-white/10" },
                { id: "#LK-287", label: "Entregado", zone: "Centro CDMX", time: "3h", color: "bg-emerald-400" },
              ].map(mov => (
                <div key={mov.id} className="bg-white/3 rounded-[2rem] p-6 flex items-center justify-between">
                   <div className="space-y-1">
                      <p className="text-[9px] font-black text-white uppercase tracking-widest">{mov.id}</p>
                      <p className="text-[8px] font-bold text-white/20 uppercase tracking-widest">{mov.zone}</p>
                   </div>
                   <div className="text-right space-y-2">
                      <div className="flex items-center gap-2 justify-end">
                         <span className={`w-1.5 h-1.5 rounded-full ${mov.color}`} />
                         <span className="text-[8px] font-bold text-white tracking-widest uppercase">{mov.label}</span>
                      </div>
                      <p className="text-[8px] font-bold text-white/10">{mov.time} ago</p>
                   </div>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
}
