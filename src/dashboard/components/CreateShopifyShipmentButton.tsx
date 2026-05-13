'use client'

import { useState } from 'react'
import { authenticatedFetch } from '@/lib/api-client'
import { useToast } from '@/components/ToastProvider'

interface Address {
  name: string
  company?: string
  street1: string
  city: string
  province: string
  zip: string
  country?: string
  phone: string
  email: string
}

interface Parcel {
  weight: number
  height: number
  width: number
  length: number
}

export interface ShipmentResult {
  id: string
  tracking_number: string
  tracking_url: string
  label_url: string
  carrier: string
  status: string
  price: number
  created_at: string
  order_reference?: string
}

interface CreateShopifyShipmentButtonProps {
  rateId: string
  addressFrom: Address
  addressTo: Address
  parcel: Parcel
  shopifyOrderId?: string
  onSuccess?: (shipment: ShipmentResult) => void
}

export function CreateShopifyShipmentButton({
  rateId,
  addressFrom,
  addressTo,
  parcel,
  shopifyOrderId,
  onSuccess,
}: CreateShopifyShipmentButtonProps) {
  const { showToast } = useToast()
  const [loading, setLoading] = useState(false)

  const handleCreate = async () => {
    setLoading(true)
    try {
      const res = await authenticatedFetch('/api/shipping/shopify/shipments', {
        method: 'POST',
        body: JSON.stringify({
          rate_id: rateId,
          address_from: addressFrom,
          address_to: addressTo,
          parcel,
          shopify_order_id: shopifyOrderId,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Error generando guía')

      showToast({
        type: 'success',
        title: 'Guía Shopify generada',
        message: `Tracking: ${data.tracking_number}`,
      })
      onSuccess?.(data as ShipmentResult)
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Error',
        message: err instanceof Error ? err.message : 'No se pudo generar la guía',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleCreate}
      disabled={loading}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all hover:opacity-90 active:scale-[0.97] disabled:opacity-50"
      style={{ backgroundColor: 'rgba(96,165,250,0.15)', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.25)' }}
    >
      <span className={`material-symbols-outlined !text-[14px] ${loading ? 'animate-spin' : ''}`}>
        {loading ? 'progress_activity' : 'print'}
      </span>
      {loading ? 'Generando...' : 'Generar guía Shopify'}
    </button>
  )
}
