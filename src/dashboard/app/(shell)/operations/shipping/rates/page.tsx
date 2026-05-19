'use client'

import { useState } from 'react'
import { authenticatedFetch } from '@/lib/api-client'

interface Rate {
  carrier: string
  service: string
  days: number
  price: number
}

const CARRIER_ICONS: Record<string, string> = {
  FedEx: 'local_shipping',
  DHL: 'local_shipping',
  Estafeta: 'delivery_truck_speed',
  RedPack: 'package_2',
  Sendex: 'package',
}

export default function ShippingRatesPage() {
  const [form, setForm] = useState({ origin_zip: '', destination_zip: '', weight_kg: '', declared_value: '' })
  const [rates, setRates] = useState<Rate[]>([])
  const [source, setSource] = useState<'live' | 'mock' | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleQuote = async () => {
    setError('')
    if (!form.origin_zip || !form.destination_zip || !form.weight_kg) {
      setError('Completa los campos requeridos')
      return
    }
    setLoading(true)
    try {
      const res = await authenticatedFetch('/api/operations/shipping/rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin_zip: form.origin_zip,
          destination_zip: form.destination_zip,
          weight_kg: parseFloat(form.weight_kg),
          declared_value: form.declared_value ? parseFloat(form.declared_value) : undefined,
        }),
      })
      const data = await res.json() as { rates: Rate[]; source: string }
      setRates(data.rates ?? [])
      setSource(data.source === 'live' ? 'live' : 'mock')
    } catch {
      setError('Error al consultar tarifas')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-10 animate-in">
      <header className="space-y-2">
        <span className="text-[0.75rem] font-bold label-tracking text-primary drop-shadow-[0_0_8px_rgba(204,255,0,0.2)]">
          Operaciones / Cotizador de Envíos
        </span>
        <h1 className="text-4xl md:text-5xl font-black tight-tracking text-on-surface">Cotizador de Envíos</h1>
        <p className="text-sm text-on-surface-variant">Compara tarifas de paquetería en tiempo real</p>
      </header>

      {/* Form */}
      <div className="glass-card rounded-[2rem] border border-white/5 p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'CP Origen', key: 'origin_zip', placeholder: '06600' },
            { label: 'CP Destino', key: 'destination_zip', placeholder: '64000' },
            { label: 'Peso (kg)', key: 'weight_kg', placeholder: '2.5' },
            { label: 'Valor declarado (MXN)', key: 'declared_value', placeholder: '1000' },
          ].map(f => (
            <div key={f.key}>
              <label className="text-[9px] font-black label-tracking text-on-surface/40 uppercase block mb-1.5">{f.label}</label>
              <input
                type="text"
                placeholder={f.placeholder}
                value={form[f.key as keyof typeof form]}
                onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-on-surface placeholder:text-on-surface/20 focus:border-primary/50 outline-none"
              />
            </div>
          ))}
        </div>

        {error && <p className="text-red-400 text-[10px] font-black mb-4">{error}</p>}

        <button
          onClick={handleQuote}
          disabled={loading}
          className="px-8 py-3 rounded-2xl bg-primary text-black text-[10px] font-black label-tracking hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center gap-2"
        >
          <span className="material-symbols-outlined !text-[16px]">calculate</span>
          {loading ? 'COTIZANDO…' : 'COTIZAR'}
        </button>
      </div>

      {/* Results */}
      {rates.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-black text-on-surface">Resultados</h2>
            {source && (
              <span className={`px-2 py-1 rounded-full text-[9px] font-black label-tracking border ${
                source === 'live' ? 'border-green-500/30 bg-green-500/10 text-green-400' : 'border-amber-500/30 bg-amber-500/10 text-amber-400'
              }`}>
                {source === 'live' ? 'LIVE' : 'ESTIMADO'}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rates.map((r, i) => (
              <div key={i} className={`glass-card rounded-[1.5rem] border p-6 flex flex-col gap-3 ${i === 0 ? 'border-primary/30' : 'border-white/5'}`}>
                {i === 0 && (
                  <span className="text-[8px] font-black label-tracking text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full self-start">
                    MÁS ECONÓMICO
                  </span>
                )}
                <div className="flex items-center gap-3">
                  <span className={`material-symbols-outlined !text-[20px] ${i === 0 ? 'text-primary' : 'text-on-surface/40'}`}>
                    {CARRIER_ICONS[r.carrier] ?? 'local_shipping'}
                  </span>
                  <div>
                    <p className="text-sm font-black text-on-surface">{r.carrier}</p>
                    <p className="text-[10px] text-on-surface/40">{r.service}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-[10px] text-on-surface/40">{r.days} día{r.days !== 1 ? 's' : ''} hábil{r.days !== 1 ? 'es' : ''}</p>
                  <p className={`text-xl font-black ${i === 0 ? 'text-primary' : 'text-on-surface'}`}>
                    ${r.price.toLocaleString()}
                  </p>
                </div>
                <button className="w-full py-2 rounded-xl bg-white/5 border border-white/10 text-[9px] font-black text-on-surface/60 hover:bg-white/10 transition-all">
                  SELECCIONAR
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="h-10" />
    </div>
  )
}
