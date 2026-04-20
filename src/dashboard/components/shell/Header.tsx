'use client'

import { Bell, User, LogOut } from 'lucide-react'
import { Breadcrumbs } from './Breadcrumbs'
import { createBrowserSupabaseClient } from '@/lib/supabase-browser'
import { useRouter } from 'next/navigation'

export function Header() {
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createBrowserSupabaseClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header className="h-14 border-b border-white/5 bg-[#040f1b] flex items-center justify-between px-6 flex-shrink-0">
      <Breadcrumbs />

      <div className="flex items-center gap-3">
        <button
          className="p-2 hover:bg-white/5 rounded-lg relative transition-colors"
          aria-label="Notificaciones"
        >
          <Bell className="w-4 h-4 text-white/50" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#CCFF00] rounded-full" />
        </button>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg">
          <div className="w-6 h-6 bg-[#CCFF00]/10 rounded-full flex items-center justify-center">
            <User className="w-3.5 h-3.5 text-[#CCFF00]/70" />
          </div>
          <span className="text-xs font-medium text-white/60 hidden md:block">Carlos Cortés</span>
        </div>

        <button
          onClick={handleLogout}
          className="p-2 hover:bg-white/5 rounded-lg transition-colors"
          aria-label="Cerrar sesión"
        >
          <LogOut className="w-4 h-4 text-white/40 hover:text-white/70 transition-colors" />
        </button>
      </div>
    </header>
  )
}
