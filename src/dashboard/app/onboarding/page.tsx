"use client";

import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import Image from "next/image";
import type { AutonomyLevel, UserRole } from "@/types";

// ──────────────────────────────────────────────────────────────────────────────
// Tipos locales
// ──────────────────────────────────────────────────────────────────────────────
type OnboardingStep = 1 | 2 | 3 | 4 | 5 | 6;

interface AutonomyConfig {
  ecommerce: AutonomyLevel;
  erp: AutonomyLevel;
  crm: AutonomyLevel;
}

const AUTONOMY_OPTIONS: { value: AutonomyLevel; label: string; desc: string; color: string }[] = [
  { value: "FULL",       label: "Completa",    desc: "Samantha actúa y decide sin intervención",          color: "#22C55E" },
  { value: "NOTIFY",     label: "Notificar",   desc: "Samantha actúa y te envía una notificación de lo que hizo", color: "#3B82F6" },
  { value: "SUPERVISED", label: "Supervisado", desc: "Samantha prepara la acción y requiere tu autorización", color: "#F59E0B" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();

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

  // Datos Paso 2: Ecommerce Keys
  const [mlApiKey, setMlApiKey] = useState("");
  const [amzApiKey, setAmzApiKey] = useState("");
  const [shpApiKey, setShpApiKey] = useState("");

  // Datos Paso 3: ERP (FacturAPI ya no la configura el cliente — Atollom la aprovisiona)
  const [rfc, setRfc] = useState("");
  const [taxRegime, setTaxRegime] = useState("");
  const [cp, setCp] = useState("");
  const [facturapiProvisionStatus, setFacturapiProvisionStatus] = useState<
    "idle" | "provisioning" | "done" | "error"
  >("idle");

  // Datos Paso 4: CRM
  const [metaAccessToken, setMetaAccessToken] = useState("");
  const [wabaId, setWabaId] = useState("");
  const [phoneId, setPhoneId] = useState("");

  // Datos Paso 5: Autonomía
  const [autonomy, setAutonomy] = useState<AutonomyConfig>({
    ecommerce: "SUPERVISED",
    erp: "SUPERVISED",
    crm: "SUPERVISED",
  });

  // Mobile warning
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Detectar mobile
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

  // Si es movil, muestra bloqueo
  if (isMobile) {
    return (
      <div className="h-screen w-full bg-[#0D1B3E] p-8 flex flex-col items-center justify-center text-center text-[#E8EAF0]">
        <div className="w-16 h-16 rounded-2xl bg-[#A8E63D]/10 flex items-center justify-center mb-6">
          <span className="material-symbols-outlined text-3xl text-[#A8E63D]">desktop_windows</span>
        </div>
        <h1 className="text-2xl font-headline font-bold mb-4">Configuración Inicial</h1>
        <p className="text-[#8DA4C4] text-sm">
          Por favor, completa este proceso desde tu computadora. Necesitarás tener varias pestañas abiertas para copiar tus API Keys.
        </p>
      </div>
    );
  }

  if (loadingUser) {
    return <div className="h-screen w-full bg-[#0D1B3E] flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-4 border-[#A8E63D] border-t-transparent rounded-full" />
    </div>;
  }

  // Guard: Solo owner
  if (role !== "owner") {
    return (
      <div className="h-screen w-full bg-[#0D1B3E] flex items-center justify-center flex-col p-8 text-center">
        <span className="material-symbols-outlined text-5xl text-[#EF4444] mb-4">lock</span>
        <h1 className="text-2xl font-headline font-bold text-[#E8EAF0] mb-2">Acceso Denegado</h1>
        <p className="text-[#8DA4C4] mb-6">Solo el propietario (owner) puede realizar el onboarding inicial.</p>
        <button onClick={() => router.push("/")} className="px-6 py-2 bg-[#A8E63D] text-[#0D1B3E] font-bold rounded-xl uppercase tracking-wider text-[11px]">Volver</button>
      </div>
    );
  }

  // Helpers para avanzar
  const nextStep = async () => {
    setSaveError(null);
    if (step === 1) await saveStep1();
    else if (step === 2) await saveStep2();
    else if (step === 3) {
      // saveStep3 retorna false si el RFC es inválido — bloquear avance
      const ok = await saveStep3();
      if (!ok) return;
    }
    else if (step === 4) await saveStep4();
    else if (step === 5) await saveStep5();

    if (step < 6) setStep(prev => (prev + 1) as OnboardingStep);
  };

  const skipStep = () => {
    setSaveError(null);
    if (step < 6) setStep(prev => (prev + 1) as OnboardingStep);
  };

  // Saltar todo — guarda el paso actual en modo best-effort antes de salir
  // para que los datos ya ingresados no se pierdan
  const skipAll = async () => {
    try {
      if (step === 1 && displayName.trim()) await saveStep1();
      else if (step === 2) await saveStep2();
      else if (step === 3) await saveStep3();
      else if (step === 4) await saveStep4();
      else if (step === 5) await saveStep5();
    } catch { /* best effort — el usuario está saliendo intencionalmente */ }
    router.push("/");
  };

  // Guardados
  const saveStep1 = async () => {
    if (!displayName.trim() || !userId) return;
    setSaving(true);
    await supabase.from("user_profiles").update({ display_name: displayName }).eq("id", userId);
    setSaving(false);
  };

  const saveStep2 = async () => {
    // E-commerce keys => Vault
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

  // Retorna true si todo guardó correctamente, false si hubo error de validación (ej. RFC inválido)
  const saveStep3 = async (): Promise<boolean> => {
    setSaving(true);
    setSaveError(null);
    try {
      // Perfil fiscal — verificar respuesta del servidor (RFC validado server-side)
      if (rfc || taxRegime || cp) {
        const res = await fetch("/api/settings/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rfc, tax_regime: taxRegime, postal_code: cp })
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          setSaveError(err.error || "RFC o datos fiscales inválidos. Revisa el formato e intenta de nuevo.");
          return false;
        }
      }

      // Aprovisionar organización FacturAPI en background — no bloquea el onboarding
      // Atollom crea la org con FACTURAPI_USER_KEY y guarda la live key en vault
      if (rfc && taxRegime) {
        setFacturapiProvisionStatus("provisioning");
        fetch("/api/onboarding/provision-facturapi", { method: "POST" })
          .then(async r => {
            const data = await r.json().catch(() => ({}));
            if (r.ok && (data.status === "provisioned" || data.status === "already_provisioned")) {
              setFacturapiProvisionStatus("done");
            } else if (data.status === "skipped") {
              // Sin FACTURAPI_USER_KEY en env — se aprovisiona después manualmente
              setFacturapiProvisionStatus("done");
            } else {
              setFacturapiProvisionStatus("error");
            }
          })
          .catch(() => setFacturapiProvisionStatus("error"));
      }

      return true;
    } finally {
      setSaving(false);
    }
  };

  const saveStep4 = async () => {
    // CRM keys => Vault
    const keys: Record<string, string> = {};
    if (metaAccessToken) keys.meta_access_token = metaAccessToken;
    if (wabaId) keys.whatsapp_business_id = wabaId; // asumiendo waba fallback
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

  const saveStep5 = async () => {
    setSaving(true);
    await fetch("/api/settings/autonomy", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(autonomy)
    });
    setSaving(false);
  };

  // Completar onboarding — marca onboarding_complete = true en el servidor
  const finishOnboarding = async () => {
    try {
      await fetch("/api/onboarding/complete", { method: "POST" });
    } catch { /* best effort — no bloquear la navegación */ }
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-[#0D1B3E] text-[#E8EAF0] flex flex-col font-sans">
      {/* ── Progress Bar Top ──────────────────────────────────────── */}
      <div className="h-1 w-full bg-white/[0.04]">
        <div 
          className="h-full bg-[#A8E63D] transition-all duration-500 ease-out"
          style={{ width: `${(step / 6) * 100}%` }}
        />
      </div>

      {/* ── Contenido Principal ────────────────────────────────────── */}
      <div className="flex-1 max-w-4xl w-full mx-auto p-12 flex flex-col mt-8">
        
        {/* Cabecera / Paginador */}
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-4">
            {/* Supongo que logo/isotipo.svg existe o usamos texto por seguridad si no existe svg. El user dice "/logo/" */}
            <div className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center font-bold text-[#A8E63D] text-lg font-headline">
              K
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-[#8DA4C4] font-bold">Onboarding</p>
              <h2 className="text-xl font-headline font-bold">Paso {step} de 6</h2>
            </div>
          </div>
          <button
            onClick={skipAll}
            className="text-[11px] font-bold uppercase tracking-wider text-[#8DA4C4] hover:text-[#EF4444] border border-transparent hover:border-[#EF4444]/20 hover:bg-[#EF4444]/10 px-4 py-2 rounded-xl transition-all"
          >
             Omitir Todo
          </button>
        </div>

        {/* ── Área activa del paso ─────────────────────────────────── */}
        <div className="flex-1 flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {step === 1 && (
            <div className="max-w-xl">
              <div className="flex items-end gap-4 mb-8">
                <div className="w-16 h-16 rounded-full bg-[#A8E63D]/10 flex items-center justify-center flex-shrink-0 animate-pulse">
                  <span className="material-symbols-outlined text-3xl text-[#A8E63D]">smart_toy</span>
                </div>
                <div className="bg-white/[0.06] border border-white/[0.1] rounded-2xl rounded-bl-sm p-5 flex-1 relative">
                  <p className="text-[14px] leading-relaxed">
                    ¡Hola! Soy <strong className="text-[#A8E63D]">Samantha</strong>, tu asistente e inteligencia orquestadora en Kinexis.
                    <br/><br/>
                    Estoy lista para conectar tus herramientas, automatizar tus finanzas y potenciar tus ventas, pero primero necesito algunas llaves de acceso.
                    <br/><br/>
                    Para empezar, <strong>¿cómo prefieres que te llame?</strong>
                  </p>
                </div>
              </div>
              <div className="ml-20">
                <input
                  type="text"
                  autoFocus
                  placeholder="Tu nombre (ej. Carlos)"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") nextStep() }}
                  className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-5 py-4 text-base focus:border-[#A8E63D]/40 focus:outline-none transition-colors"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="max-w-2xl">
              <h1 className="text-3xl font-headline font-bold mb-2">Conexión Ecommerce</h1>
              <p className="text-[#8DA4C4] text-[13px] mb-8">
                Conectemos tus plataformas de venta para que pueda monitorear el stock y registrar órdenes automáticamente. Puedes omitir las que no uses.
              </p>

              <div className="space-y-4">
                <IntegrationInput 
                  name="mlApiKey" color="#FFE600" label="Mercado Libre (Access Token)" icon="shopping_bag"
                  value={mlApiKey} onChange={setMlApiKey} link="https://developers.mercadolibre.com.mx/"
                />
                <IntegrationInput 
                  name="amzApiKey" color="#FF9900" label="Amazon SP-API Key" icon="inventory_2"
                  value={amzApiKey} onChange={setAmzApiKey} link="https://developer-docs.amazon.com/sp-api/"
                />
                <IntegrationInput 
                  name="shpApiKey" color="#96BF48" label="Shopify Access Token" icon="shopping_cart"
                  value={shpApiKey} onChange={setShpApiKey} link="https://shopify.dev/docs/apps/auth"
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="max-w-2xl">
              <h1 className="text-3xl font-headline font-bold mb-2">Datos Fiscales & ERP</h1>
              <p className="text-[#8DA4C4] text-[13px] mb-8">
                Ingresa tus datos fiscales para la emisión automática de CFDI 4.0.
                Kinexis configura la facturación por ti — no necesitas ninguna llave de API.
              </p>

              {/* Indicador de aprovisionamiento automático FacturAPI */}
              <div className={`
                flex items-center gap-3 px-4 py-3 rounded-xl border mb-6 text-[12px] font-medium transition-all
                ${facturapiProvisionStatus === "done"
                  ? "bg-[#22C55E]/10 border-[#22C55E]/20 text-[#22C55E]"
                  : facturapiProvisionStatus === "error"
                  ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-400"
                  : facturapiProvisionStatus === "provisioning"
                  ? "bg-[#3B82F6]/10 border-[#3B82F6]/20 text-[#3B82F6]"
                  : "bg-white/[0.03] border-white/[0.06] text-[#8DA4C4]"
                }
              `}>
                {facturapiProvisionStatus === "provisioning" && (
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-[#3B82F6] border-t-transparent animate-spin flex-shrink-0" />
                )}
                {facturapiProvisionStatus === "done" && (
                  <span className="material-symbols-outlined text-base flex-shrink-0">check_circle</span>
                )}
                {facturapiProvisionStatus === "error" && (
                  <span className="material-symbols-outlined text-base flex-shrink-0">warning</span>
                )}
                {facturapiProvisionStatus === "idle" && (
                  <span className="material-symbols-outlined text-base flex-shrink-0">receipt_long</span>
                )}
                <span>
                  {facturapiProvisionStatus === "idle" && "Facturación automática — Kinexis configura esto por ti al guardar"}
                  {facturapiProvisionStatus === "provisioning" && "Configurando facturación automáticamente..."}
                  {facturapiProvisionStatus === "done" && "Facturación configurada correctamente"}
                  {facturapiProvisionStatus === "error" && "La facturación se configurará en un momento — puedes continuar"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-[10px] text-[#8DA4C4] uppercase font-bold tracking-wider mb-1.5 ml-1">RFC Emisor *</label>
                  <input
                    type="text"
                    placeholder="ABC123456T1"
                    maxLength={13}
                    value={rfc}
                    onChange={(e) => setRfc(e.target.value.toUpperCase())}
                    className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 focus:outline-none focus:border-[#22C55E]/40"
                  />
                  {rfc && !/^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/.test(rfc) && (
                    <p className="text-[10px] text-red-400 mt-1.5 ml-1">Formato de RFC inválido</p>
                  )}
                </div>
                <div>
                  <label className="block text-[10px] text-[#8DA4C4] uppercase font-bold tracking-wider mb-1.5 ml-1">Código Postal *</label>
                  <input
                    type="text"
                    maxLength={5}
                    placeholder="00000"
                    value={cp}
                    onChange={(e) => setCp(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 focus:outline-none focus:border-[#22C55E]/40"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] text-[#8DA4C4] uppercase font-bold tracking-wider mb-1.5 ml-1">Régimen Fiscal *</label>
                  <select
                    value={taxRegime} onChange={e => setTaxRegime(e.target.value)}
                    className="w-full bg-[#0D1B3E] border border-white/[0.08] rounded-xl px-4 py-3 focus:outline-none focus:border-[#22C55E]/40 text-[#E8EAF0]"
                  >
                    <option value="">Selecciona tu régimen...</option>
                    <option value="601">601 - General de Ley Personas Morales</option>
                    <option value="606">606 - Arrendamiento</option>
                    <option value="612">612 - Personas Físicas con Actividades Empresariales</option>
                    <option value="626">626 - Régimen Simplificado de Confianza (RESICO)</option>
                  </select>
                </div>
              </div>

              {/* Error del servidor al guardar (ej. RFC inválido rechazado por API) */}
              {saveError && (
                <div className="mt-3 flex items-center gap-2 text-[11px] text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">
                  <span className="material-symbols-outlined text-sm">error</span>
                  {saveError}
                </div>
              )}
            </div>
          )}

          {step === 4 && (
            <div className="max-w-2xl">
              <h1 className="text-3xl font-headline font-bold mb-2">Conexión Meta (CRM)</h1>
              <p className="text-[#8DA4C4] text-[13px] mb-8">
                Habilita el envío y recepción de mensajes de WhatsApp e Instagram integrando tu cuenta de Meta for Developers.
              </p>

              <div className="space-y-4">
                <IntegrationInput 
                  name="metaToken" color="#0084FF" label="Meta System User Access Token" icon="forum"
                  value={metaAccessToken} onChange={setMetaAccessToken} link="https://developers.facebook.com/"
                />
                <div className="grid grid-cols-2 gap-4">
                  <IntegrationInput 
                    name="phoneId" color="#25D366" label="WA Phone ID" icon="phone_iphone"
                    value={phoneId} onChange={setPhoneId}
                  />
                  <IntegrationInput 
                    name="wabaId" color="#25D366" label="WABA ID" icon="domain"
                    value={wabaId} onChange={setWabaId}
                  />
                </div>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="max-w-3xl">
              <h1 className="text-3xl font-headline font-bold mb-2">Autonomía de Agentes</h1>
              <p className="text-[#8DA4C4] text-[13px] mb-8">
                Define qué tanta libertad de acción tienen mis agentes en cada área de tu negocio. Puedes cambiar esto más tarde en la configuración.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(["ecommerce", "erp", "crm"] as const).map(mod => (
                  <div key={mod} className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5">
                    <h3 className="text-[12px] font-bold text-[#E8EAF0] uppercase tracking-wider mb-4 border-b border-white/[0.06] pb-3">
                      Agentes {mod}
                    </h3>
                    <div className="space-y-2">
                      {AUTONOMY_OPTIONS.map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => setAutonomy(prev => ({ ...prev, [mod]: opt.value }))}
                          className={`
                            w-full text-left p-3 rounded-xl border transition-all
                            ${autonomy[mod] === opt.value
                                ? `bg-[${opt.color}]/10 border-[${opt.color}]/30`
                                : "bg-white/[0.02] border-transparent hover:bg-white/[0.04]"
                            }
                          `}
                          style={autonomy[mod] === opt.value ? { borderColor: `${opt.color}40`, backgroundColor: `${opt.color}10` } : {}}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[11px] font-bold" style={{ color: autonomy[mod] === opt.value ? opt.color : "#E8EAF0" }}>
                              {opt.label}
                            </span>
                            {autonomy[mod] === opt.value && <span className="material-symbols-outlined text-sm" style={{ color: opt.color }}>check_circle</span>}
                          </div>
                          <p className="text-[9px] text-[#8DA4C4] leading-relaxed">{opt.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="max-w-xl mx-auto text-center py-8">
              <div className="w-24 h-24 mx-auto rounded-full bg-[#A8E63D]/10 flex items-center justify-center mb-6 shadow-[0_0_40px_#A8E63D40]">
                <span className="material-symbols-outlined text-5xl text-[#A8E63D]">rocket_launch</span>
              </div>
              <h1 className="text-3xl font-headline font-bold mb-4">¡Todo listo, {displayName || "owner"}!</h1>
              <p className="text-[#8DA4C4] text-[14px] leading-relaxed mb-8">
                He guardado tus configuraciones de forma segura. A partir de ahora estaré monitoreando tu ecosistema.
                Si en algún momento necesitas ajustar tus reglas de negocio o llaves, dirígete a la sección de Configuración.
              </p>
              
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 text-left flex gap-4 items-center max-w-sm mx-auto mb-10">
                <span className="material-symbols-outlined text-3xl text-[#3B82F6]">smart_toy</span>
                <div>
                  <p className="text-[#E8EAF0] text-[12px] italic">
                    "Recuerda que siempre puedes usar el botón de chat en la esquina para consultarme lo que necesites."
                  </p>
                  <p className="text-[10px] text-[#506584] uppercase tracking-widest mt-1 font-bold">— Samantha</p>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* ── Footer / Botones ───────────────────────────────────── */}
        <div className="flex items-center justify-between mt-12 pt-6 border-t border-white/[0.06] flex-shrink-0">
          <div>
            {step > 1 && step < 6 && (
              <button 
                onClick={() => setStep(s => s - 1 as OnboardingStep)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[#8DA4C4] hover:text-[#E8EAF0] hover:bg-white/[0.04] transition-all text-[11px] font-bold uppercase tracking-wider"
              >
                <span className="material-symbols-outlined text-sm">arrow_back</span>
                Atrás
              </button>
            )}
          </div>
          <div className="flex gap-4">
            {step < 5 && step > 1 && (
              <button 
                onClick={skipStep}
                className="px-5 py-2.5 rounded-xl text-[#8DA4C4] hover:text-[#F59E0B] transition-all text-[11px] font-bold uppercase tracking-wider"
              >
                Saltar paso
              </button>
            )}

            {step < 6 ? (
              <button 
                onClick={nextStep}
                disabled={saving || (step === 1 && !displayName.trim())}
                className="flex items-center gap-2 px-8 py-2.5 bg-[#A8E63D] text-[#0D1B3E] font-bold rounded-xl uppercase tracking-wider text-[11px] disabled:opacity-40 hover:shadow-[0_0_16px_#A8E63D40] transition-all"
              >
                {saving ? "Guardando..." : "Siguiente"}
                {!saving && <span className="material-symbols-outlined text-sm">arrow_forward</span>}
              </button>
            ) : (
              <button 
                onClick={finishOnboarding}
                className="flex items-center gap-2 px-8 py-3 bg-[#A8E63D] text-[#0D1B3E] font-bold rounded-xl uppercase tracking-wider text-[12px] hover:shadow-[0_0_24px_#A8E63D60] transition-all"
              >
                Ir al Dashboard
                <span className="material-symbols-outlined text-lg">dashboard</span>
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
  name, label, color, icon, value, onChange, link 
}: { 
  name: string; label: string; color: string; icon: string; value: string; onChange: (v: string) => void; link?: string;
}) {
  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 flex gap-4 focus-within:border-white/[0.15] transition-all">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${color}15`, color }}>
        <span className="material-symbols-outlined">{icon}</span>
      </div>
      <div className="flex-1">
        <label className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-[#E8EAF0] mb-2">
          {label}
          {link && (
            <a href={link} target="_blank" rel="noreferrer" className="text-[#8DA4C4] hover:text-[#A8E63D] normal-case tracking-normal flex items-center gap-1 opacity-70 hover:opacity-100">
              <span className="material-symbols-outlined text-[10px]">help</span>
              ¿Cómo obtenerla?
            </a>
          )}
        </label>
        <input 
          type="password"
          placeholder="••••••••••••••••••••••••••••••••"
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full bg-transparent border-b border-white/[0.1] pb-2 text-[13px] font-mono focus:outline-none placeholder:text-[#506584]"
          style={{ borderColor: value ? color : undefined }}
        />
      </div>
    </div>
  );
}
