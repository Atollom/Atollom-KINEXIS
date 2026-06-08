'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Users, Shield, Mail, Clock } from 'lucide-react'

interface Member { id: string; email: string; role: string; created_at: string }

const roleConfig: Record<string, { label: string; color: string }> = {
  owner: { label: 'Propietario', color: 'bg-green-100 text-green-700' },
  admin: { label: 'Administrador', color: 'bg-blue-100 text-blue-700' },
  agente: { label: 'Agente', color: 'bg-purple-100 text-purple-700' },
  almacenista: { label: 'Almacenista', color: 'bg-orange-100 text-orange-700' },
  contador: { label: 'Contador', color: 'bg-yellow-100 text-yellow-700' },
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const days = Math.floor(diff / 86400000)
  return days === 0 ? 'Hoy' : days === 1 ? 'Ayer' : `Hace ${days}d`
}

export default function UsersPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.from('tenant_users').select('id, role, created_at, users(email)').then(({ data }) => {
      setMembers((data ?? []).map((d: { id: string; role: string; created_at: string; users?: { email?: string } | { email?: string }[] }) => ({
        id: d.id,
        email: (Array.isArray(d.users) ? d.users[0]?.email : d.users?.email) ?? 'Sin email',
        role: d.role ?? 'agente',
        created_at: d.created_at,
      })))
    }).finally(() => setLoading(false))
  }, [])

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Usuarios y Roles</h1>
          <p className="text-sm text-gray-500 mt-1">Gestión de accesos RBAC del tenant</p>
        </div>
        <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">Configuración</span>
      </div>

      {/* Role legend */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><Shield className="w-4 h-4 text-green-600" />Roles disponibles</h2>
        <div className="flex gap-2 flex-wrap">
          {Object.entries(roleConfig).map(([role, cfg]) => (
            <div key={role} className={`px-3 py-1.5 rounded-full text-xs font-medium ${cfg.color}`}>
              {cfg.label}
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-3">El propietario tiene acceso completo. Los demás roles tienen permisos granulares definidos por RLS en Supabase.</p>
      </div>

      {/* Members table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <Users className="w-4 h-4 text-gray-400" />
          <h2 className="font-semibold text-gray-900">Miembros del equipo</h2>
        </div>
        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />)}
          </div>
        ) : members.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Sin usuarios en este tenant</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500"><Mail className="w-3.5 h-3.5 inline mr-1" />Email</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Rol</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500"><Clock className="w-3.5 h-3.5 inline mr-1" />Incorporación</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {members.map(m => {
                const rc = roleConfig[m.role] ?? { label: m.role, color: 'bg-gray-100 text-gray-500' }
                return (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{m.email}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${rc.color}`}>{rc.label}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{relativeTime(m.created_at)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700">
        Para invitar nuevos usuarios o cambiar roles, contacta al administrador del sistema o usa el panel de Supabase.
      </div>
    </div>
  )
}
