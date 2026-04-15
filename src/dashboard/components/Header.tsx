"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useNotifications } from "@/hooks/useNotifications";
import { NotificationPanel } from "./NotificationPanel";
import { ThemeToggle } from "./ThemeToggle";

interface HeaderProps {
  onMenuToggle?: () => void;
}

const MODULES = [
  { id: "ecommerce", name: "Ecommerce", icon: "storefront", href: "/ecommerce", color: "blue" },
  { id: "erp", name: "ERP", icon: "account_tree", href: "/erp", color: "green" },
  { id: "crm", name: "CRM", icon: "group", href: "/crm", color: "amber" },
];

// ── Breadcrumb helper ──────────────────────────────────────────────────────────
const ROUTE_LABELS: Record<string, string> = {
  ecommerce: "Ecommerce",
  erp: "ERP",
  crm: "CRM",
  meta: "Meta",
  warehouse: "Almacén",
  settings: "Configuración",
  chat: "Chat",
  orders: "Órdenes",
  ml: "Mercado Libre",
  amazon: "Amazon",
  shopify: "Shopify",
  catalog: "Catálogo",
  prices: "Precios",
  reviews: "Reseñas",
  inventory: "Inventario",
  cfdi: "Facturación CFDI",
  procurement: "Compras",
  cashflow: "Flujo de Caja",
  tax: "Fiscal",
  leads: "Leads",
  pipeline: "Pipeline",
  b2b: "Ventas B2B",
  whatsapp: "WhatsApp",
  instagram: "Instagram",
  nps: "NPS",
  support: "Soporte",
};

function getBreadcrumbs(pathname: string): { label: string; href: string }[] {
  const parts = pathname.split("/").filter(Boolean);
  return parts.map((part, i) => ({
    label: ROUTE_LABELS[part] || part,
    href: "/" + parts.slice(0, i + 1).join("/"),
  }));
}

function getActiveModule(pathname: string): string | null {
  if (pathname.startsWith("/ecommerce")) return "ecommerce";
  if (pathname.startsWith("/erp") || pathname.startsWith("/warehouse")) return "erp";
  if (pathname.startsWith("/crm") || pathname.startsWith("/meta")) return "crm";
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

  const breadcrumbs = getBreadcrumbs(pathname);

  return (
    <header
      className="
        fixed top-0 right-0 left-0 md:left-[320px] z-40
        flex flex-col
        h-auto
        bg-background/80 backdrop-blur-xl
        border-b border-outline-variant
        transition-colors duration-500
      "
      aria-label="Top Navigation"
    >
      {/* Top Row */}
      <div className="flex items-center justify-between h-14 px-4 md:px-8">
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuToggle}
            className="md:hidden text-on-surface-variant hover:text-primary transition-colors"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>

          <nav className="hidden sm:flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
            <Link href="/" className="hover:text-on-surface transition-colors">Inicio</Link>
            {breadcrumbs.map((crumb, i) => (
              <div key={crumb.href} className="flex items-center gap-2">
                <span className="text-outline opacity-30">/</span>
                <Link
                  href={crumb.href}
                  className={i === breadcrumbs.length - 1 ? "text-on-surface" : "hover:text-on-surface transition-colors"}
                >
                  {crumb.label}
                </Link>
              </div>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <ThemeToggle />
          
          <div className="relative">
            <button
              onClick={() => setPanelOpen((o) => !o)}
              className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/[0.03] border border-white/[0.05] text-on-surface-variant hover:text-primary transition-all"
            >
              <span className="material-symbols-outlined text-[20px]">
                {criticalCount > 0 ? "notifications_active" : "notifications"}
              </span>
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-error animate-pulse shadow-[0_0_8px_var(--error)]" />
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

          <div className="w-9 h-9 rounded-full bg-surface-container overflow-hidden border border-outline-variant">
            <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuBn5Uj3mHl2Sq6nPUH3ztTR4KLUd0A7oDpetDUm6wilrk7IsPSALTpFOgUFnPtZpSb__tmhkziqKHgd7UVVWIEmcolFHEdVtTIlgjP4HVioontd8QP9feXcmwiSCs_7aJX0RgALEgbKKhzNJTw4W_Fj5Cem79nCMnOxZ27h6osYd80RQuGaEKGDv3qz-lERwCtkXrXpasGksTCNkTEL7YCJwggiVzgFIjlVBdSbOAFqJUQE0YsVlZCSh8ud741B7mUcFwl5XhKd7S0" alt="Profile" className="w-full h-full object-cover" />
          </div>
        </div>
      </div>

      {/* Module Navigation Bar */}
      <div className="flex items-center gap-1 px-4 md:px-8 pb-3 pt-1 border-t border-outline-variant/10">
        {MODULES.map((mod) => (
          <button
            key={mod.id}
            onClick={() => router.push(mod.href)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all
              ${activeModule === mod.id 
                ? "bg-surface-container text-on-surface shadow-sm" 
                : "text-on-surface-variant hover:bg-surface-container/50 hover:text-on-surface"
              }
            `}
          >
            <span className="material-symbols-outlined text-[18px]">{mod.icon}</span>
            <span className="hidden sm:inline font-medium tracking-tight">{mod.name}</span>
          </button>
        ))}

        <div className="flex-1" />

        <button
          onClick={() => router.push("/settings")}
          className={`
            flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all
            ${pathname.startsWith("/settings") 
              ? "bg-surface-container text-on-surface shadow-sm" 
              : "text-on-surface-variant hover:bg-surface-container/50 hover:text-on-surface"
            }
          `}
        >
          <span className="material-symbols-outlined text-[18px]">settings</span>
        </button>
      </div>
    </header>
  );
}