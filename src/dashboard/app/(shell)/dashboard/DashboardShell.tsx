// app/dashboard/DashboardShell.tsx
'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { SidebarNav } from '@/components/dashboard/SidebarNav'
import { WorkspaceArea } from '@/components/dashboard/WorkspaceArea'
import { SamanthaPanel } from '@/components/dashboard/SamanthaPanel'
import { LogoutButton } from '@/components/LogoutButton'
import { createBrowserSupabaseClient } from '@/lib/supabase-browser'
import type { UserRole } from '@/types'

interface DashboardShellProps {
  planId?: 'starter' | 'pro' | 'enterprise'
  children: React.ReactNode
}

export function DashboardShell({ planId = 'enterprise', children }: DashboardShellProps) {
  const [userRole, setUserRole] = useState<UserRole>('viewer')
  const [userName, setUserName] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createBrowserSupabaseClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { setLoading(false); return }

      // Try user_profiles first (may be blocked by RLS if migrations pending)
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role, full_name, display_name')
        .eq('id', user.id)
        .single()

      // Fallback chain: DB profile → JWT user_metadata → 'viewer'
      const role = (profile?.role ?? user.user_metadata?.role ?? 'viewer') as UserRole
      const name = profile?.full_name ?? profile?.display_name ?? user.user_metadata?.full_name ?? ''

      setUserRole(role)
      localStorage.setItem('kinexis_role', role)
      if (name) setUserName(name)
      setLoading(false)
    })
  }, [])

  return (
    <div className="flex h-screen w-full bg-[#040f1b] overflow-hidden">

      {/* COLUMNA 1: Sidebar (260px) */}
      <aside className="w-[260px] h-full flex flex-col bg-[#040f1b] relative z-20 border-r border-white/5 flex-shrink-0">
        {/* Logo header */}
        <div className="px-5 pt-5 pb-3">
          <div className="flex items-center gap-3">
            <div className="relative flex-shrink-0">
              <div className="absolute inset-0 bg-[#CCFF00]/20 blur-xl rounded-full" />
              <Image
                src="/branding/logo.png"
                alt="KINEXIS"
                width={36}
                height={36}
                className="object-contain relative z-10"
              />
            </div>
            <div>
              <h1 className="text-sm font-black text-white tracking-tighter leading-none">KINEXIS</h1>
              <p className="text-[8px] font-bold text-[#CCFF00] uppercase tracking-[0.2em] opacity-70 mt-0.5">
                Integrated AI Systems
              </p>
            </div>
          </div>

          {/* User info */}
          {!loading && userName && (
            <div className="mt-3 bg-white/5 rounded-xl px-3 py-2 flex items-center justify-between">
              <p className="text-[9px] font-black text-white/40 uppercase tracking-wider truncate">
                {userName}
              </p>
              <span className="text-[8px] font-black text-[#CCFF00]/50 uppercase tracking-wider ml-2 flex-shrink-0">
                {userRole}
              </span>
            </div>
          )}

          <div className="h-px bg-white/5 mt-3" />
        </div>

        <SidebarNav planId={planId} userRole={userRole} />

        {/* Logout */}
        <div className="px-3 pb-4 border-t border-white/5 pt-3">
          <LogoutButton />
        </div>
      </aside>

      {/* COLUMNA 2: Workspace (flexible) */}
      <WorkspaceArea>
        {children}
      </WorkspaceArea>

      {/* COLUMNA 3: Samantha (300px) */}
      <SamanthaPanel userRole={userRole} />

    </div>
  )
}
