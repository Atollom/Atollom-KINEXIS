// components/dashboard/SidebarNav.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  ChevronRight,
  ShoppingCart,
  Users,
  BarChart3,
  Settings,
  ShieldCheck,
  LayoutDashboard,
} from 'lucide-react'
import type { UserRole } from '@/types'

interface SubItem {
  id: string
  title: string
  path: string
}

interface NavModule {
  id: string
  title: string
  icon: any
  submodules: SubItem[]
  roles: UserRole[]
}

const MODULES: NavModule[] = [
  {
    id: 'dashboard',
    title: 'DASHBOARD',
    icon: LayoutDashboard,
    submodules: [
      { id: 'home', title: 'Centro de Control', path: '/dashboard' },
    ],
    roles: ['owner', 'admin', 'socia', 'atollom_admin', 'almacenista', 'warehouse', 'agente', 'contador', 'viewer'],
  },
  {
    id: 'ecommerce',
    title: 'E-COMMERCE',
    icon: ShoppingCart,
    submodules: [
      { id: 'ecommerce-dashboard', title: 'Dashboard', path: '/ecommerce' },
      { id: 'ml', title: 'Mercado Libre', path: '/ecommerce/mercadolibre' },
      { id: 'amazon', title: 'Amazon', path: '/ecommerce/amazon' },
      { id: 'shopify', title: 'Shopify / B2B', path: '/ecommerce/shopify' },
    ],
    roles: ['owner', 'admin', 'socia', 'atollom_admin', 'almacenista', 'warehouse'],
  },
  {
    id: 'crm',
    title: 'CRM',
    icon: Users,
    submodules: [
      { id: 'crm-dashboard', title: 'Dashboard', path: '/crm' },
      { id: 'pipeline', title: 'Pipeline', path: '/crm/pipeline' },
      { id: 'whatsapp', title: 'WhatsApp', path: '/meta/whatsapp' },
      { id: 'instagram', title: 'Instagram', path: '/meta' },
      { id: 'messenger', title: 'Messenger', path: '/crm/messenger' },
      { id: 'cotizaciones', title: 'Cotizaciones', path: '/crm/cotizaciones' },
    ],
    roles: ['owner', 'admin', 'socia', 'atollom_admin', 'agente'],
  },
  {
    id: 'erp',
    title: 'ERP',
    icon: BarChart3,
    submodules: [
      { id: 'erp-dashboard', title: 'Dashboard', path: '/erp' },
      { id: 'cfdi', title: 'CFDI / SAT', path: '/erp/cfdi' },
      { id: 'contabilidad', title: 'Contabilidad', path: '/erp/accounting' },
      { id: 'finanzas', title: 'Finanzas', path: '/erp/finance' },
      { id: 'inventario', title: 'Inventario', path: '/erp/inventory' },
      { id: 'compras', title: 'Compras', path: '/erp/procurement' },
    ],
    roles: ['owner', 'admin', 'socia', 'atollom_admin', 'almacenista', 'warehouse', 'contador'],
  },
  {
    id: 'system',
    title: 'CONFIGURACIÓN',
    icon: Settings,
    submodules: [
      { id: 'usuarios', title: 'Usuarios', path: '/settings' },
      { id: 'perfil', title: 'Mi Perfil', path: '/settings/profile' },
      { id: 'integraciones', title: 'Integraciones', path: '/settings/integrations' },
    ],
    roles: ['owner', 'admin', 'socia', 'atollom_admin'],
  },
  {
    id: 'atollom',
    title: 'ATOLLOM CENTRAL',
    icon: ShieldCheck,
    submodules: [
      { id: 'admin', title: 'Panel Admin', path: '/atollom' },
    ],
    roles: ['atollom_admin'],
  },
]

const STORAGE_KEY = 'kinexis_sidebar_expanded'

interface SidebarNavProps {
  planId?: string
  userRole: UserRole
}

export function SidebarNav({ userRole }: SidebarNavProps) {
  const pathname = usePathname()

  const [expanded, setExpanded] = useState<string[]>(() => {
    if (typeof window === 'undefined') return ['ecommerce', 'crm', 'erp']
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? JSON.parse(saved) : ['ecommerce', 'crm', 'erp']
    } catch {
      return ['ecommerce', 'crm', 'erp']
    }
  })

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(expanded)) } catch {}
  }, [expanded])

  const toggleModule = (id: string) => {
    setExpanded(prev =>
      prev.includes(id) ? prev.filter(k => k !== id) : [...prev, id]
    )
  }

  const visibleModules = MODULES.filter(mod => mod.roles.includes(userRole))

  return (
    <nav className="flex-1 overflow-y-auto custom-scrollbar pb-6">
      <p className="text-[9px] font-black text-white/10 uppercase tracking-[0.4em] px-5 mb-3 mt-1">
        Módulos
      </p>

      <div className="space-y-0.5 px-3">
        {visibleModules.map((mod) => {
          const isExpanded = expanded.includes(mod.id)
          const isActive = mod.submodules.some(s =>
            pathname === s.path || pathname.startsWith(s.path + '/')
          )
          const isSingleItem = mod.submodules.length === 1

          if (isSingleItem) {
            const item = mod.submodules[0]
            const isCurrent = pathname === item.path || pathname.startsWith(item.path + '/')
            return (
              <Link
                key={mod.id}
                href={item.path}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 group ${
                  isCurrent
                    ? 'bg-[#CCFF00]/10 text-[#CCFF00]'
                    : 'hover:bg-white/5 text-white/40 hover:text-white'
                }`}
              >
                <mod.icon className={`w-3.5 h-3.5 flex-shrink-0 ${isCurrent ? 'text-[#CCFF00]' : 'text-white/20 group-hover:text-white/60'}`} />
                <span className="text-[10px] font-black uppercase tracking-widest">{mod.title}</span>
              </Link>
            )
          }

          return (
            <div key={mod.id}>
              <button
                onClick={() => toggleModule(mod.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all duration-200 group ${
                  isActive ? 'bg-white/5' : 'hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <mod.icon className={`w-3.5 h-3.5 flex-shrink-0 transition-colors ${
                    isActive ? 'text-[#CCFF00]' : 'text-white/20 group-hover:text-white/60'
                  }`} />
                  <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${
                    isActive ? 'text-white' : 'text-white/40 group-hover:text-white/80'
                  }`}>
                    {mod.title}
                  </span>
                </div>
                <ChevronRight className={`w-3 h-3 flex-shrink-0 transition-all duration-300 ${
                  isExpanded ? 'rotate-90 text-[#CCFF00]/60' : 'text-white/10'
                }`} />
              </button>

              {isExpanded && (
                <div className="ml-6 pl-3 border-l border-white/5 mt-0.5 mb-1 space-y-0.5">
                  {mod.submodules.map(item => {
                    const isCurrent = pathname === item.path || pathname.startsWith(item.path + '/')
                    return (
                      <Link
                        key={item.id}
                        href={item.path}
                        className={`flex items-center gap-2.5 px-2 py-1.5 rounded-lg transition-all duration-150 group/sub ${
                          isCurrent ? 'text-[#CCFF00]' : 'text-white/25 hover:text-white/80'
                        }`}
                      >
                        <div className={`w-1 h-1 rounded-full flex-shrink-0 transition-all ${
                          isCurrent ? 'bg-[#CCFF00] shadow-[0_0_6px_#CCFF00]' : 'bg-white/10 group-hover/sub:bg-white/40'
                        }`} />
                        <span className={`text-[9px] font-bold tracking-wide transition-colors ${
                          isCurrent ? 'font-black' : ''
                        }`}>
                          {item.title}
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
      <div className="mx-3 mt-6 px-3 py-2 bg-white/3 rounded-xl">
        <p className="text-[8px] font-black text-white/20 uppercase tracking-widest text-center">
          Acceso: <span className="text-[#CCFF00]/50">{userRole}</span>
        </p>
      </div>
    </nav>
  )
}
