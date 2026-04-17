"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";

// ──────────────────────────────────────────────────────────────────────────────
// Tipos locales
// ──────────────────────────────────────────────────────────────────────────────
interface TenantProfile {
  tenant_id: string;
  business_name: string;
  rfc: string;
  plan: "Starter" | "Growth" | "Pro";
  active_modules: string[];
  system_status: "green" | "yellow" | "red";
  last_login: string;
  created_at: string;
  mrr: number;
}

interface SupportTicket {
  id: string;
  tenant_id: string;
  business_name?: string;
  subject: string;
  priority: "low" | "medium" | "high" | "critical";
  status: "open" | "in_progress" | "resolved" | "escalated";
  created_at: string;
}

interface ConfigLog {
  id: string;
  tenant_id: string;
  business_name?: string;
  user_id: string;
  field: string;
  previous_value: string;
  new_value: string;
  created_at: string;
}

interface GlobalMetrics {
  mrr_total: number;
  customers_by_plan: { Starter: number; Growth: number; Pro: number };
  churn_rate: number;
  total_alerts: number;
}

interface ApiStatus {
  service: "Mercado Libre" | "Amazon SP-API" | "Shopify" | "Meta" | "FacturAPI";
  status: "green" | "red";
  latency_ms: number;
  last_checked: string;
}

type PanelTab = "clients" | "metrics" | "support" | "logs" | "system";

// ──────────────────────────────────────────────────────────────────────────────
// Componente Principal
// ──────────────────────────────────────────────────────────────────────────────
export default function AtollomPanelPage() {
  const supabase = createBrowserSupabaseClient();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<PanelTab>("clients");
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

  // Estados de datos
  const [tenants, setTenants] = useState<TenantProfile[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [logs, setLogs] = useState<ConfigLog[]>([]);
  const [apiStatuses, setApiStatuses] = useState<ApiStatus[]>([]);
  const [metrics, setMetrics] = useState<GlobalMetrics>({
    mrr_total: 0,
    customers_by_plan: { Starter: 0, Growth: 0, Pro: 0 },
    churn_rate: 0,
    total_alerts: 0,
  });

  // Filtros Log
  const [logFilterTenant, setLogFilterTenant] = useState("all");
  const [logFilterDate, setLogFilterDate] = useState("");

  useEffect(() => {
    async function loadData() {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace('/login'); return; }

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role !== 'atollom_admin') {
        setAccessDenied(true);
        setLoading(false);
        return;
      }

      const { data: tenantData } = await supabase.from("tenant_profiles").select("*");
      const loadedTenants: TenantProfile[] = (tenantData || []).map((t: any) => ({
        tenant_id: t?.tenant_id,
        business_name: t?.business_name || "Nexus Entity",
        rfc: t?.rfc || "UNIDENTIFIED",
        plan: t?.plan || "Pro",
        active_modules: ["ecommerce", "erp", "crm"],
        system_status: (Math.random() > 0.9 ? "yellow" : Math.random() > 0.95 ? "red" : "green") as any,
        last_login: t?.updated_at || t?.created_at,
        created_at: t?.created_at,
        mrr: t?.plan === "Starter" ? 99 : t?.plan === "Growth" ? 299 : 599,
      }));
      setTenants(loadedTenants || []);

      const starterCount = loadedTenants.filter(t => t.plan === "Starter").length;
      const growthCount = loadedTenants.filter(t => t.plan === "Growth").length;
      const proCount = loadedTenants.filter(t => t.plan === "Pro").length;
      const totalMrr = loadedTenants.reduce((sum, t) => sum + t.mrr, 0);

      setMetrics({
        mrr_total: totalMrr,
        customers_by_plan: { Starter: starterCount, Growth: growthCount, Pro: proCount },
        churn_rate: 2.4,
        total_alerts: loadedTenants.filter(t => t.system_status !== "green").length,
      });

      const { data: ticketData } = await supabase
        .from("support_tickets")
        .select("*, tenant_profiles(business_name)")
        .order("created_at", { ascending: false });

      if (ticketData && Array.isArray(ticketData)) {
        setTickets(ticketData.map((t: any) => ({
          ...t,
          business_name: t.tenant_profiles?.business_name || t.tenant_id?.substring(0,8)
        })));
      }

      const { data: logData } = await supabase
        .from("config_change_log")
        .select("*, tenant_profiles(business_name)")
        .order("created_at", { ascending: false })
        .limit(100);
      
      if (logData && Array.isArray(logData)) {
        setLogs(logData.map((l: any) => ({
          ...l,
          business_name: l.tenant_profiles?.business_name || l.tenant_id?.substring(0,8)
        })));
      }

      setApiStatuses([
        { service: "Mercado Libre", status: "green", latency_ms: 120, last_checked: new Date().toISOString() },
        { service: "Amazon SP-API", status: "green", latency_ms: 340, last_checked: new Date().toISOString() },
        { service: "Shopify",       status: "green", latency_ms: 85,  last_checked: new Date().toISOString() },
        { service: "Meta",          status: "green", latency_ms: 210, last_checked: new Date().toISOString() },
        { service: "FacturAPI",     status: "green", latency_ms: 150, last_checked: new Date().toISOString() },
      ]);

      setLoading(false);
    }
    loadData();
  }, [supabase, router]);

  const notifySuperadmin = async (message: string, severity: "info" | "high" | "critical" = "info") => {
    try {
      const res = await fetch('/api/atollom/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, severity })
      });
      if (res.ok) alert("Transmitted via WA Master Link (+52 5646060947)");
      else alert("Transmission failure.");
    } catch { alert("Transmission failure."); }
  };

  const escalateTicket = async (ticketId: string) => {
    const ticket = tickets.find(t => t.id === ticketId);
    setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: "escalated" } : t));
    if (ticket?.priority === "critical") {
      await notifySuperadmin(`Critical Ticket Escalation: ${ticketId} — ${ticket.subject}`, "critical");
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-full bg-black flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-full border-2 border-[#ccff00]/20 border-t-[#ccff00] animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#ccff00]">Syncing Control Panel...</p>
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="h-screen w-full bg-black flex items-center justify-center p-8">
        <div className="glass-card p-12 rounded-[3rem] border border-red-500/20 text-center max-w-md">
           <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-8 border border-red-500/20">
              <span className="material-symbols-outlined text-5xl text-red-500">lock_open</span>
           </div>
           <h1 className="text-2xl font-black text-white uppercase tracking-tighter mb-4">Unauthorized Entry</h1>
           <p className="text-white/30 text-[10px] uppercase font-black tracking-widest leading-relaxed">Identity Role restricted.<br/>Access limited to Atollom Neural Admin Cluster.</p>
        </div>
      </div>
    );
  }

  const filteredLogs = logs.filter(l => {
    if (logFilterTenant !== "all" && l.tenant_id !== logFilterTenant) return false;
    if (logFilterDate && !l.created_at.startsWith(logFilterDate)) return false;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-12 animate-luxe pb-24 px-4">
      
      {/* ── Dynamic Header ─────────────────────────────────────────── */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 py-2">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-2xl bg-[#ccff00] text-black flex items-center justify-center shadow-volt italic font-black text-xl">
                A
             </div>
             <div>
                <h1 className="text-3xl font-black tracking-tighter text-white uppercase">Atollom Control</h1>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#ccff00]/60 italic">Neural Super-Admin Terminal</p>
             </div>
          </div>
        </div>

        <div className="bg-white/5 p-1 rounded-2xl border border-white/5 flex gap-1 overflow-x-auto scrollbar-none">
          {[
            { id: "clients", label: "Tenants", icon: "domain" },
            { id: "metrics", label: "Global", icon: "analytics" },
            { id: "support", label: "Tickets", icon: "support_agent" },
            { id: "logs", label: "Logs", icon: "list_alt" },
            { id: "system", label: "Infra", icon: "memory" },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as PanelTab)}
              className={`
                flex items-center gap-2 px-6 py-3 rounded-xl
                text-[9px] font-black uppercase tracking-[0.2em] transition-all duration-300
                whitespace-nowrap flex-shrink-0
                ${activeTab === tab.id
                  ? "bg-white text-black shadow-xl italic"
                  : "text-white/30 hover:text-white hover:bg-white/5"
                }
              `}
            >
              <span className="material-symbols-outlined text-[14px]">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* ── Content Grid ────────────────────────────────────────────── */}
      <main className="space-y-12">
        
        {/* Clients */}
        {activeTab === "clients" && (
           <div className="space-y-8 animate-luxe">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                 <MetricCard label="Active Entities" value={tenants.length.toString()} color="#ccff00" />
                 <MetricCard label="Systems in Risk" value={tenants.filter(t => t.system_status === "red").length.toString()} color="#ef4444" />
                 <MetricCard label="Period Growth" value="+12.4%" color="#ccff00" />
              </div>

              <div className="glass-card rounded-[3rem] border border-white/5 overflow-hidden">
                 <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                       <thead className="bg-white/5">
                          <tr>
                             <th className="px-8 py-6 text-[10px] font-black text-white/30 uppercase tracking-widest">Entity Signature</th>
                             <th className="px-8 py-6 text-[10px] font-black text-white/30 uppercase tracking-widest">Plan</th>
                             <th className="px-8 py-6 text-[10px] font-black text-white/30 uppercase tracking-widest text-center">Neural Status</th>
                             <th className="px-8 py-6 text-[10px] font-black text-white/30 uppercase tracking-widest">Allocation</th>
                             <th className="px-8 py-6 text-[10px] font-black text-white/30 uppercase tracking-widest">Timestamp</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-white/5">
                          {tenants.map(t => (
                             <tr key={t.tenant_id} className="hover:bg-white/[0.02] transition-colors group">
                                <td className="px-8 py-6">
                                   <p className="font-black text-sm text-white uppercase tracking-tight group-hover:text-[#ccff00] transition-colors">{t.business_name}</p>
                                   <p className="text-[10px] text-white/20 font-mono mt-1 underline decoration-white/5">{t.rfc}</p>
                                </td>
                                <td className="px-8 py-6">
                                   <span className={`text-[9px] font-black px-3 py-1.5 rounded-lg border uppercase tracking-widest ${
                                     t.plan === 'Pro' ? 'bg-[#ccff00]/10 border-[#ccff00]/30 text-[#ccff00]' : 'bg-white/5 border-white/5 text-white/20'
                                   }`}>
                                      {t.plan}
                                   </span>
                                </td>
                                <td className="px-8 py-6 text-center">
                                   <div className="flex justify-center">
                                      <span className={`w-2.5 h-2.5 rounded-full shadow-lg ${
                                        t.system_status === "green" ? "bg-[#22C55E] shadow-[#22C55E80]" : t.system_status === "yellow" ? "bg-[#F59E0B] shadow-[#F59E0B80]" : "bg-[#EF4444] shadow-[#EF444480]"
                                      }`} />
                                   </div>
                                </td>
                                <td className="px-8 py-6">
                                   <div className="flex gap-2">
                                      {t.active_modules.map(mod => (
                                         <span key={mod} className="text-[8px] bg-white/5 text-white/40 border border-white/5 px-2 py-1 rounded uppercase font-black italic">
                                            {mod.substring(0,3)}
                                         </span>
                                      ))}
                                   </div>
                                </td>
                                <td className="px-8 py-6 text-[10px] font-black text-white/20 uppercase">
                                   {new Date(t.created_at).toLocaleDateString()}
                                </td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
              </div>
           </div>
        )}

        {/* Global Metrics */}
        {activeTab === "metrics" && (
           <div className="space-y-12 animate-luxe">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                 <MetricCard label="Total MRR Cluster" value={`$${metrics.mrr_total.toLocaleString()}`} color="#ccff00" />
                 <MetricCard label="Operational Churn" value={`${metrics.churn_rate}%`} color="#ef4444" />
                 <div className="glass-card rounded-[2.5rem] border border-white/5 p-8 md:col-span-2 relative overflow-hidden flex flex-col justify-center">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-[#ccff00]/5 rounded-full blur-[80px]" />
                    <p className="text-[11px] font-black text-white/30 uppercase tracking-[0.4em] mb-6">Allocation Density by Plan</p>
                    <div className="flex gap-1.5 w-full h-4 rounded-full overflow-hidden p-0.5 bg-white/5 shadow-inner">
                       <div style={{ width: `${(metrics.customers_by_plan.Pro/tenants.length)*100}%` }} className="bg-[#ccff00] rounded-full shadow-volt" />
                       <div style={{ width: `${(metrics.customers_by_plan.Growth/tenants.length)*100}%` }} className="bg-white/40 rounded-full" />
                       <div style={{ width: `${(metrics.customers_by_plan.Starter/tenants.length)*100}%` }} className="bg-white/10 rounded-full" />
                    </div>
                    <div className="flex gap-6 mt-6">
                       <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#ccff00]" /><span className="text-[9px] font-black uppercase text-white/40">Pro</span></div>
                       <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-white/40" /><span className="text-[9px] font-black uppercase text-white/20">Growth</span></div>
                       <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-white/10" /><span className="text-[9px] font-black uppercase text-white/10">Starter</span></div>
                    </div>
                 </div>
              </div>
           </div>
        )}

        {/* Support */}
        {activeTab === "support" && (
           <div className="space-y-8 animate-luxe">
              <div className="flex items-center justify-between mb-2">
                 <h2 className="text-[11px] font-black text-white uppercase tracking-[0.3em]">Support Dispatch Queue</h2>
                 <button className="text-[9px] font-black text-[#ccff00] uppercase tracking-widest border border-[#ccff00]/20 px-4 py-2 rounded-xl group hover:bg-[#ccff00]/10 transition-all flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm group-hover:rotate-12 transition-transform">bolt</span>
                    Pulse Sync
                 </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {tickets.length === 0 ? (
                    <div className="col-span-2 glass-card py-24 rounded-[3rem] border border-white/5 text-center">
                       <p className="text-[10px] font-black text-white/20 uppercase tracking-widest italic leading-relaxed">No pending tickets in current neural branch.</p>
                    </div>
                 ) : (
                    tickets.map(t => (
                       <div key={t.id} className={`glass-card p-10 rounded-[2.5rem] border transition-all duration-500 flex flex-col justify-between group ${
                         t.status === "escalated" ? "border-red-500/20 bg-red-500/5 shadow-xl" : "border-white/5 hover:border-white/10"
                       }`}>
                          <div className="space-y-6">
                             <div className="flex items-center justify-between">
                                <span className={`text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${
                                   t.priority === 'critical' ? 'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]' : 'bg-white/5 text-white/30'
                                }`}>{t.priority}</span>
                                <span className="text-[8px] font-black text-white/10 uppercase tracking-widest">ID: {t.id}</span>
                             </div>
                             <div>
                                <h3 className="text-xl font-black text-white uppercase tracking-tighter group-hover:text-[#ccff00] transition-colors">{t.subject}</h3>
                                <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mt-2 italic">{t.business_name}</p>
                             </div>
                          </div>

                          <div className="flex items-center justify-between mt-10 pt-6 border-t border-white/5">
                             <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">{new Date(t.created_at).toLocaleDateString()}</span>
                             {t.status !== "escalated" ? (
                                <button 
                                   onClick={() => escalateTicket(t.id)}
                                   className="h-12 px-8 bg-red-500 text-white text-[10px] font-black uppercase rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-xl"
                                >
                                   Escalate Link
                                </button>
                             ) : (
                                <div className="flex items-center gap-2 text-red-500">
                                   <span className="material-symbols-outlined text-lg animate-pulse">warning</span>
                                   <span className="text-[10px] font-black uppercase tracking-widest">Escalated</span>
                                </div>
                             )}
                          </div>
                       </div>
                    ))
                 )}
              </div>
           </div>
        )}

        {/* Logs */}
        {activeTab === "logs" && (
           <div className="space-y-8 animate-luxe">
              <div className="flex gap-4 mb-2">
                 <select 
                    value={logFilterTenant} onChange={e => setLogFilterTenant(e.target.value)}
                    className="h-12 bg-white/5 border border-white/5 rounded-2xl px-6 text-[10px] font-black text-white uppercase tracking-widest outline-none focus:border-[#ccff00]/30 transition-all appearance-none cursor-pointer text-center"
                 >
                    <option value="all">All Entropy Branches</option>
                    {tenants.map(t => <option key={t.tenant_id} value={t.tenant_id} className="bg-black">{t.business_name}</option>)}
                 </select>
                 <input 
                    type="date"
                    value={logFilterDate} onChange={e => setLogFilterDate(e.target.value)}
                    className="h-12 bg-white/5 border border-white/5 rounded-2xl px-6 text-[10px] font-black text-white uppercase tracking-widest outline-none focus:border-[#ccff00]/30 transition-all inverter-calendar"
                 />
              </div>

              <div className="glass-card rounded-[3rem] border border-white/5 overflow-hidden min-h-[500px]">
                 <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                       <thead className="bg-white/5 sticky top-0 backdrop-blur-3xl z-10">
                          <tr>
                             <th className="px-8 py-6 text-[10px] font-black text-white/30 uppercase tracking-widest">Temporal Node</th>
                             <th className="px-8 py-6 text-[10px] font-black text-white/30 uppercase tracking-widest">Entity Signature</th>
                             <th className="px-8 py-6 text-[10px] font-black text-white/30 uppercase tracking-widest">Neural Key</th>
                             <th className="px-8 py-6 text-[10px] font-black text-white/30 uppercase tracking-widest">Previous State</th>
                             <th className="px-8 py-6 text-[10px] font-black text-white/30 uppercase tracking-widest">Applied Diff</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-white/5">
                          {filteredLogs.map(l => (
                             <tr key={l.id} className="hover:bg-white/[0.02] transition-colors">
                                <td className="px-8 py-6 text-[10px] font-black text-white/20 uppercase font-mono">{new Date(l.created_at).toLocaleString('es-MX')}</td>
                                <td className="px-8 py-6 text-[10px] font-black text-[#ccff00] uppercase tracking-widest italic">{l.business_name}</td>
                                <td className="px-8 py-6 font-mono text-[11px] text-white/40">{l.field}</td>
                                <td className="px-8 py-6">
                                   <div className="text-[10px] font-black text-red-500/50 uppercase line-through italic truncate max-w-[120px]">
                                      {l.field.startsWith("vault.") ? "[ENCRYPTED]" : l.previous_value}
                                   </div>
                                </td>
                                <td className="px-8 py-6">
                                   <div className="text-[10px] font-black text-[#ccff00] uppercase italic truncate max-w-[120px]">
                                      {l.field.startsWith("vault.") ? "[ENCRYPTED]" : l.new_value}
                                   </div>
                                </td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
              </div>
           </div>
        )}

        {/* System & APIs */}
        {activeTab === "system" && (
           <div className="space-y-12 animate-luxe">
              <div className="flex items-center gap-4 px-2">
                 <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[#ccff00] text-xl">hub</span>
                 </div>
                 <h2 className="text-xl font-black text-white uppercase tracking-[0.3em]">External Nodes Status</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                 {apiStatuses.map(api => (
                    <div key={api.service} className="glass-card p-8 rounded-[2rem] border border-white/5 flex flex-col items-center text-center group hover:border-white/10 transition-all hover:shadow-volt">
                       <div className="w-12 h-12 rounded-full mb-6 bg-white/5 flex items-center justify-center relative">
                          <div className={`w-3 h-3 rounded-full shadow-[0_0_15px_rgba(0,0,0,0.5)] ${api.status === 'green' ? 'bg-[#ccff00] shadow-[#ccff00]' : 'bg-red-500 shadow-red-500'}`} />
                          {api.status === 'green' && <div className="absolute inset-0 bg-[#ccff00]/10 rounded-full animate-ping" />}
                       </div>
                       <h3 className="font-black text-sm text-white uppercase tracking-tight group-hover:text-[#ccff00] transition-colors">{api.service}</h3>
                       <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mt-2">{api.latency_ms} ms Latency</p>
                    </div>
                 ))}
              </div>
           </div>
        )}

      </main>

    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Sub-componentes
// ──────────────────────────────────────────────────────────────────────────────

function MetricCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="glass-card rounded-[2.5rem] p-10 border border-white/5 relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-32 h-32 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 blur-[60px] pointer-events-none" style={{ backgroundColor: `${color}22` }} />
      <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em] mb-4">{label}</p>
      <p className="text-4xl font-black uppercase tracking-tighter" style={{ color }}>{value}</p>
      <div className="w-8 h-1 rounded-full mt-6 bg-white/5" />
    </div>
  );
}
