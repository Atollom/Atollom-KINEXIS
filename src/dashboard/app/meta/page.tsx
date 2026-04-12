// src/dashboard/app/meta/page.tsx
"use client";

import { useConversations } from "@/hooks/useConversations";
import Image from "next/image";

export default function MetaPage() {
  const { conversations, isLoading } = useConversations();

  return (
    <div className="p-6 h-[calc(100vh-64px)] overflow-hidden flex flex-col">
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-headline tracking-tight text-on-surface">Canales Meta</h1>
        <p className="text-on-surface-variant text-xs uppercase tracking-widest mt-1">Interacciones Unificadas WhatsApp & Instagram</p>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {isLoading ? (
            [1, 2, 3, 4].map(i => <div key={i} className="h-28 bg-surface-container rounded-2xl animate-pulse" />)
          ) : conversations.length === 0 ? (
            <div className="col-span-full py-20 text-center glass-panel rounded-3xl border border-dashed border-white/5">
              <span className="material-symbols-outlined text-4xl text-on-surface-variant opacity-20 mb-4 block">chat_bubble</span>
              <p className="label-sm text-on-surface-variant">Sin conversaciones activas</p>
            </div>
          ) : (
            conversations.map((conv) => (
              <div 
                key={conv.contact}
                className="group p-5 rounded-2xl glass-panel-light hover:bg-surface-bright transition-all duration-300 flex items-start gap-5 cursor-pointer border border-white/5"
              >
                {/* Avatar Section */}
                <div className="relative flex-shrink-0">
                  <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white/10 bg-surface-container-highest flex items-center justify-center">
                    {conv.avatar_url ? (
                      <Image src={conv.avatar_url} alt={conv.contact} width={56} height={56} className="object-cover" />
                    ) : (
                      <span className="material-symbols-outlined text-on-surface-variant">person</span>
                    )}
                  </div>
                  {/* Platform Badge Overlay */}
                  <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center shadow-lg ${
                    conv.channel === 'whatsapp' ? 'bg-[#25D366]' : 'bg-gradient-to-tr from-[#FFDC80] via-[#FD1D1D] to-[#833AB4]'
                  }`}>
                    <span className="material-symbols-outlined text-white text-[12px] filled font-bold">
                      {conv.channel === 'whatsapp' ? 'chat' : 'photo_camera'}
                    </span>
                  </div>
                  {conv.unread_count > 0 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary-container text-[#000f21] text-[10px] font-black flex items-center justify-center glow-primary">
                      {conv.unread_count}
                    </div>
                  )}
                </div>

                {/* Content Section */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-bold text-on-surface group-hover:text-primary-container transition-colors truncate">
                      {conv.contact}
                    </h3>
                    <span className="label-sm text-outline text-[9px]">
                      {new Date(conv.last_activity).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  
                  <p className="text-xs text-on-surface-variant truncate italic mb-3">
                    {conv.last_message || "Sin mensajes"}
                  </p>

                  <div className="flex items-center gap-2">
                    <span className={`chip-active !px-2 !py-0.5 text-[8px] tracking-widest ${
                      conv.intent === 'venta'   ? 'bg-primary-container/10 !text-primary-container !border-primary-container/20' :
                      conv.intent === 'soporte' ? 'bg-[#ffe600]/10 !text-[#ffe600] !border-[#ffe600]/20' :
                      conv.intent === 'reclamo' ? 'bg-error/10 !text-error !border-error/20' :
                      'bg-outline/10 !text-outline !border-outline/20'
                    }`}>
                      {conv.intent.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Action Arrow */}
                <div className="self-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="material-symbols-outlined text-primary-container">arrow_forward_ios</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
