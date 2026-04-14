"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import useSWR from "swr";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";
import { subscribeToTable } from "@/lib/realtime";
import { WhatsAppSession, WhatsAppMessage } from "@/types";
import { Sidebar } from "@/components/Sidebar";

// ── Helpers ──────────────────────────────────────────────────────────────────

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function formatTime(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
}

function playNewMessageSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.3);
    osc.onended = () => ctx.close();
  } catch (e) { /* ignore */ }
}

// ── Components ───────────────────────────────────────────────────────────────

export default function WhatsAppInbox() {
  const supabase = createBrowserSupabaseClient();
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const scrollRef = useRef<HTMLDivElement>(null);

  // 1. Get Tenant ID
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase
          .from("user_profiles")
          .select("tenant_id")
          .eq("id", user.id)
          .single()
          .then(({ data }) => setTenantId(data?.tenant_id || null));
      }
    });
  }, [supabase]);

  // 2. Fetch Sessions
  const { data: sessionsData, mutate: mutateSessions } = useSWR(
    tenantId ? "/api/meta/inbox" : null,
    fetcher
  );
  const sessions: WhatsAppSession[] = sessionsData?.sessions || [];

  // 3. Fetch Messages for selected session
  const { data: messagesData, mutate: mutateMessages } = useSWR(
    tenantId && selectedPhone ? `/api/meta/inbox/messages?phone=${selectedPhone}` : null,
    fetcher
  );
  const messages: WhatsAppMessage[] = messagesData?.messages || [];

  const activeSession = useMemo(() => 
    sessions.find(s => s.from_number === selectedPhone),
    [sessions, selectedPhone]
  );

  // 4. Realtime Subscriptions
  useEffect(() => {
    if (!tenantId) return;

    // Listen for new messages
    const cleanupMessages = subscribeToTable(tenantId, "whatsapp_messages", (payload) => {
      if (payload.eventType === "INSERT") {
        const newMsg = payload.new as unknown as WhatsAppMessage;
        
        // If it's for the currently open chat, update messages
        if (newMsg.from_number === selectedPhone) {
          mutateMessages();
        }
        
        // Always refresh session list (previews/order)
        mutateSessions();

        // Sound if inbound and tab not focused (or always for inbound in inbox)
        if (newMsg.direction === "inbound") {
          playNewMessageSound();
          if (document.hidden) {
            new Notification("Nuevo WhatsApp de " + newMsg.from_number, {
              body: newMsg.message_text || "Archivo multimedia",
            });
          }
        }
      }
    });

    // Listen for session updates (IA toggle)
    const cleanupSessions = subscribeToTable(tenantId, "whatsapp_sessions", () => {
      mutateSessions();
    });

    return () => {
      cleanupMessages();
      cleanupSessions();
    };
  }, [tenantId, selectedPhone, mutateMessages, mutateSessions]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Request Notification permission
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // Handlers
  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!messageInput.trim() || !selectedPhone || isSending) return;

    setIsSending(true);
    try {
      const res = await fetch("/api/meta/inbox/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: selectedPhone, text: messageInput }),
      });
      if (res.ok) {
        setMessageInput("");
        mutateMessages();
        mutateSessions();
      }
    } finally {
      setIsSending(false);
    }
  }

  async function toggleAI(active: boolean) {
    if (!activeSession) return;
    const res = await fetch("/api/meta/inbox/toggle-ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: activeSession.id, active }),
    });
    if (res.ok) mutateSessions();
  }

  const filteredSessions = sessions.filter(s => 
    s.from_number.includes(searchQuery) || (s.last_message || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-[#0A1628] text-on-surface overflow-hidden">
      <Sidebar />
      
      <main className="flex-1 flex overflow-hidden">
        {/* Lista de Conversaciones (Izquierda) */}
        <div className="w-[350px] border-r border-white/[0.05] flex flex-col bg-[#0D1B3E]/40 backdrop-blur-xl">
          <div className="p-4 border-b border-white/[0.05]">
            <h1 className="text-lg font-headline font-bold mb-4">WhatsApp Inbox</h1>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-on-surface-variant text-sm">search</span>
              <input 
                type="text" 
                placeholder="Buscar conversación..."
                className="w-full bg-white/[0.04] border-none rounded-xl py-2 pl-10 pr-4 text-xs focus:ring-1 focus:ring-secondary-container outline-none transition-all"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {filteredSessions.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedPhone(s.from_number)}
                className={`
                  w-full px-4 py-3 flex items-start gap-3 transition-colors text-left
                  ${selectedPhone === s.from_number ? "bg-white/[0.08]" : "hover:bg-white/[0.04]"}
                `}
              >
                <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-lg text-on-surface-variant">person</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <span className="font-bold text-[13px] truncate">{s.from_number}</span>
                    <span className="text-[10px] text-on-surface-variant">{formatTime(s.last_message_at || "")}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {s.samantha_active && (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" title="Samantha Activa" />
                    )}
                    <p className="text-[11px] text-on-surface-variant truncate">
                      {s.last_message || (s.last_message_direction === "outbound" ? "Mensaje enviado" : "Mensaje recibido")}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Panel de Chat (Derecha) */}
        <div className="flex-1 flex flex-col relative bg-[#111928]/30">
          {selectedPhone ? (
            <>
              {/* Header */}
              <div className="h-16 px-6 border-b border-white/[0.05] flex items-center justify-between bg-white/[0.02]">
                <div className="flex items-center gap-3">
                  <div className="font-bold text-sm">{selectedPhone}</div>
                  {activeSession?.samantha_active ? (
                    <div className="flex items-center gap-1.5 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                      <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">Samantha Atendiendo</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 bg-on-surface-variant/10 px-2 py-0.5 rounded-full border border-on-surface-variant/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-on-surface-variant" />
                      <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Control Manual</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {activeSession?.samantha_active ? (
                    <button 
                      onClick={() => toggleAI(false)}
                      className="btn-glass text-[10px] py-1.5 px-3 flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-sm">front_hand</span>
                      TOMAR CONVERSACIÓN
                    </button>
                  ) : (
                    <button 
                      onClick={() => toggleAI(true)}
                      className="btn-volt text-[10px] py-1.5 px-3 flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-sm">smart_toy</span>
                      ACTIVAR SAMANTHA
                    </button>
                  )}
                </div>
              </div>

              {/* Messages Thread */}
              <div 
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar"
                style={{ backgroundImage: "radial-gradient(circle at 50% 50%, rgba(168, 230, 61, 0.02) 0%, transparent 100%)" }}
              >
                {messages.map((m) => (
                  <MessageItem key={m.id} message={m} />
                ))}
              </div>

              {/* Composer */}
              <div className="p-4 border-t border-white/[0.05] bg-white/[0.01]">
                <form onSubmit={handleSend} className="flex gap-3 max-w-4xl mx-auto">
                  <input 
                    type="text" 
                    placeholder={activeSession?.samantha_active ? "IA activa — toma el control para responder" : "Escribe un mensaje..."}
                    className="flex-1 bg-white/[0.04] border-none rounded-xl py-3 px-5 text-sm outline-none focus:ring-1 focus:ring-secondary-container transition-all"
                    value={messageInput}
                    onChange={e => setMessageInput(e.target.value)}
                    disabled={activeSession?.samantha_active}
                  />
                  <button 
                    type="submit"
                    disabled={isSending || activeSession?.samantha_active || !messageInput.trim()}
                    className="w-12 h-12 rounded-xl btn-volt flex items-center justify-center disabled:opacity-30 disabled:grayscale transition-all"
                  >
                    <span className="material-symbols-outlined">send</span>
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center opacity-30">
              <span className="material-symbols-outlined text-6xl mb-4">forum</span>
              <p className="text-sm font-headline tracking-widest uppercase">Selecciona una conversación</p>
            </div>
          )}
        </div>
      </main>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.1); }
      `}</style>
    </div>
  );
}

function MessageItem({ message }: { message: WhatsAppMessage }) {
  const isOutbound = message.direction === "outbound";
  
  return (
    <div className={`flex ${isOutbound ? "justify-end" : "justify-start"}`}>
      <div className={`
        max-w-[70%] rounded-2xl p-3 shadow-lg flex flex-col gap-1
        ${isOutbound 
          ? "bg-secondary-container text-on-secondary-container rounded-tr-none" 
          : "bg-surface-container-high text-on-surface rounded-tl-none border border-white/[0.05]"}
      `}>
        {/* Contenido según tipo */}
        {message.message_type === "text" && message.message_text && (
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.message_text}</p>
        )}

        {message.message_type === "image" && message.media_url && (
          <div className="rounded-lg overflow-hidden">
            <img src={message.media_url} alt="WhatsApp content" className="max-w-full h-auto cursor-pointer" />
          </div>
        )}

        {message.message_type === "audio" && message.media_url && (
          <div className="space-y-2">
            <audio controls className="h-8 max-w-full">
              <source src={message.media_url} type="audio/mpeg" />
            </audio>
            {message.transcript && (
              <p className="text-[11px] italic text-on-surface-variant opacity-70 border-t border-white/10 pt-1">
                {message.transcript}
              </p>
            )}
          </div>
        )}

        {message.message_type === "document" && message.media_url && (
          <a 
            href={message.media_url} 
            target="_blank" 
            className="flex items-center gap-2 p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <span className="material-symbols-outlined">description</span>
            <span className="text-xs truncate">Descargar archivo</span>
          </a>
        )}

        {message.message_type === "location" && (
          <div className="space-y-1">
            <div className="flex items-center gap-2 p-2 bg-white/5 rounded-lg">
              <span className="material-symbols-outlined text-red-400">location_on</span>
              <span className="text-xs">Ubicación compartida</span>
            </div>
            {message.media_url && (
              <a href={message.media_url} target="_blank" className="text-[10px] text-secondary-container underline">Ver en mapa</a>
            )}
          </div>
        )}

        {/* Timestamp */}
        <div className={`text-[9px] mt-0.5 self-end opacity-50`}>
          {formatTime(message.created_at)}
        </div>
      </div>
    </div>
  );
}
