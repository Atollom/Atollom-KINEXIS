"use client";

import { useCallback, useEffect, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";
import { useConversations } from "@/hooks/useConversations";
import Image from "next/image";
import type { ConversationSummary, UserRole } from "@/types";

// ──────────────────────────────────────────────────────────────────────────────
// Tipos locales
// ──────────────────────────────────────────────────────────────────────────────
interface MetaAgentStatus {
  id: string;
  name: string;
  channel: "whatsapp" | "instagram";
  agent_status: "active" | "idle" | "error" | "paused";
  last_run?: string;
  success_rate: number;
}

type ChannelFilter = "all" | "whatsapp" | "instagram";

// ──────────────────────────────────────────────────────────────────────────────
// Constantes
// ──────────────────────────────────────────────────────────────────────────────
const INTENT_CONFIG: Record<string, { label: string; color: string }> = {
  venta:   { label: "Conversion", color: "#ccff00" },
  soporte: { label: "Support",    color: "#ffffff" },
  reclamo: { label: "Critical",   color: "#ef4444" },
  otro:    { label: "Auxiliary",  color: "#ffffff" },
  unknown: { label: "Unclassified", color: "#ffffff" },
};

const AGENT_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  active: { label: "ONLINE",  color: "#ccff00" },
  idle:   { label: "IDLE",    color: "#ffffff" },
  error:  { label: "FAULT",   color: "#ef4444" },
  paused: { label: "PAUSED",  color: "#ffffff" },
};

// ──────────────────────────────────────────────────────────────────────────────
// Componente principal
// ──────────────────────────────────────────────────────────────────────────────
export default function MetaPage() {
  const { conversations, isLoading } = useConversations();
  const [channelFilter, setChannelFilter] = useState<ChannelFilter>("all");
  const [selectedConv, setSelectedConv] = useState<ConversationSummary | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [agents, setAgents] = useState<MetaAgentStatus[]>([]);
  const [agentsLoading, setAgentsLoading] = useState(true);
  const [role, setRole] = useState<UserRole | null>(null);

  const supabase = createBrowserSupabaseClient();

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("user_profiles")
        .select("role, tenant_id")
        .eq("id", user.id)
        .single();

      if (profile?.role) setRole(profile.role as UserRole);

      if (profile?.tenant_id) {
        setAgentsLoading(true);
        const { data: agentData } = await supabase
          .from("agent_status")
          .select("*")
          .eq("tenant_id", profile.tenant_id)
          .in("module", ["whatsapp", "instagram"]);

        if (agentData) {
          setAgents(agentData.map((a: any) => ({
            id: a.agent_id,
            name: a.name,
            channel: a.module as "whatsapp" | "instagram",
            agent_status: a.agent_status as MetaAgentStatus["agent_status"],
            last_run: a.last_run,
            success_rate: a.success_rate,
          })));
        }
        setAgentsLoading(false);
      }
    }
    loadData();
  }, [supabase]);

  const handleReply = useCallback(async () => {
    if (!replyText.trim() || !selectedConv) return;
    if (!["owner", "admin", "socia", "agente"].includes(role ?? "")) return;
    setSending(true);
    try {
      await fetch("/api/meta/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contact: selectedConv.contact,
          channel: selectedConv.channel,
          message: replyText,
        }),
      });
      setReplyText("");
      setSelectedConv(null);
    } catch {
    } finally {
      setSending(false);
    }
  }, [replyText, selectedConv, role]);

  const filtered = (conversations || []).filter((c: ConversationSummary) =>
    channelFilter === "all" || c.channel === channelFilter
  );

  const whatsappCount = (conversations || []).filter((c: ConversationSummary) => c.channel === "whatsapp").length;
  const instagramCount = (conversations || []).filter((c: ConversationSummary) => c.channel === "instagram").length;
  const totalUnread = (conversations || []).reduce((sum: number, c: ConversationSummary) => sum + c.unread_count, 0);

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-luxe pb-24 px-4 h-full flex flex-col pt-4">
      
      {/* ── Dynamic Header ─────────────────────────────────────────── */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 py-2 flex-shrink-0">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-2xl bg-[#ccff00]/10 flex items-center justify-center border border-[#ccff00]/20">
                <span className="material-symbols-outlined text-[#ccff00] text-2xl shadow-volt">forum</span>
             </div>
             <div>
                <h1 className="text-3xl font-black tracking-tighter text-white uppercase leading-none">Omni Channels</h1>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#ccff00]/60 italic mt-1">Meta Neural Matrix</p>
             </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
           <div className="bg-white/5 border border-white/5 p-1 rounded-2xl flex gap-1">
              {(["all", "whatsapp", "instagram"] as ChannelFilter[]).map(ch => (
                <button
                  key={ch}
                  onClick={() => setChannelFilter(ch)}
                  className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all duration-300 ${channelFilter === ch ? 'bg-white text-black shadow-xl italic' : 'text-white/30 hover:text-white'}`}
                >
                  {ch === "all" ? "MASTER" : ch}
                </button>
              ))}
           </div>
           
           <a 
              href="/meta/inbox" 
              className="h-12 px-8 rounded-2xl bg-[#ccff00] text-black text-[11px] font-black uppercase tracking-widest flex items-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-volt"
            >
              <span className="material-symbols-outlined text-lg">forum</span>
              UNIFIED INBOX
            </a>
        </div>
      </header>

      {/* ── Neural KPIs ─────────────────────────────────────────────── */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-shrink-0">
         <KPICard label="Unread Signals" value={totalUnread.toString()} color={totalUnread > 0 ? "#ccff00" : "#ffffff"} />
         <KPICard label="WhatsApp Nodes" value={whatsappCount.toString()} color="#25D366" />
         <KPICard label="Insta Fragments" value={instagramCount.toString()} color="#A855F7" />
      </section>

      {/* ── Active Matrix Bridge ─────────────────────────────────────── */}
      <section className="flex-1 overflow-hidden flex gap-8">
        
        {/* Signal List */}
        <div className={`${selectedConv ? "w-1/2" : "w-full"} overflow-y-auto pr-2 space-y-4 scrollbar-none transition-all duration-500`}>
          {isLoading ? (
            [1, 2, 3, 4].map(i => <div key={i} className="h-28 glass-card border-white/5 rounded-[2rem] animate-pulse" />)
          ) : filtered.length === 0 ? (
            <div className="py-24 text-center glass-card rounded-[3rem] border border-dashed border-white/5">
              <span className="material-symbols-outlined text-4xl text-white/10 mb-6 block">cell_tower</span>
              <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] italic">No active signals detected in current branch</p>
            </div>
          ) : (
            filtered.map((conv: ConversationSummary, i: number) => {
              const iCfg = INTENT_CONFIG[conv.intent] || INTENT_CONFIG.unknown;
              const isSelected = selectedConv?.contact === conv.contact;

              return (
                <button
                  key={conv.contact}
                  onClick={() => setSelectedConv(conv)}
                  className={`
                    w-full group text-left p-8 rounded-[2.5rem] border transition-all duration-500 flex items-start gap-8 relative overflow-hidden
                    ${isSelected
                      ? "bg-white/5 border-white/10 shadow-volt/20"
                      : "bg-black/40 border-white/5 hover:border-white/10"
                    }
                  `}
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  {/* Identity Glow */}
                  <div className={`absolute -right-12 -top-12 w-32 h-32 blur-[60px] opacity-0 group-hover:opacity-20 transition-opacity duration-1000 ${conv.channel === 'whatsapp' ? 'bg-[#25D366]' : 'bg-[#A855F7]'}`} />
                  
                  {/* Avatar Sphere */}
                  <div className="relative flex-shrink-0">
                    <div className="w-16 h-16 rounded-full overflow-hidden border border-white/10 bg-white/5 p-1 group-hover:border-[#ccff00]/30 transition-all duration-500">
                      {conv.avatar_url ? (
                        <img src={conv.avatar_url} alt={conv.contact} className="w-full h-full object-cover rounded-full" />
                      ) : (
                        <div className="w-full h-full rounded-full flex items-center justify-center text-white/20 font-black italic">
                          {conv.contact.charAt(0)}
                        </div>
                      )}
                    </div>
                    {/* Protocol Badge */}
                    <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border border-black flex items-center justify-center shadow-lg ${
                      conv.channel === "whatsapp" ? "bg-[#25D366]" : "bg-gradient-to-tr from-[#FFDC80] via-[#FD1D1D] to-[#833AB4]"
                    }`}>
                      <span className="material-symbols-outlined text-white text-[10px]">{conv.channel === "whatsapp" ? "chat" : "photo_camera"}</span>
                    </div>
                    {/* Attention Burst */}
                    {conv.unread_count > 0 && (
                      <div className="absolute -top-1 -right-1 h-5 px-2 rounded-full bg-[#ccff00] text-black text-[9px] font-black italic flex items-center justify-center shadow-volt animate-bounce">
                        {conv.unread_count}
                      </div>
                    )}
                  </div>

                  {/* Signal Content */}
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-black text-white tracking-tighter uppercase group-hover:text-[#ccff00] transition-colors">{conv.contact}</h3>
                      <span className="text-[9px] font-black text-white/20 uppercase tracking-widest italic leading-none">
                        {new Date(conv.last_activity).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <p className="text-[11px] font-medium text-white/40 truncate italic leading-relaxed">{conv.last_message || "Awaiting signal parity..."}</p>
                    <div className="pt-2">
                       <span
                         className="text-[8px] font-black uppercase tracking-[0.3em] px-3 py-1 rounded-lg border italic"
                         style={{ color: iCfg.color, borderColor: `${iCfg.color}33`, backgroundColor: `${iCfg.color}11` }}
                       >
                         {iCfg.label}
                       </span>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Neural Bridge Control */}
        {selectedConv && (
          <div className="w-1/2 glass-card border-white/10 rounded-[3rem] flex flex-col animate-luxe overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#ccff00]/5 rounded-full blur-[100px] pointer-events-none" />
            
            {/* Bridge Header */}
            <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between flex-shrink-0 bg-white/5 backdrop-blur-3xl relative z-10">
              <div className="flex items-center gap-6">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-xl border ${
                  selectedConv.channel === "whatsapp" ? "bg-[#25D366]/10 border-[#25D366]/20 text-[#25D366]" : "bg-[#A855F7]/10 border-[#A855F7]/20 text-[#A855F7]"
                }`}>
                  <span className="material-symbols-outlined text-xl italic font-black">
                    {selectedConv.channel === "whatsapp" ? "chat" : "photo_camera"}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-black text-white uppercase tracking-tighter">{selectedConv.contact}</p>
                  <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] italic">{selectedConv.channel} secure link</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedConv(null)}
                className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 text-white/20 hover:text-white hover:bg-white/10 transition-all flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {/* Neural Memory Canvas */}
            <div className="flex-1 overflow-y-auto px-10 py-10 flex items-center justify-center relative z-10">
              <div className="text-center space-y-6">
                <div className="w-20 h-20 rounded-full bg-white/5 border border-white/5 flex items-center justify-center mx-auto opacity-20">
                   <span className="material-symbols-outlined text-4xl">inventory_2</span>
                </div>
                <div>
                   <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.5em] mb-4">Latest Transmission</p>
                   <p className="text-lg font-black text-white/80 uppercase tracking-tighter italic leading-relaxed">&ldquo;{selectedConv.last_message || "SIGNAL_LOST"}&rdquo;</p>
                </div>
              </div>
            </div>

            {/* Neural Command Input */}
            <div className="p-8 border-t border-white/5 flex-shrink-0 relative z-10 bg-black/40">
              <div className="flex items-center gap-4">
                <div className="flex-1 relative">
                   <input
                     type="text"
                     value={replyText}
                     onChange={e => setReplyText(e.target.value)}
                     onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleReply(); } }}
                     placeholder={`Transmit response to node...`}
                     className="w-full h-16 bg-white/5 border border-white/10 rounded-2xl px-8 text-sm text-white font-medium focus:border-[#ccff00]/40 outline-none transition-all placeholder:text-white/10 italic"
                   />
                </div>
                <button
                  onClick={handleReply}
                  disabled={sending || !replyText.trim()}
                  className={`
                    w-16 h-16 rounded-2xl transition-all duration-500 flex items-center justify-center shadow-xl
                    ${replyText.trim() && !sending
                      ? "bg-[#ccff00] text-black shadow-volt hover:scale-105"
                      : "bg-white/5 text-white/10 border border-white/5 cursor-not-allowed"
                    }
                  `}
                >
                  <span className="material-symbols-outlined text-2xl font-black italic">
                    {sending ? "sync" : "bolt"}
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ── Neural Agent Status Footer ─────────────────────────────── */}
      <footer className="flex-shrink-0 pt-6 border-t border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6">
         <div className="flex items-center gap-4">
            <span className="material-symbols-outlined text-[#ccff00] text-lg animate-pulse">smart_toy</span>
            <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em]">Active Meta Sub-Agents</p>
         </div>
         
         <div className="flex gap-4 overflow-x-auto pb-1 scrollbar-none">
           {agentsLoading ? (
             [1, 2].map(i => <div key={i} className="w-56 h-14 glass-card border-white/5 rounded-2xl animate-pulse flex-shrink-0" />)
           ) : agents.length === 0 ? (
             <p className="text-[9px] font-black text-white/10 uppercase tracking-widest italic">Awaiting Agent Allocation...</p>
           ) : (
             agents.map(agent => {
               const sCfg = AGENT_STATUS_CONFIG[agent.agent_status] || AGENT_STATUS_CONFIG.idle;
               return (
                 <div
                   key={agent.id}
                   className="flex-shrink-0 glass-card border border-white/5 rounded-2xl px-6 py-3 flex items-center gap-4 min-w-[240px] group hover:border-white/10 transition-all"
                 >
                   <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/5 border border-white/5 group-hover:border-[#ccff00]/20 transition-all">
                     <span className="material-symbols-outlined text-base" style={{ color: agent.channel === 'whatsapp' ? '#25D366' : '#A855F7' }}>
                       {agent.channel === "whatsapp" ? "chat" : "photo_camera"}
                     </span>
                   </div>
                   <div className="flex-1 min-w-0">
                     <p className="text-[10px] font-black text-white uppercase tracking-tighter truncate leading-none">{agent.name}</p>
                     <div className="flex items-center gap-3 mt-1.5 leading-none">
                       <span className="w-1.5 h-1.5 rounded-full shadow-lg" style={{ backgroundColor: sCfg.color, boxShadow: `0 0 5px ${sCfg.color}` }} />
                       <span className="text-[9px] font-black uppercase tracking-widest leading-none" style={{ color: sCfg.color }}>{sCfg.label}</span>
                       <span className="text-[9px] font-black text-white/20 uppercase tracking-tighter ml-auto italic">IDX: {agent.success_rate}%</span>
                     </div>
                   </div>
                 </div>
               );
             })
           )}
         </div>
      </footer>

    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Sub-componentes
// ──────────────────────────────────────────────────────────────────────────────

function KPICard({ label, value, color }: { label: string; value: string; color: string }) {
   return (
      <div className="glass-card p-8 rounded-[2.5rem] border border-white/5 group hover:border-white/10 transition-all duration-500 relative overflow-hidden">
         <div className="absolute top-0 right-0 w-32 h-32 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 blur-[40px] pointer-events-none" style={{ backgroundColor: `${color}11` }} />
         <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.4em] mb-4 block leading-none">{label}</span>
         <span className="text-3xl font-black uppercase tracking-tighter italic leading-none" style={{ color }}>{value}</span>
         <div className="w-8 h-1 bg-white/5 rounded-full mt-6" />
      </div>
   );
}
