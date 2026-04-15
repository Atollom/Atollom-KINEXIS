"use client";

import useSWR from "swr";
import { useKPIs } from "@/hooks/useKPIs";
import { useInventory } from "@/hooks/useInventory";
import { useLeads } from "@/hooks/useLeads";
import { fetcher } from "@/lib/fetcher";
import { AgentsFeed } from "@/components/AgentsFeed";
import type { InventoryItem, Lead } from "@/types";

// ── Components ──────────────────────────────────────────────────────────────

function UltraKPICard({ 
  label, 
  value, 
  suffix, 
  loading 
}: { 
  label: string; 
  value: string; 
  suffix: string; 
  loading: boolean;
}) {
  return (
    <div className="glass-card p-10 rounded-2xl flex flex-col justify-between min-h-[220px] group overflow-hidden relative">
      <div className="absolute top-0 left-0 w-1 h-full bg-primary/20 group-hover:bg-primary transition-colors" />
      <p className="text-[12px] font-black uppercase tracking-[0.2em] text-on-surface-variant mb-4 font-headline">
        {label}
      </p>
      <div className="flex items-baseline gap-3">
        <h2 className="text-ultra-kpi text-on-surface tight-tracking">
          {loading ? "---" : value}
        </h2>
        <span className="text-[11px] font-black uppercase text-on-surface-variant mb-4 self-end">
          {suffix}
        </span>
      </div>
      
      {/* Background Glow */}
      <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-all duration-500" />
    </div>
  );
}

function BentoCard({ 
  title, 
  icon, 
  children, 
  className = "", 
  locked = false 
}: { 
  title: string; 
  icon: string; 
  children: React.ReactNode; 
  className?: string;
  locked?: boolean;
}) {
  return (
    <div className={`glass-card p-6 rounded-2xl relative flex flex-col ${className} ${locked ? "opacity-60 overflow-hidden" : ""}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
            <span className="material-symbols-outlined text-primary text-[20px]">{icon}</span>
          </div>
          <h3 className="text-sm font-bold tight-tracking text-on-surface uppercase tracking-wider">{title}</h3>
        </div>
        {locked && (
          <div className="px-3 py-1 bg-primary text-background text-[10px] font-black rounded-full uppercase tracking-tighter shadow-lg shadow-primary/20">
            Upgrade Required
          </div>
        )}
      </div>
      <div className="flex-1">{children}</div>
      {locked && (
        <div className="absolute inset-0 bg-background/40 backdrop-blur-[2px] z-10 flex items-center justify-center cursor-pointer group">
           <p className="text-[11px] font-black uppercase tracking-widest bg-white text-black px-4 py-2 rounded-xl scale-95 opacity-0 group-hover:opacity-100 group-hover:scale-100 transition-all">
             Unlock Module
           </p>
        </div>
      )}
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function HomePage() {
  const { kpis, isLoading: kpisLoading } = useKPIs();
  const { inventory, isLoading: invLoading } = useInventory();
  const { leads, isLoading: leadsLoading } = useLeads();
  
  // Logic: plan_id determines visibility
  const planId = kpis?.plan_id || "enterprise";
  const isErpLocked = planId === "growth";
  const isCrmLocked = planId === "growth" || planId === "pro";

  const criticalSkus = inventory
    .filter((i) => i.status === "critical")
    .slice(0, 4);

  const formatCurrency = (val?: number) => 
    val !== undefined ? `$${(val / 1000).toFixed(1)}K` : "---";

  return (
    <div className="space-y-10">
      {/* Greeting Header */}
      <header className="flex flex-col gap-2">
        <h1 className="text-5xl font-black tight-tracking text-on-surface">
          Buen día, <span className="text-primary">{kpisLoading ? "..." : (kpis?.display_name || "Neural Commander")}</span>
        </h1>
        <p className="text-[12px] font-black uppercase tracking-[0.3em] text-on-surface-variant opacity-60">
          Atollom Kinexis Dashboard — Ops Status: Alpha
        </p>
      </header>

      {/* Ultra-KPI Bento Section */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <UltraKPICard 
          label="Ventas Hoy" 
          value={formatCurrency(kpis?.revenue_today)} 
          suffix="MXN" 
          loading={kpisLoading} 
        />
        <UltraKPICard 
          label="Ganancias" 
          value={formatCurrency((kpis?.revenue_today || 0) * 0.35)} 
          suffix="EST" 
          loading={kpisLoading} 
        />
        <UltraKPICard 
          label="Devoluciones" 
          value={kpis?.returns_count?.toString().padStart(2, "0") || "00"} 
          suffix="UNITS" 
          loading={kpisLoading} 
        />
        <UltraKPICard 
          label="Reembolsos" 
          value="$0.0" 
          suffix="MXN" 
          loading={kpisLoading} 
        />
      </section>

      {/* Advanced Operations Bento Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-12">
        
        {/* Inventory High-End Card */}
        <BentoCard title="Almacén Escaneo" icon="warehouse" className="lg:col-span-8" locked={isErpLocked}>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest">Stock Crítico</p>
                {invLoading ? (
                   <div className="animate-pulse space-y-2">
                     <div className="h-10 bg-white/[0.04] rounded-xl w-full" />
                     <div className="h-10 bg-white/[0.04] rounded-xl w-full" />
                   </div>
                ) : (
                  <div className="space-y-2">
                    {criticalSkus.map(item => (
                      <div key={item.sku} className="flex items-center justify-between p-3 bg-white/[0.02] border border-white/[0.04] rounded-xl">
                        <span className="text-xs font-bold truncate max-w-[120px]">{item.name}</span>
                        <span className="text-xs font-black text-primary">{item.stock} u</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex flex-col justify-center items-center p-6 bg-primary/5 rounded-3xl border border-primary/10">
                 <span className="material-symbols-outlined text-[48px] text-primary mb-2">upload_file</span>
                 <p className="text-center text-[13px] font-bold leading-tight">Arrastra tu Excel<br/><span className="text-on-surface-variant font-medium">para sincronizar almacén</span></p>
              </div>
           </div>
        </BentoCard>

        {/* CFDI & Agents Feed */}
        <BentoCard title="Neural Feed" icon="terminal" className="lg:col-span-4" locked={isCrmLocked}>
           <div className="max-h-[300px] overflow-hidden relative">
              <AgentsFeed />
              <div className="absolute bottom-0 left-0 w-full h-20 bg-gradient-to-t from-background to-transparent pointer-events-none" />
           </div>
        </BentoCard>

        {/* Lead Analytics */}
        <BentoCard title="Lead Pipeline" icon="person_search" className="lg:col-span-12" locked={isCrmLocked}>
           <div className="flex flex-wrap gap-4">
              {leadsLoading ? (
                 <div className="h-12 w-full bg-white/[0.04] rounded-xl animate-pulse" />
              ) : (
                leads.slice(0, 4).map(lead => (
                  <div key={lead.lead_id} className="flex-1 min-w-[200px] p-4 bg-white/[0.02] rounded-2xl border border-white/5">
                     <p className="text-[10px] font-black uppercase text-on-surface-variant mb-1">{lead.deal_stage}</p>
                     <p className="text-sm font-bold text-on-surface truncate">{lead.name}</p>
                     <div className="mt-3 h-1 w-full bg-white/5 rounded-full">
                        <div className="h-full bg-primary" style={{ width: `${lead.score}%` }} />
                     </div>
                  </div>
                ))
              )}
           </div>
        </BentoCard>

      </section>
    </div>
  );
}
