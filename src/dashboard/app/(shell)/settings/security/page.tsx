'use client'

import { useState } from 'react'
import { createBrowserSupabaseClient } from '@/lib/supabase-browser'
import { Lock, Shield, LogOut, Eye, EyeOff } from 'lucide-react'

export default function SecurityPage() {
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [show, setShow] = useState(false)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  async function changePassword() {
    if (newPw !== confirmPw) { setMsg({ type: 'err', text: 'Las contraseñas no coinciden' }); return }
    if (newPw.length < 8) { setMsg({ type: 'err', text: 'Mínimo 8 caracteres' }); return }
    setSaving(true)
    const supabase = createBrowserSupabaseClient()
    const { error } = await supabase.auth.updateUser({ password: newPw })
    if (error) setMsg({ type: 'err', text: error.message })
    else {
      setMsg({ type: 'ok', text: 'Contraseña actualizada correctamente' })
      setCurrentPw(''); setNewPw(''); setConfirmPw('')
    }
    setSaving(false)
  }

  async function signOut() {
    const supabase = createBrowserSupabaseClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <div className="flex flex-col gap-6 p-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Seguridad</h1>
        <p className="text-sm text-gray-500 mt-1">Contraseña, acceso y sesiones activas</p>
      </div>

      {/* Password change */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-5">
          <Lock className="w-4 h-4 text-green-600" />
          <h2 className="font-semibold text-gray-900">Cambiar contraseña</h2>
        </div>
        <div className="space-y-4">
          {[
            { label: 'Contraseña nueva', value: newPw, setter: setNewPw },
            { label: 'Confirmar contraseña', value: confirmPw, setter: setConfirmPw },
          ].map(field => (
            <div key={field.label}>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{field.label}</label>
              <div className="relative">
                <input
                  type={show ? 'text' : 'password'}
                  value={field.value}
                  onChange={e => field.setter(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 pr-10 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <button onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          ))}

          {msg && (
            <div className={`p-3 rounded-lg text-sm ${msg.type === 'ok' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {msg.text}
            </div>
          )}

          <button onClick={changePassword} disabled={saving || !newPw || !confirmPw} className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50">
            {saving ? 'Actualizando...' : 'Actualizar contraseña'}
          </button>
        </div>
      </div>

      {/* Security info */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-4 h-4 text-blue-600" />
          <h2 className="font-semibold text-gray-900">Estado de seguridad</h2>
        </div>
        <div className="space-y-3">
          {[
            { label: 'Autenticación', value: 'Supabase Auth (JWT)', status: 'ok' },
            { label: 'Row Level Security', value: 'Activo en todas las tablas', status: 'ok' },
            { label: 'Aislamiento de tenants', value: 'tenant_id validado en cada query', status: 'ok' },
            { label: 'HTTPS', value: 'Habilitado por Vercel', status: 'ok' },
            { label: '2FA / MFA', value: 'Disponible próximamente', status: 'pending' },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
              <span className="text-sm text-gray-600">{item.label}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-700">{item.value}</span>
                <div className={`w-2 h-2 rounded-full ${item.status === 'ok' ? 'bg-green-500' : 'bg-yellow-400'}`} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sign out */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="font-semibold text-gray-900 mb-2">Sesión activa</h2>
        <p className="text-sm text-gray-500 mb-4">Cierra sesión en este dispositivo.</p>
        <button onClick={signOut} className="flex items-center gap-2 px-5 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 text-sm font-medium rounded-lg transition-colors border border-red-100">
          <LogOut className="w-4 h-4" />
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}
