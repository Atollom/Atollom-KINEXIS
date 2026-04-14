// src/dashboard/app/crm/page.tsx
// CRM completo: Pipeline Leads + Tickets soporte + NPS + Cotizaciones
"use client";

import { useCallback, useEffect, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";
import { useLeads } from "@/hooks/useLeads";
import type { Lead, LeadStage, UserRole } from "@/types";

// ──────────────────────────────────────────────────────────────────────────────
// Tipos locales
// ──────────────────────────────────────────────────────────────────────────────
interface SupportTicket {
  id: string;
  subject: string;
  customer_name: string;
  priority: "low" | "medium" | "high" | "critical";
  status: "open" | "in_progress" | "resolved";
  created_at: string;
}

interface NPSResponse {
  id: string;
  customer_name: string;
  score: number;
  comment: string;
  created_at: string;
}

interface Quote {
  id: string;
  lead_name: string;
  total: number;
  status: "pending" | "approved" | "rejected";
  created_at: string;
}

// ──────────────────────────────────────────────────────────────────────────────
// Constantes
// ──────────────────────────────────────────────────────────────────────────────
const STAGES: { id: LeadStage; label: string; color: string; borderColor: string }[] = [
  { id: "new",         label: "Nuevo",      color: "#A8E63D", borderColor: "border-[#A8E63D]/30" },
  { id: "contacted",   label: "Contactado", color: "#3B82F6", borderColor: "border-[#3B82F6]/30" },
  { id: "quote_sent",  label: "Cotizado",   color: "#F59E0B", borderColor: "border-[#F59E0B]/30" },
  { id: "negotiating", label: "Negociando", color: "#8B5CF6", borderColor: "border-[#8B5CF6]/30" },
  { id: "won",         label: "Ganado",     color: "#22C55E", borderColor: "border-[#22C55E]/30" },
  { id: "lost",        label: "Perdido",    color: "#506584", borderColor: "border-[#506584]/30" },
];

const PRIORITY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  critical: { label: "Crítica",  color: "#EF4444", bg: "bg-red-500/10" },
  high:     { label: "Alta",     color: "#F59E0B", bg: "bg-amber-500/10" },
  medium:   { label: "Media",    color: "#3B82F6", bg: "bg-blue-500/10" },
  low:      { label: "Baja",     color: "#506584", bg: "bg-gray-500/10" },
};

type CRMTab = "pipeline" | "tickets" | "nps" | "quotes";

// ──────────────────────────────────────────────────────────────────────────────
// Componente principal
// ──────────────────────────────────────────────────────────────────────────────
export default function CRMPage() {
  const { leads, isLoading: leadsLoading } = useLeads();
  const [activeTab, setActiveTab] = useState<CRMTab>("pipeline");
  const [role, setRole] = useState<UserRole | null>(null);
  const [tenantId, setTenantId] = useState<string | null>(null);

  // Estado para tickets, NPS y cotizaciones
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [npsResponses, setNpsResponses] = useState<NPSResponse[]>([]);
  const [npsAverage, setNpsAverage] = useState<number>(0);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvingQuote, setApprovingQuote] = useState<string | null>(null);

  const supabase = createBrowserSupabaseClient();

  // Cargar datos del usuario y módulos auxiliares
  useEffect(() => {
    async function loadData() {
      setLoading(true);

      // Obtener rol del usuario
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("role, tenant_id")
          .eq("id", user.id)
          .single();
        if (profile?.role) setRole(profile.role as UserRole);
        if (profile?.tenant_id) setTenantId(profile.tenant_id);

        if (profile?.tenant_id) {
          // Cargar tickets de soporte
          const { data: ticketData } = await supabase
            .from("support_tickets")
            .select("*")
            .eq("tenant_id", profile.tenant_id)
            .in("status", ["open", "in_progress"])
            .order("created_at", { ascending: false })
            .limit(20);
          if (ticketData) setTickets(ticketData);

          // Cargar respuestas NPS recientes
          const { data: npsData } = await supabase
            .from("nps_responses")
            .select("*")
            .eq("tenant_id", profile.tenant_id)
            .order("created_at", { ascending: false })
            .limit(10);
          if (npsData) {
            setNpsResponses(npsData);
            if (npsData.length > 0) {
              const avg = npsData.reduce((sum: number, r: NPSResponse) => sum + r.score, 0) / npsData.length;
              setNpsAverage(Math.round(avg * 10) / 10);
            }
          }

          // Cargar cotizaciones pendientes
          const { data: quoteData } = await supabase
            .from("quotes")
            .select("*")
            .eq("tenant_id", profile.tenant_id)
            .eq("status", "pending")
            .order("created_at", { ascending: false });
          if (quoteData) setQuotes(quoteData);
        }
      }

      setLoading(false);
    }
    loadData();
  }, [supabase]);

  // Aprobar cotización — solo owner y socia (no admin)
  const handleApproveQuote = useCallback(async (quoteId: string) => {
    // RBAC: solo owner y socia pueden aprobar cotizaciones
    if (role !== "owner" && role !== "socia") return;
    // Tenant isolation: tenantId requerido
    if (!tenantId) return;
    setApprovingQuote(quoteId);
    try {
      const { error } = await supabase
        .from("quotes")
        .update({ status: "approved", updated_at: new Date().toISOString() })
        .eq("id", quoteId)
        .eq("tenant_id", tenantId);  // IDOR fix: tenant isolation en UPDATE
      if (!error) {
        setQuotes(prev => prev.filter(q => q.id !== quoteId));
      }
    } catch {
      // Error silencioso — el usuario verá que no se actualiza
    } finally {
      setApprovingQuote(null);
    }
  }, [supabase, role, tenantId]);

  // Filtrar leads por stage
  const getLeadsByStage = (stage: LeadStage): Lead[] =>
    (leads || []).filter(l => l.deal_stage === stage);

  // Tabs
  const tabs: { id: CRMTab; label: string; icon: string; count?: number }[] = [
    { id: "pipeline", label: "Pipeline",     icon: "filter_alt", count: (leads || []).length },
    { id: "tickets",  label: "Soporte",      icon: "support_agent", count: tickets.length },
    { id: "nps",      label: "NPS",          icon: "sentiment_satisfied" },
    { id: "quotes",   label: "Cotizaciones", icon: "request_quote", count: quotes.length },
  ];

  return (
    <div className="px-4 md:px-6 py-6 h-[calc(100vh-64px)] overflow-hidden flex flex-col">
      {/* ── Header ──────────────────────────────────────────────── */}
      <header className="mb-5 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#F59E0B]/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-[#F59E0B] text-lg">group</span>
          </div>
          <div>
            <h1 className="text-2xl font-headline font-bold text-[#E8EAF0]">CRM</h1>
            <p className="text-[11px] text-[#8DA4C4]">Gestión de Prospectos & Soporte</p>
          </div>
        </div>

        {/* Resumen KPIs */}
        <div className="hidden md:flex items-center gap-3">
          <div className="bg-white/[0.04] rounded-xl px-4 py-2 text-center">
            <p className="text-[9px] text-[#8DA4C4] uppercase tracking-wider">Leads</p>
            <p className="text-lg font-headline font-bold text-[#E8EAF0]">{(leads || []).length}</p>
          </div>
          <div className="bg-white/[0.04] rounded-xl px-4 py-2 text-center">
            <p className="text-[9px] text-[#8DA4C4] uppercase tracking-wider">Tickets</p>
            <p className="text-lg font-headline font-bold text-[#F59E0B]">{tickets.length}</p>
          </div>
          <div className="bg-white/[0.04] rounded-xl px-4 py-2 text-center">
            <p className="text-[9px] text-[#8DA4C4] uppercase tracking-wider">NPS</p>
            <p className="text-lg font-headline font-bold text-[#22C55E]">{npsAverage || "—"}</p>
          </div>
        </div>
      </header>

      {/* ── Tabs ─────────────────────────────────────────────────── */}
      <div className="flex gap-1 mb-4 overflow-x-auto pb-1 flex-shrink-0 border-b border-white/[0.06]">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex items-center gap-2 px-4 py-2.5 rounded-t-xl
              text-[11px] font-bold uppercase tracking-wider whitespace-nowrap
              transition-all duration-200
              ${activeTab === tab.id
                ? "bg-white/[0.06] text-[#F59E0B] border-b-2 border-[#F59E0B]"
                : "text-[#8DA4C4] hover:text-[#E8EAF0] hover:bg-white/[0.03]"
              }
            `}
          >
            <span className="material-symbols-outlined text-sm">{tab.icon}</span>
            {tab.label}
            {tab.count !== undefined && (
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                activeTab === tab.id ? "bg-[#F59E0B]/20 text-[#F59E0B]" : "bg-white/[0.06]"
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════════
          TAB: Pipeline de Leads
          ═══════════════════════════════════════════════════════════ */}
      {activeTab === "pipeline" && (
        <div className="flex-1 overflow-x-auto pb-4">
          <div className="flex gap-3 h-full min-w-[1100px]">
            {STAGES.map((stage) => {
              const stageLeads = getLeadsByStage(stage.id);
              return (
                <div key={stage.id} className="flex-1 min-w-[180px] flex flex-col h-full bg-white/[0.02] rounded-2xl border border-white/[0.04]">
                  {/* Encabezado de columna */}
                  <div className={`p-3.5 border-l-3 ${stage.borderColor} rounded-t-2xl flex items-center justify-between border-b border-white/[0.04]`}>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: stage.color }} />
                      <h3 className="text-[11px] font-bold text-[#E8EAF0] uppercase tracking-wider">{stage.label}</h3>
                    </div>
                    <span className="text-[10px] text-[#8DA4C4] bg-white/[0.06] px-2 py-0.5 rounded-full font-bold">
                      {stageLeads.length}
                    </span>
                  </div>

                  {/* Cards de leads */}
                  <div className="p-2.5 flex-1 overflow-y-auto space-y-2">
                    {leadsLoading ? (
                      [1, 2, 3].map(i => <div key={i} className="h-24 bg-white/[0.04] rounded-xl animate-pulse" />)
                    ) : stageLeads.length === 0 ? (
                      <div className="h-32 flex items-center justify-center border border-dashed border-white/[0.06] rounded-xl">
                        <p className="text-[10px] text-[#506584] uppercase tracking-widest">Vacío</p>
                      </div>
                    ) : (
                      stageLeads.map((lead) => {
                        const scoreColor =
                          lead.score > 7 ? "#A8E63D" :
                          lead.score >= 4 ? "#F59E0B" :
                          "#EF4444";
                        const isLost = lead.deal_stage === "lost";

                        return (
                          <div
                            key={lead.lead_id}
                            className={`
                              bg-white/[0.04] hover:bg-white/[0.07] transition-all
                              p-3.5 rounded-xl border border-white/[0.04]
                              cursor-pointer group
                              ${isLost ? "opacity-40 grayscale" : ""}
                            `}
                          >
                            {/* Nombre y score */}
                            <div className="flex items-start justify-between mb-1.5">
                              <p className="text-[12px] font-bold text-[#E8EAF0] group-hover:text-[#A8E63D] transition-colors truncate pr-2">
                                {lead.name}
                              </p>
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: scoreColor }} />
                                <span className="text-[10px] font-bold" style={{ color: scoreColor }}>{lead.score}</span>
                              </div>
                            </div>

                            {/* Empresa */}
                            <p className="text-[10px] text-[#8DA4C4] truncate mb-3">{lead.company}</p>

                            {/* Canal y valor */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5 text-[#506584]">
                                <span className="material-symbols-outlined text-[12px]">
                                  {lead.channel === "whatsapp" ? "chat" : lead.channel === "instagram" ? "photo_camera" : "language"}
                                </span>
                                <span className="text-[9px] uppercase">{lead.channel}</span>
                              </div>
                              {lead.value && (
                                <span className="text-[11px] font-bold font-headline text-[#E8EAF0]">
                                  ${lead.value.toLocaleString()}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          TAB: Tickets de Soporte
          ═══════════════════════════════════════════════════════════ */}
      {activeTab === "tickets" && (
        <div className="flex-1 overflow-y-auto space-y-2">
          {loading ? (
            [1, 2, 3].map(i => <div key={i} className="h-20 bg-white/[0.04] rounded-xl animate-pulse" />)
          ) : tickets.length === 0 ? (
            <EmptyState icon="support_agent" message="Sin tickets de soporte abiertos" />
          ) : (
            tickets.map((ticket) => {
              const pConfig = PRIORITY_CONFIG[ticket.priority] || PRIORITY_CONFIG.low;
              return (
                <div
                  key={ticket.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className={`w-8 h-8 rounded-lg ${pConfig.bg} flex items-center justify-center flex-shrink-0`}>
                      <span className="material-symbols-outlined text-sm" style={{ color: pConfig.color }}>
                        {ticket.priority === "critical" ? "error" : "confirmation_number"}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[12px] font-bold text-[#E8EAF0] truncate">{ticket.subject}</p>
                      <p className="text-[10px] text-[#8DA4C4] truncate">{ticket.customer_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                    <span
                      className="text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-full"
                      style={{ color: pConfig.color, backgroundColor: `${pConfig.color}15` }}
                    >
                      {pConfig.label}
                    </span>
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${
                      ticket.status === "in_progress"
                        ? "text-[#3B82F6] bg-[#3B82F6]/10"
                        : "text-[#F59E0B] bg-[#F59E0B]/10"
                    }`}>
                      {ticket.status === "in_progress" ? "En curso" : "Abierto"}
                    </span>
                    <span className="text-[10px] text-[#506584]">
                      {new Date(ticket.created_at).toLocaleDateString("es-MX", { day: "2-digit", month: "short" })}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          TAB: NPS Score
          ═══════════════════════════════════════════════════════════ */}
      {activeTab === "nps" && (
        <div className="flex-1 overflow-y-auto space-y-4">
          {/* Score promedio grande */}
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 flex items-center gap-8">
            <div className="text-center">
              <p className="text-[10px] text-[#8DA4C4] uppercase tracking-wider mb-1">NPS Promedio</p>
              <p className={`text-5xl font-headline font-bold ${
                npsAverage >= 8 ? "text-[#22C55E]" :
                npsAverage >= 6 ? "text-[#F59E0B]" :
                "text-[#EF4444]"
              }`}>
                {npsAverage || "—"}
              </p>
              <p className="text-[9px] text-[#506584] mt-1">de 10 · {npsResponses.length} respuestas</p>
            </div>

            {/* Distribución visual */}
            <div className="flex-1 grid grid-cols-3 gap-4">
              {[
                { label: "Promotores", range: "9-10", count: npsResponses.filter(r => r.score >= 9).length, color: "#22C55E" },
                { label: "Pasivos",    range: "7-8",  count: npsResponses.filter(r => r.score >= 7 && r.score < 9).length, color: "#F59E0B" },
                { label: "Detractores", range: "0-6", count: npsResponses.filter(r => r.score < 7).length, color: "#EF4444" },
              ].map(cat => (
                <div key={cat.label} className="text-center bg-white/[0.03] rounded-xl p-3">
                  <p className="text-lg font-headline font-bold" style={{ color: cat.color }}>{cat.count}</p>
                  <p className="text-[9px] text-[#8DA4C4] uppercase tracking-wider">{cat.label}</p>
                  <p className="text-[8px] text-[#506584]">{cat.range}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Últimas respuestas */}
          <div className="space-y-2">
            <p className="text-[11px] text-[#8DA4C4] uppercase tracking-wider font-bold mb-2">Últimas respuestas</p>
            {loading ? (
              [1, 2, 3].map(i => <div key={i} className="h-16 bg-white/[0.04] rounded-xl animate-pulse" />)
            ) : npsResponses.length === 0 ? (
              <EmptyState icon="sentiment_satisfied" message="Sin respuestas NPS aún" />
            ) : (
              npsResponses.map(resp => (
                <div key={resp.id} className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-bold font-headline text-sm"
                    style={{
                      backgroundColor: `${resp.score >= 9 ? "#22C55E" : resp.score >= 7 ? "#F59E0B" : "#EF4444"}15`,
                      color: resp.score >= 9 ? "#22C55E" : resp.score >= 7 ? "#F59E0B" : "#EF4444",
                    }}
                  >
                    {resp.score}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-bold text-[#E8EAF0]">{resp.customer_name}</p>
                    <p className="text-[11px] text-[#8DA4C4] truncate italic">{resp.comment || "Sin comentario"}</p>
                  </div>
                  <span className="text-[10px] text-[#506584] flex-shrink-0">
                    {new Date(resp.created_at).toLocaleDateString("es-MX", { day: "2-digit", month: "short" })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          TAB: Cotizaciones pendientes
          ═══════════════════════════════════════════════════════════ */}
      {activeTab === "quotes" && (
        <div className="flex-1 overflow-y-auto space-y-2">
          {loading ? (
            [1, 2].map(i => <div key={i} className="h-20 bg-white/[0.04] rounded-xl animate-pulse" />)
          ) : quotes.length === 0 ? (
            <EmptyState icon="request_quote" message="Sin cotizaciones pendientes" />
          ) : (
            quotes.map(quote => {
              const canApprove = role === "owner" || role === "socia";
              return (
                <div
                  key={quote.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-[#F59E0B]/10 flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-sm text-[#F59E0B]">request_quote</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[12px] font-bold text-[#E8EAF0] truncate">{quote.lead_name}</p>
                      <p className="text-[10px] text-[#8DA4C4]">
                        {new Date(quote.created_at).toLocaleDateString("es-MX")}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 flex-shrink-0 ml-4">
                    <span className="text-lg font-headline font-bold text-[#E8EAF0]">
                      ${quote.total.toLocaleString("es-MX")}
                    </span>

                    {canApprove && (
                      <button
                        onClick={() => handleApproveQuote(quote.id)}
                        disabled={approvingQuote === quote.id}
                        className="
                          px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider
                          bg-[#A8E63D] text-[#0D1B3E]
                          hover:shadow-[0_0_12px_#A8E63D40]
                          disabled:opacity-40
                          transition-all duration-200
                          flex items-center gap-1.5
                        "
                      >
                        {approvingQuote === quote.id ? (
                          <span className="material-symbols-outlined text-sm animate-spin">sync</span>
                        ) : (
                          <span className="material-symbols-outlined text-sm">check</span>
                        )}
                        Aprobar
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

// ── Componente auxiliar: estado vacío ────────────────────────────
function EmptyState({ icon, message }: { icon: string; message: string }) {
  return (
    <div className="py-16 text-center bg-white/[0.02] rounded-2xl border border-dashed border-white/[0.06]">
      <span className="material-symbols-outlined text-4xl text-[#506584] mb-3 block opacity-40">{icon}</span>
      <p className="text-[12px] text-[#8DA4C4]">{message}</p>
    </div>
  );
}
