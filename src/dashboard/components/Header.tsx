"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useNotifications } from "@/hooks/useNotifications";
import { NotificationPanel } from "./NotificationPanel";

interface HeaderProps {
  onMenuToggle?: () => void;
}

const MODULES = [
  { id: "ecommerce", name: "Ecommerce", href: "/ecommerce" },
  { id: "erp", name: "ERP", href: "/erp" },
  { id: "crm", name: "CRM", href: "/crm" },
];

function getActiveModule(pathname: string): string | null {
  if (pathname.startsWith("/ecommerce")) return "ecommerce";
  if (pathname.startsWith("/erp") || pathname.startsWith("/warehouse")) return "erp";
  if (pathname.startsWith("/crm")) return "crm";
  if (pathname.startsWith("/meta")) return "meta";
  if (pathname.startsWith("/atollom")) return "atollom";
  return null;
}

export function Header({ onMenuToggle }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [panelOpen, setPanelOpen] = useState(false);
  const activeModule = getActiveModule(pathname);
  const {
    notifications,
    unreadCount,
    criticalCount,
    isLoading,
    readIds,
    markRead,
    markAllAsRead,
  } = useNotifications();

  return (
    <header
      className="
        fixed top-0 right-0 left-0 md:left-[280px] z-40
        flex items-center justify-between
        h-16 px-6 md:px-10
        bg-surface/80 backdrop-blur-3xl
        border-b border-white/5
      "
    >
      <div className="flex items-center gap-8">
        <button
          onClick={onMenuToggle}
          className="md:hidden text-on-surface-variant hover:text-primary transition-colors"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>

        <nav className="hidden lg:flex items-center gap-8">
          {MODULES.map((mod) => (
            <button
              key={mod.id}
              onClick={() => router.push(mod.href)}
              className={`
                text-[10px] font-black uppercase tracking-[0.2em] transition-all
                ${activeModule === mod.id ? "text-primary drop-shadow-[0_0_8px_rgba(204,255,0,0.5)]" : "text-on-surface-variant hover:text-on-surface"}
              `}
            >
              {mod.name}
            </button>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-8">
        <div className="hidden sm:flex items-center gap-3 px-4 py-1.5 rounded-full bg-white/5 border border-white/5">
           <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(204,255,0,0.5)]" />
           <span className="text-[9px] font-black uppercase tracking-widest text-primary">Neural Link Active</span>
        </div>

        <div className="flex items-center gap-5">
          <div className="relative">
            <button
              onClick={() => setPanelOpen((o) => !o)}
              className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-white/5 text-on-surface-variant hover:text-primary transition-all"
            >
              <span className="material-symbols-outlined text-[20px]">
                {criticalCount > 0 ? "notifications_active" : "sensors"}
              </span>
              {unreadCount > 0 && (
                <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(204,255,0,0.5)]" />
              )}
            </button>
            {panelOpen && (
              <NotificationPanel
                notifications={notifications}
                isLoading={isLoading}
                readIds={readIds}
                onClose={() => setPanelOpen(false)}
                onMarkRead={markRead}
                onMarkAllRead={markAllAsRead}
              />
            )}
          </div>

          <button
             onClick={() => router.push("/settings")}
             className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-white/5 text-on-surface-variant hover:text-on-surface transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">grid_view</span>
          </button>

          <div className="w-9 h-9 rounded-full bg-white/5 overflow-hidden border border-white/10 p-0.5 group cursor-pointer active:scale-95 transition-all">
            <img 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBn5Uj3mHl2Sq6nPUH3ztTR4KLUd0A7oDpetDUm6wilrk7IsPSALTpFOgUFnPtZpSb__tmhkziqKHgd7UVVWIEmcolFHEdVtTIlgjP4HVioontd8QP9feXcmwiSCs_7aJX0RgALEgbKKhzNJTw4W_Fj5Cem79nCMnOxZ27h6osYd80RQuGaEKGDv3qz-lERwCtkXrXpasGksTCNkTEL7YCJwggiVzgFIjlVBdSbOAFqJUQE0YsVlZCSh8ud741B7mUcFwl5XhKd7S0" 
              alt="Profile" 
              className="w-full h-full rounded-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-110" 
            />
          </div>
        </div>
      </div>
    </header>
  );
}