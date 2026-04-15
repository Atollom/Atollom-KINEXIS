"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { UserRole } from "@/types";

// ──────────────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────────────
export interface NavSubItem {
  id: string;
  label: string;
  href: string;
  icon: string;
}

export interface ModuleDefinition {
  id: string;
  name: string;
  color: string;        // tailwind-compatible color key
  colorHex: string;     // hex for inline styles (glow, borders)
  icon: string;
  locked: boolean;
  items: NavSubItem[];
}

interface ModuleNavProps {
  modules: ModuleDefinition[];
  userRole: UserRole;
}

// ──────────────────────────────────────────────────────────────────────────────
// RBAC: qué módulos puede ver cada rol
// Regla: el acceso a datos está protegido por RLS + middleware; esta tabla
// controla únicamente la visibilidad del menú (UX, no seguridad).
// ──────────────────────────────────────────────────────────────────────────────
const ROLE_VISIBLE_MODULES: Record<UserRole, string[] | "all"> = {
  owner:       "all",
  admin:       "all",
  socia:       "all",
  warehouse:   ["erp"],
  almacenista: ["erp"],
  contador:    ["erp"],
  agente:      ["crm"],
  viewer:      ["ecommerce", "erp", "crm"],
  atollom_admin: "all",
};

function canSeeModule(role: UserRole, moduleId: string): boolean {
  const visibility = ROLE_VISIBLE_MODULES[role];
  if (visibility === "all") return true;
  return visibility.includes(moduleId);
}

// ──────────────────────────────────────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────────────────────────────────────
export function ModuleNav({ modules, userRole }: ModuleNavProps) {
  const pathname = usePathname();
  const [expandedModules, setExpandedModules] = useState<Set<string>>(() => {
    // auto-expand ALL modules by default, no se cierren nunca
    return new Set(modules.map(m => m.id));
  });

   // ✅ NUNCA cerrar los módulos. Siempre abiertos.
   const toggleModule = (id: string) => {
     // No hacer nada. Menú siempre expandido.
   };

   return (
     <nav className="flex flex-col gap-2 flex-1 overflow-y-auto px-4 pb-4" aria-label="Módulos">
      {modules.map((mod) => {
        // RBAC: skip invisible modules
        if (!canSeeModule(userRole, mod.id)) return null;

        const isExpanded = expandedModules.has(mod.id);
        const isModuleActive = mod.items.some((item) =>
          pathname.startsWith(item.href)
        );

        return (
          <div key={mod.id} className="mb-1">
            {/* ── Module header ─────────────────────────────── */}
            <button
              onClick={() => !mod.locked && toggleModule(mod.id)}
              disabled={mod.locked}
             className={`
                 w-full flex items-center gap-3 px-4 py-3 rounded-xl
                 font-headline font-bold text-[13px] tracking-tight
                 transition-all duration-200 group relative
                ${mod.locked
                  ? "opacity-40 cursor-not-allowed"
                  : isModuleActive
                    ? "bg-white/[0.06]"
                    : "hover:bg-white/[0.04]"
                }
              `}
              aria-expanded={!mod.locked ? isExpanded : undefined}
              title={mod.locked ? "Disponible en plan superior" : mod.name}
            >
              {/* Module color indicator */}
              <div
                className="w-1 h-6 rounded-full flex-shrink-0 transition-all duration-300"
                style={{
                  backgroundColor: mod.locked ? "#334964" : mod.colorHex,
                  boxShadow: !mod.locked && isModuleActive
                    ? `0 0 8px ${mod.colorHex}60`
                    : "none",
                }}
              />

              {/* Icon */}
              <span
                className="material-symbols-outlined text-lg"
                style={{ color: mod.locked ? "#617794" : mod.colorHex }}
                aria-hidden="true"
              >
                {mod.icon}
              </span>

              {/* Label */}
              <span
                className="flex-1 text-left"
                style={{ color: mod.locked ? "#617794" : "#d7e7ff" }}
              >
                {mod.name}
              </span>

              {/* Lock or chevron */}
              {mod.locked ? (
                <span className="material-symbols-outlined text-sm text-outline" aria-hidden="true">
                  lock
                </span>
              ) : (
                <span
                  className={`
                    material-symbols-outlined text-sm text-on-surface-variant
                    transition-transform duration-200
                    ${isExpanded ? "rotate-180" : ""}
                  `}
                  aria-hidden="true"
                >
                  expand_more
                </span>
              )}

              {/* Locked tooltip */}
              {mod.locked && (
                <span
                  className="
                    absolute left-full ml-3 top-1/2 -translate-y-1/2
                    bg-surface-container-highest text-on-surface-variant
                    text-[11px] font-body px-3 py-1.5 rounded-lg
                    whitespace-nowrap opacity-0 group-hover:opacity-100
                    transition-opacity duration-200 pointer-events-none
                    border border-outline-variant/30
                    z-50
                  "
                >
                  🔒 Disponible en plan superior
                </span>
              )}
            </button>

            {/* ── Sub-items (collapsible) ────────────────────── */}
            {!mod.locked && isExpanded && (
              <div className="mt-0.5 ml-4 pl-3 border-l border-outline-variant/20 space-y-0.5">
                {mod.items.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      aria-current={isActive ? "page" : undefined}
                      className={`
                         flex items-center gap-3 px-4 py-2.5 rounded-lg
                         text-[12px] font-medium
                        transition-all duration-150
                        ${isActive
                          ? "bg-white/[0.08] text-on-surface"
                          : "text-on-surface-variant hover:text-on-surface hover:bg-white/[0.04]"
                        }
                      `}
                    >
                      <span
                        className="material-symbols-outlined text-base"
                        style={{
                          color: isActive ? mod.colorHex : undefined,
                        }}
                        aria-hidden="true"
                      >
                        {item.icon}
                      </span>
                      {item.label}

                      {/* Active indicator dot */}
                      {isActive && (
                        <span
                          className="ml-auto w-1.5 h-1.5 rounded-full"
                          style={{
                            backgroundColor: mod.colorHex,
                            boxShadow: `0 0 6px ${mod.colorHex}80`,
                          }}
                        />
                      )}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}
