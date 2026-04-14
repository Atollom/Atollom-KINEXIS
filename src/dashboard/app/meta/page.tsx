// src/dashboard/app/meta/page.tsx
// Canales Meta: WhatsApp + Instagram + Estado agentes + Responder
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
const INTENT_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  venta:   { label: "Venta",   color: "#A8E63D", bg: "bg-[#A8E63D]/10" },
  soporte: { label: "Soporte", color: "#F59E0B", bg: "bg-[#F59E0B]/10" },
  reclamo: { label: "Reclamo", color: "#EF4444", bg: "bg-[#EF4444]/10" },
  otro:    { label: "Otro",    color: "#506584", bg: "bg-[#506584]/10" },
  unknown: { label: "Sin clasificar", color: "#506584", bg: "bg-[#506584]/10" },
};

const AGENT_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  active: { label: "Activo", color: "#22C55E" },
  idle:   { label: "Inactivo", color: "#F59E0B" },
  error:  { label: "Error",  color: "#EF4444" },
  paused: { label: "Pausado", color: "#506584" },
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

  // Cargar agentes Meta y rol del usuario
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
        // Cargar agentes Meta (WhatsApp e Instagram)
        setAgentsLoading(true);
        const { data: agentData } = await supabase
          .from("agent_status")
          .select("*")
          .eq("tenant_id", profile.tenant_id)
          .in("module", ["whatsapp", "instagram"]);

        if (agentData) {
          setAgents(agentData.map((a: { agent_id: string; name: string; module: string; agent_status: string; last_run: string; success_rate: number }) => ({
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

  // Enviar respuesta a conversación
  const handleReply = useCallback(async () => {
    if (!replyText.trim() || !selectedConv) return;
    // RBAC: solo owner/admin/socia/agente pueden responder mensajes
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
      // Error silencioso — el usuario puede reintentar
    } finally {
      setSending(false);
    }
  }, [replyText, selectedConv, role]);

  // Filtrar conversaciones
  const filtered = (conversations || []).filter((c: ConversationSummary) =>
    channelFilter === "all" || c.channel === channelFilter
  );

  const whatsappCount = (conversations || []).filter((c: ConversationSummary) => c.channel === "whatsapp").length;
  const instagramCount = (conversations || []).filter((c: ConversationSummary) => c.channel === "instagram").length;
  const totalUnread = (conversations || []).reduce((sum: number, c: ConversationSummary) => sum + c.unread_count, 0);

  return (
    <div className="px-4 md:px-6 py-6 h-[calc(100vh-64px)] overflow-hidden flex flex-col">
      {/* ── Header ──────────────────────────────────────────────── */}
      <header className="mb-5 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#3B82F6]/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-[#3B82F6] text-lg">forum</span>
          </div>
          <div>
            <h1 className="text-2xl font-headline font-bold text-[#E8EAF0]">Canales Meta</h1>
            <p className="text-[11px] text-[#8DA4C4]">WhatsApp & Instagram · Conversaciones Unificadas</p>
          </div>
        </div>

        {/* KPIs rápidos */}
        <div className="hidden md:flex items-center gap-3">
          <div className="bg-white/[0.04] rounded-xl px-4 py-2 text-center">
            <p className="text-[9px] text-[#8DA4C4] uppercase tracking-wider">Sin leer</p>
            <p className="text-lg font-headline font-bold text-[#EF4444]">{totalUnread}</p>
          </div>
          <div className="bg-[#25D366]/10 rounded-xl px-4 py-2 text-center">
            <p className="text-[9px] text-[#25D366] uppercase tracking-wider">WhatsApp</p>
            <p className="text-lg font-headline font-bold text-[#25D366]">{whatsappCount}</p>
          </div>
          <div className="bg-purple-500/10 rounded-xl px-4 py-2 text-center">
            <p className="text-[9px] text-purple-400 uppercase tracking-wider">Instagram</p>
            <p className="text-lg font-headline font-bold text-purple-400">{instagramCount}</p>
          </div>

          <a 
            href="/meta/inbox" 
            className="btn-volt flex items-center gap-2 px-5 py-3 ml-4"
          >
            <span className="material-symbols-outlined">forum</span>
            BANDEJA UNIFICADA
          </a>
        </div>
      </header>

      {/* ── Filtros de canal ─────────────────────────────────────── */}
      <div className="flex items-center gap-2 mb-4 flex-shrink-0">
        {(["all", "whatsapp", "instagram"] as ChannelFilter[]).map(ch => (
          <button
            key={ch}
            onClick={() => setChannelFilter(ch)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider
              transition-all duration-200
              ${channelFilter === ch
                ? ch === "whatsapp" ? "bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/20"
                  : ch === "instagram" ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                  : "bg-white/[0.06] text-[#E8EAF0] border border-white/[0.08]"
                : "bg-white/[0.03] text-[#8DA4C4] hover:text-[#E8EAF0] border border-transparent"
              }
            `}
          >
            <span className="material-symbols-outlined text-sm">
              {ch === "whatsapp" ? "chat" : ch === "instagram" ? "photo_camera" : "forum"}
            </span>
            {ch === "all" ? "Todos" : ch === "whatsapp" ? "WhatsApp" : "Instagram"}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-hidden flex gap-5">
        {/* ── Lista de conversaciones ────────────────────────────── */}
        <div className={`${selectedConv ? "w-1/2" : "w-full"} overflow-y-auto pr-2 transition-all`}>
          <div className="grid grid-cols-1 gap-2">
            {isLoading ? (
              [1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-white/[0.04] rounded-2xl animate-pulse" />)
            ) : filtered.length === 0 ? (
              <div className="py-16 text-center bg-white/[0.02] rounded-2xl border border-dashed border-white/[0.06]">
                <span className="material-symbols-outlined text-4xl text-[#506584] mb-3 block opacity-40">chat_bubble</span>
                <p className="text-[12px] text-[#8DA4C4]">Sin conversaciones activas</p>
              </div>
            ) : (
              filtered.map((conv: ConversationSummary) => {
                const iCfg = INTENT_CONFIG[conv.intent] || INTENT_CONFIG.unknown;
                const isSelected = selectedConv?.contact === conv.contact;

                return (
                  <button
                    key={conv.contact}
                    onClick={() => setSelectedConv(conv)}
                    className={`
                      w-full text-left p-4 rounded-2xl flex items-start gap-4
                      transition-all duration-200 border
                      ${isSelected
                        ? "bg-white/[0.06] border-white/[0.1]"
                        : "bg-white/[0.02] border-white/[0.04] hover:bg-white/[0.04]"
                      }
                    `}
                  >
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/[0.08] bg-white/[0.04] flex items-center justify-center">
                        {conv.avatar_url ? (
                          <Image src={conv.avatar_url} alt={conv.contact} width={48} height={48} className="object-cover" />
                        ) : (
                          <span className="material-symbols-outlined text-[#8DA4C4]">person</span>
                        )}
                      </div>
                      {/* Badge de plataforma */}
                      <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center ${
                        conv.channel === "whatsapp" ? "bg-[#25D366]" : "bg-gradient-to-tr from-[#FFDC80] via-[#FD1D1D] to-[#833AB4]"
                      }`}>
                        <span className="material-symbols-outlined text-white text-[10px]">
                          {conv.channel === "whatsapp" ? "chat" : "photo_camera"}
                        </span>
                      </div>
                      {/* Badge sin leer */}
                      {conv.unread_count > 0 && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#A8E63D] text-[#0D1B3E] text-[9px] font-bold flex items-center justify-center">
                          {conv.unread_count}
                        </div>
                      )}
                    </div>

                    {/* Contenido */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-[12px] font-bold text-[#E8EAF0] truncate">{conv.contact}</h3>
                        <span className="text-[9px] text-[#506584] flex-shrink-0 ml-2">
                          {new Date(conv.last_activity).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#8DA4C4] truncate italic mb-2">{conv.last_message || "Sin mensajes"}</p>
                      <span
                        className="text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                        style={{ color: iCfg.color, backgroundColor: `${iCfg.color}15` }}
                      >
                        {iCfg.label}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ── Panel de respuesta (detalle conversación) ─────────── */}
        {selectedConv && (
          <div className="w-1/2 bg-white/[0.02] border border-white/[0.04] rounded-2xl flex flex-col animate-in overflow-hidden">
            {/* Header del hilo */}
            <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  selectedConv.channel === "whatsapp" ? "bg-[#25D366]/20" : "bg-purple-500/20"
                }`}>
                  <span className="material-symbols-outlined text-sm" style={{
                    color: selectedConv.channel === "whatsapp" ? "#25D366" : "#A855F7"
                  }}>
                    {selectedConv.channel === "whatsapp" ? "chat" : "photo_camera"}
                  </span>
                </div>
                <div>
                  <p className="text-[12px] font-bold text-[#E8EAF0]">{selectedConv.contact}</p>
                  <p className="text-[10px] text-[#8DA4C4] capitalize">{selectedConv.channel}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedConv(null)}
                className="p-1.5 rounded-lg text-[#8DA4C4] hover:text-[#E8EAF0] hover:bg-white/[0.06] transition-all"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            {/* Área de mensajes (placeholder — historial real se cargará) */}
            <div className="flex-1 overflow-y-auto px-5 py-4 flex items-center justify-center">
              <div className="text-center">
                <span className="material-symbols-outlined text-3xl text-[#506584] mb-2 block opacity-40">chat</span>
                <p className="text-[11px] text-[#8DA4C4]">Último mensaje:</p>
                <p className="text-[12px] text-[#E8EAF0] italic mt-1">&ldquo;{selectedConv.last_message || "Sin mensajes"}&rdquo;</p>
              </div>
            </div>

            {/* Input de respuesta */}
            <div className="px-4 py-3 border-t border-white/[0.06] flex-shrink-0">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleReply(); } }}
                  placeholder={`Responder a ${selectedConv.contact}...`}
                  className="
                    flex-1 bg-white/[0.03] border border-white/[0.08] rounded-xl
                    px-4 py-2.5 text-[12px] text-[#E8EAF0]
                    placeholder:text-[#506584]
                    focus:border-[#A8E63D]/30 focus:outline-none
                  "
                />
                <button
                  onClick={handleReply}
                  disabled={sending || !replyText.trim()}
                  className={`
                    p-2.5 rounded-xl transition-all duration-200
                    ${replyText.trim() && !sending
                      ? "bg-[#A8E63D] text-[#0D1B3E] hover:shadow-[0_0_12px_#A8E63D40]"
                      : "bg-white/[0.04] text-[#506584] cursor-not-allowed"
                    }
                  `}
                >
                  <span className="material-symbols-outlined text-lg">
                    {sending ? "sync" : "send"}
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Estado de agentes Meta (footer) ───────────────────────── */}
      <div className="mt-4 flex-shrink-0">
        <div className="flex items-center gap-2 mb-2">
          <span className="material-symbols-outlined text-sm text-[#8DA4C4]">smart_toy</span>
          <p className="text-[10px] text-[#8DA4C4] uppercase tracking-wider font-bold">Agentes Meta</p>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-1">
          {agentsLoading ? (
            [1, 2, 3].map(i => <div key={i} className="w-48 h-14 bg-white/[0.04] rounded-xl animate-pulse flex-shrink-0" />)
          ) : agents.length === 0 ? (
            <p className="text-[11px] text-[#506584]">Sin agentes Meta configurados</p>
          ) : (
            agents.map(agent => {
              const sCfg = AGENT_STATUS_CONFIG[agent.agent_status] || AGENT_STATUS_CONFIG.idle;
              return (
                <div
                  key={agent.id}
                  className="flex-shrink-0 bg-white/[0.03] border border-white/[0.04] rounded-xl p-3 flex items-center gap-3 min-w-[200px]"
                >
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${sCfg.color}15` }}
                  >
                    <span className="material-symbols-outlined text-sm" style={{ color: sCfg.color }}>
                      {agent.channel === "whatsapp" ? "chat" : "photo_camera"}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold text-[#E8EAF0] truncate">{agent.name}</p>
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: sCfg.color }} />
                      <span className="text-[9px]" style={{ color: sCfg.color }}>{sCfg.label}</span>
                      <span className="text-[9px] text-[#506584]">{agent.success_rate}%</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
