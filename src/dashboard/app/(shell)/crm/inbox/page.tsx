"use client";

import { useState } from "react";

interface Contact {
  id: string;
  name: string;
  lastMsg: string;
  time: string;
  unread: number;
  status: "ai" | "human" | "attention";
  channel: "whatsapp" | "instagram" | "messenger";
  avatar?: string;
}

interface Message {
  id: string;
  sender: "client" | "samantha" | "agent";
  text: string;
  time: string;
  type: "text" | "image";
  mediaUrl?: string;
}

const MOCK_CONTACTS: Contact[] = [
  { id: "1", name: "Carlos Rivera", lastMsg: "Me interesa la cotización para 500 unidades.", time: "10:24 AM", unread: 2, status: "ai", channel: "whatsapp" },
  { id: "2", name: "Industrial Solutions", lastMsg: "Gracias, lo reviso con mi equipo.", time: "9:15 AM", unread: 0, status: "human", channel: "messenger" },
  { id: "3", name: "Ana Maria (Ventas)", lastMsg: "¿Tienen stock del NX-800?", time: "Ayer", unread: 0, status: "attention", channel: "instagram" },
  { id: "4", name: "Tech Corp", lastMsg: "Enviado el comprobante de pago.", time: "Ayer", unread: 0, status: "human", channel: "whatsapp" },
];

const MOCK_MESSAGES: Message[] = [
  { id: "m1", sender: "client", text: "Hola, me interesa saber el precio por volumen del NX-800 Pulse Hub.", time: "10:15 AM", type: "text" },
  { id: "m2", sender: "samantha", text: "¡Hola Carlos! Con gusto. Para el NX-800, a partir de 100 unidades ofrecemos un descuento del 15%. Para 500 unidades como mencionaste antes, podemos llegar al 22%. ¿Te gustaría que genere una cotización formal?", time: "10:16 AM", type: "text" },
  { id: "m3", sender: "client", text: "Sí, por favor. ¿Puedes incluir el envío a Monterrey?", time: "10:20 AM", type: "text" },
  { id: "m4", sender: "samantha", text: "Entendido. Procesando cotización con destino Monterrey. Un momento por favor...", time: "10:21 AM", type: "text" },
];

export default function UnifiedInboxPage() {
  const [activeContact, setActiveContact] = useState<Contact>(MOCK_CONTACTS[0]);
  const [samanthaPaused, setSamanthaPaused] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="flex h-[calc(100vh-140px)] -mt-10 -mx-10 overflow-hidden glass-card rounded-none md:rounded-3xl border-0 md:border border-white/5">
      
      {/* 1. Left Panel: Contacts List (360px) */}
      <aside className="w-full md:w-[360px] border-r border-white/5 flex flex-col bg-white/[0.02]">
         <div className="p-6 border-b border-white/5 bg-white/[0.02]">
            <h2 className="text-xl font-black text-on-surface tight-tracking mb-4">Inbox Unificado</h2>
            <div className="relative">
               <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface/30 !text-[18px]">search</span>
               <input 
                 type="text" 
                 placeholder="Search contacts..." 
                 className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-[12px] focus:outline-none focus:border-primary/50 transition-all font-medium"
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
               />
            </div>
         </div>

         <div className="flex-1 overflow-y-auto custom-scrollbar">
            {MOCK_CONTACTS.map(contact => (
              <button 
                key={contact.id}
                onClick={() => setActiveContact(contact)}
                className={`w-full p-4 flex gap-4 hover:bg-white/5 transition-colors border-b border-white/[0.02] text-left relative ${activeContact.id === contact.id ? 'bg-primary/5 border-r-2 border-r-primary' : ''}`}
              >
                 <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center border border-white/10">
                       <span className="material-symbols-outlined text-on-surface/40">person</span>
                    </div>
                    <div className={`absolute -right-1 -bottom-1 w-5 h-5 rounded-full border-2 border-[#040f1b] flex items-center justify-center ${contact.channel === 'whatsapp' ? 'bg-[#25D366]' : contact.channel === 'instagram' ? 'bg-gradient-to-tr from-[#f09433] to-[#bc1888]' : 'bg-[#0084FF]'}`}>
                       <span className="material-symbols-outlined !text-[10px] text-white">{contact.channel === 'whatsapp' ? 'chat' : contact.channel === 'instagram' ? 'photo_camera' : 'forum'}</span>
                    </div>
                 </div>
                 
                 <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                       <p className="text-[13px] font-black text-on-surface truncate">{contact.name}</p>
                       <span className="text-[9px] font-bold text-on-surface/30 uppercase">{contact.time}</span>
                    </div>
                    <p className="text-[11px] font-medium text-on-surface-variant truncate opacity-60 leading-tight">
                       {contact.lastMsg}
                    </p>
                    <div className="flex gap-2 mt-2">
                       <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase ${contact.status === 'ai' ? 'bg-primary/10 text-primary' : contact.status === 'human' ? 'bg-blue-500/10 text-blue-400' : 'bg-red-500/10 text-red-500'}`}>
                          {contact.status === 'ai' ? 'AI ACTIVE' : contact.status === 'human' ? 'AGENT ACTIVE' : 'NEEDS ATTENTION'}
                       </span>
                    </div>
                 </div>

                 {contact.unread > 0 && (
                   <div className="absolute right-4 bottom-4 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                      <span className="text-[9px] font-black text-black">{contact.unread}</span>
                   </div>
                 )}
              </button>
            ))}
         </div>
      </aside>

      {/* 2. Main Chat Area */}
      <main className="flex-1 flex flex-col bg-white/[0.01]">
         {/* Chat Header */}
         <header className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
            <div className="flex items-center gap-4">
               <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                  <span className="material-symbols-outlined text-on-surface/40">person</span>
               </div>
               <div>
                  <p className="text-sm font-black text-on-surface">{activeContact.name}</p>
                  <p className="text-[10px] font-bold text-primary uppercase label-tracking">Online / {activeContact.channel}</p>
               </div>
            </div>

            <div className="flex items-center gap-6">
               <div className={`flex items-center gap-3 glass-card px-4 py-2 rounded-xl transition-all duration-500 ${samanthaPaused ? 'border-amber-500/50 bg-amber-500/10 shadow-[0_0_15px_rgba(245,158,11,0.1)]' : 'border-white/5'}`}>
                  <p className="text-[10px] font-black text-on-surface/40 uppercase label-tracking truncate max-w-[80px]">AI Oversight</p>
                  <button 
                    onClick={() => setSamanthaPaused(!samanthaPaused)}
                    className={`relative w-10 h-5 rounded-full transition-colors duration-300 ${samanthaPaused ? 'bg-amber-600/30' : 'bg-primary/20'}`}
                  >
                     <div className={`absolute top-1 w-3 h-3 rounded-full transition-all duration-300 ${samanthaPaused ? 'left-6 bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.8)]' : 'left-1 bg-primary shadow-[0_0_8px_rgba(204,255,0,0.8)]'}`} />
                  </button>
                  <span className={`text-[9px] font-black uppercase tracking-tighter min-w-[65px] ${samanthaPaused ? 'text-amber-500 animate-pulse' : 'text-primary'}`}>
                     {samanthaPaused ? 'AI: OFFLINE' : 'AI: ONLINE'}
                  </span>
               </div>
               
               <button className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all">
                  <span className="material-symbols-outlined text-on-surface/40">more_vert</span>
               </button>
            </div>
         </header>

         {/* Messages Feed */}
         <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-6 custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.98] relative">
            
            {/* Stress Test Banner for Human Control */}
            {samanthaPaused && (
              <div className="sticky top-0 z-10 -mt-2 mb-4">
                 <div className="bg-amber-600/90 backdrop-blur-md border border-amber-400/50 p-3 rounded-2xl flex items-center justify-between shadow-xl animate-in slide-in-from-top duration-500">
                    <div className="flex items-center gap-3">
                       <span className="material-symbols-outlined text-black font-black">warning</span>
                       <div>
                          <p className="text-[10px] font-black text-black uppercase label-tracking">Atención: Control Humano Requerido</p>
                          <p className="text-[9px] font-bold text-black/70 leading-tight">Samantha ha sido intervenida. El historial está bajo supervisión manual.</p>
                       </div>
                    </div>
                    <span className="text-[8px] font-black bg-black text-amber-500 px-2 py-0.5 rounded-full uppercase">MODO MANUAL</span>
                 </div>
              </div>
            )}

            {MOCK_MESSAGES.map((msg, i) => (
              <div 
                key={msg.id} 
                className={`flex flex-col max-w-[70%] ${msg.sender === 'client' ? 'self-start' : 'self-end'}`}
              >
                 <div className={`p-4 rounded-2xl relative ${msg.sender === 'client' ? 'bg-white/5 rounded-tl-none border border-white/10' : 'bg-primary text-black rounded-tr-none font-medium'}`}>
                    <p className="text-[13px] leading-relaxed">{msg.text}</p>
                    <span className={`text-[8px] font-bold mt-2 block ${msg.sender === 'client' ? 'text-on-surface/30' : 'text-black/50'}`}>{msg.time}</span>
                 </div>
                 <span className="text-[9px] font-black uppercase label-tracking mt-1 px-1 opacity-40">
                    {msg.sender === 'samantha' ? '🤖 Samantha AI' : msg.sender === 'agent' ? '👤 Agente Humano' : '👤 Cliente'}
                 </span>
              </div>
            ))}
         </div>

         {/* Input Area */}
         <footer className="p-6 border-t border-white/5 bg-white/[0.02]">
            <div className="flex gap-4 items-center">
               <button className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all text-on-surface/40">
                  <span className="material-symbols-outlined !text-[20px]">add</span>
               </button>
               <input 
                 type="text" 
                 placeholder="Escribe un mensaje..." 
                 className="flex-1 bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-[13px] focus:outline-none focus:border-primary/50 transition-all font-medium"
               />
               <button className="w-12 h-12 rounded-2xl bg-primary text-black flex items-center justify-center hover:scale-105 transition-all shadow-glow">
                  <span className="material-symbols-outlined !text-[20px]">send</span>
               </button>
            </div>
         </footer>
      </main>

      {/* 3. Right: Context Panel (Samantha Insights) - Only visible on XL */}
      <aside className="hidden xl:flex w-[320px] border-l border-white/5 flex-col p-8 gap-8 bg-white/[0.02]">
         <div className="space-y-4">
            <h3 className="text-[10px] font-black label-tracking text-primary uppercase">Samantha Intelligence</h3>
            <div className="glass-card p-5 rounded-2xl border-white/5 bg-primary/5">
                <p className="text-[12px] font-bold text-on-surface leading-snug">
                   "He identificado intención de **Compra Directa**. El cliente ya aceptó el precio de 500 nits. Sugiero cerrar cotización."
                </p>
            </div>
         </div>

         <div className="space-y-4">
            <h3 className="text-[10px] font-black label-tracking text-on-surface/30 uppercase">Customer Profile</h3>
            <div className="space-y-3">
               <div className="flex justify-between">
                  <p className="text-[11px] font-bold text-on-surface/60">Lifetime Value</p>
                  <p className="text-[11px] font-black text-on-surface">$12,450</p>
               </div>
               <div className="flex justify-between">
                  <p className="text-[11px] font-bold text-on-surface/60">Tier</p>
                  <p className="text-[11px] font-black text-primary uppercase">Enterprise</p>
               </div>
               <div className="flex justify-between">
                  <p className="text-[11px] font-bold text-on-surface/60">Lead Score</p>
                  <p className="text-[11px] font-black text-emerald-400">92/100</p>
               </div>
            </div>
         </div>

         <div className="mt-auto">
            <button className="w-full py-4 neon-disruptor rounded-2xl text-[10px] font-black label-tracking shadow-glow">
               GENERAR COTIZACIÓN
            </button>
         </div>
      </aside>
    </div>
  );
}
