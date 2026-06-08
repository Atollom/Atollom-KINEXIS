'use client'

import { useState, useEffect } from 'react'
import { Building2, Users, Shield, Calendar, Settings } from 'lucide-react'

interface TenantData {
  id: string
  name: string
  plan: string
  status: string
  created_at: string
  settings: Record<string, unknown> | null
}

interface TenantUser {
  id: string
  user_id: string
  role: string
  created_at: string
}

const ROLE_COLORS: Record<string, string> = {
  owner: 'bg-green-100 text-green-700',
  admin: 'bg-blue-100 text-blue-700',
  agente: 'bg-purple-100 text-purple-700',
  almacenista: 'bg-orange-100 text-orange-700',
  contador: 'bg-gray-100 text-gray-700',
}

export default function AdminTenantsPage() {
  const [tenant, setTenant] = useState<TenantData | null>(null)
  const [users, setUsers] = useState<TenantUser[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/tenants')
      .then(r => r.json())
      .then(data => {
        setTenant(data.tenant)
        setUsers(data.users ?? [])
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="p-6 space-y-4">
      <div className="h-8 w-64 bg-gray-100 rounded animate-pulse" />
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    </div>
  )

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configuración del Tenant</h1>
        <p className="text-sm text-gray-500 mt-1">Información de la cuenta y usuarios</p>
      </div>

      {/* Tenant card */}
      {tenant && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-700 rounded-2xl flex items-center justify-center text-white font-bold text-xl">
                {tenant.name?.[0]?.toUpperCase() ?? 'K'}
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{tenant.name}</h2>
                <p className="text-sm text-gray-400 font-mono">{tenant.id.slice(0, 16)}…</p>
              </div>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${tenant.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
              {tenant.status}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-400">Plan</p>
                <p className="font-semibold text-gray-900 capitalize">{tenant.plan ?? 'Growth'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-400">Usuarios</p>
                <p className="font-semibold text-gray-900">{users.length}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-400">Creado</p>
                <p className="font-semibold text-gray-900">
                  {new Date(tenant.created_at).toLocaleDateString('es-MX')}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Users table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <Users className="w-4 h-4 text-gray-400" />
            Usuarios del tenant ({users.length})
          </h2>
        </div>

        {users.length === 0 ? (
          <div className="py-12 text-center text-gray-400">
            <Building2 className="w-10 h-10 mx-auto mb-3 text-gray-200" />
            <p>No hay usuarios registrados</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left font-semibold text-gray-500 px-6 py-3">Usuario ID</th>
                  <th className="text-left font-semibold text-gray-500 px-6 py-3">Rol</th>
                  <th className="text-left font-semibold text-gray-500 px-6 py-3">Unido</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-gray-500">{u.user_id.slice(0, 20)}…</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${ROLE_COLORS[u.role] ?? 'bg-gray-100 text-gray-700'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-400">
                      {new Date(u.created_at).toLocaleDateString('es-MX')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick settings link */}
      <div className="flex gap-3">
        <a href="/settings/users" className="flex items-center gap-2 px-4 py-2 border border-gray-200 hover:border-green-400 text-gray-600 text-sm font-medium rounded-lg transition-colors">
          <Settings className="w-4 h-4" />
          Gestionar usuarios
        </a>
      </div>
    </div>
  )
}
