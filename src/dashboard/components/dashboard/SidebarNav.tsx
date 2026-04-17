// components/dashboard/SidebarNav.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  ChevronDown,
  ShoppingCart,
  Users,
  Package,
  Terminal,
  ShieldCheck,
  LayoutDashboard,
} from 'lucide-react'
import type { UserRole } from '@/types'

interface NavItem {
  label: string
  href: string
}

interface NavModule {
  label: string
  icon: any
  items: NavItem[]
  roles: UserRole[]
}

// Real role-to-module mapping aligned with middleware.ts RBAC
const MODULES: Record<string, NavModule> = {
  dashboard: {
    label: 'Dashboard',
    icon: LayoutDashboard,
    items: [{ label: 'Centro de Control', href: '/dashboard' }],
    roles: ['owner', 'admin', 'socia', 'atollom_admin', 'almacenista', 'warehouse', 'agente', 'contador'],
  },
  ecommerce: {
    label: 'Ecommerce',
    icon: ShoppingCart,
    items: [
      { label: 'Vista General', href: '/ecommerce' },
      { label: 'Mercado Libre', href: '/ecommerce' },
      { label: 'Amazon', href: '/amazon' },
      { label: 'Shopify', href: '/shopify' },
    ],
    roles: ['owner', 'admin', 'socia', 'atollom_admin', 'almacenista', 'warehouse'],
  },
  crm: {
    label: 'CRM Alpha',
    icon: Users,
    items: [
      { label: 'Pipeline de Ventas', href: '/crm' },
      { label: 'WhatsApp / Instagram', href: '/meta' },
      { label: 'Bandeja Unificada', href: '/meta/inbox' },
    ],
    roles: ['owner', 'admin', 'socia', 'atollom_admin', 'agente'],
  },
  erp: {
    label: 'ERP Inventario',
    icon: Package,
    items: [
      { label: 'Inventario', href: '/erp/inventory' },
      { label: 'Órdenes de Compra', href: '/erp/procurement' },
      { label: 'Facturación CFDI', href: '/erp/cfdi' },
      { label: 'Almacén', href: '/warehouse' },
    ],
    roles: ['owner', 'admin', 'socia', 'atollom_admin', 'almacenista', 'warehouse', 'contador'],
  },
  sistema: {
    label: 'Neural System',
    icon: Terminal,
    items: [
      { label: 'Configuración', href: '/settings' },
      { label: 'Onboarding', href: '/onboarding' },
    ],
    roles: ['owner', 'admin', 'socia', 'atollom_admin'],
  },
  atollom: {
    label: 'Atollom Central',
    icon: ShieldCheck,
    items: [{ label: 'Panel Admin', href: '/atollom' }],
    roles: ['atollom_admin'],
  },
}

interface SidebarNavProps {
  planId?: string
  userRole: UserRole
}

export function SidebarNav({ userRole }: SidebarNavProps) {
  const pathname = usePathname()
  const [expanded, setExpanded] = useState<string[]>(['ecommerce', 'crm', 'erp'])

  const toggleModule = (key: string) => {
    setExpanded(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    )
  }

  const availableModules = Object.entries(MODULES).filter(([_, mod]) =>
    mod.roles.includes(userRole)
  )

  return (
    <nav className="flex-1 px-6 space-y-6 overflow-y-auto custom-scrollbar pb-10">
      <div className="space-y-2">
        <p className="text-[10px] font-black text-white/10 uppercase tracking-[0.4em] mb-4 ml-4">
          Módulos de Comando
        </p>

        {availableModules.map(([key, mod]) => {
          const isExpanded = expanded.includes(key)
          const isActive = mod.items.some(item => pathname === item.href || pathname.startsWith(item.href + '/'))

          return (
            <div key={key} className="space-y-1">
              <button
                onClick={() => toggleModule(key)}
                className={`w-full flex items-center justify-between p-4 rounded-[1.5rem] transition-all duration-300 group ${
                  isExpanded || isActive ? 'bg-white/5' : 'hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-4">
                  <mod.icon className={`w-4 h-4 transition-colors ${
                    isActive ? 'text-[#CCFF00]' : isExpanded ? 'text-[#CCFF00]' : 'text-white/20 group-hover:text-white'
                  }`} />
                  <span className={`text-[11px] font-black uppercase tracking-widest ${
                    isExpanded || isActive ? 'text-white' : 'text-white/40'
                  }`}>
                    {mod.label}
                  </span>
                </div>
                <ChevronDown className={`w-3 h-3 text-white/10 transition-transform duration-500 ${
                  isExpanded ? 'rotate-180 text-[#CCFF00]' : ''
                }`} />
              </button>

              {isExpanded && (
                <div className="pl-12 pr-4 py-2 space-y-3">
                  {mod.items.map(item => {
                    const isCurrent = pathname === item.href
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="flex items-center gap-3 group/item"
                      >
                        <div className={`w-1.5 h-1.5 rounded-full transition-all ${
                          isCurrent ? 'bg-[#CCFF00] shadow-glow' : 'bg-white/5 group-hover/item:bg-[#CCFF00] group-hover/item:shadow-glow'
                        }`} />
                        <span className={`text-[10px] font-bold tracking-tight transition-colors ${
                          isCurrent ? 'text-[#CCFF00]' : 'text-white/20 group-hover/item:text-white'
                        }`}>
                          {item.label}
                        </span>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Role badge */}
      <div className="mt-8 px-4 py-3 bg-white/3 rounded-[1.5rem]">
        <p className="text-[8px] font-black text-white/20 uppercase tracking-[0.4em] text-center">
          Acceso: <span className="text-[#CCFF00]/60">{userRole}</span>
        </p>
      </div>
    </nav>
  )
}
