'use client'

import { useState } from 'react'
import { authenticatedFetch } from '@/lib/api-client'
import { useToast } from '@/components/ToastProvider'

export interface ShippingRate {
  carrier: string
  service_level: string
  price: number
  currency: string
  days: number
  rate_id: string
}

interface ShopifyShippingCalculatorProps {
  zipFrom: string
  zipTo: string
  parcel: { weight: number; height: number; width: number; length: number }
  onSelectRate?: (rate: ShippingRate) => void
}

const CARRIER_ICONS: Record<string, string> = {
  fedex: 'local_shipping',
  dhl: 'local_shipping',
  estafeta: 'local_shipping',
  redpack: 'local_shipping',
  ups: 'local_shipping',
}

export function ShopifyShippingCalculator({
  zipFrom,
  zipTo,
  parcel,
  onSelectRate,
}: ShopifyShippingCalculatorProps) {
  const { showToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [rates, setRates] = useState<ShippingRate[]>([])
  const [selected, setSelected] = useState<string | null>(null)

  const calculate = async () => {
    setLoading(true)
    setRates([])
    try {
      const res = await authenticatedFetch('/api/shipping/shopify/rates', {
        method: 'POST',
        body: JSON.stringify({ zip_from: zipFrom, zip_to: zipTo, parcel }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Error obteniendo tarifas')
      const list: ShippingRate[] = data.rates ?? []
      setRates(list)
      if (!list.length) showToast({ type: 'info', title: 'Sin tarifas', message: 'No hay tarifas para esta ruta.' })
    } catch (err) {
      showToast({ type: 'error', title: 'Error', message: err instanceof Error ? err.message : 'Error de red' })
    } finally {
      setLoading(false)
    }
  }

  const handleSelect = (rate: ShippingRate) => {
    setSelected(rate.rate_id)
    onSelectRate?.(rate)
  }

  return (
    <div className="space-y-3">
      <button
        onClick={calculate}
        disabled={loading}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all hover:opacity-90 active:scale-[0.97] disabled:opacity-50"
        style={{ backgroundColor: 'var(--accent-primary)', color: '#000' }}
      >
        <span className={`material-symbols-outlined !text-[14px] ${loading ? 'animate-spin' : ''}`}>
          {loading ? 'progress_activity' : 'calculate'}
        </span>
        {loading ? 'Calculando...' : 'Calcular tarifas Shopify'}
      </button>

      {rates.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] label-tracking" style={{ color: 'var(--text-muted)' }}>
            {rates.length} TARIFAS DISPONIBLES — SELECCIONA UNA
          </p>
          {rates.map(rate => {
            const isSelected = selected === rate.rate_id
            return (
              <button
                key={rate.rate_id}
                onClick={() => handleSelect(rate)}
                className="w-full text-left p-3 rounded-xl flex items-center justify-between transition-all hover:opacity-90"
                style={{
                  backgroundColor: isSelected ? 'rgba(204,255,0,0.08)' : 'var(--bg-card)',
                  border: isSelected ? '1px solid rgba(204,255,0,0.4)' : '1px solid var(--border-color)',
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
                    <span className="material-symbols-outlined !text-[15px]"
                      style={{ color: 'var(--text-muted)' }}>
                      {CARRIER_ICONS[rate.carrier?.toLowerCase()] ?? 'local_shipping'}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs font-bold capitalize" style={{ color: 'var(--text-primary)' }}>{rate.carrier}</p>
                    <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{rate.service_level} · {rate.days}d hábiles</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black" style={{ color: isSelected ? '#CCFF00' : 'var(--text-primary)' }}>
                    ${Number(rate.price).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-[9px]" style={{ color: 'var(--text-muted)' }}>{rate.currency}</p>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
