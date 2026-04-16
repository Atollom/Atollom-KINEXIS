"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  ts: string;
}

export function SamanthaPanel() {
  const pathname = usePathname();
  
  // Tactical Context Map for Audit
  const contextMap: Record<string, string> = {
    "/erp/finance": "Operativa Financiera / CxC",
    "/erp/inventory": "Supply Chain / Warehouse Alpha",
    "/erp/accounting": "Fiscal Concierge / Audit Prep",
    "/crm/inbox": "Atención / Intelligence Monitoring",
    "/ecommerce/fulfillment": "Logistics Dispatch / Order Flow",
    "/ecommerce/ml": "Marketplace / Mercado Libre Health",
    "/ecommerce/amazon": "Marketplace / Amazon FBA Sync",
    "/ecommerce/b2b": "Enterprise / B2B Pipeline",
  };

  const activeContext = contextMap[pathname] || "Observación General del Sistema";

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "Bienvenido, Comandante. Samantha a su servicio. He sincronizado todos los nodos operativos (Ecommerce, CRM, ERP). Mi red neuronal está lista para asistirle con atención táctica nivel Concierge. ¿En qué sector desea intervenir hoy?",
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
    
    // Simulate "Concierge" intelligence response
    setTimeout(() => {
      let response = "Entendido. Procesando su solicitud en los registros del Nexus...";
      
      const input = inputValue.toLowerCase();
      if (input.includes("mercado libre")) {
        response = "He analizado el sector de Mercado Libre. Su reputación es Platinum, pero he detectado 3 devoluciones recientes. ¿Desea que procese los reembolsos o que contacte a los clientes proactivamente?";
      } else if (input.includes("inventario") || input.includes("stock")) {
        response = "El inventario en Warehouse Alpha muestra niveles óptimos, excepto en el SKU NX-800. Recomiendo generar una orden de compra preventiva por 200 unidades.";
      } else if (input.includes("contador") || input.includes("contabilidad")) {
        response = "He preparado el manifiesto fiscal de Abril 2026. Los XMLs de facturación están listos para ser empaquetados en un ZIP. ¿Desea que lo envíe directamente al correo del contador o prefiere descargarlo usted?";
      }

      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: response, 
        ts: new Date().toISOString() 
      }]);
      setStreaming(false);
    }, 1000);
  }, [inputValue, streaming]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <aside className="fixed right-0 top-0 h-full w-[360px] bg-[#040f1b]/80 backdrop-blur-3xl border-l border-white/5 flex flex-col z-50 hidden xl:flex">
      {/* Header */}
      <div className="p-8 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl overflow-hidden bg-primary/20 flex items-center justify-center border border-primary/40 animate-pulse">
                <span className="material-symbols-outlined text-primary !text-[24px]">neurology</span>
              </div>
              <span className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-primary border-2 border-surface shadow-[0_0_10px_rgba(204,255,0,0.5)]" />
            </div>
            <div>
              <h3 className="text-sm font-black tracking-widest uppercase text-on-surface">Samantha</h3>
              <div className="flex flex-col">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Neural Concierge v5.1</p>
                <div className="flex items-center gap-1.5 mt-1">
                   <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                   <p className="text-[8px] font-black text-on-surface/40 uppercase label-tracking truncate max-w-[150px]">
                     {activeContext}
                   </p>
                </div>
              </div>
            </div>
          </div>
          <button className="text-on-surface/20 hover:text-white transition-colors">
            <span className="material-symbols-outlined !text-[20px]">settings</span>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-95">
        {messages.map((msg, i) => (
          <div key={i} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
            <span className="text-[9px] font-black text-on-surface/30 uppercase label-tracking mb-2 px-1">
              {msg.role === "user" ? "Comandante" : "Samantha Core"}
            </span>
            <div className={`
              max-w-[90%] p-5 rounded-2xl text-[12px] leading-relaxed transition-all animate-in relative
              ${msg.role === "user" 
                ? "bg-white/5 border border-white/10 text-on-surface rounded-tr-none" 
                : "bg-primary/5 border border-primary/20 text-on-surface/90 rounded-tl-none font-medium shadow-[0_0_20px_rgba(204,255,0,0.05)]"}
            `}>
              {msg.content}
            </div>
          </div>
        ))}
        {streaming && (
          <div className="flex items-center gap-3 text-primary animate-pulse">
             <span className="material-symbols-outlined !text-[16px]">hourglass_empty</span>
             <p className="text-[9px] font-black uppercase label-tracking">Samantha analizando registros...</p>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input Section */}
      <div className="p-8 border-t border-white/5 bg-white/[0.02]">
        <div className="flex flex-col gap-4">
           {/* Context Suggestions */}
           <div className="flex flex-wrap gap-2">
              {['Status Mercado Libre', 'Bajo Stock SKUs', 'Reporte Contador'].map(sug => (
                <button 
                  key={sug}
                  onClick={() => setInputValue(sug)}
                  className="px-3 py-1.5 bg-white/5 border border-white/5 rounded-full text-[9px] font-black label-tracking text-on-surface-variant hover:border-primary/30 hover:text-primary transition-all uppercase"
                >
                  {sug}
                </button>
              ))}
           </div>

           <div className="relative group">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Solicitar asistencia táctica..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-[12px] text-on-surface placeholder:text-on-surface/20 outline-none focus:border-primary/40 transition-all font-medium"
              />
              <button 
                onClick={handleSend}
                disabled={streaming || !inputValue.trim()}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-primary text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-glow disabled:opacity-30"
              >
                <span className="material-symbols-outlined font-black !text-[20px]">bolt</span>
              </button>
           </div>
        </div>
        <p className="mt-6 text-[10px] text-center uppercase tracking-[0.2em] text-on-surface/20 font-bold">
          High-Fidelity Concierge Interface
        </p>
      </div>

      {/* Decorative Gradient */}
      <div className="absolute bottom-0 right-0 w-full h-32 bg-gradient-to-t from-primary/5 to-transparent pointer-events-none" />
    </aside>
  );
}
