// components/dashboard/SidebarNav.tsx
'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

interface SidebarNavProps {
  planId: 'starter' | 'pro' | 'enterprise'
}

interface Module {
  label: string;
  items: string[];
  requiresPlan?: string[];
}

const MODULES: Record<string, Module> = {
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
    requiresPlan: ['pro', 'enterprise'] // Solo Pro+
  },
  sistema: {
    label: 'Sistema',
    items: ['Agentes IA', 'Configuración']
  }
}

export function SidebarNav({ planId }: SidebarNavProps) {
  const [expanded, setExpanded] = useState(['ecommerce'])

  const toggleModule = (key: string) => {
    setExpanded(prev => 
      prev.includes(key) 
        ? prev.filter(k => k !== key)
        : [...prev, key]
    )
  }

  return (
    <nav className="flex flex-col gap-6 p-4">
      {Object.entries(MODULES).map(([key, module]) => {
        // TENANCY GATING: Remove ERP if Starter
        if (module.requiresPlan && !module.requiresPlan.includes(planId)) {
          return null
        }

        const isExpanded = expanded.includes(key)

        return (
          <div key={key} className="space-y-4">
            {/* Module Header */}
            <button
              onClick={() => toggleModule(key)}
              className="w-full flex items-center justify-between px-5 py-3.5 
                rounded-full bg-white/5 backdrop-blur-3xl
                hover:bg-white/8 transition-all duration-200
                shadow-[0_8px_32px_rgba(0,0,0,0.4)] text-white/80 font-semibold"
            >
              <span className="text-sm uppercase tracking-widest">{module.label}</span>
              <ChevronDown 
                className={`w-4 h-4 text-white/60 transition-transform duration-300 ${
                  isExpanded ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Accordion Items */}
            {isExpanded && (
              <div className="flex flex-col gap-2 pl-4 animate-in slide-in-from-top-2 duration-300">
                {module.items.map(item => (
                  <button
                    key={item}
                    className="w-full text-left px-5 py-3 rounded-full
                      text-sm text-white/40 hover:text-white hover:bg-white/5 
                      transition-all duration-200 uppercase tracking-widest"
                  >
                    {item}
                  </button>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </nav>
  )
}
