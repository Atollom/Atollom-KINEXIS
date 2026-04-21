'use client'

import { useState } from 'react'
import { Building2, Upload } from 'lucide-react'
import type { CompanyData } from '../hooks/useOnboarding'

const RFC_PATTERN = /^[A-Z&Ñ]{3,4}\d{6}[A-Z0-9]{3}$/

interface Step1Props {
  data: Partial<CompanyData>
  onChange: (data: Partial<CompanyData>) => void
  onNext: () => void
}

export function Step1CompanyInfo({ data, onChange, onNext }: Step1Props) {
  const [errors, setErrors] = useState<Partial<Record<keyof CompanyData, string>>>({})
  const [logoName, setLogoName] = useState<string>('')

  function validate(): boolean {
    const e: Partial<Record<keyof CompanyData, string>> = {}
    if (!data.name?.trim()) e.name = 'Nombre requerido'
    if (!data.rfc?.trim()) {
      e.rfc = 'RFC requerido'
    } else if (!RFC_PATTERN.test(data.rfc.toUpperCase())) {
      e.rfc = 'Formato inválido (ej: KAP120101AB1 o CORC801010ABC)'
    }
    if (!data.address?.trim()) e.address = 'Dirección requerida'
    if (!data.phone?.trim()) e.phone = 'Teléfono requerido'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleNext() {
    if (validate()) onNext()
  }

  function field(key: keyof CompanyData, value: string) {
    onChange({ ...data, [key]: key === 'rfc' ? value.toUpperCase() : value })
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: undefined }))
  }

  return (
    <div className="space-y-6 animate-in slide-in-from-right-8 duration-500">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-[#CCFF00]/10 flex items-center justify-center">
          <Building2 className="w-5 h-5 text-[#CCFF00]" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Información de la Empresa</h2>
          <p className="text-sm text-white/40">Datos fiscales y de contacto</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {/* Nombre */}
        <div>
          <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1.5 block">
            Nombre / Razón Social *
          </label>
          <input
            type="text"
            placeholder="Ej. Kap Tools S.A. de C.V."
            value={data.name ?? ''}
            onChange={e => field('name', e.target.value)}
            className={`w-full bg-white/5 border rounded-2xl px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:bg-white/8 transition-all ${
              errors.name ? 'border-red-500/50' : 'border-white/10 focus:border-[#CCFF00]/40'
            }`}
          />
          {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name}</p>}
        </div>

        {/* RFC */}
        <div>
          <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1.5 block">
            RFC *
          </label>
          <input
            type="text"
            placeholder="Ej. KAP120101AB1"
            value={data.rfc ?? ''}
            onChange={e => field('rfc', e.target.value)}
            maxLength={13}
            className={`w-full bg-white/5 border rounded-2xl px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:bg-white/8 transition-all font-mono ${
              errors.rfc ? 'border-red-500/50' : 'border-white/10 focus:border-[#CCFF00]/40'
            }`}
          />
          {errors.rfc && <p className="mt-1 text-xs text-red-400">{errors.rfc}</p>}
          <p className="mt-1 text-[10px] text-white/20">
            Personas morales: 12 caracteres · Personas físicas: 13 caracteres
          </p>
        </div>

        {/* Teléfono */}
        <div>
          <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1.5 block">
            Teléfono *
          </label>
          <input
            type="tel"
            placeholder="Ej. +52 222 123 4567"
            value={data.phone ?? ''}
            onChange={e => field('phone', e.target.value)}
            className={`w-full bg-white/5 border rounded-2xl px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:bg-white/8 transition-all ${
              errors.phone ? 'border-red-500/50' : 'border-white/10 focus:border-[#CCFF00]/40'
            }`}
          />
          {errors.phone && <p className="mt-1 text-xs text-red-400">{errors.phone}</p>}
        </div>

        {/* Dirección */}
        <div>
          <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1.5 block">
            Dirección Fiscal *
          </label>
          <textarea
            placeholder="Calle, número, colonia, ciudad, estado, C.P."
            value={data.address ?? ''}
            onChange={e => field('address', e.target.value)}
            rows={3}
            className={`w-full bg-white/5 border rounded-2xl px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:bg-white/8 transition-all resize-none ${
              errors.address ? 'border-red-500/50' : 'border-white/10 focus:border-[#CCFF00]/40'
            }`}
          />
          {errors.address && <p className="mt-1 text-xs text-red-400">{errors.address}</p>}
        </div>

        {/* Logo */}
        <div>
          <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1.5 block">
            Logo (opcional)
          </label>
          <label className="flex items-center gap-3 bg-white/5 border border-white/10 border-dashed rounded-2xl px-4 py-3 cursor-pointer hover:bg-white/8 transition-all group">
            <Upload className="w-4 h-4 text-white/30 group-hover:text-[#CCFF00]/60 transition-colors" />
            <span className="text-sm text-white/30 group-hover:text-white/50 transition-colors">
              {logoName || 'Subir imagen PNG o SVG'}
            </span>
            <input
              type="file"
              accept="image/png,image/svg+xml,image/jpeg"
              className="hidden"
              onChange={e => {
                const file = e.target.files?.[0]
                if (file) {
                  setLogoName(file.name)
                  onChange({ ...data, logo: file })
                }
              }}
            />
          </label>
        </div>
      </div>

      <div className="pt-4">
        <button
          onClick={handleNext}
          className="w-full bg-[#CCFF00] text-black font-bold text-sm uppercase tracking-widest py-3.5 rounded-full hover:bg-[#CCFF00]/90 active:scale-[0.98] transition-all shadow-[0_10px_30px_rgba(204,255,0,0.2)]"
        >
          Continuar →
        </button>
      </div>
    </div>
  )
}
