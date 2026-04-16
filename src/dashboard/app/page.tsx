"use client";

import { useKPIs } from "@/hooks/useKPIs";
import { useInventory } from "@/hooks/useInventory";
import { useLeads } from "@/hooks/useLeads";
import { usePurchaseOrders } from "@/hooks/usePurchaseOrders";
import { KpiCard } from "@/components/KpiCard";
import { SystemMetrics } from "@/components/SystemMetrics";
import { AgentsFeed } from "@/components/AgentsFeed";
import { ApprovalQueue } from "@/components/ApprovalQueue";

function BentoCard({ 
  title, 
  subtitle, 
  icon, 
  children 
}: { 
  title: string; 
  subtitle?: string; 
  icon?: string; 
  children: React.ReactNode 
}) {
  return (
    <div className="glass-card rounded-[2.5rem] p-8 border border-white/5 relative overflow-hidden group">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {icon && <span className="material-symbols-outlined text-[#ccff00] text-xl">{icon}</span>}
          <div>
            <h3 className="text-sm font-black uppercase italic tracking-wider text-white">{title}</h3>
            {subtitle && <p className="text-[9px] font-black uppercase text-white/20 tracking-widest mt-0.5">{subtitle}</p>}
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}

export default function HomePage() {
  const { kpis, isLoading: isLoadingKPIs } = useKPIs();
  const { inventory, isLoading: isLoadingInv } = useInventory();
  const { leads, isLoading: isLoadingLeads } = useLeads();
  const { purchaseOrders, isLoading: isLoadingPOs } = usePurchaseOrders();

  const metrics = [
    { label: "DAILY_REVENUE", value: `$${kpis?.revenue_today?.toLocaleString() ?? "0"}`, trend: "+12.4%", trendColor: "primary" as const },
    { label: "AI_CONV_NODES", value: kpis?.active_agents?.toLocaleString() ?? "0", trend: "+8.2%", trendColor: "primary" as const },
    { label: "PENDING_CFDI", value: kpis?.cfdi_pending?.toString() ?? "0", trend: "-2.1%", trendColor: "error" as const, accent: "error" as const },
    { label: "SYSTEM_UPTIME", value: "99.98%", trend: "0.001s", trendColor: "outline" as const, accent: "primary" as const },
  ];

  return (
    <div className="space-y-12 pb-24 animate-luxe">
      
      {/* ── Neural Header Cluster ────────────────────────────── */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 py-10">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
             <div className="bg-[#ccff00]/10 border border-[#ccff00]/20 px-4 py-1.5 rounded-full flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#ccff00] animate-pulse shadow-volt" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#ccff00] italic">Neural Link: Online</span>
             </div>
             <span className="text-white/10 text-[10px] uppercase font-black tracking-[0.4em] italic leading-none">ID: KINEXIS-OS-BRAVO</span>
          </div>
          <h1 className="text-6xl font-black text-white italic tracking-tighter uppercase leading-none">
            Neural <span className="text-[#ccff00] shadow-volt-text">Commander</span>
          </h1>
          <p className="text-white/20 text-[11px] uppercase font-black tracking-[0.5em] italic leading-relaxed max-w-xl">
            Autonomous multi-agent orchestration shell · Level 4 Autonomy Active
          </p>
        </div>

        <div className="flex items-center gap-6">
           <div className="text-right">
              <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.4em] italic mb-1">Last Sync</p>
              <p className="text-xs font-black text-white italic tracking-wider">0.002s DELTA</p>
           </div>
           <div className="w-px h-10 bg-white/5" />
           <button className="h-14 px-10 bg-[#ccff00] text-black rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] shadow-volt hover:scale-105 active:scale-95 transition-all italic">
              Deploy Agent
           </button>
        </div>
      </header>

      {/* ── Telemetry Matrix ─────────────────────────────────── */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {metrics.map((m, i) => (
          <KpiCard key={i} {...m} />
        ))}
      </section>

      {/* ── Core Systems ─────────────────────────────────────── */}
      <section className="grid grid-cols-12 gap-8">
        
        {/* Main Intelligence Grid */}
        <div className="col-span-12 lg:col-span-8 space-y-8">
          <SystemMetrics />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <BentoCard 
              title="INVENTORY_FRAGMENTS" 
              subtitle="Stock Integrity Audit"
              icon="inventory_2"
            >
              <div className="space-y-6 py-6">
                {(inventory?.slice(0, 4) || []).map((item: any) => (
                  <div key={item.sku} className="space-y-3 group/row">
                    <div className="flex justify-between items-end">
                      <p className="text-[10px] font-black text-white uppercase tracking-tight group-hover/row:text-[#ccff00] transition-colors">{item.name}</p>
                      <p className="text-[10px] font-black text-white/20 italic">{item.days_remaining} DAYS</p>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden p-0.5">
                       <div 
                        className={`h-full rounded-full transition-all duration-1000 ${item.days_remaining < 7 ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-[#ccff00] shadow-volt'}`} 
                        style={{ width: `${Math.min((item.days_remaining / 30) * 100, 100)}%` }} 
                       />
                    </div>
                  </div>
                ))}
              </div>
            </BentoCard>

            <BentoCard 
              title="PROCUREMENT_QUEUE" 
              subtitle="Pending Human Intercepts"
              icon="shopping_basket"
            >
              <div className="space-y-3 py-6">
                {(purchaseOrders?.slice(0, 5) || []).map((po: any) => (
                  <div key={po.po_id} className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl hover:border-white/10 transition-all">
                    <div className="flex items-center gap-3">
                       <span className="material-symbols-outlined text-white/20 text-lg italic">description</span>
                       <div>
                          <p className="text-[10px] font-black text-white uppercase leading-none">{po.supplier}</p>
                          <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mt-1 italic">{po.status}</p>
                       </div>
                    </div>
                    <span className="text-[10px] font-black text-[#ccff00] italic">${po.total?.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </BentoCard>
          </div>
        </div>

        {/* Neural Feed Sidebar */}
        <div className="col-span-12 lg:col-span-4 space-y-8">
          <AgentsFeed />
          <ApprovalQueue />
        </div>

      </section>

      {/* ── Operational Sectors ─────────────────────────────── */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
         {/* Sector Identity Cards */}
         <div className="glass-card rounded-[3rem] p-10 border border-white/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#ccff00]/5 rounded-full blur-[60px] pointer-events-none group-hover:bg-[#ccff00]/10 transition-colors duration-1000" />
            <div className="flex items-center gap-4 mb-6">
               <span className="material-symbols-outlined text-[#ccff00] text-3xl">storefront</span>
               <h3 className="text-xl font-black italic text-white uppercase tracking-tighter">Market_Sector</h3>
            </div>
            <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] mb-8 leading-relaxed italic">
               Cross-platform synchronization for ML_Amazon_Shopify nodes.
            </p>
            <div className="space-y-3">
               <div className="flex justify-between text-[9px] font-black text-white/40 uppercase italic">
                  <span>Sync Status</span>
                  <span className="text-[#ccff00]">Nominal</span>
               </div>
               <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-[#ccff00] w-full shadow-volt" />
               </div>
            </div>
         </div>

         <div className="glass-card rounded-[3rem] p-10 border border-white/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-[60px] pointer-events-none transition-colors duration-1000" />
            <div className="flex items-center gap-4 mb-6">
               <span className="material-symbols-outlined text-white/40 text-3xl">psychology</span>
               <h3 className="text-xl font-black italic text-white uppercase tracking-tighter">Logic_Core</h3>
            </div>
            <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] mb-8 leading-relaxed italic">
               High-level procurement and inventory planning fragment.
            </p>
            <div className="space-y-3">
               <div className="flex justify-between text-[9px] font-black text-white/40 uppercase italic">
                  <span>Processing</span>
                  <span className="text-white">Active</span>
               </div>
               <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-white/20 w-[85%]" />
               </div>
            </div>
         </div>

         <div className="glass-card rounded-[3rem] p-10 border border-[#ccff00]/10 bg-[#ccff00]/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#ccff00]/20 rounded-full blur-[60px] pointer-events-none" />
            <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 rounded-3xl bg-black flex items-center justify-center border border-white/10">
                   <span className="material-symbols-outlined text-[#ccff00] text-4xl shadow-volt">offline_bolt</span>
                </div>
                <div>
                   <h3 className="text-2xl font-black italic text-white uppercase tracking-tighter">System_Auth</h3>
                   <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#ccff00]">Verified</span>
                </div>
            </div>

            <button className="w-full py-4 rounded-xl border border-white/10 text-[10px] font-black uppercase tracking-[0.2em] text-white/40 hover:text-white hover:border-[#ccff00]/30 transition-all">
               Manage Identity Hub
            </button>
         </div>
      </section>
    </div>
  );
}
