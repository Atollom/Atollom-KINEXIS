"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ModuleNav } from "./ModuleNav";
import type { ModuleDefinition } from "./ModuleNav";
import type { UserRole } from "@/types";

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
        w-[280px]
        bg-[#040f1b]
        transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]
        ${open ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}
      aria-label="Main Navigation"
    >
      {/* Branding Section */}
      <div className="px-8 pt-10 pb-8">
        <Link href="/" className="flex flex-col gap-1 group">
          <h1 className="text-2xl font-black tracking-[-0.05em] text-primary leading-none mb-1">
            KINEXIS
          </h1>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(204,255,0,0.5)]" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">
              {isAtollomAdmin ? "HQ COMMAND" : "NEURAL INSTANCE"}
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation Area */}
      <div className="flex-1 overflow-y-auto px-4 py-2 custom-scrollbar space-y-4">
        <ModuleNav modules={modules} userRole={userRole} />
      </div>

      {/* User Footer - Premium Edition */}
      <div className="p-6 mt-auto">
        <div className="bg-white/5 backdrop-blur-xl rounded-[2rem] p-5 flex items-center gap-5 group/user cursor-pointer active:scale-95 transition-all shadow-lg">
          <div className="w-12 h-12 rounded-full overflow-hidden bg-white/5 flex items-center justify-center">
             <span className="material-symbols-outlined text-white/40 group-hover/user:text-[#CCFF00] transition-colors">person</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white truncate">{userName || "Comandante"}</p>
            <p className="text-[10px] uppercase tracking-widest text-white/30 font-medium">{planId?.toUpperCase() || "ENTERPRISE"}</p>
          </div>
        </div>
        
        <button 
          onClick={onLogout}
          className="mt-4 w-full flex items-center justify-between px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 hover:text-white transition-all group"
        >
          <span>Sign Out</span>
          <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">logout</span>
        </button>
      </div>

      {/* Decoration */}
      <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
    </aside>
  );
}

