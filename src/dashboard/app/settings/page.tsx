"use client";

import { useCallback, useEffect, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";
import type { AutonomyLevel, UserRole } from "@/types";

// ──────────────────────────────────────────────────────────────────────────────
// Tipos locales
// ──────────────────────────────────────────────────────────────────────────────
type TabId = "profile" | "companies" | "modules" | "apikeys" | "rules" | "users" | "autonomy";


interface TabDef {
  id: TabId;
  label: string;
  icon: string;
  ownerOnly?: boolean; // solo visible para owner
}

interface BusinessProfile {
  business_name: string;
  rfc: string;
  tax_regime: string;
  postal_code: string;
  logo_url: string;
}

interface Company {
  id: string;
  nombre: string;
  rfc: string;
  regimen_fiscal: string;
  cp_expedicion: string;
  facturapi_org_id?: string;
  es_principal: boolean;
  activa: boolean;
}


interface BusinessRules {
  ml_margin: number;
  amazon_margin: number;
  shopify_margin: number;
  b2b_margin: number;
  stock_safety_days: number;
  stock_critical_days: number;
  nps_cooldown_days: number;
}

interface TenantUserRow {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  created_at: string;
}

interface AutonomyConfig {
  ecommerce: AutonomyLevel;
  erp: AutonomyLevel;
  crm: AutonomyLevel;
}

// ──────────────────────────────────────────────────────────────────────────────
// Constantes
// ──────────────────────────────────────────────────────────────────────────────

const TABS: TabDef[] = [
  { id: "profile",   label: "Perfil",       icon: "business" },
  { id: "companies", label: "Mis empresas", icon: "domain" },
  { id: "modules",   label: "Módulos",      icon: "widgets",       ownerOnly: true },

  { id: "apikeys",  label: "API Keys",     icon: "key" },
  { id: "rules",    label: "Reglas",       icon: "tune" },
  { id: "users",    label: "Usuarios",     icon: "group" },
  { id: "autonomy", label: "Autonomía",    icon: "smart_toy" },
];

const MARGIN_MINIMUMS: Record<string, number> = {
  ml_margin: 1.20,
  amazon_margin: 1.25,
  shopify_margin: 1.30,
  b2b_margin: 1.18,
};

const MARGIN_LABELS: Record<string, string> = {
  ml_margin: "Mercado Libre",
  amazon_margin: "Amazon",
  shopify_margin: "Shopify",
  b2b_margin: "B2B",
};

/** Definición de API keys agrupadas por plataforma */
const API_KEY_GROUPS = [
  {
    platform: "Mercado Libre",
    color: "#FFE600",
    icon: "shopping_bag",
    keys: [
      { name: "ml_access_token", label: "Access Token" },
      { name: "ml_client_id", label: "Client ID" },
      { name: "ml_client_secret", label: "Client Secret" },
    ],
  },
  {
    platform: "Amazon SP-API",
    color: "#FF9900",
    icon: "inventory_2",
    keys: [
      { name: "amazon_sp_api_key", label: "API Key" },
      { name: "amazon_sp_api_secret", label: "API Secret" },
      { name: "amazon_seller_id", label: "Seller ID" },
    ],
  },
  {
    platform: "Shopify",
    color: "#96BF48",
    icon: "shopping_cart",
    keys: [
      { name: "shopify_api_key", label: "API Key" },
      { name: "shopify_api_secret", label: "API Secret" },
      { name: "shopify_store_url", label: "Store URL" },
    ],
  },
  {
    platform: "Meta (WhatsApp/IG)",
    color: "#0084FF",
    icon: "chat",
    keys: [
      { name: "meta_access_token", label: "Access Token" },
      { name: "meta_app_secret", label: "App Secret" },
    ],
  },
  {
    platform: "FacturAPI",
    color: "#22C55E",
    icon: "description",
    keys: [
      { name: "facturapi_api_key", label: "API Key" },
      { name: "facturapi_secret_key", label: "Secret Key" },
    ],
  },
];

const MODULES_LIST = [
  { id: "ecommerce", name: "Ecommerce", description: "ML, Amazon, Shopify — catálogo, órdenes, reseñas", icon: "storefront", color: "#3B82F6" },
  { id: "erp",       name: "ERP",       description: "Almacén, CFDI, compras, logística, fiscal",       icon: "account_tree", color: "#CCFF00" },
  { id: "crm",       name: "CRM",       description: "Leads, pipeline B2B, WhatsApp, Instagram, NPS",   icon: "group",        color: "#F59E0B" },
];

const AUTONOMY_LEVELS: { value: AutonomyLevel; label: string; desc: string; color: string }[] = [
  { value: "FULL",           label: "Completa",     desc: "El agente actúa sin intervención humana",          color: "#22C55E" },
  { value: "NOTIFY",         label: "Notificar",    desc: "Actúa y notifica después",                        color: "#3B82F6" },
  { value: "SUPERVISED",     label: "Supervisado",  desc: "Requiere aprobación para acciones importantes",    color: "#F59E0B" },
  { value: "HUMAN_REQUIRED", label: "Manual",       desc: "Solo ejecuta con aprobación explícita",            color: "#EF4444" },
  { value: "PAUSED",         label: "Pausado",      desc: "Módulo desactivado temporalmente",                  color: "#506584" },
];

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: "owner",       label: "Propietario" },
  { value: "admin",       label: "Administrador" },
  { value: "socia",       label: "Socia" },
  { value: "warehouse",   label: "Almacén" },
  { value: "almacenista", label: "Almacenista" },
  { value: "contador",    label: "Contador" },
  { value: "agente",      label: "Agente Ventas" },
  { value: "viewer",      label: "Solo lectura" },
];

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

/** Mostrar valor enmascarado */
function maskValue(hasValue: boolean): string {
  return hasValue ? "●●●●●●●●●●●●" : "";
}

/** Toast de éxito temporal */
function useToast() {
  const [msg, setMsg] = useState<string | null>(null);
  const show = useCallback((text: string) => {
    setMsg(text);
    setTimeout(() => setMsg(null), 3000);
  }, []);
  return { msg, show };
}

// ──────────────────────────────────────────────────────────────────────────────
// Componente principal
// ──────────────────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  // userRole starts as "viewer" (safe default — no tabs visible until auth resolves)
  const [userRole, setUserRole] = useState<UserRole>("viewer");

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase
        .from("user_profiles")
        .select("role")
        .eq("id", user.id)
        .single()
        .then(({ data }) => {
          if (data?.role) setUserRole(data.role as UserRole);
        });
    });
  }, []);

  const [activeTab, setActiveTab] = useState<TabId>("profile");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  const visibleTabs = TABS.filter(t => !t.ownerOnly || userRole === "owner");

  // ── Estado: Perfil ────────────────────────────────────────────
  const [profile, setProfile] = useState<BusinessProfile>({
    business_name: "", rfc: "", tax_regime: "", postal_code: "", logo_url: "",
  });

  // ── Estado: API Keys ──────────────────────────────────────────
  const [vaultStatus, setVaultStatus] = useState<Record<string, boolean>>({});
  const [keyInputs, setKeyInputs] = useState<Record<string, string>>({});
  const [savingKeys, setSavingKeys] = useState<Set<string>>(new Set());

  // ── Estado: Reglas de negocio ──────────────────────────────────
  const [rules, setRules] = useState<BusinessRules | null>(null);
  const [savingRules, setSavingRules] = useState(false);

  // ── Estado: Usuarios ──────────────────────────────────────────
  const [users, setUsers] = useState<TenantUserRow[]>([]);
  const [changingRole, setChangingRole] = useState<string | null>(null);

  // ── Estado: Autonomía ─────────────────────────────────────────
  const [autonomy, setAutonomy] = useState<AutonomyConfig>({
    ecommerce: "FULL", erp: "NOTIFY", crm: "SUPERVISED",
  });
  const [savingAutonomy, setSavingAutonomy] = useState(false);

  // ── Estado: Empresas ──────────────────────────────────────────
  const [companies, setCompanies] = useState<Company[]>([]);
  const [activeCompanyId, setActiveCompanyId] = useState<string | null>(null);
  const [savingCompany, setSavingCompany] = useState<string | null>(null);


  // ── Cargar todos los datos al montar ──────────────────────────
  useEffect(() => {
    async function loadAll() {
      setLoading(true);
      setError(null);
      try {
        const [profileRes, vaultRes, rulesRes, usersRes, autonomyRes, companiesRes] = await Promise.allSettled([
          fetch("/api/settings/profile").then(r => r.json()),
          fetch("/api/settings/vault").then(r => r.json()),
          fetch("/api/settings/business-rules").then(r => r.json()),
          fetch("/api/settings/users").then(r => r.json()),
          fetch("/api/settings/autonomy").then(r => r.json()),
          fetch("/api/settings/companies").then(r => r.json()),
        ]);

        if (profileRes.status === "fulfilled") setProfile(profileRes.value);
        if (vaultRes.status === "fulfilled") setVaultStatus(vaultRes.value.keys || {});
        if (rulesRes.status === "fulfilled") setRules(rulesRes.value);
        if (usersRes.status === "fulfilled") setUsers(usersRes.value.users || []);
        if (autonomyRes.status === "fulfilled") setAutonomy(autonomyRes.value.autonomy || autonomy);
        if (companiesRes.status === "fulfilled") {
          const list = companiesRes.value.companies || [];
          setCompanies(list);
          // Cargar empresa activa de localStorage
          const savedId = localStorage.getItem("active_company_id");
          if (savedId && list.some((c: Company) => c.id === savedId)) {
            setActiveCompanyId(savedId);
          } else if (list.length > 0) {
            const principal = list.find((c: Company) => c.es_principal);
            setActiveCompanyId(principal ? principal.id : list[0].id);
          }
        }

      } catch {
        setError("Error cargando configuración");
      } finally {
        setLoading(false);
      }
    }
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Guardar perfil ────────────────────────────────────────────
  async function saveProfile() {
    try {
      const res = await fetch("/api/settings/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      if (!res.ok) throw new Error("Error guardando perfil");
      toast.show("Perfil guardado correctamente");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    }
  }

  // ── Guardar API key individual ────────────────────────────────
  async function saveApiKey(keyName: string) {
    const value = keyInputs[keyName];
    if (!value?.trim()) return;

    setSavingKeys(prev => new Set(prev).add(keyName));
    try {
      const res = await fetch("/api/settings/vault", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keys: { [keyName]: value } }),
      });
      if (!res.ok) throw new Error("Error guardando key");
      setVaultStatus(prev => ({ ...prev, [keyName]: true }));
      setKeyInputs(prev => ({ ...prev, [keyName]: "" }));
      toast.show(`${keyName} actualizado correctamente`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setSavingKeys(prev => {
        const next = new Set(prev);
        next.delete(keyName);
        return next;
      });
    }
  }

  // ── Guardar reglas de negocio ─────────────────────────────────
  async function saveRules(e: React.FormEvent) {
    e.preventDefault();
    if (!rules) return;

    setSavingRules(true);
    try {
      const res = await fetch("/api/settings/business-rules", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rules),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error guardando reglas");
      toast.show("Reglas de negocio guardadas");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setSavingRules(false);
    }
  }

  // ── Cambiar rol de usuario ────────────────────────────────────
  async function changeUserRole(userId: string, newRole: UserRole) {
    setChangingRole(userId);
    try {
      const res = await fetch("/api/settings/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, role: newRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error cambiando rol");
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
      toast.show("Rol actualizado correctamente");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setChangingRole(null);
    }
  }

  // ── Guardar autonomía ─────────────────────────────────────────
  async function saveAutonomy() {
    setSavingAutonomy(true);
    try {
      const res = await fetch("/api/settings/autonomy", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(autonomy),
      });
      if (!res.ok) throw new Error("Error guardando autonomía");
      toast.show("Niveles de autonomía guardados");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setSavingAutonomy(false);
    }
  }

  // ── Acciones Empresas ─────────────────────────────────────────
  async function selectActiveCompany(id: string) {
    localStorage.setItem("active_company_id", id);
    setActiveCompanyId(id);
    toast.show("Empresa activa para la sesión actualizada");
  }

  async function setPrincipalCompany(id: string) {
    setSavingCompany(id);
    try {
      const res = await fetch("/api/settings/companies", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, es_principal: true }),
      });
      if (!res.ok) throw new Error("Error actualizando principal");
      setCompanies(prev => prev.map(c => ({ ...c, es_principal: c.id === id })));
      toast.show("Empresa principal actualizada");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setSavingCompany(null);
    }
  }

  async function addCompany() {
    const nombre = prompt("Nombre / Razón Social:");
    const rfc = prompt("RFC:");
    if (!nombre || !rfc) return;
    
    try {
      const res = await fetch("/api/settings/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre,
          rfc,
          regimen_fiscal: "601",
          cp_expedicion: "00000",
          es_principal: companies.length === 0
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error agregando empresa");
      setCompanies(prev => [...prev, data.company]);
      toast.show("Empresa agregada");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    }
  }


  // ── Loading skeleton ──────────────────────────────────────────
  if (loading) {
    return (
      <div className="px-4 md:px-8 py-6 max-w-4xl mx-auto space-y-4">
        <div className="h-10 w-48 bg-white/[0.04] rounded-xl animate-pulse" />
        <div className="h-12 bg-white/[0.04] rounded-xl animate-pulse" />
        {[1, 2, 3].map(i => (
          <div key={i} className="h-24 bg-white/[0.04] rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="px-4 md:px-8 py-6 max-w-4xl mx-auto space-y-6">
      {/* ── Header ──────────────────────────────────────────────── */}
      <header>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl bg-white/[0.06] flex items-center justify-center">
            <span className="material-symbols-outlined text-[#A8E63D] text-lg">settings</span>
          </div>
          <div>
            <h1 className="text-2xl font-headline font-bold text-[#E8EAF0]">
              Configuración
            </h1>
            <p className="text-[12px] text-[#8DA4C4]">
              Administra tu empresa, integraciones y permisos
            </p>
          </div>
        </div>
      </header>

      {/* ── Toast de éxito ───────────────────────────────────────── */}
      {toast.msg && (
        <div className="fixed top-20 right-6 z-50 animate-in bg-[#22C55E]/10 border border-[#22C55E]/20 text-[#22C55E] rounded-xl px-4 py-2.5 text-sm font-medium shadow-lg flex items-center gap-2">
          <span className="material-symbols-outlined text-base">check_circle</span>
          {toast.msg}
        </div>
      )}

      {/* ── Error banner ─────────────────────────────────────────── */}
      {error && (
        <div
          className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl px-4 py-2.5 text-sm flex items-center justify-between"
          role="alert"
        >
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-base">error</span>
            {error}
          </div>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300">
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>
      )}

      {/* ── Tabs ─────────────────────────────────────────────────── */}
      <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none border-b border-white/[0.06]">
        {visibleTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex items-center gap-2 px-4 py-2.5 rounded-t-xl
              text-[12px] font-bold uppercase tracking-wider
              transition-all duration-200 whitespace-nowrap
              ${activeTab === tab.id
                ? "bg-white/[0.06] text-[#A8E63D] border-b-2 border-[#A8E63D]"
                : "text-[#8DA4C4] hover:text-[#E8EAF0] hover:bg-white/[0.03]"
              }
            `}
          >
            <span className="material-symbols-outlined text-base" aria-hidden="true">
              {tab.icon}
            </span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════════
          TAB 1: Perfil de empresa
          ═══════════════════════════════════════════════════════════ */}
      {activeTab === "profile" && (
        <section className="space-y-4 animate-in">
          <SectionCard title="Perfil de Empresa" icon="business" color="#A8E63D">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FieldInput
                label="Nombre de empresa"
                value={profile.business_name}
                onChange={v => setProfile(p => ({ ...p, business_name: v }))}
                placeholder="Mi Empresa S.A. de C.V."
              />
              <FieldInput
                label="RFC"
                value={profile.rfc}
                onChange={v => setProfile(p => ({ ...p, rfc: v.toUpperCase() }))}
                placeholder="XAXX010101000"
                maxLength={13}
              />
              <FieldInput
                label="Régimen fiscal"
                value={profile.tax_regime}
                onChange={v => setProfile(p => ({ ...p, tax_regime: v }))}
                placeholder="601 - General de Ley"
              />
              <FieldInput
                label="Código postal"
                value={profile.postal_code}
                onChange={v => setProfile(p => ({ ...p, postal_code: v }))}
                placeholder="44100"
                maxLength={5}
              />
            </div>
            <FieldInput
              label="URL del logo"
              value={profile.logo_url}
              onChange={v => setProfile(p => ({ ...p, logo_url: v }))}
              placeholder="https://..."
            />

            {/* Vista previa del logo */}
            {profile.logo_url && (
              <div className="mt-3 flex items-center gap-3">
                <div className="w-16 h-16 rounded-xl bg-white/[0.04] border border-white/[0.06] overflow-hidden flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={profile.logo_url} alt="Logo" className="max-w-full max-h-full object-contain" />
                </div>
                <span className="text-[11px] text-[#8DA4C4]">Vista previa</span>
              </div>
            )}

            <SaveButton onClick={saveProfile} label="Guardar perfil" />
          </SectionCard>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════
          TAB 2: Mis Empresas
          ═══════════════════════════════════════════════════════════ */}
      {activeTab === "companies" && (
        <section className="space-y-4 animate-in">
          <SectionCard title="Gestión de Empresas / Razones Sociales" icon="domain" color="#3B82F6">
            <div className="flex justify-between items-center mb-6">
              <p className="text-[12px] text-[#8DA4C4]">
                Registra tus razones sociales para facturación y reportes fiscales independientes.
              </p>
              {userRole === "owner" && (
                <button 
                  onClick={addCompany}
                  className="px-4 py-2 bg-[#A8E63D]/10 border border-[#A8E63D]/20 text-[#A8E63D] rounded-xl text-[11px] font-bold uppercase tracking-wider hover:bg-[#A8E63D]/20 transition-all"
                >
                  + Nueva Empresa
                </button>
              )}
            </div>

            <div className="space-y-3">
              {companies.map(emp => (
                <div 
                  key={emp.id}
                  className={`flex items-center justify-between p-4 rounded-xl border transition-all ${activeCompanyId === emp.id ? "bg-[#3B82F6]/5 border-[#3B82F6]/30" : "bg-white/[0.03] border-white/[0.06]"}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${emp.es_principal ? "bg-[#A8E63D]/10 text-[#A8E63D]" : "bg-white/[0.05] text-[#8DA4C4]"}`}>
                      <span className="material-symbols-outlined">{emp.es_principal ? "verified" : "business"}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-[#E8EAF0]">{emp.nombre}</p>
                        {emp.es_principal && <span className="bg-[#A8E63D]/10 text-[#A8E63D] text-[9px] px-1.5 py-0.5 rounded font-bold uppercase">Principal</span>}
                        {activeCompanyId === emp.id && <span className="bg-[#3B82F6]/10 text-[#3B82F6] text-[9px] px-1.5 py-0.5 rounded font-bold uppercase">Activa en sesión</span>}
                      </div>
                      <p className="text-[11px] text-[#8DA4C4]">{emp.rfc} • CP {emp.cp_expedicion}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {activeCompanyId !== emp.id && (
                      <button 
                        onClick={() => selectActiveCompany(emp.id)}
                        className="p-2 hover:bg-white/[0.05] rounded-lg text-[#8DA4C4] hover:text-[#3B82F6] transition-all"
                        title="Seleccionar para esta sesión"
                      >
                        <span className="material-symbols-outlined text-lg">login</span>
                      </button>
                    )}
                    {userRole === "owner" && !emp.es_principal && (
                      <button 
                        onClick={() => setPrincipalCompany(emp.id)}
                        disabled={savingCompany === emp.id}
                        className="p-2 hover:bg-white/[0.05] rounded-lg text-[#8DA4C4] hover:text-[#A8E63D] transition-all"
                        title="Marcar como principal"
                      >
                        <span className="material-symbols-outlined text-lg">star</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {companies.length === 0 && (
                <div className="text-center py-8 bg-white/[0.02] border border-dashed border-white/[0.06] rounded-xl">
                  <p className="text-[#506584] text-[11px] uppercase tracking-widest font-bold">No hay empresas registradas</p>
                </div>
              )}
            </div>
          </SectionCard>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════
          TAB 3: Módulos activos (solo owner)
          ═══════════════════════════════════════════════════════════ */}

      {activeTab === "modules" && userRole === "owner" && (
        <section className="space-y-4 animate-in">
          <SectionCard title="Módulos Contratados" icon="widgets" color="#A8E63D">
            <p className="text-[12px] text-[#8DA4C4] mb-4">
              Módulos activos en tu plan actual. Contacta a soporte para activar módulos adicionales.
            </p>
            <div className="space-y-3">
              {MODULES_LIST.map(mod => (
                <div
                  key={mod.id}
                  className="flex items-center justify-between py-3 px-4 rounded-xl bg-white/[0.03] border border-white/[0.06]"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${mod.color}15` }}
                    >
                      <span className="material-symbols-outlined text-lg" style={{ color: mod.color }}>
                        {mod.icon}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#E8EAF0]">{mod.name}</p>
                      <p className="text-[11px] text-[#8DA4C4]">{mod.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#22C55E]" />
                    <span className="text-[11px] font-bold text-[#22C55E] uppercase">Activo</span>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════
          TAB 3: API Keys
          ═══════════════════════════════════════════════════════════ */}
      {activeTab === "apikeys" && (
        <section className="space-y-4 animate-in">
          {API_KEY_GROUPS.map(group => (
            <SectionCard key={group.platform} title={group.platform} icon={group.icon} color={group.color}>
              <div className="space-y-3">
                {group.keys.map(keyDef => {
                  const hasValue = vaultStatus[keyDef.name] || false;
                  const isSaving = savingKeys.has(keyDef.name);
                  const inputVal = keyInputs[keyDef.name] || "";

                  return (
                    <div key={keyDef.name} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label
                          htmlFor={`key-${keyDef.name}`}
                          className="text-[11px] font-bold text-[#8DA4C4] uppercase tracking-wider"
                        >
                          {keyDef.label}
                        </label>
                        {hasValue && (
                          <span className="text-[10px] text-[#22C55E] font-bold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" />
                            Configurado
                          </span>
                        )}
                      </div>

                      <div className="flex gap-2">
                        {/* Valor enmascarado o input para nuevo valor */}
                        <div className="flex-1 relative">
                          <input
                            id={`key-${keyDef.name}`}
                            type="password"
                            value={inputVal || (hasValue ? maskValue(hasValue) : "")}
                            onChange={e => setKeyInputs(prev => ({ ...prev, [keyDef.name]: e.target.value }))}
                            onFocus={() => {
                              // Limpiar el valor enmascarado al hacer focus
                              if (!inputVal && hasValue) {
                                setKeyInputs(prev => ({ ...prev, [keyDef.name]: "" }));
                              }
                            }}
                            placeholder={hasValue ? "Ingresa nuevo valor para actualizar" : "Ingresa el valor"}
                            className="
                              w-full bg-white/[0.03] border border-white/[0.08]
                              rounded-lg px-3 py-2 text-sm text-[#E8EAF0]
                              placeholder:text-[#506584]
                              focus:border-[#A8E63D]/30 focus:outline-none
                              transition-colors
                            "
                          />
                        </div>

                        <button
                          onClick={() => saveApiKey(keyDef.name)}
                          disabled={isSaving || !inputVal.trim()}
                          className={`
                            px-4 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider
                            transition-all duration-200
                            ${inputVal.trim() && !isSaving
                              ? "bg-[#A8E63D] text-[#0D1B3E] hover:shadow-[0_0_12px_#A8E63D40]"
                              : "bg-white/[0.04] text-[#506584] cursor-not-allowed"
                            }
                          `}
                        >
                          {isSaving ? (
                            <span className="material-symbols-outlined text-sm animate-spin">sync</span>
                          ) : (
                            "Actualizar"
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </SectionCard>
          ))}
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════
          TAB 4: Reglas de negocio
          ═══════════════════════════════════════════════════════════ */}
      {activeTab === "rules" && rules && (
        <section className="animate-in">
          <form onSubmit={saveRules} className="space-y-4">
            {/* Márgenes */}
            <SectionCard title="Márgenes de Ganancia" icon="sell" color="#A8E63D">
              <p className="text-[11px] text-[#8DA4C4] mb-3">
                Mínimo: ML ≥1.20 · Amazon ≥1.25 · Shopify ≥1.30 · B2B ≥1.18
              </p>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(MARGIN_MINIMUMS).map(([field, min]) => {
                  const val = rules[field as keyof BusinessRules] as number;
                  const isBelow = val < min;
                  return (
                    <div key={field}>
                      <label
                        htmlFor={`rule-${field}`}
                        className="text-[11px] font-bold text-[#8DA4C4] uppercase tracking-wider block mb-1"
                      >
                        {MARGIN_LABELS[field]}
                        {isBelow && (
                          <span className="ml-2 text-red-400 text-[9px] normal-case">
                            ↓ mínimo {min}
                          </span>
                        )}
                      </label>
                      <input
                        id={`rule-${field}`}
                        type="number"
                        step="0.01"
                        min={min}
                        value={val}
                        onChange={e => setRules(r => r ? { ...r, [field]: parseFloat(e.target.value) || 0 } : r)}
                        className={`
                          w-full bg-white/[0.03] border rounded-lg px-3 py-2 text-sm text-[#E8EAF0]
                          focus:outline-none transition-colors
                          ${isBelow ? "border-red-500/40 focus:border-red-500/60" : "border-white/[0.08] focus:border-[#A8E63D]/30"}
                        `}
                      />
                    </div>
                  );
                })}
              </div>
            </SectionCard>

            {/* Umbrales de almacén */}
            <SectionCard title="Umbrales de Almacén" icon="warehouse" color="#CCFF00">
              {rules.stock_critical_days >= rules.stock_safety_days && (
                <p className="text-red-400 text-[11px] mb-2 flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">error</span>
                  stock_critical_days debe ser menor que stock_safety_days
                </p>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="rule-safety" className="text-[11px] font-bold text-[#8DA4C4] uppercase tracking-wider block mb-1">
                    Días preventivo (Warning)
                  </label>
                  <input
                    id="rule-safety"
                    type="number"
                    min={rules.stock_critical_days + 1}
                    value={rules.stock_safety_days}
                    onChange={e => setRules(r => r ? { ...r, stock_safety_days: parseInt(e.target.value) || 0 } : r)}
                    className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-[#E8EAF0] focus:border-[#A8E63D]/30 focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="rule-critical" className="text-[11px] font-bold text-[#8DA4C4] uppercase tracking-wider block mb-1">
                    Días crítico (Critical)
                  </label>
                  <input
                    id="rule-critical"
                    type="number"
                    min={1}
                    max={rules.stock_safety_days - 1}
                    value={rules.stock_critical_days}
                    onChange={e => setRules(r => r ? { ...r, stock_critical_days: parseInt(e.target.value) || 0 } : r)}
                    className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-[#E8EAF0] focus:border-[#A8E63D]/30 focus:outline-none"
                  />
                </div>
              </div>
            </SectionCard>

            {/* NPS */}
            <SectionCard title="NPS & Encuestas" icon="star" color="#F59E0B">
              <div>
                <label htmlFor="rule-nps" className="text-[11px] font-bold text-[#8DA4C4] uppercase tracking-wider block mb-1">
                  Cooldown entre encuestas (días)
                </label>
                <input
                  id="rule-nps"
                  type="number"
                  min={1}
                  value={rules.nps_cooldown_days}
                  onChange={e => setRules(r => r ? { ...r, nps_cooldown_days: parseInt(e.target.value) || 90 } : r)}
                  className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-[#E8EAF0] focus:border-[#A8E63D]/30 focus:outline-none"
                />
              </div>
            </SectionCard>

            <button
              type="submit"
              disabled={savingRules || rules.stock_critical_days >= rules.stock_safety_days}
              className="
                w-full py-3 rounded-xl text-[12px] font-bold uppercase tracking-wider
                bg-[#A8E63D] text-[#0D1B3E]
                hover:shadow-[0_0_15px_#A8E63D40]
                disabled:opacity-40 disabled:cursor-not-allowed
                transition-all duration-200
                flex items-center justify-center gap-2
              "
            >
              {savingRules && <span className="material-symbols-outlined text-sm animate-spin">sync</span>}
              {savingRules ? "Guardando…" : "Guardar reglas de negocio"}
            </button>
          </form>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════
          TAB 5: Usuarios
          ═══════════════════════════════════════════════════════════ */}
      {activeTab === "users" && (
        <section className="animate-in">
          <SectionCard title="Usuarios del Tenant" icon="group" color="#3B82F6">
            {users.length === 0 ? (
              <p className="text-[#8DA4C4] text-sm text-center py-8">
                No se encontraron usuarios
              </p>
            ) : (
              <div className="space-y-2">
                {users.map(user => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between py-3 px-4 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Avatar con inicial */}
                      <div className="w-9 h-9 rounded-full bg-white/[0.06] flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-[#E8EAF0]">
                          {(user.full_name || user.email || "?").charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[#E8EAF0] truncate">
                          {user.full_name || "Sin nombre"}
                        </p>
                        <p className="text-[11px] text-[#8DA4C4] truncate">{user.email}</p>
                      </div>
                    </div>

                    {/* Selector de rol */}
                    <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                      {userRole === "owner" ? (
                        <select
                          value={user.role}
                          onChange={e => changeUserRole(user.id, e.target.value as UserRole)}
                          disabled={changingRole === user.id || user.role === "owner"}
                          className="
                            bg-white/[0.04] border border-white/[0.08]
                            rounded-lg px-3 py-1.5 text-[12px] text-[#E8EAF0]
                            focus:border-[#A8E63D]/30 focus:outline-none
                            disabled:opacity-50 disabled:cursor-not-allowed
                            appearance-none cursor-pointer
                          "
                          title={user.role === "owner" ? "No se puede cambiar el rol del propietario" : "Cambiar rol"}
                        >
                          {ROLE_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-[12px] font-bold text-[#8DA4C4] bg-white/[0.04] px-3 py-1.5 rounded-lg">
                          {ROLE_OPTIONS.find(r => r.value === user.role)?.label || user.role}
                        </span>
                      )}

                      {changingRole === user.id && (
                        <span className="material-symbols-outlined text-sm text-[#A8E63D] animate-spin">sync</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {userRole !== "owner" && (
              <p className="text-[11px] text-[#506584] text-center mt-4">
                Solo el propietario puede cambiar roles de usuario
              </p>
            )}
          </SectionCard>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════
          TAB 6: Autonomía de agentes
          ═══════════════════════════════════════════════════════════ */}
      {activeTab === "autonomy" && (
        <section className="space-y-4 animate-in">
          <SectionCard title="Autonomía de Agentes" icon="smart_toy" color="#A8E63D">
            <p className="text-[11px] text-[#8DA4C4] mb-4">
              Define qué nivel de autonomía tienen los agentes IA en cada módulo.
              Un nivel más bajo requiere más intervención humana.
            </p>

            <div className="space-y-6">
              {MODULES_LIST.map(mod => {
                const currentLevel = autonomy[mod.id as keyof AutonomyConfig];
                return (
                  <div key={mod.id} className="space-y-3">
                    {/* Encabezado del módulo */}
                    <div className="flex items-center gap-2">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${mod.color}15` }}
                      >
                        <span className="material-symbols-outlined text-sm" style={{ color: mod.color }}>
                          {mod.icon}
                        </span>
                      </div>
                      <span className="text-sm font-bold text-[#E8EAF0]">{mod.name}</span>
                    </div>

                    {/* Opciones de autonomía */}
                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                      {AUTONOMY_LEVELS.map(level => {
                        const isSelected = currentLevel === level.value;
                        return (
                          <button
                            key={level.value}
                            type="button"
                            onClick={() => setAutonomy(prev => ({
                              ...prev,
                              [mod.id]: level.value,
                            }))}
                            className={`
                              relative py-2.5 px-3 rounded-xl text-center
                              transition-all duration-200
                              ${isSelected
                                ? "bg-white/[0.08] border-2"
                                : "bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04]"
                              }
                            `}
                            style={{
                              borderColor: isSelected ? level.color : undefined,
                              boxShadow: isSelected ? `0 0 12px ${level.color}20` : undefined,
                            }}
                            title={level.desc}
                          >
                            <p
                              className="text-[11px] font-bold"
                              style={{ color: isSelected ? level.color : "#8DA4C4" }}
                            >
                              {level.label}
                            </p>
                            <p className="text-[9px] text-[#506584] mt-0.5 hidden sm:block">
                              {level.value}
                            </p>
                          </button>
                        );
                      })}
                    </div>

                    {/* Descripción del nivel seleccionado */}
                    <p className="text-[11px] text-[#8DA4C4] italic pl-9">
                      {AUTONOMY_LEVELS.find(l => l.value === currentLevel)?.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </SectionCard>

          <SaveButton onClick={saveAutonomy} label="Guardar niveles de autonomía" saving={savingAutonomy} />
        </section>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Sub-componentes reutilizables
// ──────────────────────────────────────────────────────────────────────────────

/** Tarjeta de sección con título e ícono */
function SectionCard({
  title,
  icon,
  color,
  children,
}: {
  title: string;
  icon: string;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 md:p-6 space-y-4">
      <h2 className="flex items-center gap-2 text-sm font-headline font-bold text-[#E8EAF0]">
        <span className="material-symbols-outlined text-lg" style={{ color }} aria-hidden="true">
          {icon}
        </span>
        {title}
      </h2>
      {children}
    </div>
  );
}

/** Input de campo con label */
function FieldInput({
  label,
  value,
  onChange,
  placeholder,
  maxLength,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  maxLength?: number;
  type?: string;
}) {
  return (
    <div>
      <label className="text-[11px] font-bold text-[#8DA4C4] uppercase tracking-wider block mb-1">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        className="
          w-full bg-white/[0.03] border border-white/[0.08]
          rounded-lg px-3 py-2 text-sm text-[#E8EAF0]
          placeholder:text-[#506584]
          focus:border-[#A8E63D]/30 focus:outline-none
          transition-colors
        "
      />
    </div>
  );
}

/** Botón de guardar reutilizable */
function SaveButton({
  onClick,
  label,
  saving = false,
}: {
  onClick: () => void;
  label: string;
  saving?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={saving}
      className="
        w-full py-3 rounded-xl text-[12px] font-bold uppercase tracking-wider
        bg-[#A8E63D] text-[#0D1B3E]
        hover:shadow-[0_0_15px_#A8E63D40]
        disabled:opacity-40 disabled:cursor-not-allowed
        transition-all duration-200
        flex items-center justify-center gap-2
      "
    >
      {saving && <span className="material-symbols-outlined text-sm animate-spin">sync</span>}
      {saving ? "Guardando…" : label}
    </button>
  );
}
