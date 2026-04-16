"use client";

import { useEffect, useRef, useState } from "react";
import type { ChatMessage } from "@/types";
import { MessageBubble, GuardianSeparator } from "@/components/chat/MessageBubble";
import { CommandInput } from "@/components/chat/CommandInput";
import { ContextSelector, type ChatContext } from "@/components/chat/ContextSelector";
import { AgentAvatar } from "@/components/chat/AgentAvatar";

const WELCOME_MESSAGE: ChatMessage = {
  role: "assistant",
  content:
    "Neural core activo. Soy KINEXIS — tu sistema de inteligencia operacional.\n\n" +
    "Puedo ayudarte con ventas, inventario, CFDI, campañas de ads, y el estado de todos los 43 agentes. ¿Cuál es tu misión?",
  ts: new Date().toISOString(),
};

export default function ChatPage() {
  const [messages, setMessages]       = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [context, setContext]         = useState<ChatContext>("full");
  const [streaming, setStreaming]     = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText]);

  async function handleSend(text: string, files?: File[]) {
    const userMsg: ChatMessage = {
      role: "user",
      content: text + (files && files.length > 0 ? `\n\n📎 Archivos adjuntos: ${files.map(f => f.name).join(', ')}` : ''),
      ts: new Date().toISOString(),
      attachments: files?.map(f => f.name)
    };
    setMessages((prev) => [...prev, userMsg]);
    setStreaming(true);
    setStreamingText("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: text, 
          context,
          history: messages.filter(m => m.role !== 'system').slice(-20) 
        }),
      });

      if (!res.ok || !res.body) throw new Error("Error del servidor");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (!line.startsWith("data:")) continue;
          const data = line.slice(5).trim();
          if (data === "[DONE]") break;
          try {
            const parsed = JSON.parse(data) as { text: string };
            accumulated += parsed.text;
            setStreamingText(accumulated);
          } catch {
            // skip
          }
        }
      }

      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: accumulated || "Sin respuesta del servidor.",
        ts: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: unknown) {
      const errorMsg: ChatMessage = {
        role: "assistant",
        content: `Error de conexión: ${err instanceof Error ? err.message : "desconocido"}. Por favor intenta de nuevo.`,
        ts: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setStreaming(false);
      setStreamingText("");
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] max-w-4xl mx-auto space-y-6 animate-luxe">
      
      {/* Dynamic Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-4 py-2">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-2xl bg-[#ccff00]/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-[#ccff00] text-xl">hub</span>
             </div>
             <div>
                <h1 className="text-3xl font-black tracking-tighter text-white">Neural Core</h1>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#ccff00]/60 italic">Live Intelligence Interface</p>
             </div>
          </div>
        </div>

        <div className="bg-white/5 p-1 rounded-2xl border border-white/5">
          <ContextSelector value={context} onChange={setContext} />
        </div>
      </header>

      {/* Messages Window */}
      <div className="flex-1 min-h-0 glass-card rounded-[2.5rem] border border-white/5 overflow-hidden flex flex-col shadow-2xl relative">
        <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-[#040f1b] to-transparent z-10 pointer-events-none" />
        
        <div 
          className="flex-1 overflow-y-auto px-6 py-12 space-y-8 custom-scrollbar relative z-0"
          role="log"
          aria-live="polite"
        >
          {messages.map((msg, i) => {
            const prevMsg = messages[i - 1];
            const showSeparator = i > 0 && prevMsg.role === "user" && msg.role === "assistant";

            return (
              <div key={i} className="animate-luxe" style={{ animationDelay: `${i * 100}ms` }}>
                {showSeparator && <GuardianSeparator label="KINEXIS Response Sync" />}
                <MessageBubble message={msg} agentName="KINEXIS" />
              </div>
            );
          })}

          {streaming && (
            <div className="animate-pulse">
              <GuardianSeparator label="KINEXIS Analysis In-Progress" />
              <MessageBubble
                message={{
                  role: "assistant",
                  content: streamingText || "Procesando matriz de datos...",
                  ts: new Date().toISOString(),
                }}
                agentName="KINEXIS"
                isStreaming
              />
            </div>
          )}
          <div ref={bottomRef} className="h-4" />
        </div>

        <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-[#040f1b] to-transparent z-10 pointer-events-none" />
      </div>

      {/* Input Module */}
      <div className="px-2">
         <div className="glass-card p-6 rounded-[2rem] border border-white/5 shadow-volt">
            <CommandInput onSend={handleSend} disabled={streaming} />
         </div>
         <p className="text-center text-[9px] font-black text-white/20 uppercase tracking-[0.4em] mt-4">
           Secure encrypted session / Operation controlled by Atollom Neural Core
         </p>
      </div>

    </div>
  );
}
