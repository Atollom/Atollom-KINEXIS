'use client'

import { useEffect, useState } from 'react'
import { createBrowserSupabaseClient } from '@/lib/supabase-browser'
import { User, Mail, Building2, Save } from 'lucide-react'

export default function ProfilePage() {
  const [user, setUser] = useState<{ email?: string; full_name?: string } | null>(null)
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const supabase = createBrowserSupabaseClient()
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUser({ email: data.user.email, full_name: data.user.user_metadata?.full_name })
        setName(data.user.user_metadata?.full_name ?? '')
      }
    })
  }, [])

  async function save() {
    setSaving(true)
    const supabase = createBrowserSupabaseClient()
    await supabase.auth.updateUser({ data: { full_name: name } })
    setSaved(true)
    setSaving(false)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="flex flex-col gap-6 p-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Perfil</h1>
        <p className="text-sm text-gray-500 mt-1">Datos personales y preferencias de cuenta</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
        {/* Avatar */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-green-700 flex items-center justify-center text-white text-2xl font-bold">
            {name.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || '?'}
          </div>
          <div>
            <p className="font-semibold text-gray-900">{name || 'Sin nombre'}</p>
            <p className="text-sm text-gray-500">{user?.email ?? 'Cargando...'}</p>
          </div>
        </div>

        <hr className="border-gray-100" />

        {/* Name field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            <User className="w-3.5 h-3.5 inline mr-1" />
            Nombre completo
          </label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Tu nombre"
            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        {/* Email (read only) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            <Mail className="w-3.5 h-3.5 inline mr-1" />
            Email
          </label>
          <input
            value={user?.email ?? ''}
            disabled
            className="w-full px-4 py-2.5 rounded-lg border border-gray-100 bg-gray-50 text-sm text-gray-400 cursor-not-allowed"
          />
          <p className="text-xs text-gray-400 mt-1">El email no se puede cambiar desde aquí</p>
        </div>

        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Guardando...' : saved ? '¡Guardado!' : 'Guardar cambios'}
        </button>
      </div>
    </div>
  )
}
