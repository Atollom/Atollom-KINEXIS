'use client'

import { useState } from 'react'
import { Send, CheckCircle, Loader2 } from 'lucide-react'

type Status = 'idle' | 'loading' | 'success' | 'error'

const INPUT_CLASS =
  'w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#CCFF00] focus:bg-white/[0.14] transition-colors text-sm'

export function DemoForm() {
  const [form, setForm]   = useState({ name: '', email: '', company: '', phone: '', message: '' })
  const [status, setStatus] = useState<Status>('idle')

  function set(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [field]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    try {
      await fetch('/api/demo-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      setStatus('success')
    } catch {
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div className="text-center py-12">
        <CheckCircle className="w-16 h-16 text-[#CCFF00] mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-white mb-2">¡Solicitud recibida!</h3>
        <p className="text-white/60">
          Nuestro equipo se contactará contigo en las próximas 24 horas para agendar tu demo.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-white/60 mb-1.5">Nombre completo *</label>
          <input
            type="text" required value={form.name} onChange={set('name')}
            placeholder="Carlos García" className={INPUT_CLASS}
          />
        </div>
        <div>
          <label className="block text-sm text-white/60 mb-1.5">Email *</label>
          <input
            type="email" required value={form.email} onChange={set('email')}
            placeholder="carlos@miempresa.com" className={INPUT_CLASS}
          />
        </div>
        <div>
          <label className="block text-sm text-white/60 mb-1.5">Empresa *</label>
          <input
            type="text" required value={form.company} onChange={set('company')}
            placeholder="Mi Empresa SA de CV" className={INPUT_CLASS}
          />
        </div>
        <div>
          <label className="block text-sm text-white/60 mb-1.5">Teléfono</label>
          <input
            type="tel" value={form.phone} onChange={set('phone')}
            placeholder="+52 222 123 4567" className={INPUT_CLASS}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm text-white/60 mb-1.5">¿Qué necesitas resolver?</label>
        <textarea
          value={form.message} onChange={set('message')} rows={4}
          placeholder="Cuéntanos sobre tu negocio y los retos que enfrentas..."
          className={`${INPUT_CLASS} resize-none`}
        />
      </div>

      {status === 'error' && (
        <p className="text-sm text-red-400">
          Ocurrió un error. Intenta de nuevo o escríbenos a contacto@atollom.com
        </p>
      )}

      <button
        type="submit"
        disabled={status === 'loading'}
        className="w-full flex items-center justify-center gap-2 bg-[#CCFF00] text-black font-semibold py-4 rounded-xl hover:bg-[#b8e600] transition-colors disabled:opacity-60 disabled:cursor-not-allowed text-sm"
      >
        {status === 'loading' ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</>
        ) : (
          <><Send className="w-4 h-4" /> Solicitar Demo Gratuito</>
        )}
      </button>

      <p className="text-xs text-center text-white/30">
        Sin compromisos · Demo personalizada · Respuesta en 24 horas
      </p>
    </form>
  )
}
