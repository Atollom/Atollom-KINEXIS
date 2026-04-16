"use client";

import { useMemo } from "react";
import Link from "next/link";

export default function CRMSummaryPage() {
  const stats = useMemo(() => [
    { label: "Active Leads", value: "154", growth: "+18%", icon: "person_search", color: "text-blue-400" },
    { label: "Pipeline Value", value: "$2.4M", growth: "+12%", icon: "payments", color: "text-primary" },
    { label: "Closing Ratio", value: "24%", growth: "+5%", icon: "task_alt", color: "text-emerald-400" },
    { label: "Avg Sale Cycle", value: "14d", growth: "-2d", icon: "timer", color: "text-amber-400" },
  ], []);

  const recentActivity = [
    { id: 1, type: "Quote Approved", customer: "Tech Logistics", value: 125000, time: "Hace 15 min" },
    { id: 2, type: "New Lead", customer: "Alice Johnson", channel: "WhatsApp", time: "Hace 1 hr" },
    { id: 3, type: "Meeting Scheduled", customer: "Global Corp", contact: "Mark Riva", time: "Hoy 14:00" },
  ];

  return (
    <div className="space-y-10 animate-in">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <span className="text-[0.75rem] font-bold label-tracking text-primary drop-shadow-glow">
            Relationship Engine / Global CRM
          </span>
          <h1 className="text-4xl md:text-5xl font-black tight-tracking text-on-surface">
            Command Dashboard
          </h1>
        </div>

        <div className="flex items-center gap-4">
           <Link href="/crm/inbox" className="glass-card px-8 py-5 rounded-3xl flex items-center gap-4 hover:border-primary/30 transition-all group">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                 <span className="material-symbols-outlined !text-[20px]">forum</span>
              </div>
              <div className="text-left">
                 <p className="text-[10px] font-black text-on-surface-variant label-tracking uppercase">Unified Inbox</p>
                 <p className="text-sm font-black text-on-surface">12 Unread Messages</p>
              </div>
           </Link>
        </div>
      </header>

      {/* Primary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         {stats.map((s, i) => (
           <div key={i} className="glass-card p-8 rounded-[2rem] border border-white/5 relative overflow-hidden group">
              <div className="relative z-10 space-y-4">
                 <div className="flex justify-between items-start">
                    <span className={`material-symbols-outlined !text-3xl ${s.color}`}>{s.icon}</span>
                    <span className="text-[10px] font-black text-primary bg-primary/5 px-2 py-0.5 rounded-full">{s.growth}</span>
                 </div>
                 <div>
                    <p className="text-[10px] font-black text-on-surface/30 label-tracking uppercase">{s.label}</p>
                    <p className="text-3xl font-black text-on-surface tight-tracking">{s.value}</p>
                 </div>
              </div>
           </div>
         ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
         {/* Left Col: Pipeline Visualization & Leads */}
         <div className="lg:col-span-8 space-y-10">
            {/* Pipeline Funnel Preview */}
            <section className="glass-card p-10 rounded-[3rem] border border-white/5 relative overflow-hidden">
               <h3 className="text-[10px] font-black label-tracking text-on-surface-variant uppercase italic mb-10 relative z-10">Active Pipeline Velocity</h3>
               
               <div className="flex flex-col gap-8 relative z-10">
                  <div className="space-y-3">
                     <div className="flex justify-between items-end">
                        <p className="text-sm font-black text-on-surface">Prospects <span className="text-on-surface/30 font-medium ml-2">84 Leads</span></p>
                        <p className="text-[11px] font-black text-primary italic">$1.2M Value</p>
                     </div>
                     <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                        <div className="w-full h-full bg-primary/40 rounded-full" />
                     </div>
                  </div>
                  <div className="space-y-3 pl-10">
                     <div className="flex justify-between items-end">
                        <p className="text-sm font-black text-on-surface">Quotes Sent <span className="text-on-surface/30 font-medium ml-2">32 Quotes</span></p>
                        <p className="text-[11px] font-black text-primary italic">$850k Value</p>
                     </div>
                     <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                        <div className="w-[70%] h-full bg-primary/60 rounded-full" />
                     </div>
                  </div>
                  <div className="space-y-3 pl-20">
                     <div className="flex justify-between items-end">
                        <p className="text-sm font-black text-on-surface">Negotiating <span className="text-on-surface/30 font-medium ml-2">12 Items</span></p>
                        <p className="text-[11px] font-black text-primary italic">$420k Value</p>
                     </div>
                     <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                        <div className="w-[40%] h-full bg-primary rounded-full shadow-glow" />
                     </div>
                  </div>
               </div>

               <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[100px] pointer-events-none" />
            </section>

            {/* Leads Redirect Card */}
            <Link href="/crm/leads" className="group block">
               <div className="glass-card p-8 rounded-[2.5rem] border border-white/5 group-hover:border-primary/20 transition-all flex items-center justify-between">
                  <div className="flex items-center gap-6">
                     <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-on-surface/40 group-hover:text-primary transition-colors">
                        <span className="material-symbols-outlined !text-3x">person_search</span>
                     </div>
                     <div>
                        <h4 className="text-xl font-black text-on-surface tight-tracking">Lead Intelligence Agent</h4>
                        <p className="text-sm font-medium text-on-surface-variant opacity-60">Gestionar base de prospectos y scoring automático.</p>
                     </div>
                  </div>
                  <span className="material-symbols-outlined text-primary group-hover:translate-x-2 transition-transform">arrow_forward</span>
               </div>
            </Link>
         </div>

         {/* Right Col: Activity & Intent Analysis */}
         <div className="lg:col-span-4 space-y-10">
            {/* Intent Analysis AI */}
            <section className="glass-card p-8 rounded-[2.5rem] border border-white/5 space-y-8">
               <h3 className="text-[10px] font-black label-tracking text-on-surface-variant uppercase italic">Intent Recognition (AI)</h3>
               
               <div className="space-y-6">
                  {[
                    { label: "Purchase Intent", pct: 72, color: "bg-primary" },
                    { label: "Support Inquiry", pct: 45, color: "bg-blue-400" },
                    { label: "Complaint/Claim", pct: 12, color: "bg-red-500" },
                  ].map(intent => (
                    <div key={intent.label} className="space-y-2">
                       <div className="flex justify-between text-[11px] font-bold">
                          <span className="text-on-surface/70">{intent.label}</span>
                          <span className="text-on-surface">{intent.pct}%</span>
                       </div>
                       <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                          <div className={`h-full ${intent.color}`} style={{ width: `${intent.pct}%` }} />
                       </div>
                    </div>
                  ))}
               </div>
            </section>

            {/* Recent Activity Telemetry */}
            <section className="glass-card p-8 rounded-[2.5rem] border border-white/5">
                <h3 className="text-[10px] font-black label-tracking text-on-surface-variant uppercase italic mb-8">Intelligence Feed</h3>
                <div className="space-y-6">
                   {recentActivity.map(act => (
                     <div key={act.id} className="flex gap-4 relative">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                        <div>
                           <p className="text-[11px] font-black text-on-surface">{act.type}</p>
                           <p className="text-[10px] font-bold text-on-surface-variant leading-tight">{act.customer} • {act.time}</p>
                           {act.value && <p className="text-[10px] font-black text-primary mt-1">${act.value.toLocaleString()}</p>}
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
