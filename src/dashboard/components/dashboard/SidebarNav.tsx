// components/dashboard/SidebarNav.tsx
'use client'

import { useState } from 'react'
import { 
  ChevronDown, 
  LayoutDashboard, 
  ShoppingCart, 
  Users, 
  BarChart3, 
  Settings, 
  Package, 
  ShieldCheck, 
  Terminal,
  Zap
} from 'lucide-react'
import { UserRole } from '@/app/dashboard/DashboardShell'

interface NavModule {
  label: string
  icon: any
  items: string[]
  roles: UserRole[]
}

const MODULES: Record<string, NavModule> = {
  ecommerce: {
    label: 'Ecommerce',
    icon: ShoppingCart,
    items: ['Catálogo de Productos', 'Gestión de Órdenes', 'Fulfillment / Envíos'],
    roles: ['ADMIN', 'ALMACEN']
  },
  crm: {
    label: 'CRM Alpha',
    icon: Users,
    items: ['Bandeja de Entrada', 'Pipeline de Ventas', 'Audiencias Meta'],
    roles: ['ADMIN', 'VENTAS']
  },
  erp: {
    label: 'ERP Inventario',
    icon: Package,
    items: ['Stock de Almacén', 'Movimientos SAT', 'Suministros Core'],
    roles: ['ADMIN', 'ALMACEN']
  },
  sistema: {
    label: 'Neural System',
    icon: Terminal,
    items: ['Agentes de IA (43)', 'Mission Control', 'Configuración'],
    roles: ['ADMIN']
  }
}

interface SidebarNavProps {
  planId: string
  userRole: UserRole
}

export function SidebarNav({ planId, userRole }: SidebarNavProps) {
  const [expanded, setExpanded] = useState<string[]>(['ecommerce', 'crm', 'erp', 'sistema'])
  
  const toggleModule = (key: string) => {
    setExpanded(prev => 
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    )
  }

  // Filtrado de módulos según el rol (RBAC V4)
  const availableModules = Object.entries(MODULES).filter(([_, mod]) => 
    mod.roles.includes(userRole)
  )

  return (
    <nav className="flex-1 px-6 space-y-6 overflow-y-auto custom-scrollbar pb-10">
      
      <div className="space-y-2">
         <p className="text-[10px] font-black text-white/10 uppercase tracking-[0.4em] mb-4 ml-4">Módulos de Comando</p>
         
         {availableModules.map(([key, mod]) => (
           <div key={key} className="space-y-1">
              <button 
                onClick={() => toggleModule(key)}
                className={`w-full flex items-center justify-between p-4 rounded-[1.5rem] transition-all duration-300 group ${
                  expanded.includes(key) ? 'bg-white/5 shadow-inner' : 'hover:bg-white/5'
                }`}
              >
                 <div className="flex items-center gap-4">
                    <mod.icon className={`w-4 h-4 transition-colors ${expanded.includes(key) ? 'text-[#CCFF00]' : 'text-white/20 group-hover:text-white'}`} />
                    <span className={`text-[11px] font-black uppercase tracking-widest ${expanded.includes(key) ? 'text-white' : 'text-white/40'}`}>
                       {mod.label}
                    </span>
                 </div>
                 <ChevronDown className={`w-3 h-3 text-white/10 transition-transform duration-500 ${expanded.includes(key) ? 'rotate-180 text-[#CCFF00]' : ''}`} />
              </button>
              
              {expanded.includes(key) && (
                <div className="pl-12 pr-4 py-2 space-y-3">
                   {mod.items.map(item => (
                     <div key={item} className="flex items-center gap-3 cursor-pointer group/item">
                        <div className="w-1.5 h-1.5 rounded-full bg-white/5 group-hover/item:bg-[#CCFF00] group-hover/item:shadow-glow transition-all" />
                        <span className="text-[10px] font-bold text-white/20 group-hover/item:text-white transition-colors tracking-tight">
                           {item}
                        </span>
                     </div>
                   ))}
                </div>
              )}
           </div>
         ))}
      </div>

      {/* Audit Control Status */}
      <div className="mt-12 p-6 bg-white/3 rounded-[2rem] border border-white/5">
         <div className="flex items-center gap-3 mb-4">
            <ShieldCheck className="w-4 h-4 text-[#CCFF00]" />
            <p className="text-[9px] font-black text-white uppercase tracking-widest">Aprovisionamiento</p>
         </div>
         <div className="space-y-3">
            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
               <div className="h-full w-full bg-[#CCFF00] opacity-20 animate-pulse" />
            </div>
            <p className="text-[8px] font-bold text-white/10 uppercase tracking-[0.2em]">Sincronía Total Establecida</p>
         </div>
      </div>

    </nav>
  )
}
