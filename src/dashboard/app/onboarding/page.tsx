"use client";

import { useState, useEffect } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";
import type { AutonomyLevel, UserRole } from "@/types";

// ──────────────────────────────────────────────────────────────────────────────
// Tipos locales
// ──────────────────────────────────────────────────────────────────────────────
type OnboardingStep = 1 | 2 | 3 | 4 | 5 | 6 | 7;

interface AutonomyConfig {
  ecommerce: AutonomyLevel;
  erp: AutonomyLevel;
  crm: AutonomyLevel;
}

const AUTONOMY_OPTIONS: { value: AutonomyLevel; label: string; desc: string; color: string }[] = [
  { value: "FULL",       label: "FULL",       desc: "IA autónoma total",           color: "#ccff00" },
  { value: "NOTIFY",     label: "NOTIFY",     desc: "IA actúa y reporta",           color: "#ccff00" },
  { value: "SUPERVISED", label: "SUPERVISED", desc: "Requiere autorización",        color: "#ffffff" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createBrowserSupabaseClient();

  const [loadingUser, setLoadingUser] = useState(true);
  const [role, setRole] = useState<UserRole | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [tenantId, setTenantId] = useState<string | null>(null);

  // Estados del wizard
  const [step, setStep] = useState<OnboardingStep>(1);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Datos Paso 1: Bienvenida
  const [displayName, setDisplayName] = useState("");

  // Datos Paso 2: Multi-empresa
  const [hasMultipleCompanies, setHasMultipleCompanies] = useState<boolean | null>(null);
  const [companies, setCompanies] = useState<{ id: string; nombre: string; rfc: string; regimen: string; cp: string }[]>([]);

  // Datos Paso 3: Ecommerce Keys
  const [mlApiKey, setMlApiKey] = useState("");
  const [amzApiKey, setAmzApiKey] = useState("");
  const [shpApiKey, setShpApiKey] = useState("");

  // Datos Paso 4: ERP
  const [rfc, setRfc] = useState("");
  const [taxRegime, setTaxRegime] = useState("");
  const [cp, setCp] = useState("");

  // Datos Paso 5: CRM
  const [metaAccessToken, setMetaAccessToken] = useState("");
  const [wabaId, setWabaId] = useState("");
  const [phoneId, setPhoneId] = useState("");

  // Datos Paso 6: Autonomía
  const [autonomy, setAutonomy] = useState<AutonomyConfig>({
    ecommerce: "SUPERVISED",
    erp: "SUPERVISED",
    crm: "SUPERVISED",
  });

  // Mobile warning
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setUserId(user.id);
      
      const { data } = await supabase
        .from("user_profiles")
        .select("role, tenant_id")
        .eq("id", user.id)
        .single();
        
      if (data) {
        setRole(data.role as UserRole);
        setTenantId(data.tenant_id);
      }
      setLoadingUser(false);
    }
    loadUser();
  }, [supabase, router]);

  if (isMobile) {
    return (
      <div className="h-screen w-full bg-black p-8 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#ccff00]/10 flex items-center justify-center mb-6 shadow-volt">
          <span className="material-symbols-outlined text-3xl text-[#ccff00]">desktop_windows</span>
        </div>
        <h1 className="text-2xl font-black text-white uppercase tracking-tighter mb-4">Neural Onboarding</h1>
        <p className="text-white/40 text-[10px] font-black uppercase tracking-widest leading-relaxed">
          Please initialize the system from a high-performance desktop terminal. Secure keys required for synchronization.
        </p>
      </div>
    );
  }

  if (loadingUser) {
    return (
      <div className="h-screen w-full bg-black flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-full border-2 border-[#ccff00]/20 border-t-[#ccff00] animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#ccff00]">Syncing Identity...</p>
      </div>
    );
  }

  if (role !== "owner") {
    return (
      <div className="h-screen w-full bg-black flex items-center justify-center flex-col p-8 text-center space-y-8">
        <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20">
          <span className="material-symbols-outlined text-5xl text-red-500">lock_person</span>
        </div>
        <div>
          <h1 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">Access Restrained</h1>
          <p className="text-white/30 text-[10px] uppercase font-black tracking-widest leading-relaxed">Identity Role: {role || 'RESTRICTED'}<br/>Only the Primary Neural Overseer (Owner) can initiate the core onboarding.</p>
        </div>
        <button onClick={() => router.push("/")} className="px-8 py-3 bg-white text-black text-[10px] font-black rounded-xl uppercase tracking-widest hover:bg-[#ccff00] transition-colors shadow-xl">Return to Core</button>
      </div>
    );
  }

  const nextStep = async () => {
    setSaveError(null);
    if (step === 1) await saveStep1();
    else if (step === 2) await saveStep2();
    else if (step === 3) await saveStep3();
    else if (step === 4) {
      const ok = await saveStep4();
      if (!ok) return;
    }
    else if (step === 5) await saveStep5();
    else if (step === 6) await saveStep6();

    if (step < 7) setStep(prev => (prev + 1) as OnboardingStep);
  };

  const skipStep = () => {
    setSaveError(null);
    if (step < 7) setStep(prev => (prev + 1) as OnboardingStep);
  };

  const skipAll = async () => {
    router.push("/");
  };

  const saveStep1 = async () => {
    if (!displayName.trim() || !userId) return;
    setSaving(true);
    await supabase.from("user_profiles").update({ display_name: displayName }).eq("id", userId);
    setSaving(false);
  };

  const saveStep2 = async () => {
    if (hasMultipleCompanies && companies.length > 0) {
      setSaving(true);
      for (const emp of companies) {
        await fetch("/api/settings/companies", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nombre: emp.nombre, rfc: emp.rfc, regimen_fiscal: emp.regimen, cp_expedicion: emp.cp, es_principal: false })
        });
      }
      setSaving(false);
    }
  };

  const saveStep3 = async () => {
    const keys: Record<string, string> = {};
    if (mlApiKey) keys.ml_access_token = mlApiKey;
    if (amzApiKey) keys.amazon_sp_api_key = amzApiKey;
    if (shpApiKey) keys.shopify_api_key = shpApiKey;

    if (Object.keys(keys).length > 0) {
      setSaving(true);
      await fetch("/api/settings/vault", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keys })
      });
      setSaving(false);
    }
  };

  const saveStep4 = async (): Promise<boolean> => {
    setSaving(true);
    setSaveError(null);
    try {
      if (!hasMultipleCompanies && rfc) {
        await fetch("/api/settings/companies", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nombre: displayName + " Corp", rfc, regimen_fiscal: taxRegime, cp_expedicion: cp, es_principal: true })
        });
      }
      if (rfc || taxRegime || cp) {
        const res = await fetch("/api/settings/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rfc, tax_regime: taxRegime, postal_code: cp })
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          setSaveError(err.error || "RFC identity rejected by validator.");
          return false;
        }
      }
      return true;
    } finally {
      setSaving(false);
    }
  };

  const saveStep5 = async () => {
    const keys: Record<string, string> = {};
    if (metaAccessToken) keys.meta_access_token = metaAccessToken;
    if (wabaId) keys.whatsapp_business_id = wabaId;
    if (phoneId) keys.whatsapp_phone_id = phoneId;

    if (Object.keys(keys).length > 0) {
      setSaving(true);
      await fetch("/api/settings/vault", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keys })
      });
      setSaving(false);
    }
  };

  const saveStep6 = async () => {
    setSaving(true);
    await fetch("/api/settings/autonomy", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(autonomy)
    });
    setSaving(false);
  };

  const finishOnboarding = async () => {
    try { await fetch("/api/onboarding/complete", { method: "POST" }); } catch {}
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sans overflow-hidden">
      
      {/* ── Luxe Progress Top ──────────────────────────────────────── */}
      <div className="h-1.5 w-full bg-white/5 relative overflow-hidden">
        <div 
          className="h-full bg-[#ccff00] transition-all duration-1000 ease-out shadow-volt"
          style={{ width: `${(step / 7) * 100}%` }}
        />
        <div className="absolute top-0 right-0 h-full w-24 bg-gradient-to-r from-transparent to-[#ccff00] blur-md opacity-30" style={{ right: `${100 - (step/7)*100}%` }} />
      </div>

      {/* ── Content Canvas ───────────────────────────────────────────── */}
      <div className="flex-1 max-w-5xl w-full mx-auto p-12 flex flex-col mt-12 relative">
        
        {/* Decorative elements */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-[#ccff00]/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute top-1/2 -right-48 w-[400px] h-[400px] bg-[#ccff00]/5 rounded-full blur-[120px] pointer-events-none" />

        {/* Global Nav */}
        <div className="flex items-center justify-between mb-20 relative z-10">
          <div className="flex items-center gap-6">
            <div className="w-12 h-12 rounded-2xl bg-[#ccff00]/10 border border-[#ccff00]/20 flex items-center justify-center font-black text-[#ccff00] text-xl shadow-volt italic">
              K
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.4em] text-white/30 font-black">Neural Initialization</p>
              <h2 className="text-2xl font-black uppercase tracking-tighter">Sequence {step} <span className="text-white/20 italic">/ 07</span></h2>
            </div>
          </div>

          <button
            onClick={skipAll}
            className="text-[9px] font-black uppercase tracking-[0.3em] text-white/30 hover:text-red-500 transition-all border-b border-white/5 hover:border-red-500/30 pb-1"
          >
             Bypass Sequence
          </button>
        </div>

        {/* ── Active Module ─────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col h-full animate-luxe relative z-10">
          
          {step === 1 && (
            <div className="max-w-2xl">
              <div className="flex items-end gap-6 mb-12">
                <div className="w-16 h-16 rounded-3xl bg-[#ccff00]/10 flex items-center justify-center flex-shrink-0 animate-pulse border border-[#ccff00]/20 shadow-volt">
                  <span className="material-symbols-outlined text-4xl text-[#ccff00]">smart_toy</span>
                </div>
                <div className="glass-card rounded-[2rem] rounded-bl-sm p-8 flex-1 relative border border-white/5">
                  <p className="text-[15px] font-medium leading-relaxed uppercase tracking-tight italic">
                    Greeting, Overseer. I am <strong className="text-[#ccff00]">SAMANTHA</strong>, your Neural Operational Agent.
                    <br/><br/>
                    I am ready to synchronize your commerce pipelines, stabilize fiscal logs, and amplify your market reach.
                    <br/><br/>
                    Identify yourself for the protocol. <strong>How should I address you?</strong>
                  </p>
                </div>
              </div>
              <div className="ml-20">
                <input
                  type="text"
                  autoFocus
                  placeholder="IDENTIFY: (e.g. Carlos)"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") nextStep() }}
                  className="w-full bg-white/5 border border-white/5 rounded-2xl px-8 py-6 text-xl font-black uppercase tracking-widest focus:border-[#ccff00]/40 focus:outline-none transition-all placeholder:text-white/10 italic"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="max-w-2xl animate-luxe">
              <h1 className="text-4xl font-black uppercase tracking-tighter mb-4">Operational Structure</h1>
              <p className="text-white/40 text-[12px] uppercase font-black tracking-widest leading-relaxed mb-12">
                Define the neural map for your entities. Single or Multi-Corp mapping.
              </p>

              <div className="grid grid-cols-2 gap-6 mb-12">
                <button 
                  onClick={() => setHasMultipleCompanies(false)}
                  className={`relative p-10 rounded-[2.5rem] border transition-all duration-500 text-left group overflow-hidden ${hasMultipleCompanies === false ? "bg-[#ccff00]/10 border-[#ccff00]/30 shadow-volt" : "bg-white/5 border-white/5 hover:border-white/10"}`}
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#ccff00]/5 rounded-full blur-[60px] pointer-events-none" />
                  <span className={`material-symbols-outlined text-4xl mb-6 flex-shrink-0 ${hasMultipleCompanies === false ? 'text-[#ccff00]' : 'text-white/20'}`}>business</span>
                  <h3 className="font-black text-sm uppercase tracking-[0.2em]">Single Grid</h3>
                  <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mt-2">One core entity / RFC.</p>
                </button>
                <button 
                  onClick={() => setHasMultipleCompanies(true)}
                  className={`relative p-10 rounded-[2.5rem] border transition-all duration-500 text-left group overflow-hidden ${hasMultipleCompanies === true ? "bg-[#ccff00]/10 border-[#ccff00]/30 shadow-volt" : "bg-white/5 border-white/5 hover:border-white/10"}`}
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#ccff00]/5 rounded-full blur-[60px] pointer-events-none" />
                  <span className={`material-symbols-outlined text-4xl mb-6 flex-shrink-0 ${hasMultipleCompanies === true ? 'text-[#ccff00]' : 'text-white/20'}`}>domain</span>
                  <h3 className="font-black text-sm uppercase tracking-[0.2em]">Multi-Entity</h3>
                  <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mt-2">Complex organizational grid.</p>
                </button>
              </div>

              {hasMultipleCompanies && (
                <div className="space-y-4 animate-luxe">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 mb-4 px-2 tracking-tighter">Sub-Entity Allocation</p>
                  {companies.map((emp, idx) => (
                    <div key={emp.id} className="glass-card p-6 rounded-3xl flex items-center justify-between border border-white/5 hover:border-white/10 transition-all">
                      <div>
                        <p className="text-[11px] font-black uppercase tracking-widest">{emp.nombre}</p>
                        <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mt-1">{emp.rfc}</p>
                      </div>
                      <button onClick={() => setCompanies(c => c.filter(x => x.id !== emp.id))} className="text-white/20 hover:text-red-500 transition-colors">
                        <span className="material-symbols-outlined text-lg">delete</span>
                      </button>
                    </div>
                  ))}
                  <button 
                    onClick={() => {
                      const nombre = prompt("Entity Name:");
                      const rfcVal = prompt("Tax ID (RFC):");
                      if (nombre && rfcVal) {
                        setCompanies([...companies, { id: Math.random().toString(), nombre, rfc: rfcVal, regimen: "601", cp: "00000" }]);
                      }
                    }}
                    className="w-full h-14 rounded-2xl border border-dashed border-white/10 text-[10px] font-black uppercase tracking-[0.3em] text-white/20 hover:border-[#ccff00] hover:text-[#ccff00] transition-all flex items-center justify-center gap-4"
                  >
                    <span className="material-symbols-outlined text-lg">add</span>
                    Allocate Sub-Entity
                  </button>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="max-w-3xl">
              <h1 className="text-4xl font-black uppercase tracking-tighter mb-4">Pipeline Sync</h1>
              <p className="text-white/40 text-[12px] uppercase font-black tracking-widest leading-relaxed mb-12">
                Conect your commerce ports. Samantha will encrypt all credentials in the Secure Neural Vault.
              </p>

              <div className="space-y-6">
                <div className="glass-card bg-[#ccff00]/5 border border-[#ccff00]/20 rounded-[2rem] p-8 mb-10 flex items-start gap-6">
                  <div className="w-10 h-10 rounded-xl bg-[#ccff00]/10 flex items-center justify-center text-[#ccff00] flex-shrink-0 animate-pulse">
                     <span className="material-symbols-outlined text-xl">security</span>
                  </div>
                  <div>
                     <h3 className="text-[11px] font-black text-[#ccff00] uppercase tracking-[0.3em] mb-3">Security Indoctrination</h3>
                     <p className="text-[10px] font-black text-white/50 uppercase tracking-widest leading-relaxed italic">
                        All keys are hashed and stored in high-grade vault environments. No raw credentials remain in memory after synchronization.
                     </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                   <IntegrationInput 
                     name="mlApiKey" color="#FFE600" label="Mercado Libre Protocol" icon="shopping_bag"
                     value={mlApiKey} onChange={setMlApiKey}
                   />
                   <IntegrationInput 
                     name="amzApiKey" color="#FF9900" label="Amazon SP-API Gateway" icon="inventory_2"
                     value={amzApiKey} onChange={setAmzApiKey}
                   />
                   <IntegrationInput 
                     name="shpApiKey" color="#96BF48" label="Shopify Core Sync" icon="shopping_cart"
                     value={shpApiKey} onChange={setShpApiKey}
                   />
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="max-w-2xl">
              <h1 className="text-4xl font-black uppercase tracking-tighter mb-4">Fiscal Core</h1>
              <p className="text-white/40 text-[12px] uppercase font-black tracking-widest leading-relaxed mb-12">
                Identify the fiscal signature for CFDI 4.0 automation. Kinexis provisioned ERP active.
              </p>

              <div className="grid grid-cols-2 gap-8 mb-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] ml-1 leading-none">Tax ID (RFC)</label>
                  <input
                    type="text"
                    placeholder="ABC123456T1"
                    maxLength={13}
                    value={rfc}
                    onChange={(e) => setRfc(e.target.value.toUpperCase())}
                    className="w-full h-14 bg-white/5 border border-white/5 rounded-2xl px-6 text-sm font-black uppercase focus:border-[#ccff00]/40 transition-all outline-none italic placeholder:text-white/10"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] ml-1 leading-none">Postal Identity (CP)</label>
                  <input
                    type="text"
                    maxLength={5}
                    placeholder="00000"
                    value={cp}
                    onChange={(e) => setCp(e.target.value.replace(/\D/g, ''))}
                    className="w-full h-14 bg-white/5 border border-white/5 rounded-2xl px-6 text-sm font-black uppercase focus:border-[#ccff00]/40 transition-all outline-none italic placeholder:text-white/10"
                  />
                </div>
                <div className="col-span-2 space-y-3">
                  <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] ml-1 leading-none">Fiscal Regime Protocol</label>
                  <select
                    value={taxRegime} onChange={e => setTaxRegime(e.target.value)}
                    className="w-full h-14 bg-black border border-white/10 rounded-2xl px-6 text-sm font-black uppercase focus:border-[#ccff00]/40 transition-all outline-none appearance-none cursor-pointer italic"
                  >
                    <option value="" className="text-white/20">Select Regime...</option>
                    <option value="601">601 - Gral. Ley Personas Morales</option>
                    <option value="626">626 - RESICO (Simplified Trust)</option>
                    <option value="612">612 - Business Individual (PFAE)</option>
                  </select>
                </div>
              </div>

              {saveError && (
                <div className="mt-8 glass-card border-red-500/20 bg-red-500/5 p-6 rounded-2xl flex items-center gap-4 animate-luxe">
                  <span className="material-symbols-outlined text-red-500">error</span>
                  <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">{saveError}</span>
                </div>
              )}
            </div>
          )}

          {step === 5 && (
            <div className="max-w-3xl">
              <h1 className="text-4xl font-black uppercase tracking-tighter mb-4">Neural CRM (Meta)</h1>
              <p className="text-white/40 text-[12px] uppercase font-black tracking-widest leading-relaxed mb-12">
                Enable omnichannel intelligence via Meta. Secure WABA integration required.
              </p>

              <div className="space-y-6">
                <IntegrationInput 
                  name="metaToken" color="#0084FF" label="Meta Master Access Token" icon="forum"
                  value={metaAccessToken} onChange={setMetaAccessToken}
                />
                <div className="grid grid-cols-2 gap-6">
                  <IntegrationInput 
                    name="phoneId" color="#25D366" label="WA Node ID" icon="phone_iphone"
                    value={phoneId} onChange={setPhoneId}
                  />
                  <IntegrationInput 
                    name="wabaId" color="#25C5FF" label="WABA Business Identity" icon="domain"
                    value={wabaId} onChange={setWabaId}
                  />
                </div>
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="max-w-4xl">
              <h1 className="text-4xl font-black uppercase tracking-tighter mb-4">Autonomy Matrix</h1>
              <p className="text-white/40 text-[12px] uppercase font-black tracking-widest leading-relaxed mb-12">
                Define the freedom parameters for Neural Agents in each operational sector.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {(["ecommerce", "erp", "crm"] as const).map(mod => (
                  <div key={mod} className="glass-card border border-white/5 rounded-[2.5rem] p-10 flex flex-col items-center">
                    <h3 className="text-[11px] font-black text-white/30 uppercase tracking-[0.4em] mb-10 pb-4 border-b border-white/5 w-full text-center">
                       {mod} AGENTS
                    </h3>
                    <div className="space-y-4 w-full">
                      {AUTONOMY_OPTIONS.map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => setAutonomy(prev => ({ ...prev, [mod]: opt.value }))}
                          className={`
                            w-full p-6 rounded-3xl border transition-all duration-500 text-center relative group overflow-hidden
                            ${autonomy[mod] === opt.value
                                ? "bg-[#ccff00]/10 border-[#ccff00]/40 shadow-volt"
                                : "bg-white/5 border-white/5 hover:border-white/10"
                            }
                          `}
                        >
                          <p className={`text-[10px] font-black uppercase tracking-widest italic ${autonomy[mod] === opt.value ? 'text-[#ccff00]' : 'text-white/30'}`}>
                             {opt.label}
                          </p>
                          {autonomy[mod] === opt.value && <div className="absolute top-2 right-4 w-1 h-1 rounded-full bg-[#ccff00] shadow-volt" />}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 7 && (
            <div className="max-w-xl mx-auto text-center py-12 relative overflow-hidden">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-[#ccff00]/10 rounded-full blur-[80px] pointer-events-none" />
              <div className="w-24 h-24 mx-auto rounded-full bg-[#ccff00]/10 border border-[#ccff00]/20 flex items-center justify-center mb-10 shadow-volt animate-pulse relative z-10">
                <span className="material-symbols-outlined text-5xl text-[#ccff00]">rocket_launch</span>
              </div>
              <h1 className="text-4xl font-black uppercase tracking-tighter mb-6">Matrix Initialized</h1>
              <p className="text-white/40 text-[13px] uppercase font-black tracking-widest leading-relaxed mb-12 italic">
                {displayName}, your identity is hardcoded into the neural core. Operational security protocols active.<br/>Welcome to the future of commerce.
              </p>
              
              <div className="glass-card border border-[#ccff00]/20 bg-[#ccff00]/5 rounded-[2rem] p-8 flex gap-6 items-center max-w-sm mx-auto shadow-volt group">
                <span className="material-symbols-outlined text-4xl text-[#ccff00] group-hover:scale-110 transition-transform">smart_toy</span>
                <div className="text-left">
                  <p className="text-[#ccff00] text-[11px] font-black uppercase tracking-widest italic leading-relaxed">
                    "Core stabilized. I am awaiting operational commands. Proceed to Command Center."
                  </p>
                  <p className="text-[8px] text-white/20 uppercase tracking-[0.4em] mt-3 font-black">— SAMANTHA</p>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* ── Action Grid ───────────────────────────────────────────── */}
        <div className="flex items-center justify-between mt-20 pt-10 border-t border-white/5 relative z-10">
          <div>
            {step > 1 && step < 7 && (
              <button 
                onClick={() => setStep(s => s - 1 as OnboardingStep)}
                className="flex items-center gap-3 px-8 h-14 rounded-2xl text-white/30 hover:text-white transition-all text-[10px] font-black uppercase tracking-[0.2em]"
              >
                <span className="material-symbols-outlined text-lg">arrow_back</span>
                Re-Sync
              </button>
            )}
          </div>
          <div className="flex gap-6">
            {step < 6 && (
              <button 
                onClick={skipStep}
                className="px-8 h-14 rounded-2xl text-white/20 hover:text-white/50 transition-all text-[9px] font-black uppercase tracking-[0.3em]"
              >
                Omit Sector
              </button>
            )}

            {step < 7 ? (
              <button 
                onClick={nextStep}
                disabled={saving || (step === 1 && !displayName.trim())}
                className="h-14 px-12 bg-[#ccff00] text-black font-black rounded-2xl uppercase tracking-[0.3em] text-[11px] disabled:opacity-40 hover:scale-105 active:scale-95 transition-all shadow-volt flex items-center gap-4 group"
              >
                {saving ? "Transmitting..." : "Initialize Next"}
                {!saving && <span className="material-symbols-outlined text-xl group-hover:translate-x-2 transition-transform italic">bolt</span>}
              </button>
            ) : (
              <button 
                onClick={finishOnboarding}
                className="h-16 px-16 bg-[#ccff00] text-black font-black rounded-[2rem] uppercase tracking-[0.4em] text-[12px] hover:scale-105 active:scale-95 transition-all shadow-volt flex items-center gap-6 group"
              >
                Deploy Command Center
                <span className="material-symbols-outlined text-2xl group-hover:rotate-12 transition-transform">dashboard</span>
              </button>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}

// ── Componente helper: Input de API key ──────────────────────────
function IntegrationInput({ 
  name, label, color, icon, value, onChange
}: { 
  name: string; label: string; color: string; icon: string; value: string; onChange: (v: string) => void;
}) {
  return (
    <div className="glass-card border border-white/5 rounded-3xl p-6 flex gap-8 focus-within:border-[#ccff00]/30 transition-all group overflow-hidden relative">
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-[40px] pointer-events-none group-hover:bg-[#ccff00]/5 transition-all" />
      <div className="w-14 h-14 rounded-[1.25rem] flex items-center justify-center flex-shrink-0 bg-white/5 border border-white/5 group-hover:border-white/20 transition-all" style={{ color }}>
        <span className="material-symbols-outlined text-2xl">{icon}</span>
      </div>
      <div className="flex-1 space-y-3 relative z-10">
        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 block ml-1">{label}</label>
        <input 
          type="password"
          placeholder="SECURE_HASH_INPUT"
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full bg-transparent text-xl font-black uppercase tracking-widest focus:outline-none placeholder:text-white/5 italic"
          style={{ color: value ? '#ccff00' : undefined }}
        />
        <div className={`h-1 w-full rounded-full transition-all duration-500 ${value ? 'bg-[#ccff00] shadow-volt' : 'bg-white/5'}`} />
      </div>
    </div>
  );
}
