"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ModuleNav } from "./ModuleNav";
import type { ModuleDefinition } from "./ModuleNav";
import type { UserRole } from "@/types";
import { SamanthaChat } from "./SamanthaChat";

interface SidebarProps {
  modules: ModuleDefinition[];
  userRole: UserRole;
  userName: string;
  tenantName: string;
  onLogout: () => void;
  open: boolean;
  planId?: string;
}

export function Sidebar({ modules, userRole, userName, tenantName, onLogout, open, planId }: SidebarProps) {
  const pathname = usePathname();
  const isAtollomAdmin = userRole === "atollom_admin";

  return (
    <aside
      className={`
        fixed left-0 top-0 h-full z-50
        flex flex-col
        w-[320px]
        bg-surface/95 backdrop-blur-xl
        border-r border-outline-variant
        transition-all duration-500 ease-out
        rounded-r-xl md:rounded-r-xl
        ${open ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}
      aria-label="Main Navigation"
    >
      {/* Logo Area */}
      <div className="px-6 pt-6 pb-4">
        <Link href="/" className="flex items-center gap-4 group">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-105 ${isAtollomAdmin ? 'bg-primary shadow-primary/20' : 'bg-surface-bright border border-outline-variant'}`}>
             {isAtollomAdmin ? (
               <span className="material-symbols-outlined text-background text-xl font-bold">offline_bolt</span>
             ) : (
               <span className="material-symbols-outlined text-primary text-xl font-bold">medical_services</span>
             )}
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-black tight-tracking text-on-surface truncate uppercase tracking-widest">
              {isAtollomAdmin ? "Atollom HQ" : tenantName}
            </h1>
            <p className="text-[9px] label-tracking uppercase text-primary font-black opacity-70">
              {isAtollomAdmin ? "System Master" : "Active Instance"}
            </p>
          </div>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2 custom-scrollbar">
        <ModuleNav modules={modules} userRole={userRole} />
      </div>

      {/* Samantha Chat Integration - Fixed Bottom */}
      <SamanthaChat planId={planId} />

      {/* User & Status Footer */}
      <div className="p-4 border-t border-outline-variant bg-surface-container/30">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-9 h-9 rounded-lg bg-surface-bright flex items-center justify-center border border-outline-variant">
            <span className="material-symbols-outlined text-[18px] text-primary">person</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-on-surface truncate">{userName}</p>
            <button 
              onClick={onLogout}
              className="text-[10px] font-black uppercase text-primary hover:underline transition-all"
            >
              Sign Out
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-on-surface-variant label-tracking">Latency / Status</span>
            <div className="flex items-center gap-1.5">
               <span className={`w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_var(--primary)]`} />
               <span className="text-[10px] font-black text-primary uppercase">Optimized</span>
            </div>
          </div>
          <div className="h-1.5 w-full bg-surface-bright rounded-full overflow-hidden">
            <div className="h-full bg-primary w-[85%] shadow-[0_0_10px_var(--primary)]" />
          </div>
        </div>
      </div>
    </aside>
  );
}
