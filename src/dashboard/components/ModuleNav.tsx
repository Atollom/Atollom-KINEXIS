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
    <nav className="flex flex-col gap-3" aria-label="Neural Modules">
      {modules.map((mod) => {
        if (!canSeeModule(userRole, mod.id)) return null;

        const isExpanded = expandedModules.has(mod.id);
        const isModuleActive = mod.items.some((item) =>
          pathname.startsWith(item.href)
        );

        return (
          <div key={mod.id} className="space-y-2">
            <button
              onClick={() => !mod.locked && toggleModule(mod.id)}
              disabled={mod.locked}
              className={`
                w-full flex items-center gap-4 px-6 h-14 rounded-2xl
                transition-all duration-500 group relative
                ${mod.locked 
                  ? "opacity-20 cursor-not-allowed" 
                  : isModuleActive 
                    ? "bg-white/10 text-white shadow-xl" 
                    : "hover:bg-white/[0.03] text-white/30 hover:text-white"
                }
              `}
            >
              {isModuleActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-[#ccff00] rounded-r-full shadow-volt" />
              )}
              
              <span 
                className={`material-symbols-outlined text-[20px] italic font-black ${isModuleActive ? "text-[#ccff00]" : "opacity-40 group-hover:opacity-100 transition-opacity"}`}
                aria-hidden="true"
              >
                {mod.icon}
              </span>
              
              <span className="flex-1 text-left text-[11px] font-black uppercase tracking-[0.2em] italic">
                {mod.name}
              </span>
              
              {!mod.locked && (
                <span 
                  className={`material-symbols-outlined text-[16px] transition-all duration-500 opacity-20 group-hover:opacity-100 ${isExpanded ? "rotate-180 text-[#ccff00]" : ""}`}
                >
                  expand_more
                </span>
              )}
              {mod.locked && (
                <span className="material-symbols-outlined text-[16px] opacity-20">lock</span>
              )}
            </button>

            {isExpanded && !mod.locked && (
              <div className="ml-10 space-y-1 animate-in slide-in-from-top-2 duration-500">
                {mod.items.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      className={`
                        flex items-center gap-4 px-6 h-11 rounded-xl
                        text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 italic
                        ${isActive 
                          ? "bg-[#ccff00] text-black shadow-volt" 
                          : "text-white/20 hover:text-white hover:bg-white/[0.04]"
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
