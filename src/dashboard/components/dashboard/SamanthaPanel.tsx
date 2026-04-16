// components/dashboard/SamanthaPanel.tsx
'use client'

import { Sparkles, Send, Bell, Receipt, Package, AlertCircle, Activity } from 'lucide-react'

export function SamanthaPanel() {
  const events = [
    { id: 1, type: "success", label: "Factura generada con éxito", desc: "CFDI #4928 - Orthocardio", time: "2m", icon: Receipt, color: "text-[#CCFF00]" },
    { id: 2, type: "warning", label: "Stock bajo en Almacén A", desc: "SKU-Nexus-42 (Item: Stent)", time: "15m", icon: Package, color: "text-red-400" },
    { id: 3, type: "info", label: "Sincronización Completa", desc: "Shopify / Amazon Merged", time: "45m", icon: Activity, color: "text-blue-400" },
    { id: 4, type: "success", label: "Pago verificado", desc: "Stripe Transfer #8842", time: "1h", icon: Receipt, color: "text-emerald-400" },
  ];

  return (
    <aside className="w-[320px] h-full flex flex-col bg-[#040f1b] relative z-20 border-l border-white/5">
      
      {/* Header: Zero Border Pristine */}
      <div className="p-8 pb-4">
        <div className="flex items-center gap-4 bg-white/5 backdrop-blur-3xl p-5 rounded-[2rem] shadow-ambient">
          <div className="w-12 h-12 rounded-full bg-[#CCFF00]/10 flex items-center justify-center animate-pulse">
            <Sparkles className="w-6 h-6 text-[#CCFF00]" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-widest leading-none mb-1">Samantha</h3>
            <p className="text-[10px] font-bold text-[#CCFF00] uppercase tracking-[0.2em] opacity-80">AI Co-Pilot</p>
          </div>
        </div>
      </div>

      {/* System Status: Condensed */}
      <div className="px-8 py-2">
         <div className="bg-white/3 rounded-full px-5 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
               <span className="w-1 h-1 rounded-full bg-[#CCFF00] animate-pulse" />
               <span className="text-[8px] font-bold text-white/40 uppercase tracking-widest">Neural Link</span>
            </div>
            <span className="text-[9px] font-black text-[#CCFF00] uppercase">Active</span>
         </div>
      </div>

      {/* RECENT EVENTS FEED */}
      <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
        <div className="flex items-center gap-3 mb-6">
           <Bell className="w-4 h-4 text-white/20" />
           <h4 className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">Eventos Recientes</h4>
        </div>

        <div className="space-y-6">
           {events.map((ev) => (
             <div key={ev.id} className="relative pl-10 group cursor-pointer">
                <div className={`absolute left-0 top-1 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-all ${ev.color}`}>
                   <ev.icon className="w-4 h-4" />
                </div>
                <div className="space-y-1">
                   <p className="text-xs font-bold text-white/90 group-hover:text-white transition-colors">{ev.label}</p>
                   <p className="text-[10px] font-bold text-white/20 tracking-tight leading-tight">{ev.desc}</p>
                   <p className="text-[9px] font-black text-white/10 uppercase tracking-widest mt-2">{ev.time} ago</p>
                </div>
                {/* Visual Connector Line */}
                <div className="absolute left-[15px] top-10 bottom-[-24px] w-[1px] bg-white/5 last:hidden" />
             </div>
           ))}
        </div>
      </div>

      {/* Input Field: Pill Geometry - Functional Visuals */}
      <div className="p-8 pt-4">
        <div className="relative group">
          <input 
            type="text" 
            placeholder="Comando neural..."
            className="w-full bg-white/5 backdrop-blur-3xl py-4.5 pl-8 pr-16 rounded-full 
              text-sm text-white placeholder:text-white/20 outline-none
              shadow-[0_8px_32px_rgba(0,0,0,0.4)] focus:shadow-[0_0_30px_rgba(204,255,0,0.1)] focus:bg-white/8 transition-all font-medium"
          />
          <button className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-[#CCFF00]/10 flex items-center justify-center hover:bg-[#CCFF00] hover:text-black transition-all group-focus-within:bg-[#CCFF00] group-focus-within:text-black">
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[8px] font-bold text-white/10 text-center mt-6 uppercase tracking-[0.5em]">Press Enter to Execute</p>
      </div>

    </aside>
  )
}
