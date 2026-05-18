'use client'

import { Receipt, Info } from 'lucide-react'
import { ConnectionTest } from './ConnectionTest'
import type { BillingData } from '../hooks/useOnboarding'

const REGIMENES_FISCALES = [
  { code: '601', label: '601 - General de Ley Personas Morales' },
  { code: '603', label: '603 - Personas Morales con Fines no Lucrativos' },
  { code: '605', label: '605 - Sueldos y Salarios' },
  { code: '606', label: '606 - Arrendamiento' },
  { code: '608', label: '608 - Demás Ingresos' },
  { code: '610', label: '610 - Residentes en el Extranjero' },
  { code: '611', label: '611 - Ingresos por Dividendos' },
  { code: '612', label: '612 - Personas Físicas con Actividades Empresariales' },
  { code: '614', label: '614 - Ingresos por Intereses' },
  { code: '616', label: '616 - Sin Obligaciones Fiscales' },
  { code: '621', label: '621 - Incorporación Fiscal' },
  { code: '622', label: '622 - Actividades Agrícolas, Ganaderas, Silvícolas y Pesqueras' },
  { code: '623', label: '623 - Opcional para Grupos de Sociedades' },
  { code: '624', label: '624 - Coordinados' },
  { code: '625', label: '625 - Régimen de las Actividades Empresariales con ingresos a través de Plataformas Tecnológicas' },
  { code: '626', label: '626 - Régimen Simplificado de Confianza' },
]

const RFC_PATTERN = /^[A-Z&Ñ]{3,4}\d{6}[A-Z0-9]{3}$/

interface Step4Props {
  data: Partial<BillingData>
  onChange: (data: Partial<BillingData>) => void
  onNext: () => void
  onBack: () => void
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  mono = false,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
  mono?: boolean
}) {
  return (
    <div>
      <label className="text-[10px] text-white/30 uppercase tracking-widest block mb-1">{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        className={`w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-[#CCFF00]/40 ${mono ? 'font-mono' : ''}`}
      />
    </div>
  )
}

export function Step4Billing({ data, onChange, onNext, onBack }: Step4Props) {
  function field(key: keyof BillingData, value: string | boolean) {
    onChange({ ...data, [key]: value })
  }

  const facturApiIsSandbox = data.facturapi_secret_key?.startsWith('sk_test_') ?? true

  async function testFacturama() {
    if (!data.facturama_username || !data.facturama_password) {
      return { success: false, message: 'Completa usuario y contraseña de Facturama' }
    }
    const res = await fetch('/api/erp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agent: 'facturama',
        action: 'test_connection',
        username: data.facturama_username,
        password: data.facturama_password,
        sandbox: data.facturama_sandbox ?? true,
      }),
    })
    const json = await res.json()
    return {
      success: json.success ?? false,
      message: json.success ? 'Facturama conectado correctamente' : (json.error ?? 'Error de conexión'),
    }
  }

  async function testFacturAPI() {
    if (!data.facturapi_secret_key) {
      return { success: false, message: 'Ingresa el Secret Key de FacturAPI' }
    }
    const res = await fetch('/api/erp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agent: 'facturapi',
        action: 'test_connection',
        secret_key: data.facturapi_secret_key,
      }),
    })
    const json = await res.json()
    return {
      success: json.success ?? false,
      message: json.success ? 'FacturAPI conectado correctamente' : (json.error ?? 'Error de conexión'),
    }
  }

  const rfcValid = data.rfc_emisor ? RFC_PATTERN.test(data.rfc_emisor.toUpperCase()) : true

  return (
    <div className="space-y-5 animate-in slide-in-from-right-8 duration-500">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-[#CCFF00]/10 flex items-center justify-center">
          <Receipt className="w-5 h-5 text-[#CCFF00]" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Facturación CFDI 4.0</h2>
          <p className="text-sm text-white/40">Configura tu proveedor CFDI (Facturama recomendado)</p>
        </div>
      </div>

      {/* Facturama */}
      <div className="bg-white/3 border border-[#CCFF00]/20 rounded-3xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white">Facturama</span>
            <span className="px-2 py-0.5 bg-[#CCFF00]/10 text-[#CCFF00] text-[10px] font-bold rounded-full border border-[#CCFF00]/20">
              Recomendado
            </span>
          </div>
        </div>
        <p className="text-xs text-white/30">
          Proveedor principal. $2,000/mes facturas ilimitadas.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <InputField
            label="Usuario"
            value={data.facturama_username ?? ''}
            onChange={v => field('facturama_username', v)}
            placeholder="tu_usuario"
          />
          <InputField
            label="Contraseña"
            type="password"
            value={data.facturama_password ?? ''}
            onChange={v => field('facturama_password', v)}
            placeholder="••••••••"
          />
        </div>
        <label className="flex items-center gap-2 text-xs text-white/40 cursor-pointer">
          <input
            type="checkbox"
            checked={data.facturama_sandbox ?? true}
            onChange={e => field('facturama_sandbox', e.target.checked)}
            className="accent-[#CCFF00]"
          />
          Modo Sandbox (pruebas)
        </label>
        <ConnectionTest
          provider="Facturama"
          testFn={testFacturama}
          disabled={!data.facturama_username || !data.facturama_password}
        />
      </div>

      {/* FacturAPI */}
      <div className="bg-white/3 border border-white/8 rounded-3xl p-5 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-white">FacturAPI</span>
          <span className="px-2 py-0.5 bg-white/5 text-white/40 text-[10px] font-bold rounded-full border border-white/10">
            Alternativo
          </span>
          {data.facturapi_secret_key && (
            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
              facturApiIsSandbox
                ? 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20'
                : 'bg-[#CCFF00]/10 text-[#CCFF00] border-[#CCFF00]/20'
            }`}>
              {facturApiIsSandbox ? 'Sandbox' : 'Producción'}
            </span>
          )}
        </div>
        <p className="text-xs text-white/30">
          Fallback automático. Se detecta sandbox/producción por prefijo del key.
        </p>
        <InputField
          label="Secret Key"
          type="password"
          value={data.facturapi_secret_key ?? ''}
          onChange={v => field('facturapi_secret_key', v)}
          placeholder="sk_test_... o sk_live_..."
          mono
        />
        <ConnectionTest
          provider="FacturAPI"
          testFn={testFacturAPI}
          disabled={!data.facturapi_secret_key}
        />
      </div>

      {/* Datos Fiscales Emisor */}
      <div className="bg-white/3 border border-white/8 rounded-3xl p-5 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-white">Datos Fiscales Emisor</span>
          <Info className="w-3.5 h-3.5 text-white/20" />
        </div>
        <div className="grid grid-cols-1 gap-3">
          <div>
            <label className="text-[10px] text-white/30 uppercase tracking-widest block mb-1">RFC Emisor</label>
            <input
              type="text"
              placeholder="KAP120101AB1"
              value={data.rfc_emisor ?? ''}
              onChange={e => field('rfc_emisor', e.target.value.toUpperCase())}
              maxLength={13}
              className={`w-full bg-white/5 border rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/20 focus:outline-none font-mono ${
                !rfcValid ? 'border-red-500/40' : 'border-white/10 focus:border-[#CCFF00]/40'
              }`}
            />
            {!rfcValid && <p className="mt-1 text-[10px] text-red-400">RFC con formato incorrecto</p>}
          </div>
          <div>
            <label className="text-[10px] text-white/30 uppercase tracking-widest block mb-1">Régimen Fiscal</label>
            <select
              value={data.regimen_fiscal ?? '601'}
              onChange={e => field('regimen_fiscal', e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#CCFF00]/40"
            >
              {REGIMENES_FISCALES.map(r => (
                <option key={r.code} value={r.code} className="bg-[#0b1b2a] text-white">
                  {r.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] text-white/30 uppercase tracking-widest block mb-1">Lugar de Expedición (C.P.)</label>
            <input
              type="text"
              placeholder="72000"
              value={data.lugar_expedicion ?? ''}
              onChange={e => field('lugar_expedicion', e.target.value.replace(/\D/g, '').slice(0, 5))}
              maxLength={5}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-[#CCFF00]/40 font-mono"
            />
          </div>
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
