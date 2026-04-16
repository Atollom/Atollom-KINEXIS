// app/dashboard/page.tsx
'use client'

import { Button } from '@/components/ui/Button'
import { Sparkles, BarChart3, Users, Zap } from 'lucide-react'

export default function DashboardPage() {
  return (
    <>
      {/* Bento Tiles - Operational Telemetry */}
      
      {/* Tile 1: Performance */}
      <div className="bg-white/5 backdrop-blur-3xl p-12 rounded-[3.5rem] shadow-ambient group cursor-pointer hover:bg-white/8 transition-all duration-500">
        <div className="flex flex-col h-full justify-between gap-12">
          <div className="flex items-center justify-between">
            <div className="w-16 h-16 rounded-[2rem] bg-white/5 flex items-center justify-center">
              <BarChart3 className="w-8 h-8 text-[#CCFF00]" />
            </div>
            <div className="px-5 py-2 rounded-full bg-[#CCFF00]/10 text-[10px] font-black text-[#CCFF00] tracking-widest uppercase">
              +12.4%
            </div>
          </div>
          <div>
            <h4 className="text-4xl font-black text-white tracking-tighter uppercase mb-2">Flujo Energético</h4>
            <p className="text-sm font-medium text-white/30 tracking-tight">Rendimiento de nodos en tiempo real.</p>
          </div>
        </div>
      </div>

      {/* Tile 2: User Engagement */}
      <div className="bg-white/5 backdrop-blur-3xl p-12 rounded-[3.5rem] shadow-ambient group cursor-pointer hover:bg-white/8 transition-all duration-500">
        <div className="flex flex-col h-full justify-between gap-12">
          <div className="flex items-center justify-between">
            <div className="w-16 h-16 rounded-[2rem] bg-white/5 flex items-center justify-center">
              <Users className="w-8 h-8 text-blue-400" />
            </div>
          </div>
          <div>
             <div className="flex items-end gap-1 mb-2">
                <span className="text-6xl font-black text-white leading-none tracking-tighter">2,842</span>
                <span className="text-lg font-black text-white/20 mb-1 uppercase tracking-tighter">Nodes</span>
             </div>
            <h4 className="text-xs font-black text-white/40 tracking-[0.2em] uppercase">Audiencia Neural Activa</h4>
          </div>
        </div>
      </div>

      {/* Tile 3: Strategic Action Center */}
      <div className="col-span-1 md:col-span-2 lg:col-span-3 bg-white/5 backdrop-blur-3xl p-12 rounded-[3.5rem] shadow-ambient relative overflow-hidden group">
         <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="max-w-md space-y-6">
               <h2 className="text-6xl font-black text-white tracking-tighter leading-none uppercase">Aprovisionar Nodo <br/><span className="text-[#CCFF00]">Neural Edge</span></h2>
               <p className="text-lg font-medium text-white/30 leading-relaxed">Escale su infraestructura instantáneamente con nodos optimizados por IA en 42 regiones globales.</p>
               <div className="flex gap-4">
                  <Button variant="primary">INICIALIZAR DESPLIEGUE</Button>
                  <Button variant="ghost">VER TELEMETRÍA</Button>
               </div>
            </div>
            <div className="w-full md:w-auto flex items-center justify-center p-12">
               <div className="relative pointer-events-none">
                  <div className="w-64 h-64 rounded-full bg-[#CCFF00]/5 animate-ping duration-3000" />
                  <div className="absolute inset-0 flex items-center justify-center">
                     <Zap className="w-32 h-32 text-[#CCFF00] drop-shadow-[0_0_30px_#CCFF00]" />
                  </div>
               </div>
            </div>
         </div>
      </div>
    </>
  )
}
