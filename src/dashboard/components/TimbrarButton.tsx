'use client'

import { useState } from 'react'
import { authenticatedFetch } from '@/lib/api-client'
import { useToast } from '@/components/ToastProvider'

interface TimbrarItem {
  quantity: number
  description: string
  unit_price: number
  product_key?: string
}

interface TimbrarButtonProps {
  customerData: {
    rfc: string
    name: string
    email?: string
  }
  items: TimbrarItem[]
  paymentForm?: string
  paymentMethod?: string
  use?: string
  onSuccess?: (invoice: Record<string, unknown>) => void
  size?: 'sm' | 'md'
}

export function TimbrarButton({
  customerData,
  items,
  paymentForm = '03',
  paymentMethod = 'PUE',
  use = 'G03',
  onSuccess,
  size = 'md',
}: TimbrarButtonProps) {
  const [loading, setLoading] = useState(false)
  const { showToast } = useToast()

  const handleTimbrar = async () => {
    setLoading(true)
    try {
      const res = await authenticatedFetch('/api/cfdi/invoice', {
        method: 'POST',
        body: JSON.stringify({
          customer_rfc: customerData.rfc,
          customer_name: customerData.name,
          items: items.map(i => ({
            quantity: i.quantity,
            description: i.description,
            unit_price: i.unit_price,
            product_key: i.product_key ?? '01010101',
          })),
          payment_form: paymentForm,
          payment_method: paymentMethod,
          use,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.detail || 'Error al timbrar')
      }

      showToast({
        type: 'success',
        title: 'CFDI Timbrado',
        message: `UUID: ${String(data.uuid ?? '').slice(0, 8)}… enviado a ${customerData.email ?? customerData.rfc}`,
      })

      onSuccess?.(data)
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Error al timbrar',
        message: err instanceof Error ? err.message : 'No se pudo generar la factura',
      })
    } finally {
      setLoading(false)
    }
  }

  const sizeClass = size === 'sm'
    ? 'px-3 py-1.5 text-[10px] gap-1.5'
    : 'px-4 py-2 text-xs gap-2'

  return (
    <button
      onClick={handleTimbrar}
      disabled={loading}
      className={`inline-flex items-center font-bold rounded-xl transition-all hover:opacity-90 active:scale-[0.97] disabled:opacity-50 ${sizeClass}`}
      style={{ backgroundColor: 'var(--accent-primary)', color: '#000' }}
    >
      <span className={`material-symbols-outlined ${size === 'sm' ? '!text-[12px]' : '!text-[14px]'} ${loading ? 'animate-spin' : ''}`}>
        {loading ? 'progress_activity' : 'receipt_long'}
      </span>
      {loading ? 'Timbrando...' : 'Facturar'}
    </button>
  )
}
