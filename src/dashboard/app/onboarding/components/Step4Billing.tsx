'use client'

import { Receipt, Info } from 'lucide-react'
import type { BillingData } from '../hooks/useOnboarding'

const REGIMENES_FISCALES = [
  { code: '601', label: '601 - General de Ley Personas Morales' },
  { code: '603', label: '603 - Personas Morales con Fines no Lucrativos' },
  { code: '605', label: '605 - Sueldos y Salarios' },
  { code: '606', label: '606 - Arrendamiento' },
  { code: '608', label: '608 - Demás Ingresos' },
  { code: '612', label: '612 - Personas Físicas con Actividades Empresariales' },
  { code: '616', label: '616 - Sin Obligaciones Fiscales' },
  { code: '621', label: '621 - Incorporación Fiscal' },
  { code: '625', label: '625 - Actividades Empresariales vía Plataformas Tecnológicas' },
  { code: '626', label: '626 - Régimen Simplificado de Confianza' },
]

const RFC_PATTERN = /^[A-Z&Ñ]{3,4}\d{6}[A-Z0-9]{3}$/

interface Step4Props {
  data: Partial<BillingData>
  onChange: (data: Partial<BillingData>) => void
  onNext: () => void
  onBack: () => void
  companyRfc?: string
}

export function Step4Billing({ data, onChange, onNext, onBack, companyRfc }: Step4Props) {
  // Auto-populate RFC from company step if not already set
  const rfcValue = data.rfc_emisor ?? companyRfc ?? ''

  function field(key: keyof BillingData, value: string) {
    onChange({ ...data, [key]: value })
  }

  const rfcValid = rfcValue ? RFC_PATTERN.test(rfcValue.toUpperCase()) : true

  return (
    <div className="space-y-5 animate-in slide-in-from-right-8 duration-500">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-[#CCFF00]/10 flex items-center justify-center">
          <Receipt className="w-5 h-5 text-[#CCFF00]" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Facturación CFDI 4.0</h2>
          <p className="text-sm text-white/40">Solo necesitamos tus datos fiscales</p>
        </div>
      </div>

      {/* Info box */}
      <div className="flex items-start gap-3 bg-[#CCFF00]/5 border border-[#CCFF00]/20 rounded-2xl px-4 py-4">
        <Info className="w-4 h-4 text-[#CCFF00]/70 mt-0.5 shrink-0" />
        <div className="space-y-1">
          <p className="text-xs font-bold text-[#CCFF00]/90">Facturación gestionada por KINEXIS</p>
          <p className="text-[11px] text-white/50 leading-relaxed">
            No necesitas cuenta en Facturama ni en ningún PAC. KINEXIS gestiona el timbrado CFDI 4.0 directamente en tu nombre usando nuestros timbres incluidos en tu plan.
          </p>
        </div>
      </div>

      {/* Datos Fiscales */}
      <div className="bg-white/3 border border-white/8 rounded-3xl p-5 space-y-4">
        <p className="text-xs font-bold text-white/70 uppercase tracking-widest">Datos del Emisor</p>

        <div>
          <label className="text-[10px] text-white/30 uppercase tracking-widest block mb-1.5">RFC Emisor</label>
          <input
            type="text"
            placeholder="KAP120101AB1"
            value={rfcValue}
            onChange={e => field('rfc_emisor', e.target.value.toUpperCase())}
            maxLength={13}
            className={`w-full bg-white/5 border rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none font-mono tracking-wider ${
              !rfcValid ? 'border-red-500/40' : 'border-white/10 focus:border-[#CCFF00]/40'
            }`}
          />
          {companyRfc && !data.rfc_emisor && (
            <p className="mt-1 text-[10px] text-[#CCFF00]/50">Usando RFC de Información de Empresa</p>
          )}
          {!rfcValid && <p className="mt-1 text-[10px] text-red-400">RFC con formato incorrecto</p>}
        </div>

        <div>
          <label className="text-[10px] text-white/30 uppercase tracking-widest block mb-1.5">Régimen Fiscal</label>
          <select
            value={data.regimen_fiscal ?? '601'}
            onChange={e => field('regimen_fiscal', e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#CCFF00]/40"
          >
            {REGIMENES_FISCALES.map(r => (
              <option key={r.code} value={r.code} className="bg-[#0b1b2a] text-white">
                {r.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[10px] text-white/30 uppercase tracking-widest block mb-1.5">
            Lugar de Expedición (C.P.)
          </label>
          <input
            type="text"
            placeholder="72000"
            value={data.lugar_expedicion ?? ''}
            onChange={e => field('lugar_expedicion', e.target.value.replace(/\D/g, '').slice(0, 5))}
            maxLength={5}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#CCFF00]/40 font-mono tracking-widest"
          />
          <p className="mt-1 text-[10px] text-white/25">
            Código postal del domicilio fiscal (5 dígitos, como en el SAT)
          </p>
        </div>
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
