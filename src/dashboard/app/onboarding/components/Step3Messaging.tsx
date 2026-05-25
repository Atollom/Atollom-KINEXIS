'use client'

import { MessageSquare, Clock, Info } from 'lucide-react'
import type { MessagingData } from '../hooks/useOnboarding'

interface Step3Props {
  data: Partial<MessagingData>
  onChange: (data: Partial<MessagingData>) => void
  onNext: () => void
  onBack: () => void
}

export function Step3Messaging({ data, onChange, onNext, onBack }: Step3Props) {
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

      {/* Meta Business Suite */}
      <div className="bg-white/3 border border-white/8 rounded-3xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-white">Meta Business Suite</span>
          <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 text-[10px] font-bold rounded-full border border-blue-500/20 flex items-center gap-1">
            <Clock className="w-2.5 h-2.5" />
            Próximamente
          </span>
        </div>

        <p className="text-xs text-white/40 leading-relaxed">
          Con un solo flujo OAuth conectarás las tres plataformas de Meta:
        </p>

        <div className="grid grid-cols-3 gap-2">
          {[
            { name: 'WhatsApp Business', color: 'text-green-400', bg: 'bg-green-500/8 border-green-500/15' },
            { name: 'Instagram Business', color: 'text-pink-400', bg: 'bg-pink-500/8 border-pink-500/15' },
            { name: 'Facebook Messenger', color: 'text-blue-400', bg: 'bg-blue-500/8 border-blue-500/15' },
          ].map(p => (
            <div key={p.name} className={`${p.bg} border rounded-2xl p-3 text-center`}>
              <p className={`text-[10px] font-bold ${p.color}`}>{p.name}</p>
            </div>
          ))}
        </div>

        <div className="flex items-start gap-2 bg-blue-500/5 border border-blue-500/15 rounded-2xl px-4 py-3">
          <Info className="w-3.5 h-3.5 text-blue-400 mt-0.5 shrink-0" />
          <p className="text-[11px] text-blue-300/80 leading-relaxed">
            La integración con Meta requiere que tu aplicación sea aprobada por Meta Business (proceso de revisión de 1-4 semanas). Lo activamos contigo una vez que pases a plan Starter o superior.
          </p>
        </div>
      </div>

      {/* Info box */}
      <div className="flex items-start gap-2 bg-white/3 border border-white/8 rounded-2xl px-4 py-3">
        <Info className="w-3.5 h-3.5 text-white/30 mt-0.5 shrink-0" />
        <p className="text-[11px] text-white/40 leading-relaxed">
          Puedes completar el onboarding ahora y conectar mensajería después desde <strong className="text-white/60">Configuración → Integraciones</strong>.
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
