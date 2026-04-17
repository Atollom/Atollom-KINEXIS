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
    <div className="flex h-screen w-full bg-[#040f1b] shell-bg overflow-hidden">

      {/* COLUMNA 1: Sidebar (260px) */}
      <aside className="w-[260px] h-full flex flex-col bg-[#040f1b] shell-bg relative z-20 border-r border-white/5 flex-shrink-0">
        {/* Logo header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <Image
              src="/branding/atollom-icon.png"
              alt="KINEXIS"
              width={40}
              height={40}
              className="w-10 h-10 rounded-xl"
            />
            <div className="flex flex-col">
              <h1 className="text-lg font-semibold text-white tracking-tight leading-none">
                KINEXIS
              </h1>
              <p className="text-[10px] text-white/50 uppercase tracking-wider mt-0.5">
                Integrated AI Systems
              </p>
            </div>
          </div>
          <p className="text-[9px] text-white/30 mt-2 tracking-wide">By Atollom Labs</p>

          {/* User info */}
          {!loading && userName && (
            <div className="mt-3 bg-white/5 rounded-xl px-3 py-2 flex items-center justify-between">
              <p className="text-[9px] font-semibold text-white/50 uppercase tracking-wider truncate">
                {userName}
              </p>
              <span className="text-[8px] font-semibold text-[#CCFF00]/60 uppercase tracking-wider ml-2 flex-shrink-0">
                {userRole}
              </span>
            </div>
          )}
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
