'use client'

import { useState, useEffect } from 'react'
import { useToast } from '@/components/ToastProvider'
import { authenticatedFetch } from '@/lib/api-client'
import { mockUsers, mockRoles } from '@/lib/mockData'
import type { User } from '@/lib/mockData'

const ROLE_CFG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  owner:         { label: 'Owner',        color: 'text-purple-400',    bg: 'bg-purple-400/10',    border: 'border-purple-400/20' },
  admin:         { label: 'Admin',        color: 'text-blue-400',      bg: 'bg-blue-400/10',      border: 'border-blue-400/20'   },
  socia:         { label: 'Socia',        color: 'text-pink-400',      bg: 'bg-pink-400/10',      border: 'border-pink-400/20'   },
  manager:       { label: 'Manager',      color: 'text-[#CCFF00]',     bg: 'bg-[#CCFF00]/10',     border: 'border-[#CCFF00]/20'  },
  agente:        { label: 'Agente',       color: 'text-amber-400',     bg: 'bg-amber-400/10',     border: 'border-amber-400/20'  },
  almacenista:   { label: 'Almacenista',  color: 'text-orange-400',    bg: 'bg-orange-400/10',    border: 'border-orange-400/20' },
  contador:      { label: 'Contador',     color: 'text-blue-300',      bg: 'bg-blue-300/10',      border: 'border-blue-300/20'   },
  user:          { label: 'Usuario',      color: 'text-amber-400',     bg: 'bg-amber-400/10',     border: 'border-amber-400/20'  },
  viewer:        { label: 'Visualizador', color: 'text-on-surface/50', bg: 'bg-white/5',          border: 'border-white/10'      },
  atollom_admin: { label: 'Super Admin',  color: 'text-red-400',       bg: 'bg-red-400/10',       border: 'border-red-400/20'    },
}

interface LiveUser {
  id: string
  full_name: string
  email: string
  role: string
  created_at: string
}

function fmtDate(iso: string) {
  const d = new Date(iso)
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear().toString().slice(-2)}`
}

export default function ConfigUsersPage() {
  const { showToast } = useToast()
  const [tab, setTab] = useState<'users' | 'roles'>('users')
  const [search, setSearch] = useState('')
  const [liveUsers, setLiveUsers] = useState<LiveUser[]>([])
  const [dataSource, setDataSource] = useState<'live' | 'mock'>('mock')
  const [loading, setLoading] = useState(true)
  const [expandedRole, setExpandedRole] = useState<string | null>(null)
  const [editingRole, setEditingRole] = useState<{ id: string; role: string } | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    authenticatedFetch('/api/settings/users')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.users && d.users.length > 0) {
          setLiveUsers(d.users)
          setDataSource('live')
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const displayUsers: Array<LiveUser | User> = dataSource === 'live'
    ? liveUsers.filter(u =>
        !search ||
        u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase())
      )
    : mockUsers.filter(u =>
        !search ||
        u.full_name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
      )

  const handleRoleChange = async (userId: string, newRole: string) => {
    setSaving(true)
    try {
      const res = await authenticatedFetch('/api/settings/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, role: newRole }),
      })
      if (res.ok) {
        setLiveUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u))
        setEditingRole(null)
        showToast({ type: 'success', title: 'Rol actualizado', message: `Nuevo rol: ${ROLE_CFG[newRole]?.label ?? newRole}` })
      } else {
        showToast({ type: 'error', title: 'Error', message: 'Solo el Owner puede cambiar roles' })
      }
    } finally {
      setSaving(false)
    }
  }

  const allRoles = Object.keys(ROLE_CFG)

  return (
    <div className="space-y-10 animate-in">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <span className="text-[0.75rem] font-bold label-tracking text-primary drop-shadow-[0_0_8px_rgba(204,255,0,0.2)]">
            Configuración / Usuarios & Roles
          </span>
          <div className="flex items-center gap-3">
            <h1 className="text-4xl md:text-5xl font-black tight-tracking text-on-surface">Usuarios & Roles</h1>
            <span className={`px-2 py-1 rounded-full text-[9px] font-black label-tracking border ${
              loading ? 'border-white/10 text-white/30' :
              dataSource === 'live' ? 'border-green-500/30 bg-green-500/10 text-green-400' :
              'border-amber-500/30 bg-amber-500/10 text-amber-400'
            }`}>
              {loading ? 'CARGANDO' : dataSource === 'live' ? 'LIVE' : 'SANDBOX'}
            </span>
          </div>
          <p className="text-sm text-on-surface-variant">
            {loading ? '…' : `${displayUsers.length} usuario${displayUsers.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <button
          onClick={() => showToast({ type: 'success', title: 'Invitación enviada', message: 'Email de activación enviado' })}
          className="px-6 py-3 rounded-2xl bg-primary text-black text-[10px] font-black label-tracking hover:bg-primary/90 transition-all flex items-center gap-2 self-start md:self-auto"
        >
          <span className="material-symbols-outlined !text-[16px]">person_add</span>
          INVITAR USUARIO
        </button>
      </header>

      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {(['owner', 'admin', 'agente', 'viewer'] as const).map(role => {
          const cfg = ROLE_CFG[role]
          const count = dataSource === 'live'
            ? liveUsers.filter(u => u.role === role).length
            : mockUsers.filter(u => u.role === role).length
          return (
            <div key={role} className={`glass-card rounded-[1.5rem] border ${cfg.border} p-5`}>
              <p className={`text-[9px] font-black label-tracking ${cfg.color} uppercase mb-2`}>{cfg.label}</p>
              <p className={`text-2xl font-black ${cfg.color}`}>{count}</p>
            </div>
          )
        })}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {(['users', 'roles'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2.5 rounded-xl text-[10px] font-black label-tracking transition-all ${
              tab === t ? 'bg-primary text-black' : 'glass-card border border-white/5 text-on-surface-variant hover:border-primary/20'
            }`}
          >
            {t === 'users' ? `USUARIOS (${displayUsers.length})` : `ROLES (${mockRoles.length})`}
          </button>
        ))}
      </div>

      {/* USERS */}
      {tab === 'users' && (
        <>
          <div className="relative w-72">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface/30 !text-[16px]">search</span>
            <input
              type="text" placeholder="Buscar…" value={search} onChange={e => setSearch(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-[11px] font-medium text-on-surface placeholder:text-on-surface/30 focus:border-primary/50 outline-none w-full"
            />
          </div>

          <div className="glass-card rounded-[2rem] border border-white/5 overflow-hidden">
            <div className="divide-y divide-white/5">
              {(displayUsers as LiveUser[]).map(u => {
                const rCfg = ROLE_CFG[u.role] ?? ROLE_CFG.viewer
                const isEditing = editingRole?.id === u.id
                return (
                  <div key={u.id} className="flex items-center gap-4 px-8 py-5 hover:bg-white/[0.02] transition-colors group">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-[11px] font-black flex-shrink-0 ${rCfg.bg} ${rCfg.color} border ${rCfg.border}`}>
                      {(u.full_name || u.email || '??').slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-on-surface truncate">{u.full_name || '—'}</p>
                      <p className="text-[9px] text-on-surface/40 truncate">{u.email}</p>
                    </div>
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <select
                          value={editingRole.role}
                          onChange={e => setEditingRole({ id: u.id, role: e.target.value })}
                          className="bg-white/10 border border-white/20 rounded-lg px-2 py-1 text-[10px] text-on-surface outline-none"
                        >
                          {allRoles.filter(r => r !== 'owner').map(r => (
                            <option key={r} value={r}>{ROLE_CFG[r]?.label ?? r}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => handleRoleChange(u.id, editingRole.role)}
                          disabled={saving}
                          className="px-2.5 py-1 rounded-lg bg-primary text-black text-[8px] font-black"
                        >
                          {saving ? '…' : 'OK'}
                        </button>
                        <button onClick={() => setEditingRole(null)} className="px-2.5 py-1 rounded-lg bg-white/5 text-on-surface/40 text-[8px] font-black">
                          ✕
                        </button>
                      </div>
                    ) : (
                      <>
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-xl text-[9px] font-black ${rCfg.color} ${rCfg.bg} border ${rCfg.border}`}>
                          {rCfg.label.toUpperCase()}
                        </span>
                        <p className="text-[9px] text-on-surface/30 w-20 text-right">
                          {u.created_at ? fmtDate(u.created_at) : '—'}
                        </p>
                        {u.role !== 'owner' && (
                          <button
                            onClick={() => setEditingRole({ id: u.id, role: u.role })}
                            className="opacity-0 group-hover:opacity-100 transition-opacity px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 text-on-surface/60 text-[9px] font-black hover:bg-white/10 flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined !text-[10px]">edit</span>
                            EDITAR
                          </button>
                        )}
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}

      {/* ROLES */}
      {tab === 'roles' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {mockRoles.map(role => {
            const rCfg = ROLE_CFG[role.name.toLowerCase()] ?? ROLE_CFG.viewer
            const isExpanded = expandedRole === role.id
            return (
              <div key={role.id} className={`glass-card rounded-[2rem] border ${rCfg.border} overflow-hidden`}>
                <button
                  className="w-full p-6 flex items-start justify-between gap-4 hover:bg-white/[0.02] transition-colors"
                  onClick={() => setExpandedRole(isExpanded ? null : role.id)}
                >
                  <div className="text-left">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className={`text-sm font-black ${rCfg.color}`}>{role.name}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-[8px] font-black ${rCfg.color} ${rCfg.bg} border ${rCfg.border}`}>
                        {role.users_count} usuarios
                      </span>
                    </div>
                    <p className="text-[10px] text-on-surface/40">{role.description}</p>
                  </div>
                  <span className={`material-symbols-outlined !text-[18px] text-on-surface/30 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                    expand_more
                  </span>
                </button>
                {isExpanded && (
                  <div className="px-6 pb-6">
                    <p className="text-[8px] font-black label-tracking text-on-surface/30 uppercase mb-2">Permisos por módulo</p>
                    {(['ecommerce', 'crm', 'erp', 'meta', 'settings'] as const).map(mod => (
                      <div key={mod} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                        <span className="text-[10px] font-bold text-on-surface/60 capitalize w-24">{mod}</span>
                        <div className="flex gap-2">
                          {['Ver', 'Editar', 'Gestionar'].map((label, li) => {
                            const p = role.permissions[mod]
                            const has = li === 0 ? p?.view : li === 1 ? p?.edit : p?.manage
                            return (
                              <span key={label} className={`px-2 py-0.5 rounded-lg text-[8px] font-black border ${has ? 'text-[#CCFF00] bg-[#CCFF00]/10 border-[#CCFF00]/20' : 'text-white/10 bg-white/3 border-white/5'}`}>
                                {label.toUpperCase()}
                              </span>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <div className="h-10" />
    </div>
  )
}
