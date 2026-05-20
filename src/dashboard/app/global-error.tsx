'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html>
      <body className="flex min-h-screen flex-col items-center justify-center bg-[#0a0a0a] text-white gap-6 p-8">
        <span className="text-6xl">⚠️</span>
        <h2 className="text-xl font-black">Algo salió mal</h2>
        <p className="text-sm text-white/50 text-center max-w-sm">
          Ocurrió un error inesperado. El equipo ya fue notificado.
        </p>
        <button
          onClick={reset}
          className="px-6 py-3 rounded-xl bg-[#CCFF00] text-black text-sm font-black hover:bg-[#CCFF00]/90 transition-all"
        >
          Intentar de nuevo
        </button>
      </body>
    </html>
  )
}
