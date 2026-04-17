// app/dashboard/DashboardShell.tsx
'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { SidebarNav } from '@/components/dashboard/SidebarNav'
import { WorkspaceArea } from '@/components/dashboard/WorkspaceArea'
import { SamanthaPanel } from '@/components/dashboard/SamanthaPanel'
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
      const { data } = await supabase
        .from('user_profiles')
        .select('role, full_name')
        .eq('id', user.id)
        .single()
      if (data?.role) {
        setUserRole(data.role as UserRole)
        // Sync to localStorage so DashboardPage can read it
        localStorage.setItem('kinexis_role', data.role)
      }
      if (data?.full_name) setUserName(data.full_name)
      setLoading(false)
    })
  }, [])

  return (
    <div className="flex h-screen w-full bg-[#040f1b] overflow-hidden">

      {/* COLUMNA 1: Sidebar (280px) */}
      <aside className="w-[280px] h-full flex flex-col bg-[#040f1b] relative z-20 border-r border-white/5">
        <div className="p-8 pb-4">
          <div className="flex flex-col items-center gap-4 mb-8">
            <div className="relative group">
              <div className="absolute inset-0 bg-[#CCFF00]/20 blur-2xl rounded-full group-hover:bg-[#CCFF00]/40 transition-all duration-700" />
              <Image
                src="/branding/logo.png"
                alt="KINEXIS Logo"
                width={80}
                height={80}
                className="object-contain relative z-10 animate-[pulse_4s_ease-in-out_infinite]"
              />
            </div>
            <div className="text-center">
              <h1 className="text-xl font-black text-white tracking-tighter leading-none mb-1">KINEXIS</h1>
              <p className="text-[9px] font-bold text-[#CCFF00] uppercase tracking-[0.3em] opacity-80">
                Integrated AI Systems
              </p>
              <div className="h-px w-12 bg-white/10 mx-auto mt-3" />
              <p className="text-[7px] font-black text-white/20 uppercase tracking-[0.5em] mt-3">
                By Atollom Labs
              </p>
            </div>
          </div>

          {/* User info */}
          {!loading && userName && (
            <div className="bg-white/5 rounded-[1.5rem] px-4 py-3 text-center mb-4">
              <p className="text-[9px] font-black text-white/30 uppercase tracking-widest truncate">
                {userName}
              </p>
              <p className="text-[8px] text-[#CCFF00]/50 uppercase tracking-widest mt-0.5">
                {userRole}
              </p>
            </div>
          )}
        </div>

        <SidebarNav planId={planId} userRole={userRole} />
      </aside>

      {/* COLUMNA 2: Workspace (flexible) */}
      <WorkspaceArea>
        {children}
      </WorkspaceArea>

      {/* COLUMNA 3: Samantha (320px) */}
      <SamanthaPanel userRole={userRole} />

    </div>
  )
}
