'use client'

import { Bell, User, LogOut } from 'lucide-react'
import { Breadcrumbs } from './Breadcrumbs'
import { ThemeToggle } from '@/components/ThemeToggle'
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
    <header
      className="h-14 flex items-center justify-between px-6 flex-shrink-0 transition-colors duration-300"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-color)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <Breadcrumbs />

      <div className="flex items-center gap-1">
        <ThemeToggle />

        <button
          className="p-2 rounded-lg relative transition-colors hover:bg-black/5 dark:hover:bg-white/5"
          aria-label="Notificaciones"
        >
          <Bell className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
          <span
            className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: 'var(--accent-primary)' }}
          />
        </button>

        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg ml-1"
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
          }}
        >
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'rgba(205,255,0,0.1)' }}
          >
            <User className="w-3.5 h-3.5" style={{ color: 'var(--accent-primary)' }} />
          </div>
          <span
            className="text-xs font-medium hidden md:block"
            style={{ color: 'var(--text-secondary)' }}
          >
            Carlos Cortés
          </span>
        </div>

        <button
          onClick={handleLogout}
          className="p-2 rounded-lg transition-colors ml-1 hover:bg-black/5 dark:hover:bg-white/5"
          aria-label="Cerrar sesión"
        >
          <LogOut className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
        </button>
      </div>
    </header>
  )
}
