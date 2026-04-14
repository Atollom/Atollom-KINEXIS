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

      // Defense-in-depth: verify atollom_admin role client-side
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

      // Cargar tenants
      const { data: tenantData } = await supabase.from("tenant_profiles").select("*");
      // Mapeamos a nuestro tipo con valores por defecto si no existen las columnas de facturación aún
      const loadedTenants: TenantProfile[] = (tenantData || []).map((t: any) => ({
        tenant_id: t.tenant_id,
        business_name: t.business_name || "Desconocido",
        rfc: t.rfc || "N/A",
        plan: t.plan || "Pro",
        active_modules: ["ecommerce", "erp", "crm"],
        system_status: (Math.random() > 0.9 ? "yellow" : Math.random() > 0.95 ? "red" : "green") as any,
        last_login: t.updated_at || t.created_at,
        created_at: t.created_at,
        mrr: t.plan === "Starter" ? 99 : t.plan === "Growth" ? 299 : 599,
      }));
      setTenants(loadedTenants);

      // Métricas globales
      const starterCount = loadedTenants.filter(t => t.plan === "Starter").length;
      const growthCount = loadedTenants.filter(t => t.plan === "Growth").length;
      const proCount = loadedTenants.filter(t => t.plan === "Pro").length;
      const totalMrr = loadedTenants.reduce((sum, t) => sum + t.mrr, 0);

      setMetrics({
        mrr_total: totalMrr,
        customers_by_plan: { Starter: starterCount, Growth: growthCount, Pro: proCount },
        churn_rate: 2.4, // % mock
        total_alerts: loadedTenants.filter(t => t.system_status !== "green").length,
      });

      // Cargar tickets de todos los tenants
      const { data: ticketData } = await supabase
        .from("support_tickets")
        .select("*, tenant_profiles(business_name)")
        .order("created_at", { ascending: false });

      if (ticketData) {
        setTickets(ticketData.map((t: any) => ({
          ...t,
          business_name: t.tenant_profiles?.business_name || t.tenant_id.substring(0,8)
        })));
      }

      // Cargar logs
      const { data: logData } = await supabase
        .from("config_change_log")
        .select("*, tenant_profiles(business_name)")
        .order("created_at", { ascending: false })
        .limit(100);
      
      if (logData) {
        setLogs(logData.map((l: any) => ({
          ...l,
          business_name: l.tenant_profiles?.business_name || l.tenant_id.substring(0,8)
        })));
      }

      // Simular estatus de APIs externas (esto idealmente viene de un endpoint de health real)
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
  }, [supabase]);

  // Alerta WhatsApp superadmin — usa /api/atollom/notify (endpoint dedicado, no /api/meta)
  const notifySuperadmin = async (message: string, severity: "info" | "high" | "critical" = "info") => {
    try {
      const res = await fetch('/api/atollom/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, severity })
      });
      if (res.ok) {
        alert("Notificación enviada a WhatsApp (+52 5646060947)");
      } else {
        alert("Error enviando notificación WhatsApp");
      }
    } catch {
      alert("Error enviando notificación WhatsApp");
    }
  };

  const escalateTicket = async (ticketId: string) => {
    const ticket = tickets.find(t => t.id === ticketId);
    setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: "escalated" } : t));
    // WhatsApp solo para tickets críticos
    if (ticket?.priority === "critical") {
      await notifySuperadmin(
        `Ticket crítico escalado: ${ticketId} — ${ticket.subject}`,
        "critical"
      );
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-full bg-[#0D1B3E] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-[#A8E63D] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="h-screen w-full bg-[#0D1B3E] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#EF4444] text-xl font-bold mb-2">Acceso Prohibido</p>
          <p className="text-[#8DA4C4] text-sm">Solo el Superadministrador Atollom puede acceder a este panel.</p>
        </div>
      </div>
    );
  }

  // Filtrado de logs
  const filteredLogs = logs.filter(l => {
    if (logFilterTenant !== "all" && l.tenant_id !== logFilterTenant) return false;
    if (logFilterDate && !l.created_at.startsWith(logFilterDate)) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-[#0D1B3E] text-[#E8EAF0] p-6 pb-20">
      
      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#A8E63D] to-[#22C55E] flex items-center justify-center shadow-[0_0_20px_#A8E63D30]">
            <span className="text-[#0D1B3E] font-headline font-bold text-xl">A</span>
          </div>
          <div>
            <h1 className="text-2xl font-headline font-bold">Atollom Control</h1>
            <p className="text-[11px] text-[#A8E63D] uppercase tracking-widest font-bold">Panel de Superadministrador</p>
          </div>
        </div>

        {/* Global Action */}
        <button 
          onClick={() => notifySuperadmin("Prueba de conectividad desde panel Atollom.")}
          className="flex items-center gap-2 px-4 py-2 bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all"
        >
          <span className="material-symbols-outlined text-[14px]">notifications_active</span>
          Test WhatsApp
        </button>
      </header>

      {/* ── Menu Superior ───────────────────────────────────────── */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 border-b border-white/[0.06]">
        {[
          { id: "clients", label: "Clientes Activos", icon: "domain" },
          { id: "metrics", label: "Métricas Globales", icon: "analytics" },
          { id: "support", label: "Centro de Soporte", icon: "support_agent" },
          { id: "logs", label: "Logs de Configuración", icon: "list_alt" },
          { id: "system", label: "Sistema & APIs", icon: "memory" },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as PanelTab)}
            className={`
              flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-[11px] font-bold uppercase tracking-wider
              transition-all duration-200 whitespace-nowrap
              ${activeTab === tab.id
                ? "bg-white/[0.06] text-[#A8E63D] border-b-2 border-[#A8E63D]"
                : "text-[#8DA4C4] hover:text-[#E8EAF0] hover:bg-white/[0.03]"
              }
            `}
          >
            <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════════
          SECCIÓN 1: CLIENTES ACTIVOS
          ═══════════════════════════════════════════════════════════ */}
      {activeTab === "clients" && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
              <p className="text-[10px] text-[#8DA4C4] uppercase tracking-wider mb-1">Total Clientes</p>
              <p className="text-2xl font-headline font-bold">{tenants.length}</p>
            </div>
            <div className="bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-xl p-4">
              <p className="text-[10px] text-[#EF4444] uppercase tracking-wider mb-1">Sistemas en Riesgo</p>
              <p className="text-2xl font-headline font-bold text-[#EF4444]">
                {tenants.filter(t => t.system_status === "red").length}
              </p>
            </div>
            <div className="bg-[#A8E63D]/10 border border-[#A8E63D]/20 rounded-xl p-4">
              <p className="text-[10px] text-[#A8E63D] uppercase tracking-wider mb-1">Crecimiento (Mes)</p>
              <p className="text-2xl font-headline font-bold text-[#A8E63D]">+12.4%</p>
            </div>
          </div>

          <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-white/[0.04]">
                <tr>
                  <th className="px-4 py-3 text-[10px] font-bold text-[#8DA4C4] uppercase tracking-wider">Empresa</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-[#8DA4C4] uppercase tracking-wider">Plan</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-[#8DA4C4] uppercase tracking-wider text-center">Estado Sist.</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-[#8DA4C4] uppercase tracking-wider">Módulos</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-[#8DA4C4] uppercase tracking-wider">Creado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {tenants.map(t => (
                  <tr key={t.tenant_id} className="hover:bg-white/[0.03]">
                    <td className="px-4 py-3">
                      <p className="font-bold text-[13px] text-[#E8EAF0]">{t.business_name}</p>
                      <p className="text-[10px] text-[#8DA4C4] font-mono">{t.rfc}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded object-cover ${
                        t.plan === 'Pro' ? 'bg-[#8B5CF6]/20 text-[#A855F7]' : 'bg-white/[0.06] text-[#8DA4C4]'
                      }`}>
                        {t.plan}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="w-3 h-3 rounded-full inline-block" style={{
                        backgroundColor: t.system_status === "green" ? "#22C55E" : t.system_status === "yellow" ? "#F59E0B" : "#EF4444",
                        boxShadow: `0 0 10px ${t.system_status === "green" ? "#22C55E80" : t.system_status === "yellow" ? "#F59E0B80" : "#EF444480"}`
                      }} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {t.active_modules.map(mod => (
                          <span key={mod} className="text-[8px] bg-white/[0.08] text-[#E8EAF0] px-1.5 py-0.5 rounded uppercase font-bold">
                            {mod.substring(0,3)}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[11px] text-[#506584]">
                      {new Date(t.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          SECCIÓN 2: MÉTRICAS GLOBALES
          ═══════════════════════════════════════════════════════════ */}
      {activeTab === "metrics" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6">
              <p className="text-[11px] text-[#8DA4C4] uppercase tracking-wider mb-2">MRR Total</p>
              <p className="text-4xl font-headline font-bold text-[#A8E63D]">${metrics.mrr_total.toLocaleString()}</p>
            </div>
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6">
              <p className="text-[11px] text-[#8DA4C4] uppercase tracking-wider mb-2">Churn Rate</p>
              <p className="text-4xl font-headline font-bold text-[#EF4444]">{metrics.churn_rate}%</p>
            </div>
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 col-span-2 flex flex-col justify-center">
              <p className="text-[11px] text-[#8DA4C4] uppercase tracking-wider mb-4">Clientes por Plan</p>
              <div className="flex gap-2 w-full h-8 rounded-lg overflow-hidden">
                <div style={{ width: `${(metrics.customers_by_plan.Pro/tenants.length)*100}%` }} className="bg-[#8B5CF6] flex items-center justify-center text-[10px] font-bold">PRO</div>
                <div style={{ width: `${(metrics.customers_by_plan.Growth/tenants.length)*100}%` }} className="bg-[#3B82F6] flex items-center justify-center text-[10px] font-bold">GRO</div>
                <div style={{ width: `${(metrics.customers_by_plan.Starter/tenants.length)*100}%` }} className="bg-[#506584] flex items-center justify-center text-[10px] font-bold">STA</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          SECCIÓN 3: CENTRO DE SOPORTE (ESCALADOS)
          ═══════════════════════════════════════════════════════════ */}
      {activeTab === "support" && (
        <div className="animate-in fade-in duration-300">
          <p className="text-[#8DA4C4] text-[13px] mb-4">
            Tickets levantados por los tenants. Usa "Escalar" para requerir intervención técnica del core team Kinexis.
          </p>

          <div className="grid gap-3">
            {tickets.length === 0 ? (
              <p className="text-[#506584] text-center py-10">No hay tickets activos</p>
            ) : (
              tickets.map(t => (
                <div key={t.id} className={`p-4 rounded-xl border flex items-center justify-between ${
                  t.status === "escalated" ? "bg-red-500/10 border-red-500/30" : "bg-white/[0.03] border-white/[0.06]"
                }`}>
                  <div>
                    <h3 className="text-[13px] font-bold text-[#E8EAF0]">{t.subject}</h3>
                    <p className="text-[11px] text-[#8DA4C4] mt-1">{t.business_name} <span className="text-[#506584]">| ID: {t.tenant_id}</span></p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded ${
                      t.priority === "critical" ? "bg-red-500/20 text-red-400" : "bg-white/[0.06] text-[#8DA4C4]"
                    }`}>
                      {t.priority}
                    </span>
                    {t.status !== "escalated" ? (
                      <button 
                        onClick={() => escalateTicket(t.id)}
                        className="px-4 py-2 bg-[#EF4444] text-white text-[10px] font-bold uppercase rounded-lg hover:shadow-[0_0_15px_#EF444450] transition-all"
                      >
                        Escalar
                      </button>
                    ) : (
                      <span className="text-[10px] font-bold text-red-500 flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">warning</span> EscALADO
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          SECCIÓN 4: LOG DE CONFIGURACIONES
          ═══════════════════════════════════════════════════════════ */}
      {activeTab === "logs" && (
        <div className="flex flex-col h-[600px] animate-in fade-in duration-300">
          <div className="flex gap-2 mb-4">
            <select 
              value={logFilterTenant} onChange={e => setLogFilterTenant(e.target.value)}
              className="bg-[#0D1B3E] border border-white/[0.08] text-[12px] px-3 py-2 rounded-xl text-[#E8EAF0]"
            >
              <option value="all">Todos los Tenants</option>
              {tenants.map(t => <option key={t.tenant_id} value={t.tenant_id}>{t.business_name}</option>)}
            </select>
            <input 
              type="date"
              value={logFilterDate} onChange={e => setLogFilterDate(e.target.value)}
              className="bg-[#0D1B3E] border border-white/[0.08] text-[12px] px-3 py-2 rounded-xl text-[#E8EAF0]"
            />
          </div>

          <div className="flex-1 overflow-y-auto bg-white/[0.02] border border-white/[0.06] rounded-2xl">
            <table className="w-full text-left text-[11px]">
              <thead className="bg-white/[0.04] sticky top-0 backdrop-blur-md">
                <tr>
                  <th className="px-4 py-3 font-bold text-[#8DA4C4] w-32">Fecha/Hora</th>
                  <th className="px-4 py-3 font-bold text-[#8DA4C4]">Tenant</th>
                  <th className="px-4 py-3 font-bold text-[#8DA4C4]">Campo Modificado</th>
                  <th className="px-4 py-3 font-bold text-[#8DA4C4]">Antes</th>
                  <th className="px-4 py-3 font-bold text-[#8DA4C4]">Después</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filteredLogs.map(l => (
                  <tr key={l.id} className="hover:bg-white/[0.03]">
                    <td className="px-4 py-3 text-[#506584]">{new Date(l.created_at).toLocaleString('es-MX')}</td>
                    <td className="px-4 py-3 text-[#A8E63D]">{l.business_name}</td>
                    <td className="px-4 py-3 font-mono text-[#8DA4C4]">{l.field}</td>
                    <td className="px-4 py-3 text-red-400 font-mono line-through opacity-70">
                      {l.field.startsWith("vault.") ? "[REDACTED]" : l.previous_value}
                    </td>
                    <td className="px-4 py-3 text-green-400 font-mono">
                      {l.field.startsWith("vault.") ? "[REDACTED]" : l.new_value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          SECCIÓN 5: VARIABLES Y APIS DEL SISTEMA
          ═══════════════════════════════════════════════════════════ */}
      {activeTab === "system" && (
        <div className="animate-in fade-in duration-300">
          <h2 className="text-lg font-headline font-bold mb-4">Estado Infraestructura Externa</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {apiStatuses.map(api => (
              <div key={api.service} className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-[13px]">{api.service}</h3>
                  <p className="text-[10px] text-[#506584]">Latencia: {api.latency_ms}ms</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-white/[0.05] flex items-center justify-center">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: api.status === 'green' ? '#22C55E' : '#EF4444' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
