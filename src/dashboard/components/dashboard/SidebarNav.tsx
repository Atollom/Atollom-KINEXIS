'use client'
import { useState } from 'react'
import { ChevronDown, ShoppingBag, Users, Warehouse, ShieldCheck, Cpu } from 'lucide-react'

// DEFINICIÓN DE INTERFAZ (Esto arregla el error de Vercel)
interface NavModule {
  label: string;
  icon: any;
  items: string[];
  requiresPlan?: string[];
}

const MODULES: Record<string, NavModule> = {
  ecommerce: {
    label: 'Ecommerce',
    icon: ShoppingBag,
    items: ['Catálogo', 'Órdenes', 'Logística']
  },
  crm: {
    label: 'CRM',
    icon: Users,
    items: ['Inbox', 'Pipeline', 'Audiencias']
  },
  erp: {
    label: 'ERP',
    icon: Warehouse,
    items: ['Finanzas', 'SAT', 'Inventario'],
    requiresPlan: ['pro', 'enterprise'] 
  },
  sistema: {
    label: 'Sistema',
    icon: Cpu,
    items: ['Agentes IA', 'Configuración']
  }
}

export function SidebarNav({ planId }: { planId: string }) {
  const [expanded, setExpanded] = useState(['ecommerce'])
  
  const toggleModule = (key: string) => {
    setExpanded(prev => 
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {Object.entries(MODULES).map(([key, module]) => {
        // TENANCY GATING: ERP oculto en plan Starter
        if (module.requiresPlan && !module.requiresPlan.includes(planId)) {
          return null
        }
        
        const isExpanded = expanded.includes(key)
        const Icon = module.icon
        
        return (
          <div key={key} className="flex flex-col gap-2">
            <button
              onClick={() => toggleModule(key)}
              className="w-full flex items-center justify-between px-5 py-3.5 
                rounded-full bg-white/5 backdrop-blur-3xl
                hover:bg-white/10 transition-all duration-200 group"
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4 text-[#CCFF00] opacity-60 group-hover:opacity-100 transition-opacity" />
                <span className="text-sm font-bold text-white/90 uppercase tracking-widest">{module.label}</span>
              </div>
              <ChevronDown className={`w-4 h-4 text-white/40 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
            </button>
            
            {isExpanded && (
              <div className="flex flex-col gap-1 px-4 animate-in slide-in-from-top-2 duration-300">
                {module.items.map(item => (
                  <div key={item} className="px-10 py-2.5 text-[10px] font-bold text-white/30 hover:text-[#CCFF00] hover:bg-white/5 rounded-full cursor-pointer transition-all uppercase tracking-[0.2em]">
                    {item}
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
