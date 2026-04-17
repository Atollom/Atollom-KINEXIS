'use client'

import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { createBrowserSupabaseClient } from '@/lib/supabase-browser'

export function LogoutButton() {
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createBrowserSupabaseClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <button
      onClick={handleLogout}
      className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-white/30 hover:text-red-400 hover:bg-red-400/10 transition-all duration-200 group"
    >
      <LogOut className="w-3.5 h-3.5 flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
      <span className="text-[10px] font-black uppercase tracking-widest">Cerrar Sesión</span>
    </button>
  )
}
