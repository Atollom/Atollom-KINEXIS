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
  ownerOnly?: boolean; 
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
  { id: "companies", label: "Empresas",     icon: "domain" },
  { id: "modules",   label: "Módulos",      icon: "widgets",       ownerOnly: true },
  { id: "apikeys",   label: "API Keys",     icon: "key" },
  { id: "rules",     label: "Reglas",       icon: "tune" },
  { id: "users",     label: "Usuarios",     icon: "group" },
  { id: "autonomy",  label: "Autonomía",    icon: "smart_toy" },
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

const API_KEY_GROUPS = [
  {
    platform: "Mercado Libre",
    color: "#ccff00",
    icon: "shopping_bag",
    keys: [
      { name: "ml_access_token", label: "Access Token" },
      { name: "ml_client_id", label: "Client ID" },
      { name: "ml_client_secret", label: "Client Secret" },
    ],
  },
  {
    platform: "Amazon SP-API",
    color: "#ff9900",
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
  { id: "ecommerce", name: "Ecommerce", description: "Ventas multicanal e inventario", icon: "storefront", color: "#ccff00" },
  { id: "erp",       name: "ERP",       description: "Operación, logística y CFDI",    icon: "account_tree", color: "#ccff00" },
  { id: "crm",       name: "CRM",       description: "Leads y servicio al cliente",    icon: "group",        color: "#ccff00" },
];

const AUTONOMY_LEVELS: { value: AutonomyLevel; label: string; desc: string; color: string }[] = [
  { value: "FULL",           label: "FULL",         desc: "IA autónoma total",           color: "#ccff00" },
  { value: "NOTIFY",         label: "NOTIFY",       desc: "IA actúa y reporta",           color: "#ccff00" },
  { value: "SUPERVISED",     label: "SUPERVISED",   desc: "Requiere autorización",        color: "#ccff00" },
  { value: "HUMAN_REQUIRED", label: "MANUAL",       desc: "Solo ejecución humana",        color: "#ffffff" },
  { value: "PAUSED",         label: "PAUSED",       desc: "Sistemas suspendidos",         color: "#ef4444" },
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

function maskValue(hasValue: boolean): string {
  return hasValue ? "••••••••••••••••" : "";
}

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
  const [userRole, setUserRole] = useState<UserRole>("viewer");

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase
        .from("users")
        .select("role")
        .eq("supabase_user_id", user.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data?.role) { setUserRole(data.role as UserRole); return; }
          supabase.from("users").select("role").eq("email", user.email ?? "").maybeSingle()
            .then(({ data: d }) => { if (d?.role) setUserRole(d.role as UserRole); });
        });
    });
  }, []);

  const [activeTab, setActiveTab] = useState<TabId>("profile");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  const visibleTabs = TABS.filter(t => !t.ownerOnly || userRole === "owner");

  const [profile, setProfile] = useState<BusinessProfile>({
    business_name: "", rfc: "", tax_regime: "", postal_code: "", logo_url: "",
  });
  const [vaultStatus, setVaultStatus] = useState<Record<string, boolean>>({});
  const [keyInputs, setKeyInputs] = useState<Record<string, string>>({});
  const [savingKeys, setSavingKeys] = useState<Set<string>>(new Set());
  const [rules, setRules] = useState<BusinessRules | null>(null);
  const [savingRules, setSavingRules] = useState(false);
  const [users, setUsers] = useState<TenantUserRow[]>([]);
  const [changingRole, setChangingRole] = useState<string | null>(null);
  const [autonomy, setAutonomy] = useState<AutonomyConfig>({
    ecommerce: "FULL", erp: "NOTIFY", crm: "SUPERVISED",
  });
  const [savingAutonomy, setSavingAutonomy] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [activeCompanyId, setActiveCompanyId] = useState<string | null>(null);
  const [savingCompany, setSavingCompany] = useState<string | null>(null);

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
        // Only set rules if the response contains valid data (not an error object)
        if (rulesRes.status === "fulfilled" && typeof rulesRes.value?.ml_margin === "number") {
          setRules(rulesRes.value);
        }
        if (usersRes.status === "fulfilled") setUsers(usersRes.value.users || []);
        if (autonomyRes.status === "fulfilled") setAutonomy(autonomyRes.value.autonomy || autonomy);
        if (companiesRes.status === "fulfilled") {
          const list = companiesRes.value.companies || [];
          setCompanies(list);
          const savedId = localStorage.getItem("active_company_id");
          if (savedId && list.some((c: Company) => c.id === savedId)) {
            setActiveCompanyId(savedId);
          } else if (list.length > 0) {
            const principal = list.find((c: Company) => c.es_principal);
            setActiveCompanyId(principal ? principal.id : list[0].id);
          }
        }
      } catch {
        setError("Operational error: System sync failed.");
      } finally {
        setLoading(false);
      }
    }
    loadAll();
  }, []);

  async function saveProfile() {
    try {
      const res = await fetch("/api/settings/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      if (!res.ok) throw new Error("Error guardando perfil");
      toast.show("Profile synchronized.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    }
  }

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
      toast.show(`${keyName} stored.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setSavingKeys(prev => {
        const next = new Set(prev);
        next.delete(keyName);
        return next;
      });
    }
  }

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
      if (!res.ok) throw new Error("Error guardando reglas");
      toast.show("Operational rules updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setSavingRules(false);
    }
  }

  async function changeUserRole(userId: string, newRole: UserRole) {
    setChangingRole(userId);
    try {
      const res = await fetch("/api/settings/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, role: newRole }),
      });
      if (!res.ok) throw new Error("Error cambiando rol");
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
      toast.show("User RBAC synchronized.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setChangingRole(null);
    }
  }

  async function saveAutonomy() {
    setSavingAutonomy(true);
    try {
      const res = await fetch("/api/settings/autonomy", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(autonomy),
      });
      if (!res.ok) throw new Error("Error guardando autonomía");
      toast.show("Autonomy matrix updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setSavingAutonomy(false);
    }
  }

  async function selectActiveCompany(id: string) {
    localStorage.setItem("active_company_id", id);
    setActiveCompanyId(id);
    toast.show("Active company set for this session.");
  }

  async function setPrincipalCompany(id: string) {
    setSavingCompany(id);
    try {
      await fetch("/api/settings/companies", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, es_principal: true }),
      });
      setCompanies(prev => prev.map(c => ({ ...c, es_principal: c.id === id })));
      toast.show("Principal company updated.");
    } catch {
      setError("Error");
    } finally {
      setSavingCompany(null);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4 animate-pulse">
        <div className="w-12 h-12 rounded-full border-2 border-[#ccff00]/20 border-t-[#ccff00] animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#ccff00]">Syncing Matrix...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-luxe pb-24">
      
      {/* Dynamic Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-4 py-2">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-2xl bg-[#ccff00]/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-[#ccff00] text-xl">settings</span>
             </div>
             <div>
                <h1 className="text-3xl font-black tracking-tighter text-white uppercase">System Config</h1>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#ccff00]/60 italic">Neural Operational Center</p>
             </div>
          </div>
        </div>

        {/* Luxe Tabs */}
        <div className="bg-white/5 p-1 rounded-2xl border border-white/5 flex gap-1 overflow-x-auto scrollbar-none max-w-full">
          {visibleTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 px-5 py-2.5 rounded-xl
                text-[9px] font-black uppercase tracking-[0.2em] transition-all duration-300
                whitespace-nowrap flex-shrink-0
                ${activeTab === tab.id
                  ? "bg-[#ccff00] text-black shadow-[0_0_15px_#ccff0044] italic"
                  : "text-white/30 hover:text-white hover:bg-white/5"
                }
              `}
            >
              <span className="material-symbols-outlined text-[14px]">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* Success/Error Notifs */}
      <div className="fixed top-24 right-8 z-[100] space-y-4">
        {toast.msg && (
          <div className="glass-card px-6 py-4 rounded-2xl border border-[#ccff00]/20 flex items-center gap-4 animate-luxe shadow-volt">
            <span className="material-symbols-outlined text-[#ccff00]">check_circle</span>
            <span className="text-[11px] font-black text-white uppercase tracking-widest">{toast.msg}</span>
          </div>
        )}
        {error && (
          <div className="glass-card px-6 py-4 rounded-2xl border border-red-500/20 flex items-center gap-4 animate-luxe shadow-xl bg-red-500/5">
            <span className="material-symbols-outlined text-red-500">error</span>
            <span className="text-[11px] font-black text-red-500 uppercase tracking-widest">{error}</span>
            <button onClick={() => setError(null)} className="ml-2 hover:opacity-50 transition-opacity">
               <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
        )}
      </div>

      {/* Content Canvas */}
      <main className="px-4">
        
        {/* Profile */}
        {activeTab === "profile" && (
           <div className="space-y-8 animate-luxe">
              <SectionCard title="Identity Core" icon="business" color="#ccff00">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <FieldInput label="Entity Name" value={profile.business_name} onChange={v => setProfile(p => ({ ...p, business_name: v }))} placeholder="Atollom Operational Corp" />
                    <FieldInput label="Tax ID (RFC)" value={profile.rfc} onChange={v => setProfile(p => ({ ...p, rfc: v.toUpperCase() }))} maxLength={13} />
                    <FieldInput label="Tax Regime" value={profile.tax_regime} onChange={v => setProfile(p => ({ ...p, tax_regime: v }))} />
                    <FieldInput label="Identity Pin (CP)" value={profile.postal_code} onChange={v => setProfile(p => ({ ...p, postal_code: v }))} maxLength={5} />
                 </div>
                 <div className="mt-8">
                    <FieldInput label="Brand Core (Logo URL)" value={profile.logo_url} onChange={v => setProfile(p => ({ ...p, logo_url: v }))} />
                 </div>
                 {profile.logo_url && (
                    <div className="mt-8 flex items-center gap-6 p-4 rounded-2xl border border-white/5 bg-white/5">
                       <div className="w-24 h-24 rounded-xl bg-black flex items-center justify-center overflow-hidden">
                          <img src={profile.logo_url} alt="Logo Preview" className="max-w-full max-h-full object-contain" />
                       </div>
                       <div>
                          <p className="text-[10px] font-black text-[#ccff00] uppercase tracking-widest italic">Identity Sync Active</p>
                          <p className="text-[9px] text-white/30 uppercase mt-1">Live Preview Module</p>
                       </div>
                    </div>
                 )}
                 <div className="mt-12 flex justify-end">
                    <SaveButton onClick={saveProfile} label="Commit Identity Sync" />
                 </div>
              </SectionCard>
           </div>
        )}

        {/* Companies */}
        {activeTab === "companies" && (
           <div className="space-y-8 animate-luxe">
              <SectionCard title="Entity Sub-Grid" icon="domain" color="#ccff00">
                 <div className="grid gap-4">
                    {companies.map(emp => (
                       <div key={emp.id} className={`glass-card p-6 rounded-3xl border transition-all duration-300 flex items-center justify-between ${activeCompanyId === emp.id ? 'border-[#ccff00]/30 shadow-volt' : 'border-white/5 hover:border-white/10'}`}>
                          <div className="flex items-center gap-6">
                             <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${emp.es_principal ? 'bg-[#ccff00]/10 text-[#ccff00]' : 'bg-white/5 text-white/20'}`}>
                                <span className="material-symbols-outlined text-xl">{emp.es_principal ? 'verified' : 'business'}</span>
                             </div>
                             <div>
                                <div className="flex items-center gap-3">
                                   <h3 className="text-sm font-black text-white uppercase tracking-widest">{emp.nombre}</h3>
                                   {emp.es_principal && <span className="text-[8px] font-black text-[#ccff00] border border-[#ccff00]/30 bg-[#ccff00]/5 px-2 py-0.5 rounded italic">CORE</span>}
                                </div>
                                <p className="text-[10px] text-white/40 uppercase tracking-widest mt-1">{emp.rfc} • {emp.cp_expedicion}</p>
                             </div>
                          </div>
                          <div className="flex items-center gap-3">
                             {activeCompanyId !== emp.id && (
                                <button onClick={() => selectActiveCompany(emp.id)} className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center hover:bg-white/10 transition-all text-white/40 hover:text-white" title="Select for Session">
                                   <span className="material-symbols-outlined text-lg">login</span>
                                </button>
                             )}
                             {userRole === "owner" && !emp.es_principal && (
                                <button onClick={() => setPrincipalCompany(emp.id)} disabled={savingCompany === emp.id} className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center hover:bg-white/10 transition-all text-white/40 hover:text-[#ccff00]" title="Mark as Core">
                                   <span className="material-symbols-outlined text-lg">star</span>
                                </button>
                             )}
                          </div>
                       </div>
                    ))}
                 </div>
              </SectionCard>
           </div>
        )}

        {/* API Keys */}
        {activeTab === "apikeys" && (
           <div className="space-y-8 animate-luxe">
              {API_KEY_GROUPS.map(group => (
                 <SectionCard key={group.platform} title={group.platform} icon={group.icon} color="#ccff00">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       {group.keys.map(keyDef => {
                          const hasValue = vaultStatus[keyDef.name] || false;
                          const isSaving = savingKeys.has(keyDef.name);
                          const inputVal = keyInputs[keyDef.name] || "";
                          return (
                             <div key={keyDef.name} className="space-y-3">
                                <div className="flex items-center justify-between px-1">
                                   <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">{keyDef.label}</label>
                                   {hasValue && (
                                      <span className="text-[8px] font-black text-[#ccff00] uppercase tracking-widest flex items-center gap-2">
                                         <span className="w-1 h-1 rounded-full bg-[#ccff00] shadow-[0_0_5px_#ccff00]" />
                                         Encrypted
                                      </span>
                                   )}
                                </div>
                                <div className="flex gap-4">
                                   <div className="flex-1">
                                      <input 
                                         type="password" 
                                         value={inputVal || (hasValue ? maskValue(hasValue) : "")}
                                         onChange={e => setKeyInputs(prev => ({ ...prev, [keyDef.name]: e.target.value }))}
                                         placeholder={hasValue ? "REDACTED" : "Input Cipher..."}
                                         className="w-full h-12 bg-white/5 border border-white/5 rounded-xl px-4 text-sm text-white focus:border-[#ccff00]/30 outline-none transition-all placeholder:text-white/10"
                                      />
                                   </div>
                                   <button 
                                      onClick={() => saveApiKey(keyDef.name)}
                                      disabled={isSaving || !inputVal.trim()}
                                      className={`h-12 w-12 rounded-xl flex items-center justify-center transition-all ${inputVal.trim() && !isSaving ? 'bg-[#ccff00] text-black shadow-volt' : 'bg-white/5 text-white/10'}`}
                                   >
                                      <span className="material-symbols-outlined text-lg">{isSaving ? 'sync' : 'key_vertical'}</span>
                                   </button>
                                </div>
                             </div>
                          );
                       })}
                    </div>
                 </SectionCard>
              ))}
           </div>
        )}

        {/* Rules — empty state when tenant_business_rules not seeded yet */}
        {activeTab === "rules" && !rules && (
           <div className="glass-card rounded-[3rem] p-12 flex flex-col items-center text-center gap-4 border border-white/5">
              <span className="material-symbols-outlined text-4xl text-[#ccff00]/40">tune</span>
              <h3 className="text-lg font-black text-white/60 uppercase tracking-widest">Sin Reglas Configuradas</h3>
              <p className="text-sm text-white/30 max-w-md">Las reglas operacionales se configuran durante el onboarding. Contacta al administrador de KINEXIS para inicializarlas.</p>
           </div>
        )}
        {activeTab === "rules" && rules && (
           <form onSubmit={saveRules} className="space-y-8 animate-luxe">
              <SectionCard title="Margin Parameters" icon="sell" color="#ccff00">
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    {Object.entries(MARGIN_MINIMUMS).map(([field, min]) => {
                       const val = (rules[field as keyof BusinessRules] as number) ?? 0;
                       const isBelow = val > 0 && val < min;
                       return (
                          <div key={field} className="space-y-3">
                             <label className="text-[10px] font-black text-white/30 uppercase tracking-widest leading-none block">
                                {MARGIN_LABELS[field]}
                             </label>
                             <div className="relative">
                                <input 
                                   type="number" step="0.01" min={min} value={val}
                                   onChange={e => setRules(r => r ? { ...r, [field]: parseFloat(e.target.value) || 0 } : r)}
                                   className={`w-full h-12 bg-white/5 border rounded-xl px-4 text-sm font-black transition-all outline-none ${isBelow ? 'border-red-500/40 text-red-500' : 'border-white/5 text-[#ccff00]'}`}
                                />
                                {isBelow && <p className="text-[8px] font-black text-red-500 uppercase mt-2 italic">Alert: Min {min}</p>}
                             </div>
                          </div>
                       );
                    })}
                 </div>
              </SectionCard>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <SectionCard title="Inventory Umbras" icon="warehouse" color="#ccff00">
                    <div className="grid grid-cols-2 gap-6">
                       <FieldInput type="number" label="Warning (Days)" value={(rules.stock_safety_days ?? 7).toString()} onChange={v => setRules(r => r ? { ...r, stock_safety_days: parseInt(v) || 0 } : r)} />
                       <FieldInput type="number" label="Critical (Days)" value={(rules.stock_critical_days ?? 3).toString()} onChange={v => setRules(r => r ? { ...r, stock_critical_days: parseInt(v) || 0 } : r)} />
                    </div>
                 </SectionCard>
                 <SectionCard title="NPS Cooldown" icon="star" color="#ccff00">
                    <FieldInput type="number" label="Interval (Days)" value={(rules.nps_cooldown_days ?? 90).toString()} onChange={v => setRules(r => r ? { ...r, nps_cooldown_days: parseInt(v) || 90 } : r)} />
                 </SectionCard>
              </div>

              <div className="flex justify-end pt-8">
                 <SaveButton onClick={() => {}} label="Sync Operational Rules" />
              </div>
           </form>
        )}

        {/* Users */}
        {activeTab === "users" && (
           <div className="space-y-8 animate-luxe">
              <SectionCard title="Human Matrix (RBAC)" icon="group" color="#ccff00">
                 <div className="grid gap-4">
                    {users.map(user => (
                       <div key={user.id} className="glass-card p-6 rounded-3xl border border-white/5 hover:border-white/10 transition-all flex items-center justify-between">
                          <div className="flex items-center gap-6">
                             <div className="w-12 h-12 rounded-full border border-white/10 bg-white/5 flex items-center justify-center">
                                <span className="text-sm font-black text-white">{(user.full_name || user.email).charAt(0).toUpperCase()}</span>
                             </div>
                             <div>
                                <h3 className="text-sm font-black text-white uppercase tracking-widest">{user.full_name || "Unknown Op"}</h3>
                                <p className="text-[10px] text-white/30 uppercase mt-1">{user.email}</p>
                             </div>
                          </div>
                          <div className="flex items-center gap-6">
                             {userRole === "owner" ? (
                                <select 
                                   value={user.role} 
                                   onChange={e => changeUserRole(user.id, e.target.value as UserRole)}
                                   disabled={user.role === 'owner' || changingRole === user.id}
                                   className="h-10 bg-white/5 border border-white/10 rounded-xl px-4 text-[10px] font-black text-[#ccff00] uppercase tracking-widest outline-none focus:border-[#ccff00]/30 transition-all appearance-none cursor-pointer text-center min-w-[140px]"
                                >
                                   {ROLE_OPTIONS.map(opt => <option key={opt.value} value={opt.value} className="bg-black text-white">{opt.label}</option>)}
                                </select>
                             ) : (
                                <span className="text-[10px] font-black text-[#ccff00] border border-[#ccff00]/30 bg-[#ccff00]/5 px-4 py-2 rounded-xl uppercase tracking-[0.2em] italic">
                                   {ROLE_OPTIONS.find(r => r.value === user.role)?.label || user.role}
                                </span>
                             )}
                          </div>
                       </div>
                    ))}
                 </div>
              </SectionCard>
           </div>
        )}

        {/* Autonomy */}
        {activeTab === "autonomy" && (
           <div className="space-y-8 animate-luxe">
              <SectionCard title="Neural Autonomy Matrix" icon="smart_toy" color="#ccff00">
                 <div className="space-y-12">
                    {MODULES_LIST.map(mod => {
                       const currentLevel = autonomy[mod.id as keyof AutonomyConfig];
                       return (
                          <div key={mod.id} className="space-y-6">
                             <div className="flex items-center justify-between px-2">
                                <div className="flex items-center gap-4">
                                   <div className="w-8 h-8 rounded-lg bg-[#ccff00]/10 flex items-center justify-center text-[#ccff00]">
                                      <span className="material-symbols-outlined text-lg">{mod.icon}</span>
                                   </div>
                                   <div>
                                      <h3 className="text-sm font-black text-white uppercase tracking-[0.2em]">{mod.name}</h3>
                                      <p className="text-[9px] text-white/30 uppercase mt-1 tracking-widest">{mod.description}</p>
                                   </div>
                                </div>
                                <div className="text-right">
                                   <p className="text-[10px] font-black text-[#ccff00] uppercase italic tracking-widest">Active Level: {currentLevel}</p>
                                </div>
                             </div>

                             <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                                {AUTONOMY_LEVELS.map(level => {
                                   const isSelected = currentLevel === level.value;
                                   return (
                                      <button 
                                         key={level.value}
                                         onClick={() => setAutonomy(prev => ({ ...prev, [mod.id]: level.value }))}
                                         className={`relative p-6 rounded-[2rem] border transition-all duration-500 text-center space-y-3 group ${isSelected ? 'bg-[#ccff00]/10 border-[#ccff00]/40 shadow-volt' : 'bg-white/5 border-white/5 hover:border-white/10'}`}
                                      >
                                         <p className={`text-[11px] font-black uppercase tracking-widest leading-none ${isSelected ? 'text-[#ccff00]' : 'text-white/40'}`}>{level.label}</p>
                                         <p className="text-[8px] text-white/30 uppercase tracking-widest leading-none transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 opacity-0 group-hover:opacity-100">{level.desc}</p>
                                         {isSelected && <div className="absolute top-2 right-4 w-1 h-1 rounded-full bg-[#ccff00] shadow-[0_0_5px_#ccff00]" />}
                                      </button>
                                   );
                                })}
                             </div>
                          </div>
                       );
                    })}
                 </div>
              </SectionCard>
              <div className="flex justify-end pt-8">
                 <SaveButton onClick={saveAutonomy} label="Update Neural Matrix" saving={savingAutonomy} />
              </div>
           </div>
        )}

      </main>

    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Sub-componentes
// ──────────────────────────────────────────────────────────────────────────────

function SectionCard({ title, icon, color, children }: { title: string; icon: string; color: string; children: React.ReactNode }) {
  return (
    <div className="glass-card rounded-[3rem] p-10 border border-white/5 relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#ccff00]/5 rounded-full blur-[100px] pointer-events-none group-hover:bg-[#ccff00]/10 transition-all duration-700" />
      <div className="flex items-center gap-4 mb-10 pb-6 border-b border-white/5">
        <span className="material-symbols-outlined text-2xl" style={{ color }}>{icon}</span>
        <h2 className="text-xl font-black text-white uppercase tracking-[0.3em] font-headline">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function FieldInput({ label, value, onChange, placeholder, maxLength, type = "text" }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; maxLength?: number; type?: string }) {
  return (
    <div className="space-y-3">
      <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] leading-none block px-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        className="w-full h-14 bg-white/5 border border-white/5 rounded-2xl px-6 text-[14px] text-white font-medium outline-none focus:border-[#ccff00]/30 transition-all placeholder:text-white/10"
      />
    </div>
  );
}

function SaveButton({ onClick, label, saving = false }: { onClick: () => void; label: string; saving?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={saving}
      className="h-14 px-10 rounded-2xl bg-[#ccff00] text-black text-[11px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-4 hover:scale-105 active:scale-95 transition-all shadow-volt disabled:opacity-40 disabled:cursor-not-allowed group"
    >
      {saving ? <span className="material-symbols-outlined text-lg animate-spin">sync</span> : <span className="material-symbols-outlined text-lg group-hover:rotate-12 transition-transform">bolt</span>}
      {saving ? "Processing..." : label}
    </button>
  );
}
