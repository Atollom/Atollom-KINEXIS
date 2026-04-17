"use client";

import { useState } from "react";

interface Conversation {
  id: string;
  phone: string;
  name: string;
  last_message: string;
  unread: number;
  ai_managed: boolean;
  last_time: string;
  messages: Message[];
}

interface Message {
  id: string;
  role: "user" | "agent" | "ai";
  content: string;
  time: string;
}

const demoConversations: Conversation[] = [
  { id: "1", phone: "5512345678", name: "María González", last_message: "Perfecto, ya confirmo tu pedido", unread: 0, ai_managed: true, last_time: "14:32", messages: [] },
  { id: "2", phone: "5587654321", name: "Juan Pérez", last_message: "Cuando llega mi paquete?", unread: 2, ai_managed: false, last_time: "13:18", messages: [] },
  { id: "3", phone: "5544556677", name: "Carlos Ramírez", last_message: "Gracias por la información", unread: 0, ai_managed: true, last_time: "12:45", messages: [] },
  { id: "4", phone: "5511223344", name: "Ana Martínez", last_message: "Quiero cambiar mi pedido", unread: 1, ai_managed: false, last_time: "11:22", messages: [] },
  { id: "5", phone: "5599887766", name: "Laura Sánchez", last_message: "¿Tienen stock de la SKU-123?", unread: 0, ai_managed: true, last_time: "10:15", messages: [] },
];

export default function MetaWhatsAppPage() {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [aiMode, setAiMode] = useState(true);
  const [inputValue, setInputValue] = useState("");

  return (
    <div className="h-[calc(100vh-4rem)] flex">
      {/* Lista de conversaciones */}
      <div className="w-[320px] border-r border-white/[0.06] bg-white/[0.02]">
        <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
          <h2 className="font-bold text-on-surface">WhatsApp</h2>
          <div className="flex items-center gap-3">
            <span className="text-xs text-on-surface-variant">IA</span>
            <button 
              onClick={() => setAiMode(!aiMode)}
              className={`w-10 h-5 rounded-full transition-colors ${aiMode ? 'bg-[#A8E63D]' : 'bg-white/[0.1]'}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${aiMode ? 'translate-x-5' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto h-[calc(100%-60px)]">
          {demoConversations.map((conv) => (
            <div 
              key={conv.id}
              onClick={() => setSelectedConversation(conv.id)}
              className={`p-4 border-b border-white/[0.04] cursor-pointer hover:bg-white/[0.04] transition-colors ${selectedConversation === conv.id ? 'bg-white/[0.06]' : ''}`}
            >
              <div className="flex items-start justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-on-surface">{conv.name}</span>
                  {conv.ai_managed && (
                    <span className="px-1.5 py-0.5 bg-[#A8E63D]/20 text-[#A8E63D] text-xs rounded-md">🤖 IA</span>
                  )}
                </div>
                <span className="text-xs text-on-surface-variant">{conv.last_time}</span>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-on-surface-variant truncate flex-1 mr-2">{conv.last_message}</p>
                {conv.unread > 0 && (
                  <span className="px-1.5 py-0.5 bg-[#A8E63D] text-[#0D1B3E] text-xs font-bold rounded-full">{conv.unread}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-on-surface">
                    {demoConversations.find(c => c.id === selectedConversation)?.name}
                  </h3>
                  {demoConversations.find(c => c.id === selectedConversation)?.ai_managed && (
                    <span className="px-1.5 py-0.5 bg-[#A8E63D]/20 text-[#A8E63D] text-xs rounded-md">🤖 Gestionado por IA</span>
                  )}
                </div>
                <p className="text-xs text-on-surface-variant">
                  {demoConversations.find(c => c.id === selectedConversation)?.phone}
                </p>
              </div>
              <button className="px-3 py-1.5 bg-white/[0.06] text-on-surface rounded-lg text-xs font-bold hover:bg-white/[0.1] transition-all">
                Ver perfil
              </button>
            </div>

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto p-4 bg-[#071020]">
              <div className="text-center text-xs text-on-surface-variant mb-4">Hoy</div>
              
              <div className="flex justify-start mb-4">
                <div className="bg-white/[0.06] rounded-2xl rounded-tl-none px-4 py-2 max-w-[65%]">
                  <p className="text-sm text-on-surface">Buen día, ¿en qué puedo ayudarte hoy?</p>
                  <p className="text-[10px] text-on-surface-variant text-right mt-1">14:30 • 🤖 Samantha</p>
                </div>
              </div>

              <div className="flex justify-end mb-4">
                <div className="bg-[#A8E63D] rounded-2xl rounded-br-none px-4 py-2 max-w-[65%]">
                  <p className="text-sm text-[#0D1B3E]">Hola, quiero información sobre el producto SKU-789</p>
                  <p className="text-[10px] text-[#0D1B3E]/60 text-right mt-1">14:31</p>
                </div>
              </div>

              <div className="flex justify-start mb-4">
                <div className="bg-white/[0.06] rounded-2xl rounded-tl-none px-4 py-2 max-w-[65%]">
                  <p className="text-sm text-on-surface">Perfecto, el producto SKU-789 tiene stock de 47 unidades, precio $897 MXN. ¿Te gustaría que te genere la liga de compra directa?</p>
                  <p className="text-[10px] text-on-surface-variant text-right mt-1">14:32 • 🤖 Samantha</p>
                </div>
              </div>
            </div>

            {/* Input */}
            <div className="p-4 border-t border-white/[0.06]">
              <div className="flex gap-3">
                <input 
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Escribe un mensaje..."
                  className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 py-2.5 text-on-surface focus:outline-none focus:border-[#A8E63D]/50"
                />
                <button className="px-4 py-2.5 bg-[#A8E63D] text-[#0D1B3E] rounded-lg font-bold hover:bg-[#8BCF34] transition-all">
                  <span className="material-symbols-outlined">send</span>
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <span className="material-symbols-outlined text-5xl text-on-surface-variant mb-4">chat</span>
              <p className="text-on-surface-variant">Selecciona una conversación</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}