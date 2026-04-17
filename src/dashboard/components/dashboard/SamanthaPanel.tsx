// components/dashboard/SamanthaPanel.tsx
'use client'

import { 
  Send, 
  Bell, 
  Receipt, 
  Package, 
  Activity, 
  Target, 
  CheckCircle2, 
  AlertCircle, 
  Database,
  ShieldCheck,
  Zap,
  Globe
} from 'lucide-react'
import type { UserRole } from '@/types'

interface SamanthaPanelProps {
  userRole: UserRole
}

export function SamanthaPanel({ userRole }: SamanthaPanelProps) {
  const events = [
    { 
      id: 1, 
      type: "success", 
      label: "Factura SAT Generada", 
      desc: "Folio #A-8842 validado correctamente por el nodo fiscal.", 
      time: "2m", 
      icon: Receipt, 
      color: "text-[#CCFF00]" 
    },
    { 
      id: 2, 
      type: "warning", 
      label: "Alerta de Stock Bajo", 
      desc: "SKU-42 (Almacén Central) por debajo del umbral de seguridad.", 
      time: "15m", 
      icon: AlertCircle, 
      color: "text-red-400" 
    },
    { 
      id: 3, 
      type: "info", 
      label: "Sincronización Supabase", 
      desc: "Réplica de datos maestros completada en 2.3ms (V4 Engine).", 
      time: "1h", 
      icon: Database, 
      color: "text-blue-400" 
    },
    { 
      id: 4, 
      type: "success", 
      label: "Cluster AI Actualizado", 
      desc: "Modelo Atollom Neural optimizado con nuevos logs de ventas.", 
      time: "3h", 
      icon: Activity, 
      color: "text-[#CCFF00]" 
    },
  ];

  return (
    <aside className="w-[320px] h-full flex flex-col bg-[#040f1b] relative z-20 border-l border-white/5">
      
      {/* 1. BRANDING: Atollom AI Logo with Neon Orbit */}
      <div className="p-8 pb-4">
        <div className="bg-white/5 backdrop-blur-3xl p-6 rounded-[2.5rem] shadow-ambient relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-[#CCFF00]/10 to-transparent opacity-50" />
          
          <div className="flex flex-col items-center text-center relative z-10">
             <div className="relative mb-4">
                {/* Orbit Effect */}
                <div className="absolute inset-[-8px] border border-[#CCFF00]/20 rounded-full animate-spin-slow pointer-events-none" />
                <div className="absolute inset-[-4px] border border-[#CCFF00]/40 rounded-full animate-[spin_3s_linear_infinite] pointer-events-none" />
                <div className="w-16 h-16 rounded-full bg-black flex items-center justify-center p-3 shadow-[0_0_20px_rgba(204,255,0,0.2)]">
                   <Globe className="w-10 h-10 text-[#CCFF00] animate-pulse" />
                </div>
             </div>
             <h3 className="text-xs font-black text-white uppercase tracking-[0.4em] mb-1">Samantha <span className="text-[#CCFF00]">AI</span></h3>
             <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest italic">Neural Command v4.0</p>
          </div>
        </div>
      </div>

      {/* 2. AGENT METRIC: Neon Accent Metric */}
      <div className="px-8 mb-6">
         <div className="bg-white/5 backdrop-blur-3xl p-4 rounded-full border border-white/5 flex items-center justify-between group cursor-pointer hover:border-[#CCFF00]/30 transition-all">
            <div className="flex items-center gap-3">
               <div className="w-2 h-2 rounded-full bg-[#CCFF00] shadow-[0_0_10px_#CCFF00] animate-pulse" />
               <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Estado de Fuerza</p>
            </div>
            <p className="text-xl font-black text-white tracking-tighter">
               42 <span className="text-[10px] text-[#CCFF00] uppercase ml-1">Agentes</span>
            </p>
         </div>
      </div>

      {/* 3. RECENT EVENTS: Detailed Static Feed */}
      <div className="flex-1 overflow-y-auto px-8 space-y-8 custom-scrollbar">
        <div className="flex items-center justify-between mb-6">
           <div className="flex items-center gap-3">
              <Bell className="w-4 h-4 text-white/20" />
              <h4 className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">REGISTROS RECIENTES</h4>
           </div>
           <Zap className="w-3 h-3 text-[#CCFF00]/40" />
        </div>

        <div className="space-y-6 pb-10">
           {events.map((ev) => (
             <div key={ev.id} className="relative pl-12 group cursor-pointer">
                <div className={`absolute left-0 top-0 w-9 h-9 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-all border border-white/5 group-hover:border-[#CCFF00]/20 ${ev.color}`}>
                   <ev.icon className="w-4 h-4" />
                </div>
                <div className="space-y-1">
                   <div className="flex items-center justify-between gap-2">
                      <p className="text-[11px] font-black text-white group-hover:text-[#CCFF00] transition-colors uppercase tracking-tight">{ev.label}</p>
                      <p className="text-[9px] font-black text-white/10 uppercase tracking-widest">{ev.time}</p>
                   </div>
                   <p className="text-[10px] font-bold text-white/20 tracking-tight leading-snug">{ev.desc}</p>
                </div>
                <div className="absolute left-[18px] top-11 bottom-[-24px] w-[1px] bg-gradient-to-b from-white/10 to-transparent last:hidden" />
             </div>
           ))}
        </div>
      </div>

      {/* 4. Neural Command: Pill Input */}
      <div className="p-8 pt-4">
        <div className="relative group">
          <input 
            type="text" 
            placeholder={`Neural command...`}
            className="w-full bg-white/5 backdrop-blur-3xl py-4.5 pl-8 pr-16 rounded-full 
              text-xs text-white placeholder:text-white/20 outline-none
              border border-white/5 focus:border-[#CCFF00]/30
              shadow-[0_8px_32px_rgba(0,0,0,0.4)] focus:shadow-[0_0_30px_rgba(204,255,0,0.1)] transition-all font-bold uppercase tracking-widest"
          />
          <button className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-[#CCFF00]/10 flex items-center justify-center hover:bg-[#CCFF00] hover:text-black transition-all group-focus-within:bg-[#CCFF00] group-focus-within:text-black">
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
        <p className="text-[8px] font-bold text-white/10 text-center mt-6 uppercase tracking-[0.5em]">Atollom Intelligence Protocol</p>
      </div>

    </aside>
  )
}
