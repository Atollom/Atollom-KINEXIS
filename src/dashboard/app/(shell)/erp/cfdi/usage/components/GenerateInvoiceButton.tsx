'use client'

import { Plus } from 'lucide-react'
import Link from 'next/link'

interface GenerateInvoiceButtonProps {
  disabled?: boolean
  disabledReason?: string
}

export function GenerateInvoiceButton({ disabled, disabledReason }: GenerateInvoiceButtonProps) {
  if (disabled) {
    return (
      <div title={disabledReason}>
        <button
          disabled
          className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 text-white/30 rounded-xl text-sm font-medium cursor-not-allowed"
        >
          <Plus className="w-4 h-4" />
          Generar Factura
        </button>
      </div>
    )
  }

  return (
    <Link
      href="/erp/cfdi/generate"
      className="inline-flex items-center gap-2 px-4 py-2 bg-[#CCFF00] hover:bg-[#CCFF00]/90 text-black rounded-xl text-sm font-semibold transition-colors"
    >
      <Plus className="w-4 h-4" />
      Generar Factura
    </Link>
  )
}
