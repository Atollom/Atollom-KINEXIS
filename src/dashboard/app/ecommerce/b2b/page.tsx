"use client";

import { useMemo } from "react";

export default function B2BPage() {
  const stats = useMemo(() => [
    { label: "Active Corporate Clients", value: "48", icon: "domain", color: "text-blue-400" },
    { label: "Accounts Receivable", value: "$1.2M", icon: "account_balance", color: "text-primary" },
    { label: "Credit Utilization", value: "62%", icon: "credit_score", color: "text-amber-400" },
    { label: "Pipeline Value", value: "$4.5M", icon: "trending_up", color: "text-emerald-400" },
  ], []);

  const highTicketLeads = [
    { id: 1, company: "Tech Logistic Corp", value: 450000, stage: "Negotiation", contact: "Mark R." },
    { id: 2, company: "Global Vision S.A.", value: 125000, stage: "Quote Sent", contact: "Alice W." },
  ];

  const creditRequests = [
    { id: "CR-901", company: "Retail Group MX", limit: 500000, requested: 750000, score: "A+" },
    { id: "CR-902", company: "Optic Solutions", limit: 0, requested: 150000, score: "B" },
  ];

  return (
    <div className="space-y-10 animate-in">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <span className="text-[0.75rem] font-bold label-tracking text-[#3B82F6] drop-shadow-[0_0_8px_rgba(59,130,246,0.3)]">
            Channel Intelligence / B2B Enterprise
          </span>
          <h1 className="text-4xl md:text-5xl font-black tight-tracking text-on-surface">
            Control Operativo B2B
          </h1>
        </div>

        <div className="flex items-center gap-3">
           <button className="px-8 py-4 glass-card border-white/5 rounded-2xl text-[10px] font-black label-tracking text-on-surface-variant hover:text-on-surface hover:border-primary/20 transition-all flex items-center gap-2">
              <span className="material-symbols-outlined !text-[16px]">description</span>
              NUEVO CONTRATO
           </button>
           <button className="px-8 py-4 neon-disruptor rounded-2xl text-[10px] font-black label-tracking shadow-glow">
              GESTIÓN DE CRÉDITOS
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
         {/* Left Col: High Ticket Pipeline & Credit Requests */}
         <div className="lg:col-span-8 space-y-10">
            {/* Enterprise Pipeline */}
            <section className="space-y-6">
               <div className="flex items-center justify-between">
                  <h3 className="text-[10px] font-black label-tracking text-on-surface-variant uppercase italic">High Ticket Pipeline</h3>
                  <span className="text-[9px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">ACTION REQUIRED</span>
               </div>
               <div className="space-y-4">
                  {highTicketLeads.map(lead => (
                    <div key={lead.id} className="glass-card p-6 rounded-3xl border border-white/5 flex items-center justify-between group hover:border-[#3B82F6]/30 transition-all">
                       <div className="flex items-center gap-6">
                          <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center">
                             <span className="material-symbols-outlined text-[#3B82F6]">handshake</span>
                          </div>
                          <div>
                             <p className="text-sm font-black text-on-surface">{lead.company}</p>
                             <p className="text-[10px] font-bold text-on-surface-variant italic">Stage: {lead.stage}</p>
                          </div>
                       </div>
                       <div className="flex items-center gap-10">
                          <div className="text-right">
                             <p className="text-[9px] font-black text-on-surface/20 label-tracking">EST. VALUE</p>
                             <p className="text-lg font-black text-primary italic">${lead.value.toLocaleString()}</p>
                          </div>
                          <button className="w-10 h-10 rounded-lg border border-white/10 hover:bg-white/10 transition-all flex items-center justify-center">
                             <span className="material-symbols-outlined !text-[18px]">more_vert</span>
                          </button>
                       </div>
                    </div>
                  ))}
               </div>
            </section>

            {/* Credit Requests Area */}
            <section className="space-y-6">
                <h3 className="text-[10px] font-black label-tracking text-on-surface-variant uppercase italic">Credit & Overdraft Requests</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   {creditRequests.map(req => (
                     <div key={req.id} className="glass-card p-6 rounded-3xl border border-white/5 flex flex-col gap-4">
                        <div className="flex justify-between items-start">
                           <div>
                              <p className="text-xs font-black text-on-surface">{req.company}</p>
                              <p className="text-[9px] font-bold text-on-surface/40 uppercase tracking-widest">Score: {req.score}</p>
                           </div>
                           <span className="text-[9px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-full">NEW REQ</span>
                        </div>
                        <div className="space-y-2">
                           <div className="flex justify-between text-[10px] font-bold">
                              <span className="text-on-surface/30">Request</span>
                              <span className="text-on-surface">${req.requested.toLocaleString()}</span>
                           </div>
                           <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                              <div className="w-3/4 h-full bg-[#3B82F6]" />
                           </div>
                        </div>
                     </div>
                   ))}
                </div>
            </section>
         </div>

         {/* Right Col: Fiscal Integrity & Terms */}
         <div className="lg:col-span-4 space-y-10">
            {/* Credit Scoring Agent */}
            <section className="glass-card p-8 rounded-[3rem] border border-white/5 space-y-8 relative overflow-hidden bg-gradient-to-br from-white/[0.02] to-transparent">
               <div className="flex items-center gap-4 relative z-10">
                  <div className="w-12 h-12 rounded-full bg-[#3B82F6]/10 flex items-center justify-center border border-[#3B82F6]/20">
                     <span className="material-symbols-outlined text-[#3B82F6]">policy</span>
                  </div>
                  <div>
                    <h3 className="text-[10px] font-black label-tracking text-[#3B82F6] uppercase">Credit AI</h3>
                    <p className="text-lg font-black text-on-surface">Risk Level: Low</p>
                  </div>
               </div>
               
               <div className="space-y-6 relative z-10">
                  <p className="text-[12px] font-medium text-on-surface-variant leading-relaxed opacity-80">
                    "Comandante, **Retail Group MX** ha solicitado un aumento de crédito. Su historial de pagos es del 100% y su IPI score indica bajo riesgo."
                  </p>
                  <button className="w-full py-4 bg-[#3B82F6] text-white rounded-2xl text-[10px] font-black label-tracking hover:brightness-110 transition-all uppercase">
                    Aprobar Incremento
                  </button>
               </div>
               <div className="absolute top-0 right-0 w-32 h-32 bg-[#3B82F6]/5 blur-[70px]" />
            </section>

            {/* Terms Distribution */}
            <section className="glass-card p-8 rounded-[2.5rem] border border-white/5">
                <h3 className="text-[10px] font-black label-tracking text-on-surface-variant uppercase italic mb-8">Contract Terms Distribution</h3>
                <div className="space-y-6">
                   {[
                     { term: "Net 30", count: 28, pct: 60, color: "bg-blue-400" },
                     { term: "Net 60", count: 12, pct: 25, color: "bg-amber-400" },
                     { term: "Consignment", count: 4, pct: 10, color: "bg-emerald-400" },
                     { term: "Upfront", count: 4, pct: 5, color: "bg-white/10" },
                   ].map(t => (
                     <div key={t.term} className="space-y-2">
                        <div className="flex justify-between text-[10px] font-bold">
                           <span className="text-on-surface/60">{t.term}</span>
                           <span className="text-on-surface">{t.count} Clients</span>
                        </div>
                        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                           <div className={`h-full ${t.color}`} style={{ width: `${t.pct}%` }} />
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
