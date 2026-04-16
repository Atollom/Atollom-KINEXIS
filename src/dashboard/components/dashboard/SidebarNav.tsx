'use client'
import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

// DEFINICIÓN DE INTERFAZ (Esto arregla el error de Vercel)
interface NavModule {
  label: string;
  items: string[];
  requiresPlan?: string[]; // El '?' indica que es opcional
}

const MODULES: Record<string, NavModule> = {
  ecommerce: {
    label: 'Ecommerce',
    items: ['Catálogo', 'Órdenes', 'Logística']
  },
  crm: {
    label: 'CRM',
    items: ['Inbox', 'Pipeline', 'Audiencias']
  },
  erp: {
    label: 'ERP',
    items: ['Finanzas', 'SAT', 'Inventario'],
    requiresPlan: ['pro', 'enterprise'] 
  },
  sistema: {
    label: 'Sistema',
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
        // TENANCY GATING corregido
        if (module.requiresPlan && !module.requiresPlan.includes(planId)) {
          return null
        }
        
        const isExpanded = expanded.includes(key)
        
        return (
          <div key={key} className="flex flex-col gap-2">
            <button
              onClick={() => toggleModule(key)}
              className="w-full flex items-center justify-between px-5 py-3.5 
                rounded-full bg-white/5 backdrop-blur-3xl
                hover:bg-white/10 transition-all duration-200"
            >
              <span className="text-sm font-medium text-white/90">{module.label}</span>
              <ChevronDown className={`w-4 h-4 text-white/40 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
            </button>
            
            {isExpanded && (
              <div className="flex flex-col gap-1 px-4">
                {module.items.map(item => (
                  <div key={item} className="px-4 py-2 text-xs text-white/50 hover:text-[#CCFF00] cursor-pointer transition-colors">
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
