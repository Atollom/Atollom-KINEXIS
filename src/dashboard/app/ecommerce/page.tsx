"use client";

import { MLFeed } from "@/components/ecommerce/MLFeed";
import { ApprovalQueue } from "@/components/ApprovalQueue";

function PlatformCard({ 
  name, 
  value, 
  status, 
  detail, 
  color = "#ccff00" 
}: { 
  name: string; 
  value: string | number; 
  status: string; 
  detail: string;
  color?: string;
}) {
  return (
    <div className="glass-card p-6 rounded-[2rem] flex flex-col justify-between min-h-[220px] group relative overflow-hidden transition-all duration-500 hover:bg-white/[0.05]">
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">{name}</p>
          <h2 className="text-4xl font-black text-white group-hover:text-[#ccff00] transition-colors">{value}</h2>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/5">
           <span className="w-1 h-1 rounded-full bg-[#ccff00] animate-pulse" />
           <span className="text-[9px] font-bold uppercase tracking-widest text-white/60">{status}</span>
        </div>
      </div>
      
      <div className="mt-4">
        <p className="text-[11px] font-medium text-white/40 leading-relaxed">{detail}</p>
      </div>

      <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-[#ccff00]/5 rounded-full blur-3xl group-hover:bg-[#ccff00]/10 transition-all" />
    </div>
  );
}

export default function EcommercePage() {
  return (
    <div className="space-y-16 animate-luxe">
      {/* Module Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
             <span className="w-1.5 h-1.5 rounded-full bg-[#ccff00] animate-pulse" />
             <p className="text-[#ccff00] text-[10px] uppercase tracking-[0.3em] font-black opacity-80">
               SALES COMMAND / ECOMMERCE
             </p>
          </div>
          <h1 className="text-5xl md:text-6xl font-black tracking-[-0.05em] leading-none text-white">
            Marketplace <span className="text-[#ccff00]">Pulse</span>
          </h1>
        </div>
        
        <div className="flex items-center gap-3 glass-card px-6 py-4 rounded-full">
           <span className="material-symbols-outlined text-[#ccff00] text-sm italic">sync</span>
           <span className="text-[10px] font-bold uppercase tracking-widest text-white/60 text-nowrap">Global Sync: <span className="text-white">Active</span></span>
        </div>
      </header>

      {/* Level 1: Platform Bento Breakdown */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <PlatformCard 
          name="Mercado Libre" 
          value="24" 
          status="Live" 
          detail="Corte operativo: 09:00 AM. 4 envíos pendientes de despacho Full."
        />
        <PlatformCard 
          name="Amazon FBA" 
          value="08" 
          status="Syncing" 
          detail="2 Órdenes Same-Day detectadas. Inventario FBA: 1,247 unidades."
        />
        <PlatformCard 
          name="Shopify Direct" 
          value="05" 
          status="Active" 
          detail="3 Guías pendientes de impresión. Incremento de tráfico: +14%."
        />
      </section>

      {/* Level 2: Command Center Metrics */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* ML Feed Area */}
        <div className="lg:col-span-8 space-y-8">
          <div className="flex items-center justify-between px-4">
             <h3 className="text-lg font-black uppercase italic tracking-tight">Ventas en Tiempo Real</h3>
             <button className="text-[10px] font-black uppercase tracking-widest text-white/30 hover:text-[#ccff00] transition-colors">Export Logs</button>
          </div>
          <div className="glass-card rounded-[2.5rem] p-1 overflow-hidden">
            <MLFeed />
          </div>
        </div>

        {/* Approval & Alerts Side Area */}
        <div className="lg:col-span-4 space-y-8">
          <div className="flex items-center gap-3 px-4">
             <span className="material-symbols-outlined text-[#ccff00]">verified_user</span>
             <h3 className="text-sm font-black uppercase tracking-widest italic">Command Queue</h3>
          </div>
          
          <div className="glass-card rounded-[2.5rem] p-4">
            <ApprovalQueue />
          </div>

          {/* Quick Stats Mini-Bento */}
          <div className="grid grid-cols-2 gap-4">
             <div className="glass-card p-6 rounded-[2rem] space-y-2">
                <p className="text-[9px] font-black uppercase text-white/30 tracking-widest">Preguntas</p>
                <p className="text-2xl font-black text-[#ccff00]">14</p>
             </div>
             <div className="glass-card p-6 rounded-[2rem] space-y-2">
                <p className="text-[9px] font-black uppercase text-white/30 tracking-widest">Ajustes Price</p>
                <p className="text-2xl font-black text-white">07</p>
             </div>
          </div>
        </div>

      </section>

      {/* Level 3: FBA Operations Deep Dive */}
      <section className="glass-card rounded-[2.5rem] p-10 relative overflow-hidden group">
         <div className="relative z-10 grid grid-cols-1 md:grid-cols-4 gap-12">
            <div className="space-y-4">
               <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#ccff00] text-sm">inventory</span>
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/40">FBA Health</p>
               </div>
               <p className="text-4xl font-black text-white italic tracking-tighter">Operational</p>
            </div>
            
            <div className="space-y-2 border-l border-white/5 pl-8">
               <p className="text-white/30 text-[9px] font-bold uppercase tracking-widest">Rotación</p>
               <p className="text-xl font-black text-white">17 Días</p>
            </div>
            <div className="space-y-2 border-l border-white/5 pl-8">
               <p className="text-white/30 text-[9px] font-bold uppercase tracking-widest">En Tránsito</p>
               <p className="text-xl font-black text-white">342 Units</p>
            </div>
            <div className="space-y-2 border-l border-white/5 pl-8">
               <button className="w-full h-full glass-card hover:bg-[#ccff00] hover:text-black transition-all flex items-center justify-center gap-2 font-black uppercase text-[10px] tracking-widest">
                  Ver Inventario FBA
               </button>
            </div>
         </div>
         <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-[#ccff00]/5 to-transparent pointer-events-none" />
      </section>

      <div className="h-20" /> {/* Spacer */}
    </div>
  );
}