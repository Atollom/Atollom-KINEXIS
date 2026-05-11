"use client";

import { useState } from "react";
import { useToast } from "@/components/ToastProvider";
import { mockUsers, mockRoles, mockUserStats } from "@/lib/mockData";
import type { User, Role } from "@/lib/mockData";

const ROLE_CFG: Record<User["role"], { label: string; color: string; bg: string; border: string }> = {
  owner:   { label: "Owner",        color: "text-purple-400", bg: "bg-purple-400/10", border: "border-purple-400/20" },
  admin:   { label: "Admin",        color: "text-blue-400",   bg: "bg-blue-400/10",   border: "border-blue-400/20"  },
  manager: { label: "Manager",      color: "text-[#CCFF00]",  bg: "bg-[#CCFF00]/10",  border: "border-[#CCFF00]/20" },
  user:    { label: "Usuario",      color: "text-amber-400",  bg: "bg-amber-400/10",  border: "border-amber-400/20" },
  viewer:  { label: "Visualizador", color: "text-on-surface/50", bg: "bg-white/5",    border: "border-white/10"     },
};

const STATUS_CFG: Record<User["status"], { label: string; color: string; bg: string; icon: string }> = {
  active:   { label: "Activo",    color: "text-[#CCFF00]",  bg: "bg-[#CCFF00]/10",  icon: "check_circle"  },
  invited:  { label: "Invitado",  color: "text-amber-400",  bg: "bg-amber-400/10",  icon: "schedule_send" },
  inactive: { label: "Inactivo",  color: "text-on-surface/30", bg: "bg-white/5",    icon: "block"         },
};

const MODULES = ["ecommerce", "crm", "erp", "meta", "settings"] as const;
type Module = typeof MODULES[number];

const MODULE_LABEL: Record<Module, string> = {
  ecommerce: "E-commerce",
  crm:       "CRM",
  erp:       "ERP",
  meta:      "Meta",
  settings:  "Config",
};

function PermDot({ has }: { has: boolean }) {
  return (
    <div className={`w-1.5 h-1.5 rounded-full ${has ? "bg-[#CCFF00]" : "bg-white/10"}`} />
  );
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear().toString().slice(-2)}`;
}

function AvatarCircle({ initials, role }: { initials: string; role: User["role"] }) {
  const cfg = ROLE_CFG[role];
  return (
    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-[11px] font-black flex-shrink-0 ${cfg.bg} ${cfg.color} border ${cfg.border}`}>
      {initials}
    </div>
  );
}

function PermMatrix({ permissions }: { permissions: User["permissions"] }) {
  return (
    <div className="flex gap-3">
      {MODULES.map(mod => {
        const p = permissions[mod];
        const level = p.manage ? 2 : p.edit ? 1 : p.view ? 0 : -1;
        return (
          <div key={mod} className="flex flex-col items-center gap-1">
            <div className="flex flex-col gap-0.5">
              <PermDot has={p.manage} />
              <PermDot has={p.edit} />
              <PermDot has={p.view} />
            </div>
            <span className={`text-[7px] font-black label-tracking ${level >= 0 ? "text-on-surface/40" : "text-on-surface/15"}`}>
              {MODULE_LABEL[mod].slice(0, 2).toUpperCase()}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function RolePermRow({ label, perms }: { label: string; perms: { view: boolean; edit: boolean; manage: boolean } }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
      <span className="text-[10px] font-bold text-on-surface/60 capitalize w-24">{label}</span>
      <div className="flex gap-2">
        {[
          { key: "view",   label: "Ver",      color: perms.view   ? "text-blue-400 bg-blue-400/10 border-blue-400/20"    : "text-white/10 bg-white/3 border-white/5" },
          { key: "edit",   label: "Editar",   color: perms.edit   ? "text-[#CCFF00] bg-[#CCFF00]/10 border-[#CCFF00]/20" : "text-white/10 bg-white/3 border-white/5" },
          { key: "manage", label: "Gestionar",color: perms.manage ? "text-purple-400 bg-purple-400/10 border-purple-400/20" : "text-white/10 bg-white/3 border-white/5" },
        ].map(p => (
          <span key={p.key} className={`px-2 py-0.5 rounded-lg text-[8px] font-black border ${p.color}`}>
            {p.label.toUpperCase()}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function ConfigUsersPage() {
  const { showToast } = useToast();
  const [tab, setTab] = useState<"users" | "roles">("users");
  const [search, setSearch] = useState("");
  const [expandedRole, setExpandedRole] = useState<string | null>(null);

  const users = search
    ? mockUsers.filter(u =>
        u.full_name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
      )
    : mockUsers;

  return (
    <div className="space-y-10 animate-in">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <span className="text-[0.75rem] font-bold label-tracking text-primary drop-shadow-[0_0_8px_rgba(204,255,0,0.2)]">
            Configuración / Usuarios & Roles
          </span>
          <h1 className="text-4xl md:text-5xl font-black tight-tracking text-on-surface">
            Usuarios & Roles
          </h1>
          <p className="text-sm text-on-surface-variant">
            {mockUserStats.total} usuarios ·{" "}
            <span className="text-[#CCFF00] font-bold">{mockUserStats.active} activos</span> ·{" "}
            {mockUserStats.invited} invitación pendiente
          </p>
        </div>
        <div className="flex gap-3 self-start md:self-auto">
          <button
            onClick={() => showToast({ type: "success", title: "Invitación enviada", message: "Email de activación enviado" })}
            className="px-6 py-3 rounded-2xl bg-primary text-black text-[10px] font-black label-tracking hover:bg-primary/90 transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined !text-[16px]">person_add</span>
            INVITAR USUARIO
          </button>
        </div>
      </header>

      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {(["owner", "admin", "manager", "user", "viewer"] as User["role"][]).map(role => {
          const cfg = ROLE_CFG[role];
          const count = mockUsers.filter(u => u.role === role).length;
          return (
            <div key={role} className={`glass-card rounded-[1.5rem] border ${cfg.border} p-5`}>
              <p className={`text-[9px] font-black label-tracking ${cfg.color} uppercase mb-2`}>{cfg.label}</p>
              <p className={`text-2xl font-black ${cfg.color}`}>{count}</p>
              <p className="text-[9px] text-on-surface/30 mt-0.5">usuario{count !== 1 ? "s" : ""}</p>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {(["users", "roles"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2.5 rounded-xl text-[10px] font-black label-tracking transition-all ${
              tab === t
                ? "bg-primary text-black"
                : "glass-card border border-white/5 text-on-surface-variant hover:border-primary/20"
            }`}
          >
            {t === "users" ? `USUARIOS (${mockUserStats.total})` : `ROLES (${mockRoles.length})`}
          </button>
        ))}
      </div>

      {/* USERS TAB */}
      {tab === "users" && (
        <>
          {/* Search */}
          <div className="relative w-72">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface/30 !text-[16px]">search</span>
            <input
              type="text"
              placeholder="Buscar nombre o email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-[11px] font-medium text-on-surface placeholder:text-on-surface/30 focus:border-primary/50 outline-none w-full"
            />
          </div>

          {/* Users table */}
          <div className="glass-card rounded-[2rem] border border-white/5 overflow-hidden">
            {/* Header row */}
            <div className="grid grid-cols-[2.5fr_1.2fr_1fr_1.2fr_auto_auto] gap-4 px-8 py-4 border-b border-white/5">
              {["Usuario", "Rol", "Estado", "Último Acceso", "Permisos", ""].map((h, i) => (
                <span key={i} className="text-[9px] font-black label-tracking text-on-surface/30 uppercase">{h}</span>
              ))}
            </div>

            <div className="divide-y divide-white/5">
              {users.map(u => {
                const rCfg = ROLE_CFG[u.role];
                const sCfg = STATUS_CFG[u.status];
                return (
                  <div
                    key={u.id}
                    className="grid grid-cols-[2.5fr_1.2fr_1fr_1.2fr_auto_auto] gap-4 items-center px-8 py-5 hover:bg-white/[0.02] transition-colors group"
                  >
                    {/* Name + email */}
                    <div className="flex items-center gap-3 min-w-0">
                      <AvatarCircle initials={u.avatar_initials} role={u.role} />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-on-surface truncate">{u.full_name}</p>
                        <p className="text-[9px] text-on-surface/40 truncate">{u.email}</p>
                      </div>
                    </div>

                    {/* Role badge */}
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-xl text-[9px] font-black ${rCfg.color} ${rCfg.bg} border ${rCfg.border} w-fit`}>
                      {rCfg.label.toUpperCase()}
                    </span>

                    {/* Status badge */}
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-black ${sCfg.color} ${sCfg.bg} w-fit`}>
                      <span className="material-symbols-outlined !text-[9px]">{sCfg.icon}</span>
                      {sCfg.label.toUpperCase()}
                    </span>

                    {/* Last login */}
                    <span className="text-[10px] text-on-surface/40">
                      {u.last_login ? fmtDate(u.last_login) : "—"}
                    </span>

                    {/* Permission matrix */}
                    <PermMatrix permissions={u.permissions} />

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => showToast({ type: "info", title: "Editar usuario", message: `Modificando permisos de ${u.full_name}` })}
                        className="px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 text-on-surface/60 text-[9px] font-black hover:bg-white/10 transition-colors flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined !text-[10px]">edit</span>
                        EDITAR
                      </button>
                      {u.status === "invited" && (
                        <button
                          onClick={() => showToast({ type: "success", title: "Invitación reenviada", message: `Email enviado a ${u.email}` })}
                          className="px-2.5 py-1 rounded-xl bg-amber-400/10 border border-amber-400/20 text-amber-400 text-[9px] font-black hover:bg-amber-400/20 transition-colors whitespace-nowrap"
                        >
                          REENVIAR
                        </button>
                      )}
                      {u.role !== "owner" && u.status === "active" && (
                        <button
                          onClick={() => showToast({ type: "warning", title: "Usuario desactivado", message: `${u.full_name} ya no tiene acceso` })}
                          className="px-2.5 py-1 rounded-xl bg-red-400/10 border border-red-400/20 text-red-400 text-[9px] font-black hover:bg-red-400/20 transition-colors"
                        >
                          BAJA
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Perm legend */}
          <div className="flex items-center gap-6 px-2">
            <span className="text-[9px] text-on-surface/30 font-black label-tracking">LEYENDA PERMISOS:</span>
            {[
              { dots: 1, label: "Solo ver",        color: "bg-[#CCFF00]"  },
              { dots: 2, label: "Ver + editar",     color: "bg-[#CCFF00]"  },
              { dots: 3, label: "Control total",    color: "bg-[#CCFF00]"  },
            ].map((l, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="flex flex-col gap-0.5">
                  {[2, 1, 0].map(j => (
                    <div key={j} className={`w-1.5 h-1.5 rounded-full ${j < l.dots ? l.color : "bg-white/10"}`} />
                  ))}
                </div>
                <span className="text-[9px] text-on-surface/30">{l.label}</span>
              </div>
            ))}
            <div className="flex items-center gap-2">
              <div className="flex flex-col gap-0.5">
                {[0, 1, 2].map(j => <div key={j} className="w-1.5 h-1.5 rounded-full bg-white/10" />)}
              </div>
              <span className="text-[9px] text-on-surface/30">Sin acceso</span>
            </div>
          </div>
        </>
      )}

      {/* ROLES TAB */}
      {tab === "roles" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {mockRoles.map(role => {
            const rCfg = ROLE_CFG[role.name.toLowerCase() as User["role"]];
            const isExpanded = expandedRole === role.id;
            return (
              <div key={role.id} className={`glass-card rounded-[2rem] border ${rCfg.border} overflow-hidden`}>
                {/* Role header */}
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
                  <span className={`material-symbols-outlined !text-[18px] text-on-surface/30 transition-transform ${isExpanded ? "rotate-180" : ""}`}>
                    expand_more
                  </span>
                </button>

                {/* Expanded permissions */}
                {isExpanded && (
                  <div className="px-6 pb-6">
                    <div className="rounded-2xl bg-white/[0.02] border border-white/5 p-4">
                      <p className="text-[8px] font-black label-tracking text-on-surface/30 uppercase mb-3">Permisos por módulo</p>
                      {MODULES.map(mod => (
                        <RolePermRow
                          key={mod}
                          label={MODULE_LABEL[mod]}
                          perms={role.permissions[mod]}
                        />
                      ))}
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => showToast({ type: "info", title: "Editor de rol", message: `Editando permisos de "${role.name}"` })}
                        className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-on-surface/60 text-[9px] font-black hover:bg-white/10 transition-colors flex items-center justify-center gap-1"
                      >
                        <span className="material-symbols-outlined !text-[12px]">edit</span>
                        EDITAR ROL
                      </button>
                      <button
                        onClick={() => showToast({ type: "success", title: "Rol duplicado", message: `"${role.name} (copia)" creado — puedes personalizarlo` })}
                        className="flex-1 px-3 py-2 rounded-xl bg-primary/10 border border-primary/20 text-primary text-[9px] font-black hover:bg-primary/20 transition-colors flex items-center justify-center gap-1"
                      >
                        <span className="material-symbols-outlined !text-[12px]">content_copy</span>
                        DUPLICAR
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* New custom role CTA */}
          <button
            onClick={() => showToast({ type: "info", title: "Nuevo rol personalizado", message: "Abriendo constructor de permisos" })}
            className="glass-card rounded-[2rem] border border-dashed border-white/10 p-6 flex items-center justify-center gap-3 hover:border-primary/30 hover:bg-white/[0.02] transition-all text-on-surface/30 hover:text-on-surface/60 min-h-[120px]"
          >
            <span className="material-symbols-outlined !text-[20px]">add_circle</span>
            <span className="text-[10px] font-black label-tracking">CREAR ROL PERSONALIZADO</span>
          </button>
        </div>
      )}

      <div className="h-10" />
    </div>
  );
}
