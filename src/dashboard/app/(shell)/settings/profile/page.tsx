'use client'

import { useState, useEffect } from 'react'
import { useToast } from '@/components/ToastProvider'
import { authenticatedFetch } from '@/lib/api-client'

interface UserProfile {
  full_name: string
  email: string
  phone: string
  role: string
  created_at: string
}

interface TenantProfile {
  business_name: string
  rfc: string
  tax_regime: string
  postal_code: string
}

export default function ProfilePage() {
  const { showToast } = useToast()
  const [user, setUser] = useState<UserProfile>({ full_name: '', email: '', phone: '', role: '', created_at: '' })
  const [tenant, setTenant] = useState<TenantProfile>({ business_name: '', rfc: '', tax_regime: '', postal_code: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    Promise.all([
      authenticatedFetch('/api/settings/me').then(r => r.ok ? r.json() : null),
      authenticatedFetch('/api/settings/profile').then(r => r.ok ? r.json() : null),
    ]).then(([me, profile]) => {
      if (me?.user) setUser(me.user)
      if (profile) setTenant(profile)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const handleSaveUser = async () => {
    setSaving(true)
    try {
      const res = await authenticatedFetch('/api/settings/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: user.full_name, phone: user.phone }),
      })
      if (res.ok) showToast({ type: 'success', title: 'Perfil actualizado', message: 'Tus datos personales han sido guardados' })
      else showToast({ type: 'error', title: 'Error', message: 'No se pudo actualizar' })
    } finally {
      setSaving(false)
    }
  }

  const handleSaveTenant = async () => {
    setSaving(true)
    try {
      const res = await authenticatedFetch('/api/settings/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tenant),
      })
      if (res.ok) showToast({ type: 'success', title: 'Empresa actualizada', message: 'Datos fiscales guardados correctamente' })
      else showToast({ type: 'error', title: 'Error', message: 'No se pudo actualizar' })
    } finally {
      setSaving(false)
    }
  }

  const ROLE_LABELS: Record<string, string> = {
    owner: 'Owner', admin: 'Administrador', socia: 'Socia', viewer: 'Visualizador',
    contador: 'Contador', agente: 'Agente', almacenista: 'Almacenista', atollom_admin: 'Atollom Admin',
  }

  return (
    <div className="space-y-10 animate-in">
      <header className="space-y-2">
        <span className="text-[0.75rem] font-bold label-tracking text-primary drop-shadow-[0_0_8px_rgba(204,255,0,0.2)]">
          Configuración / Perfil
        </span>
        <h1 className="text-4xl md:text-5xl font-black tight-tracking text-on-surface">Mi Perfil</h1>
        <p className="text-sm text-on-surface-variant">Datos personales y configuración de empresa</p>
      </header>

      {/* Personal info */}
      <div className="glass-card rounded-[2rem] border border-white/5 p-8 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-black text-sm text-on-surface">Información personal</h2>
          <span className="px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-[9px] font-black text-primary">
            {ROLE_LABELS[user.role] ?? user.role}
          </span>
        </div>

        {/* Avatar */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-xl font-black text-primary">
            {user.full_name ? user.full_name.slice(0, 2).toUpperCase() : '??'}
          </div>
          <div>
            <p className="font-black text-sm text-on-surface">{user.full_name || '—'}</p>
            <p className="text-[10px] text-on-surface/40">{user.email}</p>
            {user.created_at && (
              <p className="text-[9px] text-on-surface/30 mt-0.5">
                Miembro desde {new Date(user.created_at).toLocaleDateString('es-MX', { year: 'numeric', month: 'long' })}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { label: 'Nombre completo', field: 'full_name' as const, type: 'text', placeholder: 'Tu nombre' },
            { label: 'Teléfono', field: 'phone' as const, type: 'tel', placeholder: '+52 55 1234 5678' },
          ].map(f => (
            <div key={f.field}>
              <label className="text-[9px] font-black label-tracking text-on-surface/40 uppercase block mb-1.5">{f.label}</label>
              <input
                type={f.type}
                placeholder={f.placeholder}
                value={(user[f.field] as string) ?? ''}
                onChange={e => setUser(p => ({ ...p, [f.field]: e.target.value }))}
                disabled={loading}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-on-surface placeholder:text-on-surface/20 focus:border-primary/50 outline-none disabled:opacity-40"
              />
            </div>
          ))}
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSaveUser}
            disabled={saving || loading}
            className="px-6 py-2.5 rounded-xl bg-primary text-black text-[9px] font-black label-tracking hover:bg-primary/90 transition-all disabled:opacity-50"
          >
            {saving ? 'GUARDANDO…' : 'GUARDAR PERFIL'}
          </button>
        </div>
      </div>

      {/* Tenant / fiscal data */}
      <div className="glass-card rounded-[2rem] border border-white/5 p-8 space-y-6">
        <h2 className="font-black text-sm text-on-surface">Datos de empresa</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { label: 'Razón social', field: 'business_name' as const, placeholder: 'Nombre legal de tu empresa' },
            { label: 'RFC', field: 'rfc' as const, placeholder: 'ABC010101XYZ' },
            { label: 'Régimen fiscal', field: 'tax_regime' as const, placeholder: 'Ej. 601 - General de Ley' },
            { label: 'Código postal', field: 'postal_code' as const, placeholder: '06600' },
          ].map(f => (
            <div key={f.field}>
              <label className="text-[9px] font-black label-tracking text-on-surface/40 uppercase block mb-1.5">{f.label}</label>
              <input
                type="text"
                placeholder={f.placeholder}
                value={tenant[f.field] ?? ''}
                onChange={e => setTenant(p => ({ ...p, [f.field]: e.target.value }))}
                disabled={loading}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-on-surface placeholder:text-on-surface/20 focus:border-primary/50 outline-none disabled:opacity-40"
              />
            </div>
          ))}
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSaveTenant}
            disabled={saving || loading}
            className="px-6 py-2.5 rounded-xl bg-primary text-black text-[9px] font-black label-tracking hover:bg-primary/90 transition-all disabled:opacity-50"
          >
            {saving ? 'GUARDANDO…' : 'GUARDAR EMPRESA'}
          </button>
        </div>
      </div>

      <div className="h-10" />
    </div>
  )
}
