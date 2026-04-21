'use client'

import { MessageSquare } from 'lucide-react'
import { ConnectionTest } from './ConnectionTest'
import type { MessagingData } from '../hooks/useOnboarding'

interface Step3Props {
  data: Partial<MessagingData>
  onChange: (data: Partial<MessagingData>) => void
  onNext: () => void
  onBack: () => void
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
}) {
  return (
    <div>
      <label className="text-[10px] text-white/30 uppercase tracking-widest block mb-1">{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-[#CCFF00]/40 font-mono"
      />
    </div>
  )
}

export function Step3Messaging({ data, onChange, onNext, onBack }: Step3Props) {
  function field(key: keyof MessagingData, value: string) {
    onChange({ ...data, [key]: value })
  }

  async function testWhatsApp() {
    if (!data.wa_access_token || !data.wa_phone_number_id) {
      return { success: false, message: 'Completa Phone Number ID y Access Token' }
    }
    const res = await fetch('/api/meta', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agent: 'whatsapp',
        action: 'test_connection',
        phone_number_id: data.wa_phone_number_id,
        access_token: data.wa_access_token,
      }),
    })
    const json = await res.json()
    return {
      success: json.success ?? false,
      message: json.success ? 'WhatsApp Business conectado' : (json.error ?? 'Error de conexión'),
    }
  }

  async function testInstagram() {
    if (!data.ig_access_token || !data.ig_account_id) {
      return { success: false, message: 'Completa Account ID y Access Token' }
    }
    const res = await fetch('/api/meta', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agent: 'instagram',
        action: 'test_connection',
        account_id: data.ig_account_id,
        access_token: data.ig_access_token,
      }),
    })
    const json = await res.json()
    return {
      success: json.success ?? false,
      message: json.success ? 'Instagram Business conectado' : (json.error ?? 'Error de conexión'),
    }
  }

  async function testFacebook() {
    if (!data.fb_page_access_token || !data.fb_page_id) {
      return { success: false, message: 'Completa Page ID y Page Access Token' }
    }
    const res = await fetch('/api/meta', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agent: 'facebook',
        action: 'test_connection',
        page_id: data.fb_page_id,
        access_token: data.fb_page_access_token,
      }),
    })
    const json = await res.json()
    return {
      success: json.success ?? false,
      message: json.success ? 'Facebook Page conectada' : (json.error ?? 'Error de conexión'),
    }
  }

  return (
    <div className="space-y-5 animate-in slide-in-from-right-8 duration-500">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-[#CCFF00]/10 flex items-center justify-center">
          <MessageSquare className="w-5 h-5 text-[#CCFF00]" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Mensajería</h2>
          <p className="text-sm text-white/40">Conecta WhatsApp, Instagram y Facebook Business</p>
        </div>
      </div>

      {/* WhatsApp */}
      <div className="bg-white/3 border border-white/8 rounded-3xl p-5 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-white">WhatsApp Business</span>
          <span className="px-2 py-0.5 bg-green-500/10 text-green-400 text-[10px] font-bold rounded-full border border-green-500/20">
            Cloud API
          </span>
        </div>
        <div className="grid grid-cols-1 gap-3">
          <InputField
            label="Phone Number ID"
            value={data.wa_phone_number_id ?? ''}
            onChange={v => field('wa_phone_number_id', v)}
            placeholder="123456789012345"
          />
          <InputField
            label="Business Account ID"
            value={data.wa_business_account_id ?? ''}
            onChange={v => field('wa_business_account_id', v)}
            placeholder="987654321098765"
          />
          <InputField
            label="Access Token"
            type="password"
            value={data.wa_access_token ?? ''}
            onChange={v => field('wa_access_token', v)}
            placeholder="EAAxxxxxxxxxx..."
          />
        </div>
        <ConnectionTest
          provider="WhatsApp"
          testFn={testWhatsApp}
          disabled={!data.wa_phone_number_id || !data.wa_access_token}
        />
      </div>

      {/* Instagram */}
      <div className="bg-white/3 border border-white/8 rounded-3xl p-5 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-white">Instagram Business</span>
          <span className="px-2 py-0.5 bg-pink-500/10 text-pink-400 text-[10px] font-bold rounded-full border border-pink-500/20">
            Graph API
          </span>
        </div>
        <div className="grid grid-cols-1 gap-3">
          <InputField
            label="Instagram Account ID"
            value={data.ig_account_id ?? ''}
            onChange={v => field('ig_account_id', v)}
            placeholder="17841412345678"
          />
          <InputField
            label="Access Token (puede ser el mismo que WA)"
            type="password"
            value={data.ig_access_token ?? ''}
            onChange={v => field('ig_access_token', v)}
            placeholder="EAAxxxxxxxxxx..."
          />
        </div>
        <ConnectionTest
          provider="Instagram"
          testFn={testInstagram}
          disabled={!data.ig_account_id || !data.ig_access_token}
        />
      </div>

      {/* Facebook */}
      <div className="bg-white/3 border border-white/8 rounded-3xl p-5 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-white">Facebook Messenger</span>
          <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 text-[10px] font-bold rounded-full border border-blue-500/20">
            Graph API
          </span>
        </div>
        <div className="grid grid-cols-1 gap-3">
          <InputField
            label="Page ID"
            value={data.fb_page_id ?? ''}
            onChange={v => field('fb_page_id', v)}
            placeholder="123456789012"
          />
          <InputField
            label="Page Access Token"
            type="password"
            value={data.fb_page_access_token ?? ''}
            onChange={v => field('fb_page_access_token', v)}
            placeholder="EAAxxxxxxxxxx..."
          />
        </div>
        <ConnectionTest
          provider="Facebook"
          testFn={testFacebook}
          disabled={!data.fb_page_id || !data.fb_page_access_token}
        />
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
