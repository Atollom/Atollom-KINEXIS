"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import useSWR from "swr";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";
import { subscribeToTable } from "@/lib/realtime";
import { WhatsAppSession, WhatsAppMessage } from "@/types";

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

  const { data: sessionsData, mutate: mutateSessions } = useSWR(
    tenantId ? "/api/meta/inbox" : null,
    fetcher
  );
  const sessions: WhatsAppSession[] = sessionsData?.sessions || [];

  const { data: messagesData, mutate: mutateMessages } = useSWR(
    tenantId && selectedPhone ? `/api/meta/inbox/messages?phone=${selectedPhone}` : null,
    fetcher
  );
  const messages: WhatsAppMessage[] = messagesData?.messages || [];

  const activeSession = useMemo(() => 
    sessions.find(s => s.from_number === selectedPhone),
    [sessions, selectedPhone]
  );

  useEffect(() => {
    if (!tenantId) return;

    const cleanupMessages = subscribeToTable(tenantId, "whatsapp_messages", (payload) => {
      if (payload.eventType === "INSERT") {
        const newMsg = payload.new as unknown as WhatsAppMessage;
        if (newMsg.from_number === selectedPhone) mutateMessages();
        mutateSessions();
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

    const cleanupSessions = subscribeToTable(tenantId, "whatsapp_sessions", () => mutateSessions());

    return () => {
      cleanupMessages();
      cleanupSessions();
    };
  }, [tenantId, selectedPhone, mutateMessages, mutateSessions]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

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
    <div className="flex h-[calc(100vh-120px)] overflow-hidden rounded-3xl border border-outline-variant bg-surface/30 backdrop-blur-2xl">
      {/* Sessions List */}
      <div className="w-[350px] border-r border-outline-variant flex flex-col bg-surface-container/50">
        <div className="p-6 border-b border-outline-variant">
          <h1 className="text-xl font-black tight-tracking mb-4">Neural Inbox</h1>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-3 text-on-surface-variant text-sm">search</span>
            <input 
              type="text" 
              placeholder="Buscar..."
              className="w-full bg-surface-bright border border-outline-variant rounded-2xl py-2.5 pl-11 pr-4 text-[13px] outline-none focus:ring-1 focus:ring-primary transition-all font-medium"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
          {filteredSessions.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelectedPhone(s.from_number)}
              className={`
                w-full px-6 py-4 flex items-start gap-4 transition-all text-left border-b border-outline-variant/30
                ${selectedPhone === s.from_number ? "bg-primary/10" : "hover:bg-white/[0.04]"}
              `}
            >
              <div className="w-12 h-12 rounded-2xl bg-surface-bright flex items-center justify-center flex-shrink-0 border border-outline-variant">
                <span className="material-symbols-outlined text-lg text-primary">person</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-1">
                  <span className="font-bold text-[14px] truncate">{s.from_number}</span>
                  <span className="text-[10px] text-on-surface-variant font-black">{formatTime(s.last_message_at || "")}</span>
                </div>
                <div className="flex items-center gap-2">
                  {s.samantha_active && (
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_var(--primary)]" />
                  )}
                  <p className="text-[12px] text-on-surface-variant truncate font-medium">
                    {s.last_message || "Multimedia"}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Panel */}
      <div className="flex-1 flex flex-col relative bg-surface-container/20">
        {selectedPhone ? (
          <>
            <div className="h-20 px-8 border-b border-outline-variant flex items-center justify-between bg-surface-container/40">
              <div className="flex items-center gap-4">
                <div className="font-black text-[15px] tight-tracking">{selectedPhone}</div>
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full border border-outline-variant ${activeSession?.samantha_active ? 'bg-primary/10 border-primary/20' : ''}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${activeSession?.samantha_active ? 'bg-primary animate-pulse' : 'bg-on-surface-variant'}`} />
                  <span className={`text-[9px] font-black uppercase tracking-widest ${activeSession?.samantha_active ? 'text-primary' : 'text-on-surface-variant'}`}>
                    {activeSession?.samantha_active ? 'IA Activa' : 'Manual'}
                  </span>
                </div>
              </div>
              <button 
                onClick={() => toggleAI(!activeSession?.samantha_active)}
                className={`
                  px-5 py-2 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all
                  ${activeSession?.samantha_active 
                    ? "bg-on-surface-variant/10 text-on-surface hover:bg-on-surface-variant/20" 
                    : "bg-primary text-background shadow-lg shadow-primary/20 hover:scale-105 active:scale-95"}
                `}
              >
                {activeSession?.samantha_active ? "Tomar Control" : "Activar IA"}
              </button>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
              {messages.map((m) => (
                <MessageItem key={m.id} message={m} />
              ))}
            </div>

            <div className="p-6 border-t border-outline-variant bg-surface-container/30">
              <form onSubmit={handleSend} className="flex gap-4 max-w-5xl mx-auto items-end">
                <div className="flex-1 relative">
                  <textarea 
                    rows={1}
                    placeholder={activeSession?.samantha_active ? "IA activa..." : "Escribe un mensaje..."}
                    className="w-full bg-surface-bright border border-outline-variant rounded-2xl py-4 px-6 text-[14px] outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium resize-none max-h-32"
                    value={messageInput}
                    onChange={e => setMessageInput(e.target.value)}
                    disabled={activeSession?.samantha_active}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend(e as any);
                      }
                    }}
                  />
                  {activeSession?.samantha_active && (
                    <div className="absolute inset-0 bg-background/20 backdrop-blur-[1px] rounded-2xl cursor-not-allowed" />
                  )}
                </div>
                <button 
                  type="submit"
                  disabled={isSending || activeSession?.samantha_active || !messageInput.trim()}
                  className="w-14 h-14 rounded-2xl bg-primary text-background flex items-center justify-center disabled:opacity-30 transition-all shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 flex-shrink-0"
                >
                  <span className="material-symbols-outlined font-black">send</span>
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center opacity-20">
            <span className="material-symbols-outlined text-[80px] mb-6">chat_bubble</span>
            <p className="text-[12px] font-black uppercase tracking-[0.4em]">Neural Inbox Ready</p>
          </div>
        )}
      </div>
    </div>
  );
}

function MessageItem({ message }: { message: WhatsAppMessage }) {
  const isOutbound = message.direction === "outbound";
  
  return (
    <div className={`flex ${isOutbound ? "justify-end" : "justify-start"}`}>
      <div className={`
        max-w-[75%] rounded-3xl p-4 shadow-xl flex flex-col gap-2 relative group
        ${isOutbound 
          ? "bg-primary text-background rounded-tr-none shadow-primary/10" 
          : "bg-surface-bright text-on-surface rounded-tl-none border border-outline-variant shadow-black/5"}
      `}>
        {message.message_type === "text" && message.message_text && (
          <p className="text-[14px] leading-relaxed font-medium whitespace-pre-wrap">{message.message_text}</p>
        )}

        {message.message_type === "image" && message.media_url && (
          <div className="rounded-2xl overflow-hidden border border-white/5">
            <img src={message.media_url} alt="WhatsApp content" className="max-w-full h-auto cursor-zoom-in" />
          </div>
        )}

        {message.message_type === "audio" && message.media_url && (
          <div className="space-y-3 min-w-[240px]">
            <audio controls className="h-10 w-full invert brightness-0 dark:invert-0">
              <source src={message.media_url} type="audio/mpeg" />
            </audio>
            {message.transcript && (
              <p className={`text-[12px] italic opacity-70 border-t pt-2 ${isOutbound ? 'border-background/20' : 'border-outline-variant'}`}>
                {message.transcript}
              </p>
            )}
          </div>
        )}

        {message.message_type === "document" && message.media_url && (
          <a 
            href={message.media_url} 
            target="_blank" 
            className={`flex items-center gap-3 p-3 rounded-2xl transition-all ${isOutbound ? 'bg-background/10 hover:bg-background/20' : 'bg-surface-container hover:bg-surface-container-high'}`}
          >
            <span className="material-symbols-outlined">description</span>
            <span className="text-xs font-bold truncate">Archivo recibo</span>
          </a>
        )}

        <div className={`text-[9px] font-black uppercase tracking-tighter self-end opacity-40`}>
          {formatTime(message.created_at)}
        </div>
        
        <div className={`absolute top-0 ${isOutbound ? '-right-1' : '-left-1'} w-2 h-4 ${isOutbound ? 'bg-primary' : 'bg-surface-bright'} clip-path-triangle`} />
      </div>
    </div>
  );
}
