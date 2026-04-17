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
  Zap
} from 'lucide-react'
import Image from 'next/image'
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
    <aside className="w-[300px] h-full flex flex-col bg-[#040f1b] relative z-20 border-l border-white/5 flex-shrink-0">
      
      {/* 1. BRANDING: Atollom AI Logo with Neon Orbit */}
      <div className="px-5 pt-5 pb-3">
        <div className="bg-white/5 backdrop-blur-3xl px-4 py-3 rounded-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#CCFF00]/5 to-transparent" />
          <div className="flex items-center gap-3 relative z-10">
            <div className="relative flex-shrink-0">
              <div className="absolute inset-[-4px] border border-[#CCFF00]/30 rounded-full animate-[spin_3s_linear_infinite] pointer-events-none" />
              <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center shadow-[0_0_15px_rgba(204,255,0,0.15)]">
                <Image src="/branding/atollom-icon.png" alt="Atollom AI" width={34} height={34} className="rounded-full animate-pulse" />
              </div>
            </div>
            <div>
              <h3 className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Samantha <span className="text-[#CCFF00]">AI</span></h3>
              <p className="text-[8px] font-bold text-white/30 uppercase tracking-widest">Neural Command v4.0</p>
            </div>
            <div className="ml-auto">
              <div className="w-2 h-2 rounded-full bg-[#CCFF00] shadow-[0_0_8px_#CCFF00] animate-pulse" />
            </div>
          </div>
        </div>

        {/* Agent count pill */}
        <div className="mt-2 bg-white/3 rounded-xl px-3 py-2 flex items-center justify-between">
          <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">Agentes activos</p>
          <p className="text-sm font-black text-white">42 <span className="text-[9px] text-[#CCFF00]">online</span></p>
        </div>

        <div className="h-px bg-white/5 mt-3" />
      </div>

      {/* 3. RECENT EVENTS: Detailed Static Feed */}
      <div className="flex-1 overflow-y-auto px-5 custom-scrollbar">
        <div className="flex items-center justify-between mb-4">
           <div className="flex items-center gap-2">
              <Bell className="w-3 h-3 text-white/20" />
              <h4 className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">Registros Recientes</h4>
           </div>
           <Zap className="w-3 h-3 text-[#CCFF00]/40" />
        </div>

        <div className="space-y-4 pb-6">
           {events.map((ev) => (
             <div key={ev.id} className="relative pl-10 group cursor-pointer">
                <div className={`absolute left-0 top-0 w-7 h-7 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-all border border-white/5 group-hover:border-[#CCFF00]/20 ${ev.color}`}>
                   <ev.icon className="w-3.5 h-3.5" />
                </div>
                <div className="space-y-0.5">
                   <div className="flex items-center justify-between gap-2">
                      <p className="text-[10px] font-black text-white group-hover:text-[#CCFF00] transition-colors uppercase tracking-tight">{ev.label}</p>
                      <p className="text-[8px] font-black text-white/10 uppercase tracking-widest flex-shrink-0">{ev.time}</p>
                   </div>
                   <p className="text-[9px] font-bold text-white/20 leading-snug">{ev.desc}</p>
                </div>
                <div className="absolute left-[13px] top-9 bottom-[-16px] w-[1px] bg-gradient-to-b from-white/10 to-transparent last:hidden" />
             </div>
           ))}
        </div>
      </div>

      {/* 4. Neural Command: Pill Input */}
      <div className="px-5 pb-5 pt-3">
        <div className="relative group">
          <input
            type="text"
            placeholder="Neural command..."
            className="w-full bg-white/5 py-3 pl-5 pr-12 rounded-full
              text-[10px] text-white placeholder:text-white/20 outline-none
              border border-white/5 focus:border-[#CCFF00]/30
              transition-all font-bold uppercase tracking-wider"
          />
          <button className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#CCFF00]/10 flex items-center justify-center hover:bg-[#CCFF00] hover:text-black transition-all group-focus-within:bg-[#CCFF00] group-focus-within:text-black">
            <Send className="w-3 h-3" />
          </button>
        </div>
        <p className="text-[7px] font-bold text-white/10 text-center mt-3 uppercase tracking-[0.4em]">Atollom Intelligence Protocol</p>
      </div>

    </aside>
  )
}
