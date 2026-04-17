"use client";

import { useMemo } from "react";

export default function AmazonPage() {
  const stats = useMemo(() => [
    { label: "ASINs Active", value: "842", icon: "widgets", color: "text-amber-400" },
    { label: "Account Health", value: "Healthy", icon: "favorite", color: "text-[#FF9900]" },
    { label: "FBA Inventory", value: "3,120", icon: "box", color: "text-blue-400" },
    { label: "Buy Box Wins", value: "98%", icon: "flash_on", color: "text-primary" },
  ], []);

  const reviews = [
    { id: 1, user: "John D.", product: "NX-800 Hub", content: "Best controller I've used. Fast shipping.", score: 5 },
    { id: 2, user: "Sarah L.", product: "Neural Hub", content: "Great product, but setup was complex.", score: 4 },
  ];

  const shipments = [
    { id: "FBA-101", destination: "MEX-FBA-01", pieces: 200, status: "Carrier Picked Up" },
    { id: "FBA-102", destination: "MEX-FBA-02", pieces: 450, status: "In Transit" },
  ];

  return (
    <div className="space-y-10 animate-in">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <span className="text-[0.75rem] font-bold label-tracking text-[#FF9900] drop-shadow-[0_0_8px_rgba(255,153,0,0.3)]">
            Channel Intelligence / Amazon MX
          </span>
          <h1 className="text-4xl md:text-5xl font-black tight-tracking text-on-surface">
            Control Operativo Amazon
          </h1>
        </div>

        <div className="flex items-center gap-3">
           <button className="px-8 py-4 glass-card border-white/5 rounded-2xl text-[10px] font-black label-tracking text-on-surface-variant hover:text-on-surface hover:border-primary/20 transition-all flex items-center gap-2">
              <span className="material-symbols-outlined !text-[16px]">sync</span>
              SYNC SELLER CENTRAL
           </button>
           <button className="px-8 py-4 neon-disruptor rounded-2xl text-[10px] font-black label-tracking shadow-glow">
              GENERAR ENVÍO FBA
           </button>
        </div>
      </header>

      {/* Primary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         {stats.map((s, i) => (
           <div key={i} className="glass-card p-8 rounded-[2rem] border border-white/5 relative overflow-hidden group">
              <div className="relative z-10 flex flex-col gap-4">
                 <span className={`material-symbols-outlined !text-3xl ${s.color}`}>{s.icon}</span>
                 <div>
                    <p className="text-[10px] font-black text-on-surface/30 label-tracking uppercase">{s.label}</p>
                    <p className="text-3xl font-black text-on-surface tight-tracking">{s.value}</p>
                 </div>
              </div>
              <div className="absolute right-0 bottom-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                 <span className="material-symbols-outlined !text-6xl">{s.icon}</span>
              </div>
           </div>
         ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
         {/* Left Col: FBA Shipments & Reviews */}
         <div className="lg:col-span-8 space-y-10">
            {/* Active FBA Shipments */}
            <section className="space-y-6">
               <div className="flex items-center justify-between">
                  <h3 className="text-[10px] font-black label-tracking text-on-surface-variant uppercase italic">Envíos FBA Activos</h3>
                  <span className="text-[9px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">MONITORING</span>
               </div>
               <div className="space-y-4">
                  {shipments.map(ship => (
                    <div key={ship.id} className="glass-card p-6 rounded-3xl border border-white/5 flex items-center justify-between group hover:border-[#FF9900]/30 transition-all">
                       <div className="flex items-center gap-6">
                          <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center">
                             <span className="material-symbols-outlined text-[#FF9900]">inventory_2</span>
                          </div>
                          <div>
                             <p className="text-sm font-black text-on-surface">{ship.id}</p>
                             <p className="text-[10px] font-bold text-on-surface-variant italic">Destino: {ship.destination}</p>
                          </div>
                       </div>
                       <div className="flex items-center gap-8">
                          <div className="text-right">
                             <p className="text-[9px] font-black text-on-surface/20 label-tracking">PIECES</p>
                             <p className="text-sm font-black text-on-surface">{ship.pieces} units</p>
                          </div>
                          <div className="min-w-[120px] text-right">
                             <p className="text-[9px] font-black text-on-surface/20 label-tracking">STATUS</p>
                             <p className="text-xs font-black text-primary italic uppercase">{ship.status}</p>
                          </div>
                       </div>
                    </div>
                  ))}
               </div>
            </section>

            {/* Recent Reviews */}
            <section className="space-y-6">
                <h3 className="text-[10px] font-black label-tracking text-on-surface-variant uppercase italic">Vine & organic Reviews</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   {reviews.map(rev => (
                     <div key={rev.id} className="glass-card p-6 rounded-3xl border border-white/5 flex flex-col gap-4">
                        <div className="flex justify-between items-start">
                           <div>
                              <p className="text-xs font-black text-on-surface">{rev.user}</p>
                              <p className="text-[9px] font-bold text-on-surface/40 uppercase tracking-tighter">{rev.product}</p>
                           </div>
                           <div className="flex text-[#FF9900]">
                              {[...Array(5)].map((_, i) => (
                                <span key={i} className={`material-symbols-outlined !text-[12px] ${i < rev.score ? 'fill-1' : 'opacity-20'}`}>star</span>
                              ))}
                           </div>
                        </div>
                        <p className="text-[11px] font-medium text-on-surface-variant leading-relaxed italic">"{rev.content}"</p>
                     </div>
                   ))}
                </div>
            </section>
         </div>

         {/* Right Col: IPI Score & Performance */}
         <div className="lg:col-span-4 space-y-10">
            {/* Inventory Health Agent */}
            <section className="glass-card p-8 rounded-[3rem] border border-white/5 space-y-8 relative overflow-hidden bg-gradient-to-br from-white/[0.02] to-transparent">
               <div className="flex items-center gap-4 relative z-10">
                  <div className="w-12 h-12 rounded-full bg-[#FF9900]/10 flex items-center justify-center border border-[#FF9900]/20">
                     <span className="material-symbols-outlined text-[#FF9900]">neurology</span>
                  </div>
                  <div>
                    <h3 className="text-[10px] font-black label-tracking text-[#FF9900] uppercase">Inventory AI</h3>
                    <p className="text-lg font-black text-on-surface">IPI Score: 684</p>
                  </div>
               </div>
               
               <div className="space-y-6 relative z-10">
                  <p className="text-[12px] font-medium text-on-surface-variant leading-relaxed opacity-80">
                    "Comandante, el inventario de **NX-800** para FBA se agotará en **12 días**. Recomiendo despachar 200 piezas adicionales."
                  </p>
                  <button className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black label-tracking hover:bg-white/10 transition-all uppercase">
                    Ver Plan de Reabastecimiento
                  </button>
               </div>
               <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF9900]/5 blur-[70px]" />
            </section>

            {/* Buy Box Performance */}
            <section className="glass-card p-8 rounded-[2.5rem] border border-white/5">
                <h3 className="text-[10px] font-black label-tracking text-on-surface-variant uppercase italic mb-8">Buy Box Telemetry</h3>
                <div className="space-y-6">
                   <div className="flex justify-between text-xs font-bold text-on-surface/60">
                      <span>ODR (Order Defect Rate)</span>
                      <span className="text-primary">&lt; 0.1%</span>
                   </div>
                   <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                      <div className="w-[10%] h-full bg-primary" />
                   </div>
                   <div className="flex justify-between text-xs font-bold text-on-surface/60">
                      <span>LHR (Late Shipment)</span>
                      <span className="text-primary">0.0%</span>
                   </div>
                   <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                      <div className="w-0 h-full bg-primary" />
                   </div>
                </div>
            </section>
         </div>
      </div>

      <div className="h-20" />
    </div>
  );
}
