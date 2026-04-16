// app/dashboard/DashboardShell.tsx
'use client'

import { SidebarNav } from '@/components/dashboard/SidebarNav'
import { WorkspaceArea } from '@/components/dashboard/WorkspaceArea'
import { SamanthaPanel } from '@/components/dashboard/SamanthaPanel'

interface DashboardShellProps {
  planId: 'starter' | 'pro' | 'enterprise'
  children: React.ReactNode
}

export function DashboardShell({ planId, children }: DashboardShellProps) {
  return (
    <div className="flex h-screen w-full bg-[#040f1b] overflow-hidden">
      
      {/* COLUMNA 1: Sidebar (280px fijo) */}
      <aside className="w-[280px] h-full flex flex-col bg-[#040f1b] relative z-20">
        <div className="p-8">
           <h1 className="text-3xl font-black text-[#CCFF00] tracking-tighter leading-none mb-1">
             KINEXIS
           </h1>
           <div className="flex items-center gap-2">
             <span className="w-1.5 h-1.5 rounded-full bg-[#CCFF00] animate-pulse shadow-[0_0_8px_rgba(204,255,0,0.5)]" />
             <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 italic">
               V3 Purge Architecture
             </span>
           </div>
        </div>
        <SidebarNav planId={planId} />
      </aside>
      
      {/* COLUMNA 2: Workspace (flexible) */}
      <WorkspaceArea>
        {children}
      </WorkspaceArea>
      
      {/* COLUMNA 3: Samantha (320px fijo) */}
      <SamanthaPanel />
      
    </div>
  )
}
