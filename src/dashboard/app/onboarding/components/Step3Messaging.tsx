'use client'

import { useState, useEffect } from 'react'
import { MessageSquare, CheckCircle, Loader2, Info } from 'lucide-react'
import type { MessagingData } from '../hooks/useOnboarding'

interface Step3Props {
  data: Partial<MessagingData>
  onChange: (data: Partial<MessagingData>) => void
  onNext: () => void
  onBack: () => void
}

interface MetaStatus {
  connected: boolean
  fb_name?: string
  phone_number?: string
  connected_platforms?: string[]
}

const PLATFORM_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  whatsapp:  { label: 'WhatsApp Business',   color: 'text-green-400',  bg: 'bg-green-500/8 border-green-500/15'  },
  instagram: { label: 'Instagram Business',  color: 'text-pink-400',   bg: 'bg-pink-500/8 border-pink-500/15'   },
  facebook:  { label: 'Facebook Messenger',  color: 'text-blue-400',   bg: 'bg-blue-500/8 border-blue-500/15'   },
}

export function Step3Messaging({ data, onChange, onNext, onBack }: Step3Props) {
  const [metaStatus, setMetaStatus] = useState<MetaStatus>({ connected: false })
  const [connecting, setConnecting] = useState(false)
  const [checking, setChecking] = useState(true)

  // Check if Meta is already connected
  useEffect(() => {
    fetch('/api/integrations/meta/status')
      .then(r => r.json())
      .then(d => {
        setMetaStatus(d)
        if (d.connected && d.connected_platforms?.length) {
          onChange({ meta_connected: true, connected_platforms: d.connected_platforms })
        }
      })
      .catch(() => {})
      .finally(() => setChecking(false))
  }, [])

  // Handle redirect back from Meta OAuth (url params: ?meta=connected or ?meta=error)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const meta = params.get('meta')
    if (meta === 'connected') {
      // Re-fetch status after successful OAuth
      fetch('/api/integrations/meta/status')
        .then(r => r.json())
        .then(d => {
          setMetaStatus(d)
          if (d.connected) onChange({ meta_connected: true, connected_platforms: d.connected_platforms ?? [] })
        })
        .catch(() => {})
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  async function handleConnect() {
    setConnecting(true)
    try {
      const res = await fetch('/api/integrations/meta/connect')
      const data = await res.json()
      if (data.auth_url) {
        window.location.href = data.auth_url
      }
    } catch {
      setConnecting(false)
    }
  }

  const platforms = metaStatus.connected_platforms ?? []

  return (
    <div className="space-y-5 animate-in slide-in-from-right-8 duration-500">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-[#CCFF00]/10 flex items-center justify-center">
          <MessageSquare className="w-5 h-5 text-[#CCFF00]" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Mensajería</h2>
          <p className="text-sm text-white/40">WhatsApp, Instagram y Facebook Business</p>
        </div>
      </div>

      {/* Meta Business Suite card */}
      <div className="bg-white/3 border border-white/8 rounded-3xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-white">Meta Business Suite</span>
          {metaStatus.connected && (
            <span className="flex items-center gap-1 px-2 py-0.5 bg-green-500/10 text-green-400 text-[10px] font-bold rounded-full border border-green-500/20">
              <CheckCircle className="w-3 h-3" />
              Conectado
            </span>
          )}
        </div>

        {checking ? (
          <div className="flex items-center gap-2 text-white/30 text-xs">
            <Loader2 className="w-3 h-3 animate-spin" />
            Verificando conexión...
          </div>
        ) : metaStatus.connected ? (
          /* ── Already connected ── */
          <div className="space-y-3">
            <div className="bg-green-500/5 border border-green-500/15 rounded-2xl px-4 py-3 space-y-1">
              <p className="text-xs font-bold text-green-400">{metaStatus.fb_name}</p>
              {metaStatus.phone_number && (
                <p className="text-[11px] text-white/40">{metaStatus.phone_number}</p>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {['whatsapp', 'instagram', 'facebook'].map(p => {
                const cfg = PLATFORM_LABELS[p]
                const active = platforms.includes(p)
                return (
                  <div key={p} className={`${active ? cfg.bg : 'bg-white/3 border-white/8'} border rounded-2xl p-3 text-center`}>
                    <p className={`text-[10px] font-bold ${active ? cfg.color : 'text-white/20'}`}>{cfg.label}</p>
                    {active && <p className="text-[8px] text-white/40 mt-0.5">✓ Activo</p>}
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          /* ── Not connected ── */
          <div className="space-y-4">
            <p className="text-xs text-white/40 leading-relaxed">
              Con un solo clic conecta las tres plataformas de Meta. KINEXIS registra el webhook automáticamente.
            </p>
            <div className="grid grid-cols-3 gap-2">
              {['whatsapp', 'instagram', 'facebook'].map(p => {
                const cfg = PLATFORM_LABELS[p]
                return (
                  <div key={p} className={`${cfg.bg} border rounded-2xl p-3 text-center`}>
                    <p className={`text-[10px] font-bold ${cfg.color}`}>{cfg.label}</p>
                  </div>
                )
              })}
            </div>
            <button
              onClick={handleConnect}
              disabled={connecting}
              className="w-full py-3 rounded-2xl bg-[#1877F2] text-white font-bold text-sm hover:bg-[#1877F2]/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {connecting ? (
                <><Loader2 className="w-4 h-4 animate-spin" />Redirigiendo a Meta...</>
              ) : (
                <><span className="text-base">f</span>Conectar con Meta</>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Skip info */}
      <div className="flex items-start gap-2 bg-white/3 border border-white/8 rounded-2xl px-4 py-3">
        <Info className="w-3.5 h-3.5 text-white/30 mt-0.5 shrink-0" />
        <p className="text-[11px] text-white/40 leading-relaxed">
          Puedes continuar ahora y conectar mensajería después desde{' '}
          <strong className="text-white/60">Configuración → Integraciones</strong>.
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
          {metaStatus.connected ? 'Continuar →' : 'Omitir por ahora →'}
        </button>
      </div>
    </div>
  )
}
