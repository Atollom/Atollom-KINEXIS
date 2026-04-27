"use client";

import { useMemo } from "react";

export default function MercadoLibrePage() {
  const stats = useMemo(() => [
    { label: "Publicaciones Activas", value: "1,240", icon: "inventory", color: "text-blue-400" },
    { label: "Reputación del Vendedor", value: "Platino", icon: "verified", color: "text-primary" },
    { label: "En Tránsito", value: "42", icon: "local_shipping", color: "text-amber-400" },
    { label: "Devoluciones", value: "3", icon: "assignment_return", color: "text-red-400" },
  ], []);

  const comments = [
    { id: 1, user: "Carlos R.", product: "NX-800 Hub", content: "Excelente calidad, llegó antes de lo esperado.", score: 5 },
    { id: 2, user: "Ana S.", product: "Neural Cable", content: "Funciona bien, pero el empaque llegó un poco dañado.", score: 4 },
  ];

  const priceRequests = [
    { id: "PR-01", product: "NX-800 Hub", current: 1540, requested: 1490, reason: "Competencia bajó precio" },
    { id: "PR-02", product: "Command Center", current: 8900, requested: 8500, reason: "Promoción Buen Fin" },
  ];

  return (
    <div className="space-y-10 animate-in">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <span className="text-[0.75rem] font-bold label-tracking text-[#FFE600] drop-shadow-[0_0_8px_rgba(255,230,0,0.3)]">
            Channel Intelligence / Mercado Libre
          </span>
          <h1 className="text-4xl md:text-5xl font-black tight-tracking text-on-surface">
            Control Operativo ML
          </h1>
        </div>

        <div className="flex items-center gap-3">
           <button className="px-8 py-4 glass-card border-white/5 rounded-2xl text-[10px] font-black label-tracking text-on-surface-variant hover:text-on-surface hover:border-primary/20 transition-all flex items-center gap-2">
              <span className="material-symbols-outlined !text-[16px]">sync</span>
              SYNC API
           </button>
           <button className="px-8 py-4 neon-disruptor rounded-2xl text-[10px] font-black label-tracking shadow-glow">
              SOLICITAR SURTIDO FULL
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
         {/* Left Col: Price Requests & Comments */}
         <div className="lg:col-span-8 space-y-10">
            {/* Price Requests */}
            <section className="space-y-6">
               <div className="flex items-center justify-between">
                  <h3 className="text-[10px] font-black label-tracking text-on-surface-variant uppercase italic">Solicitudes de Cambio de Precio</h3>
                  <span className="text-[9px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">ACCIÓN REQUERIDA</span>
               </div>
               <div className="space-y-4">
                  {priceRequests.map(req => (
                    <div key={req.id} className="glass-card p-6 rounded-3xl border border-white/5 flex items-center justify-between group hover:border-primary/20 transition-all">
                       <div className="flex items-center gap-6">
                          <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center">
                             <span className="material-symbols-outlined text-amber-500">trending_down</span>
                          </div>
                          <div>
                             <p className="text-sm font-black text-on-surface">{req.product}</p>
                             <p className="text-[10px] font-bold text-on-surface-variant italic">"{req.reason}"</p>
                          </div>
                       </div>
                       <div className="flex items-center gap-8">
                          <div className="text-right">
                             <p className="text-[9px] font-black text-on-surface/20 label-tracking">ACTUAL vs NUEVO</p>
                             <p className="text-sm font-black text-on-surface">${req.current.toLocaleString()} &rarr; <span className="text-primary font-black">${req.requested.toLocaleString()}</span></p>
                          </div>
                          <div className="flex gap-2">
                             <button className="w-10 h-10 rounded-lg border border-white/5 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center">
                                <span className="material-symbols-outlined !text-[18px]">close</span>
                             </button>
                             <button className="w-10 h-10 rounded-lg bg-primary text-black flex items-center justify-center hover:scale-105 transition-all">
                                <span className="material-symbols-outlined !text-[18px]">check</span>
                             </button>
                          </div>
                       </div>
                    </div>
                  ))}
               </div>
            </section>

            {/* Recent Product Comments */}
            <section className="space-y-6">
                <h3 className="text-[10px] font-black label-tracking text-on-surface-variant uppercase italic">Feedback de Productos</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   {comments.map(comment => (
                     <div key={comment.id} className="glass-card p-6 rounded-3xl border border-white/5 flex flex-col gap-4">
                        <div className="flex justify-between items-start">
                           <div>
                              <p className="text-xs font-black text-on-surface">{comment.user}</p>
                              <p className="text-[9px] font-bold text-on-surface/40 uppercase tracking-tighter">{comment.product}</p>
                           </div>
                           <div className="flex text-primary">
                              {[...Array(5)].map((_, i) => (
                                <span key={i} className={`material-symbols-outlined !text-[12px] ${i < comment.score ? 'fill-1' : ''}`}>star</span>
                              ))}
                           </div>
                        </div>
                        <p className="text-[11px] font-medium text-on-surface-variant leading-relaxed italic">"{comment.content}"</p>
                     </div>
                   ))}
                </div>
            </section>
         </div>

         {/* Right Col: Logistics Summary & Seller Health */}
         <div className="lg:col-span-4 space-y-10">
            {/* Seller Health */}
            <section className="glass-card p-8 rounded-[2.5rem] border border-white/5 space-y-6 relative overflow-hidden">
               <h3 className="text-[10px] font-black label-tracking text-on-surface-variant uppercase italic relative z-10">Salud del Vendedor</h3>
               
               <div className="space-y-6 relative z-10">
                  <div className="flex justify-between items-center">
                     <p className="text-xs font-bold text-on-surface/60">Ventas con Reclamo</p>
                     <p className="text-xs font-black text-primary">&lt; 1%</p>
                  </div>
                  <div className="w-full h-1 bg-white/5 rounded-full">
                     <div className="w-1/4 h-full bg-primary rounded-full shadow-glow" />
                  </div>

                  <div className="flex justify-between items-center">
                     <p className="text-xs font-bold text-on-surface/60">Tiempo de Despacho</p>
                     <p className="text-xs font-black text-amber-500">1.2h delay</p>
                  </div>
                  <div className="w-full h-1 bg-white/5 rounded-full">
                     <div className="w-3/4 h-full bg-amber-500 rounded-full" />
                  </div>

                  <div className="flex justify-between items-center">
                     <p className="text-xs font-bold text-on-surface/60">Cancelaciones</p>
                     <p className="text-xs font-black text-primary">0%</p>
                  </div>
                  <div className="w-full h-1 bg-white/5 rounded-full">
                     <div className="w-[2%] h-full bg-primary rounded-full shadow-glow" />
                  </div>
               </div>

               <div className="absolute inset-0 bg-primary/5 opacity-5 blur-3xl" />
            </section>

            {/* Top Publications Area */}
            <section className="glass-card p-8 rounded-[2.5rem] border border-white/5">
                <h3 className="text-[10px] font-black label-tracking text-on-surface-variant uppercase italic mb-8">Top Publicaciones</h3>
                <div className="space-y-6">
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10" />
                      <div className="flex-1">
                         <p className="text-[11px] font-black text-on-surface truncate">NX-800 Pulse Hub</p>
                         <p className="text-[9px] font-bold text-[#ccff00] uppercase tracking-widest">Activa / Promocionada</p>
                      </div>
                      <span className="material-symbols-outlined text-primary !text-[16px]">trending_up</span>
                   </div>
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10" />
                      <div className="flex-1">
                         <p className="text-[11px] font-black text-on-surface truncate">Neural Link v2</p>
                         <p className="text-[9px] font-bold text-primary uppercase tracking-widest">Active</p>
                      </div>
                      <span className="material-symbols-outlined text-on-surface/30 !text-[16px]">horizontal_rule</span>
                   </div>
                </div>
            </section>
         </div>
      </div>

      <div className="h-20" />
    </div>
  );
}