'use client'

import { useState } from 'react'
import { ShoppingCart, ExternalLink, CheckCircle } from 'lucide-react'
import { ConnectionTest } from './ConnectionTest'
import type { EcommerceData } from '../hooks/useOnboarding'

const ML_AUTH_URL =
  'https://auth.mercadolibre.com.mx/authorization?response_type=code&client_id=YOUR_ML_APP_ID&redirect_uri=/api/integrations/ml/callback'

const AMAZON_MARKETPLACES = [
  { id: 'ATVPDKIKX0DER', label: 'US (Estados Unidos)' },
  { id: 'A1AM78C64UM0Y8', label: 'MX (México)' },
  { id: 'A2Q3Y263D00KWC', label: 'CA (Canadá)' },
  { id: 'A1RKKUPIHCS9HS', label: 'ES (España)' },
]

interface Step2Props {
  data: Partial<EcommerceData>
  onChange: (data: Partial<EcommerceData>) => void
  onNext: () => void
  onBack: () => void
}

export function Step2Ecommerce({ data, onChange, onNext, onBack }: Step2Props) {
  const [skipAmazon, setSkipAmazon] = useState(false)
  const [skipShopify, setSkipShopify] = useState(false)

  function field(key: keyof EcommerceData, value: string) {
    onChange({ ...data, [key]: value })
  }

  async function testAmazon() {
    if (!data.amazon_seller_id || !data.amazon_access_key) {
      return { success: false, message: 'Completa Seller ID y Access Key primero' }
    }
    const res = await fetch('/api/ecommerce', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agent: 'amazon',
        action: 'test_connection',
        seller_id: data.amazon_seller_id,
        marketplace_id: data.amazon_marketplace_id,
      }),
    })
    const json = await res.json()
    return {
      success: json.success ?? false,
      message: json.success ? 'Conexión Amazon exitosa' : (json.error ?? 'Error de conexión'),
    }
  }

  async function testShopify() {
    if (!data.shopify_store_url || !data.shopify_access_token) {
      return { success: false, message: 'Completa Store URL y Access Token primero' }
    }
    const res = await fetch('/api/ecommerce', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agent: 'shopify',
        action: 'test_connection',
        store_url: data.shopify_store_url,
        access_token: data.shopify_access_token,
      }),
    })
    const json = await res.json()
    return {
      success: json.success ?? false,
      message: json.success ? 'Conexión Shopify exitosa' : (json.error ?? 'Error de conexión'),
    }
  }

  return (
    <div className="space-y-6 animate-in slide-in-from-right-8 duration-500">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-[#CCFF00]/10 flex items-center justify-center">
          <ShoppingCart className="w-5 h-5 text-[#CCFF00]" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Plataformas E-commerce</h2>
          <p className="text-sm text-white/40">Conecta tus canales de venta (puedes saltar y configurar después)</p>
        </div>
      </div>

      {/* Mercado Libre */}
      <div className="bg-white/3 border border-white/8 rounded-3xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white">Mercado Libre</span>
            <span className="px-2 py-0.5 bg-yellow-400/10 text-yellow-400 text-[10px] font-bold rounded-full border border-yellow-400/20">
              OAuth
            </span>
          </div>
          {data.ml_connected && (
            <div className="flex items-center gap-1.5 text-[#CCFF00] text-xs font-bold">
              <CheckCircle className="w-3.5 h-3.5" />
              {data.ml_nickname ?? 'Conectado'}
            </div>
          )}
        </div>
        <p className="text-xs text-white/30">
          Autoriza acceso a tu cuenta ML para gestionar órdenes, preguntas y envíos.
        </p>
        {!data.ml_connected ? (
          <a
            href={ML_AUTH_URL}
            className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-yellow-400/20 transition-all"
          >
            <ExternalLink className="w-3 h-3" />
            Conectar con Mercado Libre
          </a>
        ) : (
          <p className="text-xs text-[#CCFF00]/60">
            ✅ Cuenta conectada: {data.ml_nickname} (ID: {data.ml_user_id})
          </p>
        )}
      </div>

      {/* Amazon */}
      <div className="bg-white/3 border border-white/8 rounded-3xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-white">Amazon Seller Central</span>
          <label className="flex items-center gap-2 text-xs text-white/40 cursor-pointer">
            <input
              type="checkbox"
              checked={skipAmazon}
              onChange={e => setSkipAmazon(e.target.checked)}
              className="accent-[#CCFF00]"
            />
            Configurar después
          </label>
        </div>

        {!skipAmazon && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-white/30 uppercase tracking-widest block mb-1">Seller ID</label>
                <input
                  type="text"
                  placeholder="A1B2C3D4E5F6G7"
                  value={data.amazon_seller_id ?? ''}
                  onChange={e => field('amazon_seller_id', e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-[#CCFF00]/40"
                />
              </div>
              <div>
                <label className="text-[10px] text-white/30 uppercase tracking-widest block mb-1">Marketplace</label>
                <select
                  value={data.amazon_marketplace_id ?? 'A1AM78C64UM0Y8'}
                  onChange={e => field('amazon_marketplace_id', e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#CCFF00]/40"
                >
                  {AMAZON_MARKETPLACES.map(m => (
                    <option key={m.id} value={m.id} className="bg-[#0b1b2a]">
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-white/30 uppercase tracking-widest block mb-1">Access Key ID</label>
                <input
                  type="text"
                  placeholder="AKIAIOSFODNN7EXAMPLE"
                  value={data.amazon_access_key ?? ''}
                  onChange={e => field('amazon_access_key', e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-[#CCFF00]/40 font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] text-white/30 uppercase tracking-widest block mb-1">Secret Key</label>
                <input
                  type="password"
                  placeholder="••••••••••••••••"
                  value={data.amazon_secret_key ?? ''}
                  onChange={e => field('amazon_secret_key', e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-[#CCFF00]/40 font-mono"
                />
              </div>
            </div>
            <ConnectionTest
              provider="Amazon"
              testFn={testAmazon}
              disabled={!data.amazon_seller_id || !data.amazon_access_key}
            />
          </div>
        )}
      </div>

      {/* Shopify */}
      <div className="bg-white/3 border border-white/8 rounded-3xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-white">Shopify</span>
          <label className="flex items-center gap-2 text-xs text-white/40 cursor-pointer">
            <input
              type="checkbox"
              checked={skipShopify}
              onChange={e => setSkipShopify(e.target.checked)}
              className="accent-[#CCFF00]"
            />
            Configurar después
          </label>
        </div>

        {!skipShopify && (
          <div className="space-y-3">
            <div>
              <label className="text-[10px] text-white/30 uppercase tracking-widest block mb-1">Store URL</label>
              <div className="flex items-center">
                <input
                  type="text"
                  placeholder="mi-tienda"
                  value={data.shopify_store_url ?? ''}
                  onChange={e => field('shopify_store_url', e.target.value)}
                  className="flex-1 bg-white/5 border border-white/10 rounded-l-xl px-3 py-2 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-[#CCFF00]/40"
                />
                <span className="bg-white/8 border border-l-0 border-white/10 rounded-r-xl px-3 py-2 text-xs text-white/40">
                  .myshopify.com
                </span>
              </div>
            </div>
            <div>
              <label className="text-[10px] text-white/30 uppercase tracking-widest block mb-1">Access Token</label>
              <input
                type="password"
                placeholder="shpat_••••••••••••••••"
                value={data.shopify_access_token ?? ''}
                onChange={e => field('shopify_access_token', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-[#CCFF00]/40 font-mono"
              />
            </div>
            <ConnectionTest
              provider="Shopify"
              testFn={testShopify}
              disabled={!data.shopify_store_url || !data.shopify_access_token}
            />
          </div>
        )}
      </div>

      <div className="flex gap-3 pt-2">
        <button
          onClick={onBack}
          className="flex-1 bg-white/5 text-white/50 font-bold text-sm uppercase tracking-widest py-3 rounded-full hover:bg-white/10 transition-all"
        >
          ← Atrás
        </button>
        <button
          onClick={onNext}
          className="flex-[2] bg-[#CCFF00] text-black font-bold text-sm uppercase tracking-widest py-3 rounded-full hover:bg-[#CCFF00]/90 active:scale-[0.98] transition-all shadow-[0_10px_30px_rgba(204,255,0,0.2)]"
        >
          Continuar →
        </button>
      </div>
    </div>
  )
}
