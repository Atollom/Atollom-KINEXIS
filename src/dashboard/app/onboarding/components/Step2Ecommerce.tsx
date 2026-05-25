'use client'

import { useState } from 'react'
import { ShoppingCart, CheckCircle, ExternalLink, Clock } from 'lucide-react'
import type { EcommerceData } from '../hooks/useOnboarding'

interface Step2Props {
  data: Partial<EcommerceData>
  onChange: (data: Partial<EcommerceData>) => void
  onNext: () => void
  onBack: () => void
}

export function Step2Ecommerce({ data, onChange, onNext, onBack }: Step2Props) {
  const [mlLoading, setMlLoading] = useState(false)
  const [mlError, setMlError] = useState<string | null>(null)
  const [amazonLoading, setAmazonLoading] = useState(false)
  const [amazonError, setAmazonError] = useState<string | null>(null)

  async function connectAmazon() {
    setAmazonLoading(true)
    setAmazonError(null)
    try {
      const res = await fetch('/api/integrations/amazon/connect?return_to=onboarding')
      const json = await res.json()
      if (json.auth_url) {
        window.location.href = json.auth_url
      } else {
        setAmazonError(json.error ?? 'No se pudo obtener el enlace de autorización')
        setAmazonLoading(false)
      }
    } catch {
      setAmazonError('Error de conexión. Intenta de nuevo.')
      setAmazonLoading(false)
    }
  }

  async function connectML() {
    setMlLoading(true)
    setMlError(null)
    try {
      const res = await fetch('/api/integrations/ml/connect')
      const json = await res.json()
      if (json.auth_url) {
        window.location.href = json.auth_url
      } else {
        setMlError(json.error ?? 'No se pudo obtener el enlace de autorización')
        setMlLoading(false)
      }
    } catch {
      setMlError('Error de conexión. Intenta de nuevo.')
      setMlLoading(false)
    }
  }

  return (
    <div className="space-y-5 animate-in slide-in-from-right-8 duration-500">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-[#CCFF00]/10 flex items-center justify-center">
          <ShoppingCart className="w-5 h-5 text-[#CCFF00]" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Plataformas E-commerce</h2>
          <p className="text-sm text-white/40">Conecta tus canales de venta con un solo clic</p>
        </div>
      </div>

      {/* MercadoLibre */}
      <div className={`bg-white/3 border rounded-3xl p-5 space-y-4 transition-all ${
        data.ml_connected ? 'border-[#CCFF00]/30' : 'border-white/8'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white">Mercado Libre</span>
            <span className="px-2 py-0.5 bg-yellow-400/10 text-yellow-400 text-[10px] font-bold rounded-full border border-yellow-400/20 uppercase tracking-widest">
              OAuth 2.0
            </span>
          </div>
          {data.ml_connected && (
            <div className="flex items-center gap-1.5 text-[#CCFF00] text-xs font-bold">
              <CheckCircle className="w-3.5 h-3.5" />
              Conectado
            </div>
          )}
        </div>

        {data.ml_connected ? (
          <div className="flex items-center gap-2 text-sm text-white/70">
            <span className="w-2 h-2 rounded-full bg-[#CCFF00] shadow-[0_0_8px_#CCFF00]" />
            Cuenta: <span className="text-white font-semibold">{data.ml_nickname ?? data.ml_user_id}</span>
          </div>
        ) : (
          <>
            <p className="text-xs text-white/30 leading-relaxed">
              Inicia sesión con tu cuenta de MercadoLibre para que KINEXIS pueda gestionar órdenes,
              preguntas, envíos y publicaciones en tu nombre.
            </p>
            {mlError && (
              <p className="text-xs text-red-400 font-medium">{mlError}</p>
            )}
            <button
              onClick={connectML}
              disabled={mlLoading}
              className="flex items-center gap-2 px-5 py-2.5 bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-yellow-400/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {mlLoading ? (
                <span className="w-3.5 h-3.5 border-2 border-yellow-400/40 border-t-yellow-400 rounded-full animate-spin" />
              ) : (
                <ExternalLink className="w-3.5 h-3.5" />
              )}
              {mlLoading ? 'Redirigiendo...' : 'Conectar con MercadoLibre'}
            </button>
          </>
        )}
      </div>

      {/* Amazon */}
      <div className={`bg-white/3 border rounded-3xl p-5 space-y-4 transition-all ${
        data.amazon_connected ? 'border-[#CCFF00]/30' : 'border-white/8'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white">Amazon Seller Central</span>
            <span className="px-2 py-0.5 bg-orange-400/10 text-orange-400 text-[10px] font-bold rounded-full border border-orange-400/20 uppercase tracking-widest">
              OAuth 2.0
            </span>
          </div>
          {data.amazon_connected && (
            <div className="flex items-center gap-1.5 text-[#CCFF00] text-xs font-bold">
              <CheckCircle className="w-3.5 h-3.5" />
              Conectado
            </div>
          )}
        </div>

        {data.amazon_connected ? (
          <div className="flex items-center gap-2 text-sm text-white/70">
            <span className="w-2 h-2 rounded-full bg-[#CCFF00] shadow-[0_0_8px_#CCFF00]" />
            Cuenta Amazon SP-API conectada
          </div>
        ) : (
          <>
            <p className="text-xs text-white/30 leading-relaxed">
              Conecta tu cuenta de Amazon Seller Central México o EE.UU. para gestionar órdenes,
              inventario FBA y reportes.
            </p>
            {amazonError && (
              <p className="text-xs text-red-400 font-medium">{amazonError}</p>
            )}
            <button
              onClick={connectAmazon}
              disabled={amazonLoading}
              className="flex items-center gap-2 px-5 py-2.5 bg-orange-400/10 text-orange-400 border border-orange-400/20 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-orange-400/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {amazonLoading ? (
                <span className="w-3.5 h-3.5 border-2 border-orange-400/40 border-t-orange-400 rounded-full animate-spin" />
              ) : (
                <ExternalLink className="w-3.5 h-3.5" />
              )}
              {amazonLoading ? 'Redirigiendo...' : 'Conectar con Amazon'}
            </button>
          </>
        )}
      </div>

      {/* Shopify */}
      <div className="bg-white/3 border border-white/8 rounded-3xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white">Shopify</span>
            <span className="px-2 py-0.5 bg-white/5 text-white/30 text-[10px] font-bold rounded-full border border-white/10 flex items-center gap-1">
              <Clock className="w-2.5 h-2.5" />
              Próximamente
            </span>
          </div>
        </div>
        <p className="text-xs text-white/30 leading-relaxed">
          La integración con Shopify estará disponible pronto mediante OAuth. Podrás conectar tu tienda sin necesidad de tokens manuales.
        </p>
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
