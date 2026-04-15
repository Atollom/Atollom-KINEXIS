"use client";

import { useState } from "react";
import Link from "next/link";
import { ModuleNav } from "./ModuleNav";
import { SamanthaFAB } from "./SamanthaFAB";
import { Header } from "./Header";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";
import type { ModuleDefinition } from "./ModuleNav";
import type { UserRole } from "@/types";

// ──────────────────────────────────────────────────────────────────────────────
// Module Definitions — single source of truth
// ──────────────────────────────────────────────────────────────────────────────
const DEFAULT_MODULES: ModuleDefinition[] = [
  {
    id: "ecommerce",
    name: "Ecommerce",
    color: "blue",
    colorHex: "#3B82F6",
    icon: "storefront",
    locked: false,
    items: [
      { id: "ec-overview",  label: "Vista General",       href: "/ecommerce",           icon: "dashboard" },
      { id: "ec-orders",    label: "Órdenes",             href: "/ecommerce/orders",    icon: "receipt_long" },
      { id: "ec-ml",        label: "Mercado Libre",        href: "/ecommerce/ml",        icon: "shopping_bag" },
      { id: "ec-amazon",    label: "Amazon",               href: "/ecommerce/amazon",    icon: "inventory_2" },
      { id: "ec-shopify",   label: "Shopify",              href: "/ecommerce/shopify",   icon: "shopping_cart" },
      { id: "ec-catalog",   label: "Catálogo",             href: "/ecommerce/catalog",   icon: "category" },
      { id: "ec-prices",    label: "Precios",              href: "/ecommerce/prices",    icon: "sell" },
      { id: "ec-reviews",   label: "Reseñas",              href: "/ecommerce/reviews",   icon: "star_rate" },
    ],
  },
  {
    id: "erp",
    name: "ERP",
    color: "green",
    colorHex: "#22C55E",
    icon: "account_tree",
    locked: false,
    items: [
      { id: "erp-overview",   label: "Vista General",     href: "/erp",                  icon: "dashboard" },
      { id: "erp-inventory",  label: "Almacén",         href: "/erp/inventory",        icon: "warehouse" },
      { id: "erp-cfdi",       label: "Facturación CFDI",   href: "/erp/cfdi",             icon: "description" },
      { id: "erp-procurement",label: "Compras",            href: "/erp/procurement",      icon: "shopping_basket" },
      { id: "erp-warehouse",  label: "Operaciones",        href: "/warehouse",            icon: "forklift" },
      { id: "erp-cashflow",   label: "Flujo de Caja",      href: "/erp/cashflow",         icon: "account_balance" },
      { id: "erp-tax",        label: "Fiscal",             href: "/erp/tax",              icon: "gavel" },
    ],
  },
  {
    id: "crm",
    name: "CRM",
    color: "amber",
    colorHex: "#F59E0B",
    icon: "group",
    locked: false,
    items: [
      { id: "crm-overview",  label: "Vista General",      href: "/crm",                  icon: "dashboard" },
      { id: "crm-leads",     label: "Leads",              href: "/crm/leads",            icon: "person_search" },
      { id: "crm-pipeline",  label: "Pipeline",           href: "/crm/pipeline",         icon: "filter_alt" },
      { id: "crm-b2b",       label: "Ventas B2B",         href: "/crm/b2b",              icon: "handshake" },
      { id: "crm-whatsapp",  label: "WhatsApp",           href: "/meta/whatsapp",        icon: "chat" },
      { id: "crm-instagram", label: "Instagram",          href: "/meta/instagram",       icon: "photo_camera" },
      { id: "crm-nps",       label: "NPS & Satisfacción", href: "/crm/nps",              icon: "sentiment_satisfied" },
      { id: "crm-support",   label: "Soporte",            href: "/crm/support",          icon: "support_agent" },
    ],
  },
];

const ADMIN_MODULES: ModuleDefinition[] = [
  {
    id: "atollom-admin",
    name: "System Root",
    color: "lime",
    colorHex: "#CCFF00",
    icon: "shield",
    locked: false,
    items: [
      { id: "admin-central", label: "Mission Control", href: "/atollom/central", icon: "terminal" },
    ],
  },
];

// ──────────────────────────────────────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────────────────────────────────────
interface DashboardShellProps {
  children: React.ReactNode;
  /** Modules the tenant has unlocked. If undefined, all are unlocked. */
  unlockedModules?: string[];
  /**
   * Current user role — must come from server-side auth, never default to owner.
   * Defaults to "viewer" (zero module access) so unauthenticated renders are safe.
   */
  userRole?: UserRole;
  /** Display name from user_profiles.full_name */
  userName?: string;
  /** Subscription plan ID from tenants table */
  planId?: string;
}

export function DashboardShell({
  children,
  unlockedModules,
  userRole = "viewer",   // safe default: no modules visible
  userName = "",
  planId = "enterprise", // default to full for now if not set
}: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const supabase = createBrowserSupabaseClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.refresh();
    router.push("/auth/login");
  };


  // Determine unlocked modules if not provided, based on planId
  const effectiveUnlocked = unlockedModules || (
    planId === "growth" ? ["ecommerce"] :
    planId === "pro" ? ["ecommerce", "erp"] :
    ["ecommerce", "erp", "crm"] // enterprise or default
  );

  // Apply lock state based on unlockedModules prop
  const modules: ModuleDefinition[] = [
    ...(userRole === "atollom_admin" ? ADMIN_MODULES : []),
    ...DEFAULT_MODULES.map((mod) => ({
      ...mod,
      locked: !effectiveUnlocked.includes(mod.id),
    }))
  ];

  return (
    <>
      {/* ── Mobile overlay ─────────────────────────────────────── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Sidebar ────────────────────────────────────────────── */}
       <aside
         className={`
           fixed left-0 top-0 h-full z-50
           flex flex-col
           w-[288px]
           bg-[#0A1628]/98 backdrop-blur-2xl
           border-r border-white/[0.07]
           transition-transform duration-300 ease-out
           ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
         `}
         aria-label="Navegación principal"
       >
         {/* Logo */}
         <div className="px-5 pt-6 pb-5">
           <Link href="/" className="flex items-center gap-3 group" aria-label="Ir al inicio">
             {/* Logo Oficial KINEXIS */}
             <img 
               src="/kinexis-logo.png" 
               alt="KINEXIS by Atollom AI" 
               className="w-11 h-11 flex-shrink-0 rounded-xl"
             />

             {/* Wordmark */}
             <div>
               <h1 className="text-xl font-headline font-bold tracking-tight text-white group-hover:text-[#A8E63D] transition-colors">
                 KINEXIS
               </h1>
               <p className="text-[10px] text-on-surface-variant tracking-[0.15em] uppercase -mt-0.5">
                 Atollom Neural Platform
               </p>
             </div>
           </Link>
         </div>

        {/* Divider */}
        <div className="mx-5 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

          {/* User card / Apple Menu */}
          <div className="px-5 py-5 group/user">
            <div className="flex items-center gap-4 p-3 rounded-2xl transition-all duration-300 hover:bg-white/[0.04]">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#CCFF00]/20 to-[#CCFF00]/5 border border-[#CCFF00]/20 flex items-center justify-center flex-shrink-0 animate-pulse">
                <span className="material-symbols-outlined text-[#CCFF00] text-base">person</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-headline font-bold text-on-surface truncate">
                  {userName || "Usuario"}
                </p>
                <div className="flex items-center gap-2">
                  <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">
                    {userRole}
                  </p>
                  <button 
                    onClick={handleLogout}
                    className="text-[9px] text-[#CCFF00] font-bold uppercase tracking-widest hover:underline opacity-0 group-hover/user:opacity-100 transition-opacity"
                  >
                    Log Out
                  </button>
                </div>
              </div>
            </div>
          </div>

        {/* Divider */}
        <div className="mx-5 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-3" />

        {/* Module Navigation */}
        <ModuleNav modules={modules} userRole={userRole} />

        {/* System status footer */}
        <div className="px-5 py-5 border-t border-white/[0.06]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] text-outline uppercase tracking-[0.1em] font-bold">
              Sistema
            </span>
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-[#A8E63D] opacity-40 animate-ping" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#A8E63D]" />
              </span>
              <span className="text-[10px] font-bold text-[#A8E63D]">Activo</span>
            </div>
          </div>

          {/* Agent load bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <span className="text-[10px] text-on-surface-variant">Agentes</span>
              <span className="text-[10px] text-on-surface font-bold">43/43</span>
            </div>
            <div className="h-1 w-full bg-white/[0.06] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#A8E63D] to-[#6BBF00]"
                style={{ width: "100%", boxShadow: "0 0 8px #A8E63D60" }}
              />
            </div>
          </div>
        </div>
      </aside>

      {/* ── Header ─────────────────────────────────────────────── */}
      <Header onMenuToggle={() => setSidebarOpen((o) => !o)} />

      {/* ── Main content ────────────────────────────────────────── */}
      <main
        className="
          md:ml-[272px]
          pt-16
          pb-24 md:pb-8
          min-h-screen
          bg-[#000103]
        "
      >
        {children}
      </main>

      {/* ── Samantha chat FAB ───────────────────────────────────── */}
      <SamanthaFAB planId={planId} />
    </>
  );
}
