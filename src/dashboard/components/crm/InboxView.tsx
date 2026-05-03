"use client";

import { useState } from "react";
import { mockConversations, mockInboxStats, type Conversation } from "@/lib/mockData";
import { useToast } from "@/components/ToastProvider";

type PlatformFilter = "all" | "whatsapp" | "instagram" | "facebook";
type StatusFilter = "all" | "open" | "pending" | "resolved";

interface InboxViewProps {
  defaultPlatform?: "whatsapp" | "instagram" | "facebook";
}

const PC = {
  whatsapp: { label: "WhatsApp", color: "#25D366", text: "text-[#25D366]", bg: "bg-[#25D366]/10", border: "border-[#25D366]/20", icon: "chat" },
  instagram: { label: "Instagram", color: "#E1306C", text: "text-pink-400", bg: "bg-pink-500/10", border: "border-pink-500/20", icon: "photo_camera" },
  facebook: { label: "Facebook", color: "#0084FF", text: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20", icon: "forum" },
} as const;

const PRIORITY_DOT: Record<string, string> = {
  urgent: "bg-red-500",
  high: "bg-orange-500",
  medium: "bg-amber-400",
  low: "bg-white/20",
};

const STATUS_BADGE: Record<string, string> = {
  open: "text-[#CCFF00] bg-[#CCFF00]/10",
  pending: "text-amber-400 bg-amber-400/10",
  resolved: "text-on-surface/40 bg-white/5",
  archived: "text-on-surface/20 bg-white/5",
};

const STATUS_LABEL: Record<string, string> = {
  open: "ABIERTA",
  pending: "PENDIENTE",
  resolved: "RESUELTA",
  archived: "ARCHIVADA",
};

export function InboxView({ defaultPlatform }: InboxViewProps) {
  const { showToast } = useToast();
  const [platformFilter, setPlatformFilter] = useState<PlatformFilter>(defaultPlatform ?? "all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [selected, setSelected] = useState<Conversation>(mockConversations[0]);
  const [samanthaActive, setSamanthaActive] = useState(true);
  const [draft, setDraft] = useState("");
  const [search, setSearch] = useState("");

  const filtered = mockConversations.filter(c => {
    const p = platformFilter === "all" || c.platform === platformFilter;
    const s = statusFilter === "all" || c.status === statusFilter;
    const q = !search || c.customer.name.toLowerCase().includes(search.toLowerCase()) || c.last_message.toLowerCase().includes(search.toLowerCase());
    return p && s && q;
  });

  const pcounts = {
    all: mockConversations.length,
    whatsapp: mockConversations.filter(c => c.platform === "whatsapp").length,
    instagram: mockConversations.filter(c => c.platform === "instagram").length,
    facebook: mockConversations.filter(c => c.platform === "facebook").length,
  };

  function send() {
    if (!draft.trim()) return;
    showToast({ type: "success", title: "Mensaje Enviado", message: `→ ${selected.customer.name}` });
    setDraft("");
  }

  function samanthaReply() {
    showToast({ type: "info", title: "Samantha Respondiendo", message: "Generando respuesta inteligente..." });
  }

  return (
    <div className="flex h-[calc(100vh-140px)] -mt-10 -mx-10 overflow-hidden glass-card rounded-none md:rounded-3xl border-0 md:border border-white/5">

      {/* ── Left: conversation list ─────────────────────────── */}
      <aside className="w-full md:w-[340px] border-r border-white/5 flex flex-col bg-white/[0.02] flex-shrink-0">
        {/* KPIs + search + filters */}
        <div className="p-5 border-b border-white/5 space-y-3">
          {/* Mini KPIs */}
          <div className="flex gap-3 mb-1">
            {[
              { value: mockInboxStats.open, label: "Abiertas", color: "text-primary" },
              { value: mockInboxStats.pending, label: "Pendientes", color: "text-amber-400" },
              { value: mockInboxStats.avg_response_time, label: "Resp. media", color: "text-on-surface/50" },
            ].map(k => (
              <div key={k.label} className="flex-1 text-center">
                <p className={`text-lg font-black tight-tracking ${k.color}`}>{k.value}</p>
                <p className="text-[7px] font-black label-tracking text-on-surface/30 uppercase">{k.label}</p>
              </div>
            ))}
          </div>

          {/* Search */}
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 !text-[15px] text-on-surface/30">search</span>
            <input
              type="text"
              placeholder="Buscar conversación..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-[11px] focus:outline-none focus:border-primary/50 transition-all placeholder:text-on-surface/30"
            />
          </div>

          {/* Platform tabs — hidden when a platform is locked */}
          {!defaultPlatform && (
            <div className="flex gap-1 flex-wrap">
              {(["all", "whatsapp", "instagram", "facebook"] as PlatformFilter[]).map(p => (
                <button
                  key={p}
                  onClick={() => setPlatformFilter(p)}
                  className={`px-2.5 py-1 rounded-lg text-[8px] font-black label-tracking transition-all ${
                    platformFilter === p
                      ? p === "all"
                        ? "bg-primary text-black"
                        : `${PC[p].bg} ${PC[p].text}`
                      : "bg-white/5 text-on-surface/30 hover:bg-white/10"
                  }`}
                >
                  {p === "all" ? `TODAS (${pcounts.all})` : `${PC[p].label} (${pcounts[p]})`}
                </button>
              ))}
            </div>
          )}

          {/* Status tabs */}
          <div className="flex gap-1">
            {(["all", "open", "pending", "resolved"] as StatusFilter[]).map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-2 py-1 rounded-lg text-[7px] font-black label-tracking transition-all ${
                  statusFilter === s ? "bg-white/10 text-on-surface" : "text-on-surface/30 hover:text-on-surface/60"
                }`}
              >
                {s === "all" ? "TODAS" : s === "open" ? "ABIERTAS" : s === "pending" ? "PENDIENTES" : "RESUELTAS"}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 && (
            <p className="p-8 text-center text-[11px] text-on-surface/30">Sin conversaciones</p>
          )}
          {filtered.map(conv => {
            const pc = PC[conv.platform];
            return (
              <button
                key={conv.id}
                onClick={() => setSelected(conv)}
                className={`w-full p-4 flex gap-3 border-b border-white/[0.03] text-left transition-colors hover:bg-white/[0.03] relative ${
                  selected.id === conv.id ? "bg-primary/5 border-r-2 border-r-primary" : ""
                }`}
              >
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <div className="w-11 h-11 rounded-full bg-white/10 border border-white/10 flex items-center justify-center">
                    <span className="material-symbols-outlined !text-[20px] text-on-surface/40">person</span>
                  </div>
                  <div
                    className="absolute -right-1 -bottom-1 w-5 h-5 rounded-full border-2 border-[#0a0f1c] flex items-center justify-center"
                    style={{ backgroundColor: pc.color }}
                  >
                    <span className="material-symbols-outlined !text-[10px] text-white">{pc.icon}</span>
                  </div>
                  <div className={`absolute -top-1 -left-1 w-2.5 h-2.5 rounded-full border border-[#0a0f1c] ${PRIORITY_DOT[conv.priority]}`} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-1 mb-0.5">
                    <p className="text-[12px] font-black text-on-surface truncate">{conv.customer.name}</p>
                    <span className="text-[7px] font-bold text-on-surface/30 flex-shrink-0">
                      {new Date(conv.last_message_at).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <p className="text-[10px] text-on-surface/50 truncate leading-tight mb-1.5">{conv.last_message}</p>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`text-[7px] font-black px-1.5 py-0.5 rounded-full uppercase ${STATUS_BADGE[conv.status]}`}>
                      {STATUS_LABEL[conv.status]}
                    </span>
                    {conv.tags.slice(0, 1).map(tag => (
                      <span key={tag} className="text-[7px] font-black px-1.5 py-0.5 rounded-full bg-white/5 text-on-surface/30 uppercase">{tag}</span>
                    ))}
                  </div>
                </div>

                {conv.unread_count > 0 && (
                  <div className="absolute right-3 top-3 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-[8px] font-black text-black">{conv.unread_count}</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </aside>

      {/* ── Center: chat ───────────────────────────────────── */}
      <main className="flex-1 flex flex-col bg-white/[0.01] min-w-0">
        {/* Chat header */}
        <header className="p-5 border-b border-white/5 flex items-center justify-between bg-white/[0.02] flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
              <span className="material-symbols-outlined !text-[18px] text-on-surface/40">person</span>
            </div>
            <div>
              <p className="text-[13px] font-black text-on-surface">{selected.customer.name}</p>
              <p className="text-[9px] font-bold label-tracking uppercase" style={{ color: PC[selected.platform].color }}>
                {PC[selected.platform].label} · {selected.customer.phone || selected.customer.username || ""}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* AI toggle */}
            <div className={`flex items-center gap-2 glass-card px-3 py-1.5 rounded-xl transition-all ${!samanthaActive ? "border-amber-500/30 bg-amber-500/5" : "border-white/5"}`}>
              <span className={`text-[7px] font-black label-tracking uppercase ${samanthaActive ? "text-primary" : "text-amber-400 animate-pulse"}`}>
                AI {samanthaActive ? "ONLINE" : "PAUSED"}
              </span>
              <button
                onClick={() => setSamanthaActive(v => !v)}
                className={`relative w-8 h-4 rounded-full transition-colors ${samanthaActive ? "bg-primary/20" : "bg-amber-500/20"}`}
              >
                <div className={`absolute top-0.5 w-3 h-3 rounded-full transition-all ${samanthaActive ? "left-4 bg-primary shadow-[0_0_8px_rgba(204,255,0,0.8)]" : "left-0.5 bg-amber-400"}`} />
              </button>
            </div>

            <button
              onClick={() => showToast({ type: "success", title: "Resuelta", message: selected.customer.name })}
              className="px-3 py-1.5 rounded-xl text-[8px] font-black label-tracking border border-white/10 hover:border-primary/30 text-on-surface/50 transition-all"
            >
              RESOLVER
            </button>
            <button
              onClick={() => showToast({ type: "info", title: "Transferido", message: `${selected.customer.name} → Agente humano` })}
              className="px-3 py-1.5 rounded-xl text-[8px] font-black label-tracking border border-white/10 hover:border-white/20 text-on-surface/40 transition-all"
            >
              TRANSFERIR
            </button>
            <button className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all">
              <span className="material-symbols-outlined !text-[16px] text-on-surface/40">more_vert</span>
            </button>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
          {!samanthaActive && (
            <div className="sticky top-0 z-10 bg-amber-500/90 backdrop-blur-md border border-amber-400/50 p-3 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined !text-[16px] text-black">warning</span>
                <p className="text-[9px] font-black text-black uppercase label-tracking">Control humano activo — Samantha en pausa</p>
              </div>
              <span className="text-[7px] font-black bg-black text-amber-400 px-2 py-0.5 rounded-full uppercase">MODO MANUAL</span>
            </div>
          )}

          {selected.messages.map(msg => (
            <div key={msg.id} className={`flex flex-col max-w-[72%] ${msg.sender === "customer" ? "self-start" : "self-end"}`}>
              <div className={`px-4 py-3 rounded-2xl ${
                msg.sender === "customer"
                  ? "bg-white/5 border border-white/10 rounded-tl-none"
                  : msg.sender === "bot"
                  ? "bg-primary/10 border border-primary/20 rounded-tr-none"
                  : "bg-blue-500/10 border border-blue-500/20 rounded-tr-none"
              }`}>
                <p className="text-[12px] leading-relaxed text-on-surface">{msg.content}</p>
                <p className="text-[8px] text-on-surface/30 mt-1.5">
                  {new Date(msg.timestamp).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
              <span className="text-[8px] font-black uppercase label-tracking mt-1 px-1 opacity-30">
                {msg.sender === "bot" ? "Samantha AI" : msg.sender === "agent" ? "Agente" : msg.sender_name}
              </span>
            </div>
          ))}
        </div>

        {/* Input */}
        <footer className="p-5 border-t border-white/5 bg-white/[0.02] flex-shrink-0">
          <div className="flex gap-2 items-center">
            <button className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all flex-shrink-0">
              <span className="material-symbols-outlined !text-[16px] text-on-surface/40">attach_file</span>
            </button>
            <input
              type="text"
              placeholder="Escribe un mensaje..."
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={e => e.key === "Enter" && send()}
              className="flex-1 bg-white/5 border border-white/10 rounded-2xl py-3 px-5 text-[12px] focus:outline-none focus:border-primary/50 transition-all placeholder:text-on-surface/30"
            />
            <button
              onClick={samanthaReply}
              className="px-3 py-2 rounded-xl text-[8px] font-black label-tracking text-primary bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-all flex-shrink-0"
            >
              AI
            </button>
            <button
              onClick={send}
              className="w-11 h-11 rounded-2xl bg-primary text-black flex items-center justify-center hover:scale-105 transition-all shadow-glow flex-shrink-0"
            >
              <span className="material-symbols-outlined !text-[18px]">send</span>
            </button>
          </div>
        </footer>
      </main>

      {/* ── Right: Samantha insights (xl only) ─────────────── */}
      <aside className="hidden xl:flex w-[280px] border-l border-white/5 flex-col p-6 gap-6 bg-white/[0.02]">
        <div className="space-y-3">
          <p className="text-[9px] font-black label-tracking text-primary uppercase">Samantha Intelligence</p>
          <div className="glass-card p-4 rounded-2xl border-primary/10 bg-primary/5">
            <p className="text-[11px] text-on-surface leading-snug">
              {selected.priority === "urgent"
                ? "Conversación URGENTE sin asignar. Requiere atención humana inmediata."
                : selected.priority === "high"
                ? `Prioridad alta detectada. ${selected.unread_count > 0 ? `${selected.unread_count} mensajes sin leer.` : "Monitoreo activo."}`
                : `Conversación estable en ${PC[selected.platform].label}. Sin señales de urgencia.`}
            </p>
          </div>
        </div>

        <div className="space-y-2.5">
          <p className="text-[9px] font-black label-tracking text-on-surface/30 uppercase">Detalles</p>
          {[
            { label: "Canal", value: PC[selected.platform].label },
            { label: "Prioridad", value: selected.priority.toUpperCase() },
            { label: "Estado", value: STATUS_LABEL[selected.status] },
            { label: "Asignado a", value: selected.assigned_to || "Sin asignar" },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between">
              <span className="text-[10px] text-on-surface/50">{label}</span>
              <span className="text-[10px] font-bold text-on-surface">{value}</span>
            </div>
          ))}
        </div>

        {selected.tags.length > 0 && (
          <div className="space-y-2">
            <p className="text-[9px] font-black label-tracking text-on-surface/30 uppercase">Tags</p>
            <div className="flex flex-wrap gap-1.5">
              {selected.tags.map(tag => (
                <span key={tag} className="px-2 py-0.5 rounded-full bg-white/5 text-[7px] font-black text-on-surface/40 uppercase">{tag}</span>
              ))}
            </div>
          </div>
        )}

        <div className="mt-auto space-y-2">
          <button
            onClick={() => showToast({ type: "info", title: "Cotización Generada", message: `Para ${selected.customer.name}` })}
            className="w-full py-3 neon-disruptor rounded-2xl text-[9px] font-black label-tracking shadow-glow"
          >
            GENERAR COTIZACIÓN
          </button>
          <button
            onClick={() => showToast({ type: "success", title: "Ticket Creado", message: `Soporte para ${selected.customer.name}` })}
            className="w-full py-2.5 rounded-xl text-[9px] font-black label-tracking border border-white/10 hover:border-primary/20 text-on-surface/50 transition-all"
          >
            CREAR TICKET
          </button>
        </div>
      </aside>
    </div>
  );
}
