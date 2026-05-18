'use client'

import { useState } from 'react'
import { Users, UserPlus, Trash2, Crown, Shield, Headphones, Package, Calculator, Loader2 } from 'lucide-react'
import type { UserEntry } from '../hooks/useOnboarding'

const ROLES: { value: UserEntry['role']; label: string; description: string; Icon: React.ElementType }[] = [
  { value: 'owner', label: 'Owner', description: 'Acceso total al sistema', Icon: Crown },
  { value: 'admin', label: 'Admin', description: 'Gestión de módulos y usuarios', Icon: Shield },
  { value: 'agente', label: 'Agente', description: 'CRM y atención al cliente', Icon: Headphones },
  { value: 'almacenista', label: 'Almacenista', description: 'Inventario y logística', Icon: Package },
  { value: 'contador', label: 'Contador', description: 'ERP y facturación', Icon: Calculator },
]

interface Step5Props {
  users: UserEntry[]
  onAddUser: (user: Omit<UserEntry, 'id'>) => void
  onRemoveUser: (id: string) => void
  onSubmit: () => void
  submitting: boolean
  onBack: () => void
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function Step5Users({ users, onAddUser, onRemoveUser, onSubmit, submitting, onBack }: Step5Props) {
  const [form, setForm] = useState({ full_name: '', email: '', role: 'agente' as UserEntry['role'] })
  const [errors, setErrors] = useState<{ full_name?: string; email?: string }>({})

  function validate(): boolean {
    const e: typeof errors = {}
    if (!form.full_name.trim()) e.full_name = 'Nombre requerido'
    if (!EMAIL_RE.test(form.email)) e.email = 'Email inválido'
    if (users.some(u => u.email === form.email)) e.email = 'Email ya agregado'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleAdd() {
    if (!validate()) return
    onAddUser({ full_name: form.full_name, email: form.email, role: form.role })
    setForm({ full_name: '', email: '', role: 'agente' })
    setErrors({})
  }

  const canSubmit = users.length > 0

  return (
    <div className="space-y-5 animate-in slide-in-from-right-8 duration-500">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-[#CCFF00]/10 flex items-center justify-center">
          <Users className="w-5 h-5 text-[#CCFF00]" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Equipo y Roles</h2>
          <p className="text-sm text-white/40">Agrega los usuarios que tendrán acceso a KINEXIS</p>
        </div>
      </div>

      {/* Add user form */}
      <div className="bg-white/3 border border-white/8 rounded-3xl p-5 space-y-3">
        <p className="text-xs font-bold text-white/40 uppercase tracking-widest">Agregar usuario</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] text-white/30 uppercase tracking-widest block mb-1">Nombre completo</label>
            <input
              type="text"
              placeholder="Juan García López"
              value={form.full_name}
              onChange={e => { setForm(p => ({ ...p, full_name: e.target.value })); setErrors(p => ({ ...p, full_name: undefined })) }}
              className={`w-full bg-white/5 border rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-[#CCFF00]/40 ${errors.full_name ? 'border-red-500/40' : 'border-white/10'}`}
            />
            {errors.full_name && <p className="mt-1 text-[10px] text-red-400">{errors.full_name}</p>}
          </div>
          <div>
            <label className="text-[10px] text-white/30 uppercase tracking-widest block mb-1">Email</label>
            <input
              type="email"
              placeholder="juan@miempresa.com"
              value={form.email}
              onChange={e => { setForm(p => ({ ...p, email: e.target.value })); setErrors(p => ({ ...p, email: undefined })) }}
              className={`w-full bg-white/5 border rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-[#CCFF00]/40 ${errors.email ? 'border-red-500/40' : 'border-white/10'}`}
            />
            {errors.email && <p className="mt-1 text-[10px] text-red-400">{errors.email}</p>}
          </div>
        </div>

        {/* Role selector */}
        <div>
          <label className="text-[10px] text-white/30 uppercase tracking-widest block mb-2">Rol</label>
          <div className="grid grid-cols-5 gap-2">
            {ROLES.map(({ value, label, description, Icon }) => (
              <button
                key={value}
                onClick={() => setForm(p => ({ ...p, role: value }))}
                className={`flex flex-col items-center gap-1.5 p-2.5 rounded-2xl border text-center transition-all ${
                  form.role === value
                    ? 'border-[#CCFF00]/40 bg-[#CCFF00]/10 text-[#CCFF00]'
                    : 'border-white/8 bg-white/3 text-white/30 hover:bg-white/6 hover:text-white/50'
                }`}
                title={description}
              >
                <Icon className="w-4 h-4" />
                <span className="text-[9px] font-bold uppercase tracking-wide">{label}</span>
              </button>
            ))}
          </div>
          <p className="mt-1 text-[10px] text-white/20">
            {ROLES.find(r => r.value === form.role)?.description}
          </p>
        </div>

        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-4 py-2 bg-white/8 border border-white/10 rounded-full text-xs font-bold text-white/60 uppercase tracking-widest hover:bg-[#CCFF00]/10 hover:text-[#CCFF00] hover:border-[#CCFF00]/30 transition-all"
        >
          <UserPlus className="w-3.5 h-3.5" />
          Agregar usuario
        </button>
      </div>

      {/* Users list */}
      {users.length > 0 && (
        <div className="bg-white/3 border border-white/8 rounded-3xl p-5 space-y-2">
          <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3">
            Usuarios ({users.length})
          </p>
          {users.map(user => {
            const roleInfo = ROLES.find(r => r.value === user.role)
            const { Icon: RoleIcon } = roleInfo ?? { Icon: Users }
            return (
              <div key={user.id} className="flex items-center justify-between py-2.5 px-3 bg-white/3 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-[#CCFF00]/10 flex items-center justify-center">
                    <RoleIcon className="w-3.5 h-3.5 text-[#CCFF00]" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">{user.full_name}</p>
                    <p className="text-[10px] text-white/30">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-white/5 text-white/40 text-[9px] font-bold rounded-full uppercase tracking-widest">
                    {user.role}
                  </span>
                  <button
                    onClick={() => onRemoveUser(user.id)}
                    className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-red-500/10 hover:text-red-400 text-white/20 transition-all"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {users.length === 0 && (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <Users className="w-8 h-8 text-white/10 mb-2" />
          <p className="text-sm text-white/20">Agrega al menos un usuario para continuar</p>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button
          onClick={onBack}
          className="flex-1 bg-white/5 text-white/50 font-bold text-sm uppercase tracking-widest py-3 rounded-full hover:bg-white/10 transition-all"
        >
          ← Atrás
        </button>
        <button
          onClick={onSubmit}
          disabled={!canSubmit || submitting}
          className={`flex-[2] flex items-center justify-center gap-2 font-bold text-sm uppercase tracking-widest py-3 rounded-full transition-all ${
            canSubmit && !submitting
              ? 'bg-[#CCFF00] text-black hover:bg-[#CCFF00]/90 active:scale-[0.98] shadow-[0_10px_30px_rgba(204,255,0,0.25)]'
              : 'bg-white/5 text-white/20 cursor-not-allowed'
          }`}
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Configurando...
            </>
          ) : (
            'Completar Configuración ✓'
          )}
        </button>
      </div>
    </div>
  )
}
