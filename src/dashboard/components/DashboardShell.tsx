"use client";

import { useState, useEffect } from "react";
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
      { id: "ec-overview",    label: "Dashboard General",   href: "/ecommerce",             icon: "dashboard" },
      { id: "ec-fulfillment", label: "Pedidos por Surtir",  href: "/ecommerce/fulfillment", icon: "pending_actions" },
      { id: "ec-ml",          label: "Mercado Libre",      href: "/ecommerce/ml",          icon: "shopping_bag" },
      { id: "ec-amazon",      label: "Amazon",             href: "/ecommerce/amazon",      icon: "inventory_2" },
      { id: "ec-shopify",     label: "Shopify",            href: "/ecommerce/shopify",     icon: "shopping_cart" },
      { id: "ec-b2b",         label: "Ventas B2B",         href: "/ecommerce/b2b",         icon: "handshake" },
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
      { id: "crm-overview",  label: "Dashboard General",    href: "/crm",                  icon: "dashboard" },
      { id: "crm-inbox",     label: "Inbox Unificado",      href: "/crm/inbox",            icon: "forum" },
      { id: "crm-pipeline",  label: "Pipeline & Leads",     href: "/crm/leads",            icon: "filter_alt" },
      { id: "crm-quotes",    label: "Cotizaciones",         href: "/crm/quotes",           icon: "description" },
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
      { id: "erp-overview",   label: "Dashboard General",   href: "/erp",                  icon: "dashboard" },
      { id: "erp-inventory",  label: "Almacén",            href: "/erp/inventory",        icon: "warehouse" },
      { id: "erp-procurement",label: "Compras",            href: "/erp/procurement",      icon: "shopping_basket" },
      { id: "erp-finance",    label: "Finanzas",           href: "/erp/finance",          icon: "account_balance" },
      { id: "erp-accounting", label: "Accounting ZIP",     href: "/erp/accounting",       icon: "file_zip" },
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
  const [activePlan, setActivePlan] = useState<string>(planId);
  const router = useRouter();
  const supabase = createBrowserSupabaseClient();

  // ──────────────────────────────────────────────────────────────────────────────
  // QA Mock Integration: Sync plan override from localStorage for audit
  // ──────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const mockPlan = localStorage.getItem("kinexis_mock_plan");
    if (mockPlan && mockPlan !== activePlan) {
      setActivePlan(mockPlan);
    }
  }, [activePlan]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.refresh();
    router.push("/auth/login");
  };

  const effectiveUnlocked = unlockedModules || (
    activePlan === "starter" ? ["ecommerce"] :
    activePlan === "growth" ? ["ecommerce", "erp"] :
    ["ecommerce", "erp", "crm"]
  );

  // Filter modules: Strictly remove if not in effectiveUnlocked
  const modules: ModuleDefinition[] = [
    ...(userRole === "atollom_admin" ? ADMIN_MODULES : []),
    ...DEFAULT_MODULES.filter((mod) => effectiveUnlocked.includes(mod.id))
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
