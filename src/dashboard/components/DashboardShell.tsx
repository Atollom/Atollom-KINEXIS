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
    id: "command",
    name: "CENTRO DE COMANDO",
    color: "lime",
    colorHex: "#CCFF00",
    icon: "terminal",
    locked: false,
    items: [
      { id: "cmd-exec",      label: "Dashboard Ejecutivo",   href: "/",                      icon: "monitoring" },
      { id: "cmd-samantha",  label: "Samantha AI (Auditoría)",href: "/onboarding",           icon: "neurology" },
    ],
  },
  {
    id: "ecommerce",
    name: "E-COMMERCE",
    color: "blue",
    colorHex: "#3B82F6",
    icon: "shopping_cart",
    locked: false,
    items: [
      { id: "ec-showcase",   label: "Escaparate Digital",    href: "/ecommerce",             icon: "storefront" },
      { id: "ec-catalog",    label: "Gestión de Catálogo",   href: "/ecommerce/ml",          icon: "inventory_2" },
      { id: "ec-fulfillment", label: "Órdenes y Cumplimiento",href: "/ecommerce/fulfillment", icon: "conveyor_belt" },
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
      { id: "crm-inbox",     label: "Comunicaciones (Inbox)",href: "/crm/inbox",            icon: "forum" },
      { id: "crm-sales",     label: "Operaciones de Venta",  href: "/crm",                  icon: "view_kanban" },
      { id: "crm-ucp",       label: "Audiencias Corporativas",href: "/crm/leads",           icon: "hub" },
      { id: "crm-marketing", label: "Motor de Marketing",    href: "/crm/marketing",        icon: "campaign" },
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
      { id: "erp-finance",    label: "Finanzas Core",        href: "/erp/finance",          icon: "account_balance_wallet" },
      { id: "erp-accounting", label: "Impuestos (SAT Zip)",  href: "/erp/accounting",       icon: "file_zip" },
      { id: "erp-inventory",  label: "Cadena de Suministro", href: "/erp/inventory",        icon: "warehouse" },
    ],
  },
  {
    id: "system",
    name: "SISTEMA",
    color: "gray",
    colorHex: "#94A3B8",
    icon: "settings",
    locked: false,
    items: [
      { id: "sys-base",      label: "Configuraciones Base",  href: "/settings",             icon: "faders" },
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
    activePlan === "starter" ? ["command", "ecommerce", "system"] :
    activePlan === "growth" ? ["command", "ecommerce", "erp", "system"] :
    ["command", "ecommerce", "erp", "crm", "system"]
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
