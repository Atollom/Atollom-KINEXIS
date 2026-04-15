"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { UserRole } from "@/types";

export interface NavSubItem {
  id: string;
  label: string;
  href: string;
  icon: string;
}

export interface ModuleDefinition {
  id: string;
  name: string;
  color: string;
  colorHex: string;
  icon: string;
  locked: boolean;
  items: NavSubItem[];
}

interface ModuleNavProps {
  modules: ModuleDefinition[];
  userRole: UserRole;
}

const ROLE_VISIBLE_MODULES: Record<UserRole, string[] | "all"> = {
  owner: "all",
  admin: "all",
  socia: "all",
  warehouse: ["erp"],
  almacenista: ["erp"],
  contador: ["erp"],
  agente: ["crm"],
  viewer: ["ecommerce", "erp", "crm"],
  atollom_admin: "all",
};

function canSeeModule(role: UserRole, moduleId: string): boolean {
  const visibility = ROLE_VISIBLE_MODULES[role];
  if (visibility === "all") return true;
  return visibility.includes(moduleId);
}

export function ModuleNav({ modules, userRole }: ModuleNavProps) {
  const pathname = usePathname();
  const [expandedModules, setExpandedModules] = useState<Set<string>>(
    new Set(modules.filter(m => !m.locked).map(m => m.id))
  );

  const toggleModule = (id: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <nav className="flex flex-col gap-1" aria-label="Módulos">
      {modules.map((mod) => {
        if (!canSeeModule(userRole, mod.id)) return null;

        const isExpanded = expandedModules.has(mod.id);
        const isModuleActive = mod.items.some((item) =>
          pathname.startsWith(item.href)
        );

        return (
          <div key={mod.id} className="mb-2">
            <button
              onClick={() => !mod.locked && toggleModule(mod.id)}
              disabled={mod.locked}
              className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-2xl
                transition-all duration-300 group
                ${mod.locked 
                  ? "opacity-30 cursor-not-allowed" 
                  : isModuleActive 
                    ? "bg-primary/10 text-on-surface" 
                    : "hover:bg-white/[0.04] text-on-surface-variant hover:text-on-surface"
                }
              `}
            >
              <span 
                className={`material-symbols-outlined text-[20px] ${isModuleActive ? "text-primary" : ""}`}
                aria-hidden="true"
              >
                {mod.icon}
              </span>
              <span className="flex-1 text-left text-[13px] font-bold tight-tracking">
                {mod.name}
              </span>
              {!mod.locked && (
                <span 
                  className={`material-symbols-outlined text-[18px] transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}
                >
                  expand_more
                </span>
              )}
              {mod.locked && (
                <span className="material-symbols-outlined text-[16px]">lock</span>
              )}
            </button>

            {isExpanded && !mod.locked && (
              <div className="mt-1 ml-4 pl-4 border-l border-outline-variant/30 space-y-1">
                {mod.items.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      className={`
                        flex items-center gap-3 px-4 py-2 rounded-xl
                        text-[12px] font-medium transition-all duration-200
                        ${isActive 
                          ? "bg-primary text-background shadow-lg shadow-primary/20" 
                          : "text-on-surface-variant hover:text-on-surface hover:bg-white/[0.04]"
                        }
                      `}
                    >
                      {item.label}
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
