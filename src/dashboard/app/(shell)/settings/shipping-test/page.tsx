'use client'

import { useState } from 'react'
import { ShopifyShippingCalculator, type ShippingRate } from '@/components/ShopifyShippingCalculator'
import { CreateShopifyShipmentButton, type ShipmentResult } from '@/components/CreateShopifyShipmentButton'

const TEST_ADDRESSES = {
  from: {
    name: 'KINEXIS Warehouse',
    company: 'Atollom Labs',
    street1: 'Av. Test 123',
    city: 'Ciudad de México',
    province: 'CDMX',
    zip: '03100',
    country: 'MX',
    phone: '5512345678',
    email: 'contacto@atollom.com',
  },
  to: {
    name: 'Cliente Shopify Test',
    street1: 'Calle Destino 456',
    city: 'Monterrey',
    province: 'NL',
    zip: '64000',
    country: 'MX',
    phone: '8112345678',
    email: 'cliente@test.com',
  },
}

const TEST_PARCEL = { weight: 1.5, height: 10, width: 20, length: 30 }

export default function ShippingTestPage() {
  const [selectedRate, setSelectedRate] = useState<ShippingRate | null>(null)
  const [shipment, setShipment] = useState<ShipmentResult | null>(null)

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-2xl font-black tight-tracking" style={{ color: 'var(--text-primary)' }}>Shipping Test</h1>
          <span className="px-2 py-1 rounded-full bg-[#60a5fa]/10 border border-[#60a5fa]/20 text-[9px] font-black label-tracking text-[#60a5fa]">SHOPIFY</span>
          <span className="px-2 py-1 rounded-full bg-[#facc15]/10 border border-[#facc15]/20 text-[9px] font-black label-tracking text-[#facc15]">SANDBOX</span>
        </div>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Prueba la generación de guías Skydropx para órdenes Shopify</p>
      </div>

      {/* Scope warning */}
      <div className="flex items-start gap-3 p-4 rounded-2xl" style={{ backgroundColor: 'rgba(96,165,250,0.06)', border: '1px solid rgba(96,165,250,0.2)' }}>
        <span className="material-symbols-outlined !text-[18px] text-[#60a5fa] flex-shrink-0 mt-0.5">info</span>
        <div className="text-xs space-y-1">
          <p className="font-bold text-[#60a5fa]">Alcance: Shopify únicamente</p>
          <p style={{ color: 'var(--text-muted)' }}>
            Mercado Libre usa <span className="font-mono bg-black/20 px-1 rounded">Mercado Envíos</span> (API propia) ·
            Amazon usa <span className="font-mono bg-black/20 px-1 rounded">Buy Shipping / FBA</span> (API propia)
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left: params + calculator */}
        <div className="space-y-4">
          <div className="glass-card rounded-2xl p-5 space-y-4">
            <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Parámetros de prueba</h2>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'CP Origen', value: TEST_ADDRESSES.from.zip },
                { label: 'CP Destino', value: TEST_ADDRESSES.to.zip },
                { label: 'Peso', value: `${TEST_PARCEL.weight} kg` },
                { label: 'Dimensiones', value: `${TEST_PARCEL.length}×${TEST_PARCEL.width}×${TEST_PARCEL.height} cm` },
              ].map(r => (
                <div key={r.label}>
                  <p className="text-[10px] label-tracking mb-0.5" style={{ color: 'var(--text-muted)' }}>{r.label.toUpperCase()}</p>
                  <p className="text-sm font-bold font-mono" style={{ color: 'var(--text-primary)' }}>{r.value}</p>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t" style={{ borderColor: 'var(--border-color)' }}>
              <ShopifyShippingCalculator
                zipFrom={TEST_ADDRESSES.from.zip}
                zipTo={TEST_ADDRESSES.to.zip}
                parcel={TEST_PARCEL}
                onSelectRate={setSelectedRate}
              />
            </div>
          </div>
        </div>

        {/* Right: create shipment */}
        <div className="space-y-4">
          {selectedRate ? (
            <div className="glass-card rounded-2xl p-5 space-y-4">
              <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Tarifa seleccionada</h2>

              <div className="p-3 rounded-xl space-y-2" style={{ backgroundColor: 'rgba(204,255,0,0.04)', border: '1px solid rgba(204,255,0,0.2)' }}>
                <p className="text-lg font-black text-[#CCFF00]">
                  ${Number(selectedRate.price).toLocaleString('es-MX', { minimumFractionDigits: 2 })} {selectedRate.currency}
                </p>
                <p className="text-xs font-bold capitalize" style={{ color: 'var(--text-secondary)' }}>{selectedRate.carrier} · {selectedRate.service_level}</p>
                <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{selectedRate.days} días hábiles</p>
              </div>

              <CreateShopifyShipmentButton
                rateId={selectedRate.rate_id}
                addressFrom={TEST_ADDRESSES.from}
                addressTo={TEST_ADDRESSES.to}
                parcel={TEST_PARCEL}
                shopifyOrderId="TEST-12345"
                onSuccess={setShipment}
              />
            </div>
          ) : (
            <div className="glass-card rounded-2xl p-8 flex flex-col items-center text-center gap-3">
              <span className="material-symbols-outlined !text-[32px]" style={{ color: 'var(--text-muted)' }}>package_2</span>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Calcula las tarifas y selecciona una para generar la guía</p>
            </div>
          )}

          {/* Result */}
          {shipment && (
            <div className="glass-card rounded-2xl p-5 space-y-4" style={{ border: '1px solid rgba(74,222,128,0.3)' }}>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined !text-[18px] text-[#4ade80]">check_circle</span>
                <h3 className="text-sm font-bold text-[#4ade80]">Guía Shopify generada</h3>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Tracking', value: shipment.tracking_number },
                  { label: 'Paquetería', value: shipment.carrier },
                  { label: 'Status', value: shipment.status },
                  { label: 'Costo', value: `$${shipment.price}` },
                ].map(r => (
                  <div key={r.label}>
                    <p className="text-[10px] label-tracking mb-0.5" style={{ color: 'var(--text-muted)' }}>{r.label.toUpperCase()}</p>
                    <p className="text-xs font-bold font-mono" style={{ color: 'var(--text-primary)' }}>{r.value ?? '—'}</p>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-3 pt-2 border-t" style={{ borderColor: 'var(--border-color)' }}>
                {shipment.label_url && (
                  <a href={shipment.label_url} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:opacity-80"
                    style={{ backgroundColor: 'rgba(204,255,0,0.1)', color: '#CCFF00', border: '1px solid rgba(204,255,0,0.2)' }}>
                    <span className="material-symbols-outlined !text-[13px]">download</span>
                    Descargar guía
                  </a>
                )}
                {shipment.tracking_url && (
                  <a href={shipment.tracking_url} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:opacity-80"
                    style={{ backgroundColor: 'rgba(96,165,250,0.1)', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.2)' }}>
                    <span className="material-symbols-outlined !text-[13px]">open_in_new</span>
                    Rastrear
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Env guide */}
      <div className="glass-card rounded-2xl p-5 space-y-3">
        <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Pasar a producción</h3>
        {[
          { step: '1', text: 'Crea cuenta en skydropx.com con contacto@atollom.com' },
          { step: '2', text: 'Dashboard → Configuración → API Keys → copiar Live key' },
          { step: '3', text: 'Railway → SKYDROPX_API_KEY_LIVE=live_xxxxx' },
          { step: '4', text: 'Railway → SKYDROPX_ENVIRONMENT=live → Redeploy ✅' },
        ].map(s => (
          <div key={s.step} className="flex items-start gap-3">
            <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0 mt-0.5"
              style={{ backgroundColor: 'rgba(96,165,250,0.15)', color: '#60a5fa' }}>{s.step}</span>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{s.text}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
