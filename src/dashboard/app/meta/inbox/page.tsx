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
            new Notification("New Signal from " + newMsg.from_number, {
              body: newMsg.message_text || "Attachment received",
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
    <div className="flex h-[calc(100vh-140px)] overflow-hidden rounded-[3rem] border border-white/5 bg-black/40 backdrop-blur-2xl animate-luxe shadow-2xl relative">
      
      {/* Sessions Sidebar */}
      <div className="w-[380px] border-r border-white/5 flex flex-col bg-white/[0.02] relative z-10">
        <div className="p-8 border-b border-white/5 space-y-6">
          <div className="flex items-center gap-4">
             <div className="w-10 h-10 rounded-xl bg-[#ccff00]/10 flex items-center justify-center border border-[#ccff00]/20">
                <span className="material-symbols-outlined text-[#ccff00] text-xl shadow-volt">satellite_alt</span>
             </div>
             <h1 className="text-xl font-black uppercase tracking-tighter text-white">Neural Hub</h1>
          </div>
          
          <div className="relative group">
            <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-white/20 text-lg group-focus-within:text-[#ccff00] transition-colors">search</span>
            <input 
              type="text" 
              placeholder="Scan frequencies..."
              className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 pl-14 pr-6 text-[12px] font-black uppercase tracking-widest outline-none focus:border-[#ccff00]/30 transition-all placeholder:text-white/10 italic"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">
          {filteredSessions.length === 0 ? (
             <div className="py-12 text-center opacity-20">
                <p className="text-[10px] font-black uppercase tracking-widest italic">No signals found</p>
             </div>
          ) : (
            filteredSessions.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedPhone(s.from_number)}
                className={`
                  w-full px-6 py-6 rounded-[2rem] flex items-start gap-5 transition-all duration-500 text-left relative overflow-hidden group
                  ${selectedPhone === s.from_number ? "bg-white/10 border-white/10 shadow-xl" : "hover:bg-white/[0.04] border border-transparent"}
                `}
              >
                {selectedPhone === s.from_number && (
                   <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#ccff00] shadow-volt" />
                )}
                
                <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center flex-shrink-0 relative group-hover:border-[#ccff00]/30 transition-all">
                  <span className="material-symbols-outlined text-xl text-white/30 group-hover:text-[#ccff00]">person</span>
                  {s.samantha_active && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#ccff00] animate-pulse shadow-volt" />
                  )}
                </div>

                <div className="flex-1 min-w-0 pt-1">
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="font-black text-[13px] text-white uppercase tracking-tighter truncate">{s.from_number}</span>
                    <span className="text-[9px] text-white/20 font-black italic">{formatTime(s.last_message_at || "")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-[11px] text-white/40 truncate italic font-medium">
                      {s.last_message || "Multimedia transmission"}
                    </p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Neural Bridge View */}
      <div className="flex-1 flex flex-col relative bg-gradient-to-br from-black to-white/[0.02]">
        {selectedPhone ? (
          <>
            {/* Bridge Info Bar */}
            <div className="h-24 px-10 border-b border-white/5 flex items-center justify-between bg-white/[0.02] backdrop-blur-3xl relative z-10">
              <div className="flex items-center gap-6">
                <div className="text-lg font-black text-white uppercase tracking-tighter italic">{selectedPhone}</div>
                <div className={`flex items-center gap-3 px-4 py-1.5 rounded-full border transition-all duration-500 ${activeSession?.samantha_active ? 'bg-[#ccff00]/10 border-[#ccff00]/20 text-[#ccff00]' : 'bg-white/5 border-white/5 text-white/20'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${activeSession?.samantha_active ? 'bg-[#ccff00] animate-pulse shadow-volt' : 'bg-white/20 font-black'}`} />
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] italic">
                    {activeSession?.samantha_active ? 'SAMANTHA ACTIVE' : 'MANUAL OVERRIDE'}
                  </span>
                </div>
              </div>
              
              <button 
                onClick={() => toggleAI(!activeSession?.samantha_active)}
                className={`
                  h-12 px-8 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all italic
                  ${activeSession?.samantha_active 
                    ? "bg-white/5 text-white/40 border border-white/5 hover:text-white" 
                    : "bg-[#ccff00] text-black shadow-volt hover:scale-105 active:scale-95"}
                `}
              >
                {activeSession?.samantha_active ? "Assume Control" : "Engage Neural AI"}
              </button>
            </div>

            {/* Neural Canvas */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-10 py-10 space-y-10 custom-scrollbar relative z-0">
               {/* Background Glow */}
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-[#ccff00]/2 rounded-full blur-[120px] pointer-events-none" />
               
              {messages.map((m) => (
                <MessageItem key={m.id} message={m} />
              ))}
            </div>

            {/* Neural Control Deck */}
            <div className="p-10 border-t border-white/5 bg-black/40 relative z-10">
              <form onSubmit={handleSend} className="flex gap-6 max-w-5xl mx-auto items-center">
                <div className="flex-1 relative group">
                  <textarea 
                    rows={1}
                    placeholder={activeSession?.samantha_active ? "Neural link locked..." : "Transmit data..."}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-8 text-[14px] text-white font-medium outline-none focus:border-[#ccff00]/40 transition-all resize-none max-h-32 placeholder:text-white/10 italic"
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
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] rounded-2xl cursor-not-allowed flex items-center justify-center">
                       <span className="text-[9px] font-black text-[#ccff00] uppercase tracking-[0.4em] italic animate-pulse">Neural Synchronization in Progress</span>
                    </div>
                  )}
                </div>
                <button 
                  type="submit"
                  disabled={isSending || activeSession?.samantha_active || !messageInput.trim()}
                  className="w-16 h-16 rounded-2xl bg-[#ccff00] text-black flex items-center justify-center disabled:opacity-10 transition-all shadow-volt hover:scale-105 active:scale-95 flex-shrink-0"
                >
                  <span className="material-symbols-outlined font-black italic">send</span>
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center space-y-8">
            <div className="w-24 h-24 rounded-full bg-white/5 border border-white/5 flex items-center justify-center opacity-10">
               <span className="material-symbols-outlined text-[40px]">cell_tower</span>
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 italic">Awaiting Signal Acquisition</p>
          </div>
        )}
      </div>

    </div>
  );
}

function MessageItem({ message }: { message: WhatsAppMessage }) {
  const isOutbound = message.direction === "outbound";
  
  return (
    <div className={`flex ${isOutbound ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-500`}>
      <div className={`
        max-w-[70%] rounded-[2rem] p-6 flex flex-col gap-4 relative group transition-all duration-300
        ${isOutbound 
          ? "bg-[#ccff00] text-black rounded-tr-none shadow-volt/20" 
          : "bg-white/5 text-white rounded-tl-none border border-white/5 hover:border-white/10 shadow-2xl backdrop-blur-3xl"}
      `}>
        {message.message_type === "text" && message.message_text && (
          <p className="text-[14px] leading-relaxed font-semibold whitespace-pre-wrap">{message.message_text}</p>
        )}

        {message.message_type === "image" && message.media_url && (
          <div className="rounded-2xl overflow-hidden border border-black/10 shadow-2xl">
            <img src={message.media_url} alt="Transmission content" className="max-w-full h-auto cursor-zoom-in hover:scale-105 transition-transform duration-700" />
          </div>
        )}

        {message.message_type === "audio" && message.media_url && (
          <div className="space-y-4 min-w-[280px]">
            <div className="h-10 rounded-xl bg-black/10 flex items-center px-4">
               <audio controls className={`h-8 w-full ${isOutbound ? '' : 'invert'}`}>
                 <source src={message.media_url} type="audio/mpeg" />
               </audio>
            </div>
            {message.transcript && (
              <p className={`text-[12px] italic font-medium opacity-60 border-t pt-4 ${isOutbound ? 'border-black/10 text-black' : 'border-white/10 text-white'}`}>
                &ldquo;{message.transcript}&rdquo;
              </p>
            )}
          </div>
        )}

        {message.message_type === "document" && message.media_url && (
          <a 
            href={message.media_url} 
            target="_blank" 
            className={`flex items-center gap-4 p-5 rounded-2xl transition-all border ${isOutbound ? 'bg-black/5 border-black/10 hover:bg-black/10' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
          >
            <span className={`material-symbols-outlined ${isOutbound ? 'text-black' : 'text-[#ccff00]'}`}>description</span>
            <div className="flex flex-col">
               <span className="text-[11px] font-black uppercase tracking-wider truncate">Digital Fragment</span>
               <span className="text-[9px] opacity-40 uppercase font-black">Open Link</span>
            </div>
          </a>
        )}

        <div className={`text-[9px] font-black uppercase tracking-tighter self-end opacity-30 italic mt-2`}>
          {formatTime(message.created_at)}
        </div>
      </div>
    </div>
  );
}
