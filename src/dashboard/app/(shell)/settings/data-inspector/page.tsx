'use client'

import { useState } from 'react'
import { authenticatedFetch } from '@/lib/api-client'

type IntegrationKey = 'mercadolibre' | 'amazon' | 'shopify' | 'meta'

interface InspectorOption {
  label: string
  path: string
}

const INTEGRATIONS: { id: IntegrationKey; label: string; color: string; icon: string }[] = [
  { id: 'mercadolibre', label: 'Mercado Libre', color: 'text-yellow-400',  icon: 'storefront' },
  { id: 'amazon',       label: 'Amazon',         color: 'text-orange-400', icon: 'inventory_2' },
  { id: 'shopify',      label: 'Shopify',         color: 'text-[#CCFF00]', icon: 'shopping_bag' },
  { id: 'meta',         label: 'Meta',            color: 'text-blue-400',  icon: 'groups' },
]

const DATA_OPTIONS: Record<IntegrationKey, InspectorOption[]> = {
  mercadolibre: [
    { label: 'Productos',  path: '/api/sandbox/data/ml/products' },
    { label: 'Órdenes',    path: '/api/sandbox/data/ml/orders' },
    { label: 'Métricas',   path: '/api/sandbox/data/ml/metrics' },
  ],
  amazon: [
    { label: 'Listings',   path: '/api/sandbox/data/amazon/listings' },
    { label: 'Órdenes',    path: '/api/sandbox/data/amazon/orders' },
    { label: 'FBA Stock',  path: '/api/sandbox/data/amazon/fba' },
  ],
  shopify: [
    { label: 'Productos',  path: '/api/sandbox/data/shopify/products' },
    { label: 'Órdenes',    path: '/api/sandbox/data/shopify/orders' },
    { label: 'Analytics',  path: '/api/sandbox/data/shopify/analytics' },
  ],
  meta: [
    { label: 'WA Templates',  path: '/api/sandbox/data/meta/wa-templates' },
    { label: 'IG Insights',   path: '/api/sandbox/data/meta/ig-insights' },
    { label: 'Ad Insights',   path: '/api/sandbox/data/meta/ad-insights' },
  ],
}

export default function DataInspectorPage() {
  const [integration, setIntegration] = useState<IntegrationKey>('mercadolibre')
  const [option, setOption]           = useState<InspectorOption>(DATA_OPTIONS.mercadolibre[0])
  const [data, setData]               = useState<object | null>(null)
  const [loading, setLoading]         = useState(false)
  const [fetchedPath, setFetchedPath] = useState('')

  async function fetchData() {
    setLoading(true)
    try {
      const res = await authenticatedFetch(option.path)
      const json = await res.json()
      setData(json)
      setFetchedPath(option.path)
    } catch (err: any) {
      setData({ error: err?.message ?? 'Fetch failed' })
    } finally {
      setLoading(false)
    }
  }

  function handleIntegrationChange(id: IntegrationKey) {
    setIntegration(id)
    setOption(DATA_OPTIONS[id][0])
    setData(null)
  }

  const activeIntegration = INTEGRATIONS.find(i => i.id === integration)!

  return (
    <div className="min-h-screen p-6 space-y-6 animate-in fade-in duration-300">

      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <span className="material-symbols-outlined !text-[26px] text-[#CCFF00]">manage_search</span>
          <h1 className="tight-tracking text-2xl font-black text-white">Data Inspector</h1>
        </div>
        <p className="text-sm text-white/40">Inspecciona respuestas sandbox en tiempo real — misma forma que producción</p>
      </div>

      {/* Integration tabs */}
      <div className="flex gap-2 flex-wrap">
        {INTEGRATIONS.map(int => (
          <button
            key={int.id}
            onClick={() => handleIntegrationChange(int.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-semibold transition-all ${
              integration === int.id
                ? `bg-white/8 border-white/15 ${int.color}`
                : 'bg-white/3 border-white/5 text-white/30 hover:bg-white/5 hover:text-white/60'
            }`}
          >
            <span className={`material-symbols-outlined !text-[14px]`}>{int.icon}</span>
            {int.label}
          </button>
        ))}
      </div>

      {/* Controls */}
      <div className="glass-card p-5 space-y-4">
        <p className="text-[10px] label-tracking text-white/30">ENDPOINT</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          {/* Data type */}
          <div className="md:col-span-2 flex gap-2 flex-wrap">
            {DATA_OPTIONS[integration].map(opt => (
              <button
                key={opt.path}
                onClick={() => { setOption(opt); setData(null) }}
                className={`px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${
                  option.path === opt.path
                    ? `bg-white/8 border-white/15 ${activeIntegration.color}`
                    : 'bg-white/3 border-white/5 text-white/30 hover:text-white/60'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {/* Fetch button */}
          <button
            onClick={fetchData}
            disabled={loading}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-[#CCFF00]/10 border-[#CCFF00]/20 text-[#CCFF00] hover:bg-[#CCFF00]/20`}
          >
            <span className={`material-symbols-outlined !text-[16px] ${loading ? 'animate-spin' : ''}`}>
              {loading ? 'progress_activity' : 'refresh'}
            </span>
            {loading ? 'Fetching...' : 'Fetch Data'}
          </button>
        </div>
        {/* Active path */}
        <div className="flex items-center gap-2 text-[11px] font-mono text-white/25">
          <span className="text-[#CCFF00]/40">GET</span>
          <span>{option.path}</span>
        </div>
      </div>

      {/* JSON output */}
      {data && (
        <div className="rounded-2xl bg-black/60 border border-white/5 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-400/60" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#CCFF00]/60" />
            </div>
            <span className={`text-[10px] font-mono ${activeIntegration.color}`}>
              {fetchedPath}
            </span>
            <button
              onClick={() => navigator.clipboard.writeText(JSON.stringify(data, null, 2))}
              className="text-[10px] text-white/20 hover:text-white/60 transition-colors flex items-center gap-1"
            >
              <span className="material-symbols-outlined !text-[12px]">content_copy</span>
              copy
            </button>
          </div>
          <pre className="p-5 text-xs font-mono text-[#CCFF00]/80 overflow-x-auto max-h-[520px] overflow-y-auto custom-scrollbar leading-relaxed">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}

      {!data && (
        <div className="glass-card p-12 flex flex-col items-center gap-3 text-center">
          <span className="material-symbols-outlined !text-[40px] text-white/10">data_object</span>
          <p className="text-sm text-white/30">Selecciona una integración y tipo de dato, luego presiona Fetch Data</p>
        </div>
      )}

    </div>
  )
}
