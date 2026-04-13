"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useNotifications } from "@/hooks/useNotifications";
import { NotificationPanel } from "./NotificationPanel";

interface HeaderProps {
  onMenuToggle?: () => void;
}

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

export function Header({ onMenuToggle }: HeaderProps) {
  const pathname = usePathname();
  const [panelOpen, setPanelOpen] = useState(false);
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
  const pageTitle = breadcrumbs.length > 0
    ? breadcrumbs[breadcrumbs.length - 1].label
    : "Inicio";

  return (
    <header
      className="
        fixed top-0 right-0 left-0 md:left-[272px] z-40
        flex items-center justify-between
        h-16 px-5 md:px-8
        bg-[#0D1B3E]/80 backdrop-blur-xl
        border-b border-white/[0.04]
      "
      aria-label="Barra de navegación superior"
    >
      {/* Left: hamburger + breadcrumbs */}
      <div className="flex items-center gap-4">
        {/* Mobile menu toggle */}
        <button
          onClick={onMenuToggle}
          className="md:hidden text-on-surface-variant hover:text-[#A8E63D] transition-colors"
          aria-label="Abrir menú"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>

        {/* Breadcrumbs */}
        <nav className="hidden sm:flex items-center gap-1.5 text-[12px]" aria-label="Ubicación">
          <Link
            href="/"
            className="text-on-surface-variant hover:text-on-surface transition-colors"
          >
            Inicio
          </Link>
          {breadcrumbs.map((crumb, i) => (
            <span key={crumb.href} className="flex items-center gap-1.5">
              <span className="text-outline">/</span>
              {i === breadcrumbs.length - 1 ? (
                <span className="text-on-surface font-medium">{crumb.label}</span>
              ) : (
                <Link
                  href={crumb.href}
                  className="text-on-surface-variant hover:text-on-surface transition-colors"
                >
                  {crumb.label}
                </Link>
              )}
            </span>
          ))}
        </nav>

        {/* Mobile title */}
        <h1 className="sm:hidden font-headline font-bold text-sm text-on-surface">
          {pageTitle}
        </h1>
      </div>

      {/* Right: status + actions */}
      <div className="flex items-center gap-4 md:gap-6">
        {/* Agents online pill */}
        <div
          className="hidden lg:flex items-center gap-2 bg-white/[0.04] rounded-full px-3 py-1.5"
          aria-label="Agentes en línea"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-[#A8E63D] opacity-40 animate-ping" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#A8E63D]" />
          </span>
          <span className="text-[11px] font-bold text-[#A8E63D] tracking-wider uppercase">
            43 Agentes
          </span>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-2">
          {/* Notifications bell */}
          <div className="relative">
            <button
              onClick={() => setPanelOpen((o) => !o)}
              className="
                relative p-2 rounded-xl
                text-on-surface-variant hover:text-[#A8E63D]
                hover:bg-white/[0.04]
                transition-all duration-200
              "
              aria-label={`Notificaciones${unreadCount > 0 ? ` — ${unreadCount} sin leer` : ""}`}
              aria-expanded={panelOpen}
            >
              <span className="material-symbols-outlined text-xl">
                {criticalCount > 0 ? "notifications_active" : "notifications"}
              </span>

              {/* Unread badge — shows total unread, pulses when there are critical */}
              {unreadCount > 0 && (
                <span
                  className={`
                    absolute top-1 right-1
                    w-4 h-4 rounded-full
                    bg-red-500 text-white
                    text-[9px] font-bold
                    flex items-center justify-center
                    leading-none
                    ${criticalCount > 0 ? "animate-pulse" : ""}
                  `}
                  aria-hidden="true"
                >
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {/* Slide-over panel */}
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

          {/* Settings link */}
          <Link
            href="/settings"
            className="
              p-2 rounded-xl
              text-on-surface-variant hover:text-[#A8E63D]
              hover:bg-white/[0.04]
              transition-all duration-200
            "
            aria-label="Configuración"
          >
            <span className="material-symbols-outlined text-xl">settings</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
