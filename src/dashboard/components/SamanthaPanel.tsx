"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  ts: string;
}

export function SamanthaPanel() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "Comandante, los sistemas están sincronizados. ¿En qué módulo nos enfocamos ahora?",
      ts: new Date().toISOString(),
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const handleSend = useCallback(async () => {
    if (!inputValue.trim() || streaming) return;
    const userMsg: ChatMessage = { role: "user", content: inputValue, ts: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setInputValue("");
    setStreaming(true);
    
    // Simulate AI response for now (to be replaced by real fetch)
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: "Procesando solicitud... Conexión con base de datos establecida.", 
        ts: new Date().toISOString() 
      }]);
      setStreaming(false);
    }, 1000);
  }, [inputValue, streaming]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <aside className="fixed right-0 top-0 h-full w-[360px] bg-[#040f1b] border-l border-white/5 flex flex-col z-40 hidden xl:flex">
      {/* Header */}
      <div className="p-8 border-b border-white/5">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl overflow-hidden bg-white/5 border border-[#ccff00]/20 flex items-center justify-center">
              <Image src="/ATOLLOM_AI_ICON.png" alt="AI" width={32} height={32} />
            </div>
            <span className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-[#ccff00] border-2 border-[#040f1b] shadow-[0_0_10px_#ccff00]" />
          </div>
          <div>
            <h3 className="text-sm font-black tracking-widest uppercase text-white">Samantha</h3>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#ccff00]">Neural Core v4.1</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`
              max-w-[90%] p-4 rounded-2xl text-[13px] leading-relaxed transition-all animate-luxe
              ${msg.role === "user" 
                ? "bg-[#ccff00] text-black font-medium rounded-tr-none" 
                : "glass-card text-white/90 rounded-tl-none"}
            `}>
              {msg.content}
            </div>
          </div>
        ))}
        {streaming && (
          <div className="flex justify-start">
            <div className="glass-card p-4 rounded-2xl rounded-tl-none flex gap-1">
              <span className="w-1 h-1 rounded-full bg-[#ccff00] animate-bounce" />
              <span className="w-1 h-1 rounded-full bg-[#ccff00] animate-bounce [animation-delay:0.2s]" />
              <span className="w-1 h-1 rounded-full bg-[#ccff00] animate-bounce [animation-delay:0.4s]" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-6 border-t border-white/5">
        <div className="relative flex items-center">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Transmitir comando..."
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white placeholder:text-white/20 outline-none focus:border-[#ccff00]/30 transition-all"
          />
          <button 
            onClick={handleSend}
            className="absolute right-3 w-10 h-10 rounded-xl bg-[#ccff00] text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_#ccff0055]"
          >
            <span className="material-symbols-outlined font-black">arrow_upward</span>
          </button>
        </div>
        <p className="mt-4 text-[10px] text-center uppercase tracking-[0.2em] text-white/20 font-bold">
          End-to-End Neural Encryption
        </p>
      </div>

      {/* Decorative Gradient */}
      <div className="absolute bottom-0 right-0 w-full h-32 bg-gradient-to-t from-[#ccff00]/5 to-transparent pointer-events-none" />
    </aside>
  );
}
