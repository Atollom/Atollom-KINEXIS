"use client";

import { useCallback, useEffect, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";
import { useLeads } from "@/hooks/useLeads";
import type { Lead, LeadStage, UserRole } from "@/types";

// ──────────────────────────────────────────────────────────────────────────────
// Types & Constants
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

const STAGES: { id: LeadStage; label: string; color: string }[] = [
  { id: "new",         label: "Nuevo",      color: "#ccff00" },
  { id: "contacted",   label: "Contactado", color: "#3B82F6" },
  { id: "quote_sent",  label: "Cotizado",   color: "#F59E0B" },
  { id: "negotiating", label: "Negociando", color: "#8B5CF6" },
  { id: "won",         label: "Ganado",     color: "#22C55E" },
  { id: "lost",        label: "Perdido",    color: "#506584" },
];

type CRMTab = "pipeline" | "tickets" | "nps" | "quotes";

// ──────────────────────────────────────────────────────────────────────────────
// Main CRM Component
// ──────────────────────────────────────────────────────────────────────────────

export default function CRMPage() {
  const { leads, isLoading: leadsLoading } = useLeads();
  const [activeTab, setActiveTab] = useState<CRMTab>("pipeline");
  const [role, setRole] = useState<UserRole | null>(null);
  const [tenantId, setTenantId] = useState<string | null>(null);

  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [npsResponses, setNpsResponses] = useState<NPSResponse[]>([]);
  const [npsAverage, setNpsAverage] = useState<number>(0);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvingQuote, setApprovingQuote] = useState<string | null>(null);

  const supabase = createBrowserSupabaseClient();

  useEffect(() => {
    async function loadData() {
      setLoading(true);
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
          const { data: ticketData } = await supabase
            .from("support_tickets")
            .select("*")
            .eq("tenant_id", profile.tenant_id)
            .in("status", ["open", "in_progress"])
            .order("created_at", { ascending: false })
            .limit(20);
          if (ticketData) setTickets(ticketData);

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

  const handleApproveQuote = useCallback(async (quoteId: string) => {
    if (role !== "owner" && role !== "socia") return;
    if (!tenantId) return;
    setApprovingQuote(quoteId);
    try {
      const { error } = await supabase
        .from("quotes")
        .update({ status: "approved", updated_at: new Date().toISOString() })
        .eq("id", quoteId)
        .eq("tenant_id", tenantId);
      if (!error) {
        setQuotes(prev => prev.filter(q => q.id !== quoteId));
      }
    } finally {
      setApprovingQuote(null);
    }
  }, [supabase, role, tenantId]);

  const getLeadsByStage = (stage: LeadStage): Lead[] =>
    (leads || []).filter(l => l.deal_stage === stage);

  return (
    <div className="space-y-12 animate-luxe h-full flex flex-col">
      {/* Header Area */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 flex-shrink-0">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
             <span className="w-1.5 h-1.5 rounded-full bg-[#ccff00] animate-pulse" />
             <p className="text-[#ccff00] text-[10px] uppercase tracking-[0.3em] font-black opacity-80">
               RELATIONSHIP ENGINE / CRM HUB
             </p>
          </div>
          <h1 className="text-5xl md:text-6xl font-black tracking-[-0.05em] leading-none text-white">
            Prospectos <span className="text-[#ccff00]">&</span> Soporte
          </h1>
        </div>

        <div className="flex items-center gap-4">
           <div className="glass-card px-6 py-4 rounded-3xl flex items-center gap-4">
              <div className="text-center">
                 <p className="text-[9px] font-black text-white/30 uppercase">Open Leads</p>
                 <p className="text-xl font-black text-white">{(leads || []).length}</p>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="text-center">
                 <p className="text-[9px] font-black text-white/30 uppercase">NPS Score</p>
                 <p className="text-xl font-black text-[#ccff00]">{npsAverage || "9.2"}</p>
              </div>
           </div>
        </div>
      </header>

      {/* Tabs Menu */}
      <nav className="flex gap-2 p-1 bg-white/5 rounded-[1.5rem] w-fit flex-shrink-0">
         {[
           { id: 'pipeline', label: 'Pipeline', icon: 'filter_alt' },
           { id: 'tickets', label: 'Tickets', icon: 'support_agent' },
           { id: 'nps', label: 'NPS Score', icon: 'sentiment_satisfied' },
           { id: 'quotes', label: 'Quotes', icon: 'request_quote' },
         ].map(tab => (
           <button
             key={tab.id}
             onClick={() => setActiveTab(tab.id as CRMTab)}
             className={`
               flex items-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all
               ${activeTab === tab.id 
                 ? "bg-[#ccff00] text-black shadow-[0_0_20px_#ccff0033]" 
                 : "text-white/40 hover:text-white hover:bg-white/5"}
             `}
           >
             <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
             {tab.label}
           </button>
         ))}
      </nav>

      {/* Main Content Area */}
      <div className="flex-1 min-h-0">
        
        {/* PIPELINE VIEW */}
        {activeTab === "pipeline" && (
          <div className="h-full overflow-x-auto custom-scrollbar pb-8">
            <div className="flex gap-6 h-full min-w-max">
              {STAGES.map(stage => {
                const stageLeads = getLeadsByStage(stage.id);
                return (
                  <div key={stage.id} className="w-72 flex flex-col gap-4">
                    <div className="flex items-center justify-between px-4">
                       <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: stage.color }} />
                          <h3 className="text-[10px] font-black uppercase tracking-widest text-white/50 italic">{stage.label}</h3>
                       </div>
                       <span className="text-[9px] font-black text-white/20">{stageLeads.length}</span>
                    </div>
                    
                    <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar pr-2">
                       {stageLeads.map(lead => (
                         <div key={lead.lead_id} className="glass-card p-5 rounded-3xl border border-white/5 hover:border-[#ccff00]/30 hover:bg-white/[0.05] transition-all cursor-pointer group">
                            <div className="flex justify-between items-start mb-4">
                               <p className="text-xs font-black text-white group-hover:text-[#ccff00] transition-colors leading-tight truncate pr-2">{lead.name}</p>
                               <span className="text-[9px] font-black text-[#ccff00] px-2 py-0.5 bg-[#ccff00]/10 rounded-full">{lead.score}</span>
                            </div>
                            <p className="text-[10px] font-medium text-white/30 truncate mb-4">{lead.company}</p>
                            <div className="flex items-center justify-between">
                               <div className="flex items-center gap-1 text-white/20">
                                  <span className="material-symbols-outlined text-[12px]">
                                     {lead.channel === 'whatsapp' ? 'chat' : 'language'}
                                  </span>
                                  <span className="text-[8px] font-black uppercase tracking-tighter">{lead.channel}</span>
                               </div>
                               {lead.value && (
                                 <p className="text-[11px] font-black text-white italic">${lead.value.toLocaleString()}</p>
                               )}
                            </div>
                         </div>
                       ))}
                       {stageLeads.length === 0 && (
                         <div className="h-32 rounded-[2rem] border-2 border-dashed border-white/5 flex items-center justify-center">
                            <p className="text-[9px] font-black text-white/10 uppercase tracking-widest">No entries</p>
                         </div>
                       )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TICKETS VIEW */}
        {activeTab === "tickets" && (
          <div className="space-y-4">
            {tickets.map(ticket => (
              <div key={ticket.id} className="glass-card p-6 rounded-[2rem] flex items-center justify-between group hover:border-[#ccff00]/30 transition-all">
                <div className="flex items-center gap-6">
                   <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-white/5`}>
                      <span className="material-symbols-outlined text-white/20">confirmation_number</span>
                   </div>
                   <div>
                      <p className="text-xs font-black text-white">{ticket.subject}</p>
                      <p className="text-[10px] font-medium text-white/30 uppercase tracking-widest">{ticket.customer_name}</p>
                   </div>
                </div>
                <div className="flex items-center gap-8">
                   <div className="text-right">
                      <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">Priority</p>
                      <p className={`text-xs font-black italic ${ticket.priority === 'critical' ? 'text-red-400' : 'text-[#ccff00]'}`}>
                         {ticket.priority.toUpperCase()}
                      </p>
                   </div>
                   <button className="h-10 px-6 rounded-xl border border-white/10 text-[9px] font-black uppercase tracking-widest text-white/40 hover:text-white hover:border-[#ccff00]/30 transition-all">
                      Respond
                   </button>
                </div>
              </div>
            ))}
            {tickets.length === 0 && (
              <div className="py-20 text-center glass-card rounded-[2.5rem]">
                 <span className="material-symbols-outlined text-4xl text-white/10 mb-4 block">check_circle</span>
                 <p className="text-xs font-black text-white/20 uppercase tracking-widest">All tickets resolved</p>
              </div>
            )}
          </div>
        )}

        {/* NPS VIEW */}
        {activeTab === "nps" && (
           <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
             <div className="lg:col-span-4 glass-card p-8 rounded-[2.5rem] flex flex-col justify-center items-center gap-4 relative overflow-hidden">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 relative z-10">Global NPS Average</p>
                <p className="text-8xl font-black text-[#ccff00] italic tracking-tighter relative z-10">{npsAverage || "9.2"}</p>
                <div className="absolute -bottom-20 -right-20 w-48 h-48 bg-[#ccff00]/5 rounded-full blur-[100px]" />
             </div>
             
             <div className="lg:col-span-8 space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-4">Recent Feedback</h3>
                <div className="space-y-4">
                   {npsResponses.map(resp => (
                     <div key={resp.id} className="glass-card p-6 rounded-[2rem] flex items-center gap-6">
                        <div className="w-12 h-12 rounded-full border border-[#ccff00]/30 flex items-center justify-center">
                           <span className="text-xl font-black text-[#ccff00] italic">{resp.score}</span>
                        </div>
                        <div className="flex-1">
                           <p className="text-xs font-black text-white mb-1">{resp.customer_name}</p>
                           <p className="text-[11px] font-medium text-white/40 leading-relaxed italic">"{resp.comment || 'No comment provided.'}"</p>
                        </div>
                     </div>
                   ))}
                </div>
             </div>
           </div>
        )}

        {/* QUOTES VIEW */}
        {activeTab === "quotes" && (
          <div className="space-y-4">
            {quotes.map(quote => (
              <div key={quote.id} className="glass-card p-8 rounded-[2rem] flex items-center justify-between">
                <div className="flex items-center gap-6">
                   <div className="w-12 h-12 rounded-2xl bg-[#ccff00]/10 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[#ccff00]">receipt_long</span>
                   </div>
                   <div>
                      <p className="text-xs font-black text-white">{quote.lead_name}</p>
                      <p className="text-[10px] font-medium text-white/30">{new Date(quote.created_at).toLocaleDateString()}</p>
                   </div>
                </div>
                <div className="flex items-center gap-12">
                   <p className="text-3xl font-black text-white italic tracking-tighter">${quote.total.toLocaleString()}</p>
                   <button 
                     onClick={() => handleApproveQuote(quote.id)}
                     disabled={!!approvingQuote}
                     className="px-8 py-4 bg-[#ccff00] text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                   >
                     {approvingQuote === quote.id ? 'Processing...' : 'Approve & Send'}
                   </button>
                </div>
              </div>
            ))}
            {quotes.length === 0 && (
              <div className="py-20 text-center glass-card rounded-[2.5rem]">
                 <span className="material-symbols-outlined text-4xl text-white/10 mb-4 block">description</span>
                 <p className="text-xs font-black text-white/20 uppercase tracking-widest">No pending quotes</p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="h-20" />
    </div>
  );
}
