'use client'

import { useEffect, useState } from 'react'

export function NotificationBadge() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    async function fetchCount() {
      try {
        const res = await fetch('/api/dashboard/urgencies')
        if (!res.ok) return
        const data = await res.json()
        const urgent = (data.urgencies as Array<{ severity: string }> | undefined)?.filter(
          u => u.severity === 'critical' || u.severity === 'high'
        ).length ?? 0
        setCount(urgent)
      } catch {
        // silently ignore — badge just won't show
      }
    }

    fetchCount()
    const interval = setInterval(fetchCount, 2 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  if (count === 0) return null

  return (
    <span
      className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[9px] font-black rounded-full border border-black/20 animate-pulse"
      style={{ backgroundColor: '#FF0055', color: '#fff' }}
    >
      {count > 9 ? '9+' : count}
    </span>
  )
}
