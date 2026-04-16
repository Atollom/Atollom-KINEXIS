// app/dashboard/DashboardShell.tsx
'use client'

import { useState } from 'react'
import { SidebarNav } from '@/components/dashboard/SidebarNav'
import { WorkspaceArea } from '@/components/dashboard/WorkspaceArea'
import { SamanthaPanel } from '@/components/dashboard/SamanthaPanel'
import { Sparkles, Orbit } from 'lucide-react'

export type UserRole = 'ADMIN' | 'ALMACEN' | 'VENTAS'
export type TenantType = 'ATOLLOM' | 'CLIENT'

interface DashboardShellProps {
  planId: 'starter' | 'pro' | 'enterprise'
  children: React.ReactNode
}

export function DashboardShell({ planId, children }: DashboardShellProps) {
  // Demo State: Role Management (V4)
  const [userRole, setUserRole] = useState<UserRole>('ADMIN')
  const [tenantType, setTenantType] = useState<TenantType>('CLIENT')

  return (
    <div className="flex h-screen w-full bg-[#040f1b] overflow-hidden">
      
      {/* COLUMNA 1: Sidebar (280px fijo) */}
      <aside className="w-[280px] h-full flex flex-col bg-[#040f1b] relative z-20 border-r border-white/5">
        <div className="p-8">
           {/* Logo KINEXIS Alpha V4 */}
           <div className="flex flex-col gap-4 mb-10">
              <div className="flex items-center gap-3">
                 <div className="relative">
                    <Orbit className="w-10 h-10 text-[#CCFF00] animate-[spin_10s_linear_infinite]" />
                    <div className="absolute inset-0 bg-[#CCFF00]/20 blur-xl rounded-full" />
                 </div>
                 <div>
                    <h1 className="text-2xl font-black text-white tracking-tighter leading-none">KINEXIS</h1>
                    <p className="text-[10px] font-bold text-[#CCFF00] uppercase tracking-widest opacity-80">Integrated AI Systems</p>
                 </div>
              </div>
              <div className="bg-white/5 p-2 rounded-full text-center">
                 <p className="text-[7px] font-black text-white/20 uppercase tracking-[0.4em]">By Atollom Labs</p>
              </div>
           </div>

           {/* Role Switcher (Solo para auditoría de V4) */}
           <div className="bg-white/5 rounded-2xl p-4 space-y-3">
              <p className="text-[8px] font-bold text-white/20 uppercase tracking-widest">Simulación De Acceso</p>
              <div className="flex flex-wrap gap-2">
                 {(['ADMIN', 'ALMACEN', 'VENTAS'] as UserRole[]).map(r => (
                    <button 
                      key={r}
                      onClick={() => setUserRole(r)}
                      className={`px-3 py-1.5 rounded-full text-[8px] font-bold uppercase transition-all ${userRole === r ? 'bg-[#CCFF00] text-black' : 'bg-white/5 text-white/30 hover:bg-white/10'}`}
                    >
                       {r}
                    </button>
                 ))}
              </div>
           </div>
        </div>
        
        <SidebarNav planId={planId} userRole={userRole} />
      </aside>
      
      {/* COLUMNA 2: Workspace (flexible) */}
      <WorkspaceArea>
        {/* Pasamos el rol a los hijos si es necesario, pero aquí page.tsx manejara su propio sensor de rol via Context si fuera complejo, pero para este override lo haremos directo */}
        <div className="flex-1">
           {/* Inyectamos el rol en el children mediante un patrón de clonación o simplemente confiamos en el prop-drilling en page.tsx si fuera necesario, pero por ahora page.tsx detectará el rol del shell (o via mock) */}
           {/* Para el propósito de V4, page.tsx será actualizado para ser role-aware */}
           {children}
        </div>
      </WorkspaceArea>
      
      {/* COLUMNA 3: Samantha (320px fijo) */}
      <SamanthaPanel userRole={userRole} />
      
    </div>
  )
}
