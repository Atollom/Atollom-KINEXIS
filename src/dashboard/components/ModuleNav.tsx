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
  warehouse: ["erp", "warehouse"],
  almacenista: ["erp", "warehouse"],
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
    <nav className="flex flex-col gap-2" aria-label="Neural Modules">
      {modules.map((mod) => {
        if (!canSeeModule(userRole, mod.id)) return null;

        const isExpanded = expandedModules.has(mod.id);
        const isModuleActive = mod.items.some((item) =>
          pathname.startsWith(item.href)
        );

        return (
          <div key={mod.id} className="space-y-1">
            <button
              onClick={() => !mod.locked && toggleModule(mod.id)}
              disabled={mod.locked}
              className={`
                w-full flex items-center gap-4 px-5 h-12 rounded-xl
                transition-all duration-300 group relative
                ${mod.locked 
                  ? "opacity-20 cursor-not-allowed" 
                  : isModuleActive 
                    ? "bg-white/5 text-on-surface" 
                    : "hover:bg-white/5 text-on-surface-variant hover:text-on-surface"
                }
              `}
            >
              <span 
                className={`material-symbols-outlined !text-[18px] ${isModuleActive ? "text-primary drop-shadow-[0_0_8px_rgba(204,255,0,0.5)]" : "opacity-40 group-hover:opacity-100 transition-opacity"}`}
                aria-hidden="true"
              >
                {mod.icon}
              </span>
              
              <span className="flex-1 text-left text-[10px] font-black uppercase tracking-widest">
                {mod.name}
              </span>
              
              {!mod.locked && (
                <span 
                  className={`material-symbols-outlined !text-[14px] transition-all duration-300 opacity-20 group-hover:opacity-100 ${isExpanded ? "rotate-180 text-primary" : ""}`}
                >
                  expand_more
                </span>
              )}
            </button>

            {isExpanded && !mod.locked && (
              <div className="ml-10 space-y-1 animate-in">
                {mod.items.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      className={`
                        flex items-center gap-4 px-5 h-10 rounded-lg
                        text-[9px] font-bold uppercase tracking-widest transition-all duration-200
                        ${isActive 
                          ? "neon-disruptor shadow-[0_0_15px_rgba(204,255,0,0.2)]" 
                          : "text-on-surface-variant hover:text-on-surface hover:bg-white/5"
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

