'use client'

import { useEffect, useState } from 'react'
import { UsageCard } from './UsageCard'
import { GenerateInvoiceButton } from './GenerateInvoiceButton'

interface UsageData {
  limit: number
  used: number
  remaining: number
  percentage: number
  status: 'ok' | 'warning' | 'critical'
}

const DEFAULT: UsageData = { limit: 500, used: 127, remaining: 373, percentage: 25.4, status: 'ok' }

export function UsageWrapper() {
  const [data, setData] = useState<UsageData>(DEFAULT)

  useEffect(() => {
    fetch('/api/cfdi/usage')
      .then(r => r.ok ? r.json() : null)
      .then(json => { if (json) setData(json) })
      .catch(() => {})
  }, [])

  const quotaExhausted = data.remaining <= 0

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <GenerateInvoiceButton
          disabled={quotaExhausted}
          disabledReason="Cuota mensual agotada — aumenta tu plan para generar facturas"
        />
      </div>
      <UsageCard {...data} />
    </div>
  )
}
