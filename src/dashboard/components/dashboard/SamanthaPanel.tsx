// components/dashboard/SamanthaPanel.tsx
'use client'

import { Sparkles, Send, Bell, Receipt, Package, Activity, Target } from 'lucide-react'
import { UserRole } from '@/app/dashboard/DashboardShell'

interface SamanthaPanelProps {
  userRole: UserRole
}

export function SamanthaPanel({ userRole }: SamanthaPanelProps) {
  const getEventsByRole = (role: UserRole) => {
    const common = [
      { id: 10, type: "info", label: "Sincronización Completa", desc: "Clustering Neural Finalizado", time: "1h", icon: Activity, color: "text-blue-400" },
    ];

    if (role === 'VENTAS') {
      return [
        { id: 1, type: "success", label: "Nuevo Lead Calificado", desc: "Proyecto Alpha - $250k", time: "5m", icon: Target, color: "text-blue-400" },
        { id: 2, type: "success", label: "Pago verificado", desc: "Stripe #8842 - Cliente X", time: "20m", icon: Receipt, color: "text-emerald-400" },
        ...common
      ];
    }
    if (role === 'ALMACEN') {
      return [
        { id: 1, type: "warning", label: "Stock Crítico SKU-42", desc: "Solo 2 unidades en Almacén A", time: "2m", icon: Package, color: "text-red-400" },
        { id: 2, type: "success", label: "Surtido Completo", desc: "Ruta 42 - CDMX Centro", time: "15m", icon: Package, color: "text-[#CCFF00]" },
        ...common
      ];
    }
    return [
      { id: 1, type: "success", label: "Factura SAT generada", desc: "Folio #994 - Global Sync", time: "2m", icon: Receipt, color: "text-[#CCFF00]" },
      { id: 2, type: "warning", label: "Alerta de Sistema", desc: "Latencia en Nodo 4 (2.3ms)", time: "10m", icon: Activity, color: "text-red-400" },
      ...common
    ];
  };

  const events = getEventsByRole(userRole);

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
            <p className="text-[10px] font-bold text-[#CCFF00] uppercase tracking-[0.2em] opacity-80">
              {userRole} SUPPORT
            </p>
          </div>
        </div>
      </div>

      {/* Greeting Contextual */}
      <div className="px-8 mb-4">
         <div className="bg-white/5 backdrop-blur-3xl p-6 rounded-[2.5rem] shadow-ambient text-[11px] font-medium text-white/70 italic leading-relaxed">
            {userRole === 'VENTAS' && "Comandante, el pipeline está listo. Hemos detectado 3 oportunidades calientes para cierre hoy."}
            {userRole === 'ALMACEN' && "Operación activa. 14 paquetes listos para despacho. He marcado el SKU-42 como stock crítico."}
            {userRole === 'ADMIN' && "Sistema íntegro. He verificado los 43 núcleos de la arquitectura V4. Todo está en orden."}
         </div>
      </div>

      {/* RECENT EVENTS FEED (ROLE-AWARE) */}
      <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
        <div className="flex items-center gap-3 mb-6">
           <Bell className="w-4 h-4 text-white/20" />
           <h4 className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">Audit Log ({userRole})</h4>
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
                <div className="absolute left-[15px] top-10 bottom-[-24px] w-[1px] bg-white/5 last:hidden" />
             </div>
           ))}
        </div>
      </div>

      {/* Input Field: Pill Geometry */}
      <div className="p-8 pt-4">
        <div className="relative group">
          <input 
            type="text" 
            placeholder={`Comando ${userRole.toLowerCase()}...`}
            className="w-full bg-white/5 backdrop-blur-3xl py-4.5 pl-8 pr-16 rounded-full 
              text-sm text-white placeholder:text-white/20 outline-none
              shadow-[0_8px_32_rgba(0,0,0,0.4)] focus:shadow-[0_0_30px_rgba(204,255,0,0.1)] focus:bg-white/8 transition-all font-medium"
          />
          <button className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-[#CCFF00]/10 flex items-center justify-center hover:bg-[#CCFF00] hover:text-black transition-all group-focus-within:bg-[#CCFF00] group-focus-within:text-black">
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[8px] font-bold text-white/10 text-center mt-6 uppercase tracking-[0.5em]">Neural Direct Access</p>
      </div>

    </aside>
  )
}
