// components/dashboard/SamanthaPanel.tsx
'use client'

import { Sparkles, Send } from 'lucide-react'

export function SamanthaPanel() {
  return (
    <aside className="w-[320px] h-full flex flex-col bg-[#040f1b] relative z-20">
      
      {/* Header: Zero Border Pristine */}
      <div className="p-8 pb-4">
        <div className="flex items-center gap-4 bg-white/5 backdrop-blur-3xl p-5 rounded-[2rem] shadow-ambient">
          <div className="w-12 h-12 rounded-full bg-[#CCFF00]/10 flex items-center justify-center animate-pulse">
            <Sparkles className="w-6 h-6 text-[#CCFF00]" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-widest">Samantha</h3>
            <p className="text-[10px] font-bold text-[#CCFF00] uppercase tracking-[0.2em] opacity-80">AI Co-Pilot</p>
          </div>
        </div>
      </div>

      {/* Conversation History: Fluid Depth */}
      <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
        {/* Message Bubble - NO USAR BORDERS */}
        <div className="bg-white/5 backdrop-blur-3xl p-6 rounded-[2.5rem] shadow-ambient text-white/90 leading-relaxed text-sm italic">
          <p>¿En qué puedo ayudarte hoy, Comandante? El sistema opera con 43 núcleos activos bajo la arquitectura Pristine.</p>
        </div>
      </div>

      {/* Input Field: Pill Geometry */}
      <div className="p-8 pt-4">
        <div className="relative">
          <input 
            type="text" 
            placeholder="Neural query..."
            className="w-full bg-white/5 backdrop-blur-3xl py-4 pl-8 pr-16 rounded-full 
              text-sm text-white placeholder:text-white/20 outline-none
              shadow-[0_8px_32px_rgba(0,0,0,0.4)] focus:bg-white/10 transition-all font-medium"
          />
          <button className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-[#CCFF00]/10 flex items-center justify-center hover:bg-[#CCFF00]/20 transition-all">
            <Send className="w-4 h-4 text-[#CCFF00]" />
          </button>
        </div>
      </div>

    </aside>
  )
}
