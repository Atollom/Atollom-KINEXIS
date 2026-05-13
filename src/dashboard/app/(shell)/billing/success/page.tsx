'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

export default function BillingSuccessPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [countdown, setCountdown] = useState(5)
  const sessionId = searchParams.get('session_id')

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          clearInterval(timer)
          router.push('/settings/billing')
          return 0
        }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [router])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
      <div className="w-20 h-20 rounded-full flex items-center justify-center"
        style={{ backgroundColor: 'rgba(74,222,128,0.1)', border: '2px solid rgba(74,222,128,0.3)' }}>
        <span className="material-symbols-outlined !text-[40px] text-[#4ade80]">check_circle</span>
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-black tight-tracking" style={{ color: 'var(--text-primary)' }}>¡Suscripción activada!</h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Tu plan KINEXIS está activo. Bienvenido.</p>
        {sessionId && (
          <p className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>Session: {sessionId.slice(-12)}</p>
        )}
      </div>

      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
        Redirigiendo en <span className="font-bold text-[#CCFF00]">{countdown}s</span>...
      </p>

      <button
        onClick={() => router.push('/settings/billing')}
        className="px-6 py-2.5 rounded-xl text-xs font-bold transition-all hover:opacity-90"
        style={{ backgroundColor: 'var(--accent-primary)', color: '#000' }}
      >
        Ver mi plan
      </button>
    </div>
  )
}
