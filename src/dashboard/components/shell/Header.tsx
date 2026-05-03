'use client'

import { useEffect, useRef } from 'react'
import { Bell, User, LogOut } from 'lucide-react'
import { Breadcrumbs } from './Breadcrumbs'
import { ThemeToggle } from '@/components/ThemeToggle'
import { createBrowserSupabaseClient } from '@/lib/supabase-browser'
import { useRouter } from 'next/navigation'
import { NotificationBadge } from '@/components/NotificationBadge'
import { useToast } from '@/components/ToastProvider'

export function Header() {
  const router = useRouter()
  const { showToast } = useToast()
  const toastShown = useRef(false)

  const handleLogout = async () => {
    const supabase = createBrowserSupabaseClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  // Show a one-time toast per session if there are critical urgencies
  useEffect(() => {
    if (toastShown.current) return
    const key = 'kinexis_urgency_toast_session'
    if (sessionStorage.getItem(key)) return

    async function checkUrgencies() {
      try {
        const res = await fetch('/api/dashboard/urgencies')
        if (!res.ok) return
        const data = await res.json()
        const critical = (data.urgencies as Array<{ severity: string }> | undefined)?.filter(
          u => u.severity === 'critical'
        ) ?? []

        if (critical.length > 0) {
          showToast({
            type: 'error',
            title: 'Atención requerida',
            message: `${critical.length} situación${critical.length > 1 ? 'es' : ''} crítica${critical.length > 1 ? 's' : ''} detectada${critical.length > 1 ? 's' : ''}`,
            duration: 8000,
          })
          sessionStorage.setItem(key, '1')
          toastShown.current = true
        }
      } catch {
        // silently ignore
      }
    }

    checkUrgencies()
  }, [showToast])

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
          <NotificationBadge />
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
