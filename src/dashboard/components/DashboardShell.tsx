"use client";

import { useState } from "react";
import Link from "next/link";
import { ModuleNav } from "./ModuleNav";
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
  /** Tenant company name from tenants table */
  tenantName?: string;
}

import { Sidebar } from "./Sidebar";
import { SamanthaPanel } from "./SamanthaPanel";

export function DashboardShell({
  children,
  unlockedModules,
  userRole = "viewer",
  userName = "",
  planId = "enterprise",
  tenantName = "Atollom HQ",
}: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const supabase = createBrowserSupabaseClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.refresh();
    router.push("/auth/login");
  };

  const effectiveUnlocked = unlockedModules || (
    planId === "growth" ? ["ecommerce"] :
    planId === "pro" ? ["ecommerce", "erp"] :
    ["ecommerce", "erp", "crm"]
  );

  const modules: ModuleDefinition[] = [
    ...(userRole === "atollom_admin" ? ADMIN_MODULES : []),
    ...DEFAULT_MODULES.map((mod) => ({
      ...mod,
      locked: !effectiveUnlocked.includes(mod.id),
    }))
  ];

  return (
    <div className="min-h-screen bg-[#040f1b] text-white flex overflow-x-hidden selection:bg-[#ccff00] selection:text-black">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60] md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ──────────────────────────────────────────────────────────────────────────────
          1. Sidebar (Fixed Left: 280px)
         ────────────────────────────────────────────────────────────────────────────── */}
      <Sidebar 
        modules={modules} 
        userRole={userRole} 
        userName={userName} 
        tenantName={tenantName}
        onLogout={handleLogout} 
        open={sidebarOpen}
        planId={planId}
      />

      {/* ──────────────────────────────────────────────────────────────────────────────
          2. Main Layout Area (Central)
         ────────────────────────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 md:pl-[280px] xl:pr-[360px]">
        {/* Header */}
        <Header onMenuToggle={() => setSidebarOpen((o) => !o)} />

        <main className="flex-1 pt-16 min-h-screen">
          <div className="px-6 md:px-10 py-10 animate-luxe max-w-[1400px] mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* ──────────────────────────────────────────────────────────────────────────────
          3. Samantha Panel (Fixed Right: 360px)
         ────────────────────────────────────────────────────────────────────────────── */}
      <SamanthaPanel />
    </div>
  );
}
