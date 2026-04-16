// app/dashboard/DashboardShell.tsx
'use client'

import { useState } from 'react'
import { SidebarNav } from '@/components/dashboard/SidebarNav'
import { WorkspaceArea } from '@/components/dashboard/WorkspaceArea'
import { SamanthaPanel } from '@/components/dashboard/SamanthaPanel'

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
           {/* Logo KINEXIS Alpha V4 DEFINITIVO */}
           <div className="flex flex-col gap-6 mb-12">
              <div className="flex flex-col items-center gap-4">
                 <div className="relative group">
                    <div className="absolute inset-0 bg-[#CCFF00]/20 blur-2xl rounded-full group-hover:bg-[#CCFF00]/40 transition-all duration-700" />
                    <img 
                      src="/branding/logo.png" 
                      alt="KINEXIS Logo" 
                      className="w-24 h-24 object-contain relative z-10 animate-[pulse_4s_ease-in-out_infinite]"
                    />
                 </div>
                 <div className="text-center">
                    <h1 className="text-2xl font-black text-white tracking-tighter leading-none mb-1">KINEXIS</h1>
                    <p className="text-[9px] font-bold text-[#CCFF00] uppercase tracking-[0.3em] opacity-80">Integrated AI Systems</p>
                    <div className="h-[1px] w-12 bg-white/10 mx-auto mt-4" />
                    <p className="text-[7px] font-black text-white/20 uppercase tracking-[0.5em] mt-4">By Atollom Labs</p>
                 </div>
              </div>
           </div>

           {/* Role Switcher (Solo para auditoría de V4) */}
           <div className="bg-white/5 rounded-[2.5rem] p-5 space-y-4">
              <p className="text-[8px] font-black text-white/20 uppercase tracking-[0.4em] text-center">Neural Access Key</p>
              <div className="grid grid-cols-1 gap-2">
                 {(['ADMIN', 'ALMACEN', 'VENTAS'] as UserRole[]).map(r => (
                    <button 
                      key={r}
                      onClick={() => {
                         setUserRole(r);
                         localStorage.setItem('kinexis_role', r); // Sync with DashboardPage
                      }}
                      className={`px-4 py-2.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all duration-300 ${
                         userRole === r 
                         ? 'bg-[#CCFF00] text-black shadow-glow' 
                         : 'bg-white/5 text-white/30 hover:bg-white/10 hover:text-white'
                      }`}
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
        <div className="flex-1">
           {children}
        </div>
      </WorkspaceArea>
      
      {/* COLUMNA 3: Samantha (320px fijo) */}
      <SamanthaPanel userRole={userRole} />
      
    </div>
  )
}
