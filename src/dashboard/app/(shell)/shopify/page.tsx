"use client";

import { useMemo } from "react";

export default function ShopifyPage() {
  const stats = useMemo(() => [
    { label: "Active Store Sessions", value: "24,800", icon: "visibility", color: "text-blue-400" },
    { label: "Conversion Rate", value: "3.2%", icon: "autorenew", color: "text-primary" },
    { label: "AOV (Avg Order Value)", value: "$1,850", icon: "payments", color: "text-emerald-400" },
    { label: "Cart Abandonment", value: "68%", icon: "shopping_cart_checkout", color: "text-red-400" },
  ], []);

  const topProducts = [
    { id: 1, name: "NX-800 Pulse Hub", sales: 120, conversion: "4.5%" },
    { id: 2, name: "Neural Link v2", sales: 85, conversion: "2.8%" },
  ];

  return (
    <div className="space-y-10 animate-in">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <span className="text-[0.75rem] font-bold label-tracking text-[#95BF47] drop-shadow-[0_0_8px_rgba(149,191,71,0.3)]">
            Channel Intelligence / Shopify D2C
          </span>
          <h1 className="text-4xl md:text-5xl font-black tight-tracking text-on-surface">
            Control Operativo Shopify
          </h1>
        </div>

        <div className="flex items-center gap-3">
           <button className="px-8 py-4 glass-card border-white/5 rounded-2xl text-[10px] font-black label-tracking text-on-surface-variant hover:text-on-surface hover:border-primary/20 transition-all flex items-center gap-2">
              <span className="material-symbols-outlined !text-[16px]">language</span>
              OPEN LIVE STORE
           </button>
           <button className="px-8 py-4 neon-disruptor rounded-2xl text-[10px] font-black label-tracking shadow-glow">
              GESTIONAR DESCUENTOS
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
         {/* Left Col: Real-time Sales & Product Performance */}
         <div className="lg:col-span-8 space-y-10">
            {/* Live Orders Feed */}
            <section className="space-y-6">
               <div className="flex items-center justify-between">
                  <h3 className="text-[10px] font-black label-tracking text-on-surface-variant uppercase italic">Live Sales Stream</h3>
                  <div className="flex items-center gap-2">
                     <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                     <span className="text-[9px] font-bold text-red-500 uppercase">LIVE</span>
                  </div>
               </div>
               <div className="glass-card rounded-[2.5rem] border border-white/5 overflow-hidden">
                  <table className="w-full text-left">
                     <thead>
                        <tr className="border-b border-white/5">
                           <th className="px-8 py-5 text-[10px] font-black label-tracking text-on-surface/40 uppercase">Order</th>
                           <th className="px-8 py-5 text-[10px] font-black label-tracking text-on-surface/40 uppercase">Customer</th>
                           <th className="px-8 py-5 text-[10px] font-black label-tracking text-on-surface/40 uppercase">Status</th>
                           <th className="px-8 py-5 text-[10px] font-black label-tracking text-on-surface/40 uppercase text-right">Total</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-white/5">
                        {[
                          { id: "#1024", name: "Robert Fox", status: "Paid", total: 1240 },
                          { id: "#1023", name: "Jane Cooper", status: "Paid", total: 890 },
                          { id: "#1022", name: "Guy Hawkins", status: "Fulfilled", total: 3200 },
                        ].map(order => (
                          <tr key={order.id} className="group hover:bg-white/[0.02] transition-colors">
                             <td className="px-8 py-5 text-[11px] font-black text-primary">{order.id}</td>
                             <td className="px-8 py-5 text-[11px] font-bold text-on-surface">{order.name}</td>
                             <td className="px-8 py-5">
                                <span className="text-[9px] font-black bg-white/5 px-3 py-1 rounded-full text-on-surface-variant uppercase">{order.status}</span>
                             </td>
                             <td className="px-8 py-5 text-[11px] font-black text-on-surface text-right">${order.total.toLocaleString()}</td>
                          </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </section>

            {/* Product Efficiency */}
            <section className="space-y-6">
                <h3 className="text-[10px] font-black label-tracking text-on-surface-variant uppercase italic">Store Product Performance</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   {topProducts.map(prod => (
                     <div key={prod.id} className="glass-card p-6 rounded-3xl border border-white/5 flex flex-col gap-4 group hover:border-[#95BF47]/30 transition-all">
                        <div className="flex justify-between items-start">
                           <p className="text-sm font-black text-on-surface">{prod.name}</p>
                           <span className="text-[10px] font-black text-[#95BF47]">{prod.conversion} CV</span>
                        </div>
                        <div className="flex items-center gap-4">
                           <div className="flex-1 h-1 bg-white/5 rounded-full">
                              <div className="h-full bg-[#95BF47] rounded-full" style={{ width: prod.conversion }} />
                           </div>
                           <p className="text-[10px] font-black text-on-surface/40">{prod.sales} Sold</p>
                        </div>
                     </div>
                   ))}
                </div>
            </section>
         </div>

         {/* Right Col: Marketing & Analytics */}
         <div className="lg:col-span-4 space-y-10">
            {/* Abandoned Recovery AI */}
            <section className="glass-card p-8 rounded-[3rem] border border-white/5 space-y-8 relative overflow-hidden bg-gradient-to-br from-white/[0.02] to-transparent">
               <div className="flex items-center gap-4 relative z-10">
                  <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20">
                     <span className="material-symbols-outlined text-red-500">campaign</span>
                  </div>
                  <div>
                    <h3 className="text-[10px] font-black label-tracking text-red-500 uppercase">Recovery Agent</h3>
                    <p className="text-lg font-black text-on-surface">68% Drop-off</p>
                  </div>
               </div>
               
               <div className="space-y-6 relative z-10">
                  <p className="text-[12px] font-medium text-on-surface-variant leading-relaxed opacity-80">
                    "He detectado un aumento en carritos abandonados. He programado una secuencia de **3 correos de recuperación** y activado un cupón dinámico del 10%."
                  </p>
                  <div className="flex gap-3">
                     <button className="flex-1 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black label-tracking hover:bg-white/10 transition-all uppercase">
                       View Funnel
                     </button>
                     <button className="flex-1 py-4 bg-primary/10 border border-primary/20 rounded-2xl text-[10px] font-black label-tracking text-primary hover:bg-primary/20 transition-all uppercase">
                       Boost AI
                     </button>
                  </div>
               </div>
            </section>

            {/* Traffic Sources */}
            <section className="glass-card p-8 rounded-[2.5rem] border border-white/5">
                <h3 className="text-[10px] font-black label-tracking text-on-surface-variant uppercase italic mb-8">Traffic Acquisition</h3>
                <div className="space-y-6">
                   {[
                     { source: "Direct/Search", pct: 45, color: "bg-blue-400" },
                     { source: "Social (FB/IG)", pct: 35, color: "bg-purple-400" },
                     { source: "Email CRM", pct: 15, color: "bg-primary" },
                     { source: "Other", pct: 5, color: "bg-white/10" },
                   ].map(source => (
                     <div key={source.source} className="space-y-2">
                        <div className="flex justify-between text-[10px] font-bold">
                           <span className="text-on-surface/60">{source.source}</span>
                           <span className="text-on-surface">{source.pct}%</span>
                        </div>
                        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                           <div className={`h-full ${source.color}`} style={{ width: `${source.pct}%` }} />
                        </div>
                     </div>
                   ))}
                </div>
            </section>
         </div>
      </div>

      <div className="h-20" />
    </div>
  );
}
