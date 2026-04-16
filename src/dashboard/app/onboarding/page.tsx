"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SamanthaGuide } from "@/components/Onboarding/SamanthaGuide";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    companyName: "",
    industry: "E-commerce",
  });
  const [mockPlan, setMockPlan] = useState("enterprise");
  const [syncStatus, setSyncStatus] = useState({
    shopify: "idle",
    meta: "idle",
    sat: "idle",
  });

  useEffect(() => {
    const saved = localStorage.getItem("kinexis_mock_plan") || "enterprise";
    setMockPlan(saved);
  }, []);

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  const performSync = (key: keyof typeof syncStatus) => {
    setSyncStatus(prev => ({ ...prev, [key]: "syncing" }));
    setTimeout(() => {
      setSyncStatus(prev => ({ ...prev, [key]: "done" }));
    }, 2000);
  };

  const finalize = () => {
    setStep(4);
    setTimeout(() => {
      router.push("/");
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-[#040f1b] flex items-center justify-center p-6 relative overflow-hidden selection:bg-primary selection:text-black">
      
      {/* Samantha Guide */}
      <SamanthaGuide step={step} />

      {/* Main Glass Card */}
      <div className="w-full max-w-3xl bg-white/[0.03] backdrop-blur-3xl p-16 rounded-[2.5rem] shadow-[0_50px_100px_rgba(0,0,0,0.5)] relative z-10 animate-in zoom-in-95 duration-1000 border-none">
         
         {/* Step Indicators */}
         <div className="mb-16 flex justify-between items-center">
            <div className="flex gap-3">
               {[1, 2, 3].map(s => (
                 <div key={s} className={`h-1 rounded-full transition-all duration-700 ${step === s ? 'w-16 bg-primary shadow-[0_0_15px_rgba(204,255,0,0.5)]' : step > s ? 'w-8 bg-primary/20' : 'w-8 bg-white/5'}`} />
               ))}
            </div>
            <span className="text-[11px] font-black text-on-surface/20 uppercase tracking-[0.2em]">Sequence 0{step}</span>
         </div>

         {/* STEP 1: IDENTIDAD */}
         {step === 1 && (
           <div className="space-y-12 animate-in slide-in-from-right-8 duration-700">
              <div className="space-y-4">
                 <h2 className="text-5xl font-black text-on-surface tight-tracking tracking-tighter">Identidad Operativa</h2>
                 <p className="text-[15px] font-medium text-on-surface/40 leading-relaxed">Defina el identificador maestro para su terminal de comando.</p>
              </div>

              <div className="space-y-10">
                 <div className="space-y-4">
                    <label className="text-[11px] font-black text-on-surface/20 tracking-[0.2em] uppercase ml-6">Entidad Corporativa</label>
                    <input 
                      type="text" 
                      placeholder="Nombre de su Empresa"
                      className="w-full bg-white/[0.04] rounded-3xl p-8 text-2xl font-black text-on-surface placeholder:text-on-surface/10 focus:bg-white/[0.07] outline-none transition-all border-none shadow-inner"
                      value={formData.companyName}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    />
                 </div>

                 <div className="space-y-4">
                    <label className="text-[11px] font-black text-on-surface/20 tracking-[0.2em] uppercase ml-6">Segmendo de Mercado</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                       {["Retail", "E-commerce", "Manufactura", "Logística", "B2B"].map(ind => (
                         <button 
                           key={ind}
                           onClick={() => setFormData({ ...formData, industry: ind })}
                           className={`p-5 rounded-3xl text-[12px] font-black uppercase tracking-wider transition-all duration-500 border-none ${formData.industry === ind ? 'bg-primary text-black shadow-[0_20px_40px_rgba(204,255,0,0.2)]' : 'bg-white/5 text-on-surface/30 hover:bg-white/10'}`}
                         >
                            {ind}
                         </button>
                       ))}
                    </div>
                 </div>
              </div>

              <button 
                onClick={nextStep}
                disabled={!formData.companyName}
                className="w-full py-7 bg-primary text-black rounded-full text-[13px] font-black uppercase tracking-[0.2em] shadow-[0_25px_50px_rgba(204,255,0,0.15)] hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-10 border-none mt-4"
              >
                 INICIAR APROVISIONAMIENTO
              </button>
           </div>
         )}

         {/* STEP 2: APROVISIONAMIENTO */}
         {step === 2 && (
           <div className="space-y-12 animate-in slide-in-from-right-8 duration-700">
              <div className="space-y-4">
                 <h2 className="text-5xl font-black text-on-surface tight-tracking tracking-tighter">Sistemas a la Carta</h2>
                 <p className="text-[15px] font-medium text-on-surface/40 leading-relaxed">Configurando nodos operativos para el plan <span className="text-primary font-black uppercase">{mockPlan}</span>.</p>
              </div>

              <div className="grid grid-cols-1 gap-5">
                 {[
                   { id: "ecommerce", name: "Escaparate Digital", icon: "shopping_bag", status: "Active", color: "text-blue-400" },
                   { id: "crm", name: "Relaciones Neurales", icon: "forum", status: mockPlan === 'starter' ? 'Gated' : 'Active', color: "text-amber-500" },
                   { id: "erp", name: "Logística Core", icon: "warehouse", status: mockPlan === 'enterprise' ? 'Active' : 'Gated', color: "text-emerald-500" },
                 ].map(mod => (
                   <div key={mod.id} className="bg-white/[0.03] p-7 rounded-[2rem] flex items-center justify-between border-none shadow-sm">
                      <div className="flex items-center gap-8">
                         <div className="w-16 h-16 rounded-3xl flex items-center justify-center bg-white/[0.04] shadow-inner">
                            <span className={`material-symbols-outlined !text-4xl ${mod.color}`}>{mod.icon}</span>
                         </div>
                         <div>
                            <p className="text-xl font-black text-on-surface tracking-tight">{mod.name}</p>
                            <p className="text-[11px] font-black text-on-surface/20 uppercase tracking-widest">{mod.status === 'Active' ? 'READY FOR SYNC' : 'UPGRADE REQUIRED'}</p>
                         </div>
                      </div>
                      {mod.status === 'Gated' ? (
                        <button className="px-8 py-3 bg-white/5 rounded-full text-[10px] font-black text-primary uppercase tracking-widest hover:bg-white/10 transition-all border-none">BUY NOW</button>
                      ) : (
                        <div className="flex items-center gap-3 px-5 py-2 bg-primary/5 rounded-full">
                           <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                           <span className="text-[10px] font-black text-primary uppercase tracking-widest">ENABLED</span>
                        </div>
                      )}
                   </div>
                 ))}
              </div>

              <div className="flex gap-6 pt-4">
                 <button onClick={prevStep} className="flex-1 py-7 bg-white/5 rounded-full text-[12px] font-black uppercase tracking-widest text-on-surface/30 hover:bg-white/10 transition-all border-none">VOLVER</button>
                 <button onClick={nextStep} className="flex-[2] py-7 bg-primary text-black rounded-full text-[13px] font-black uppercase tracking-widest shadow-[0_25px_50px_rgba(204,255,0,0.1)] border-none">APLICAR CONFIGURACIÓN</button>
              </div>
           </div>
         )}

         {/* STEP 3: SINCRONIZACIÓN */}
         {step === 3 && (
           <div className="space-y-12 animate-in slide-in-from-right-8 duration-700">
              <div className="space-y-4">
                 <h2 className="text-5xl font-black text-on-surface tight-tracking tracking-tighter">Handshake Externo</h2>
                 <p className="text-[15px] font-medium text-on-surface/40 leading-relaxed">Sincronice sus ecosistemas para iniciar la telemetría.</p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                 {[
                   { id: "shopify", name: "Shopify / M. Libre", icon: "hub", color: "text-blue-400" },
                   { id: "meta", name: "WhatsApp Business", icon: "chat", color: "text-[#25D366]" },
                   { id: "sat", name: "SAT / Fiscal Concierge", icon: "shield", color: "text-amber-500" },
                 ].map(end => (
                   <button 
                     key={end.id}
                     onClick={() => performSync(end.id as any)}
                     disabled={syncStatus[end.id as keyof typeof syncStatus] !== 'idle'}
                     className="bg-white/[0.03] p-6 rounded-3xl flex items-center justify-between group hover:bg-white/[0.06] transition-all border-none shadow-sm"
                   >
                       <div className="flex items-center gap-8">
                          <span className={`material-symbols-outlined !text-3xl ${end.color}`}>{end.icon}</span>
                          <p className="text-[15px] font-black text-on-surface uppercase tracking-wider">{end.name}</p>
                       </div>
                       <div>
                          {syncStatus[end.id as keyof typeof syncStatus] === 'idle' ? (
                            <span className="text-[11px] font-black text-on-surface/20 group-hover:text-primary transition-colors tracking-widest">CONECTAR</span>
                          ) : syncStatus[end.id as keyof typeof syncStatus] === 'syncing' ? (
                            <span className="material-symbols-outlined !text-[24px] text-primary animate-spin">sync</span>
                          ) : (
                            <span className="material-symbols-outlined !text-[24px] text-primary shadow-[0_0_15px_rgba(204,255,0,0.5)]">check_circle</span>
                          )}
                       </div>
                   </button>
                 ))}
              </div>

              <div className="pt-10">
                <button 
                  onClick={finalize}
                  className="w-full py-9 bg-on-surface text-[#040f1b] rounded-full text-sm font-black uppercase tracking-[0.3em] shadow-[0_40px_80px_rgba(0,0,0,0.4)] hover:bg-primary transition-all hover:scale-[1.01] border-none"
                >
                   ESTABLECER CONEXIÓN TOTAL
                </button>
              </div>
           </div>
         )}

         {/* STEP 4: FINALIZING */}
         {step === 4 && (
           <div className="py-24 text-center space-y-12 animate-in zoom-in-50 duration-1000">
              <div className="relative inline-block">
                 <div className="w-32 h-32 rounded-full border-[6px] border-primary/10 border-t-primary animate-spin" />
                 <div className="absolute inset-0 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary !text-5xl drop-shadow-[0_0_15px_rgba(204,255,0,0.5)]">bolt</span>
                 </div>
              </div>
              <div className="space-y-5">
                 <h2 className="text-4xl font-black text-on-surface uppercase tracking-[0.4em] opacity-90">Sistemas Online</h2>
                 <p className="text-[12px] font-black text-primary animate-pulse uppercase tracking-[0.3em]">Cargando Arquitectura V2...</p>
              </div>
           </div>
         )}

      </div>

      {/* Ambinet Luxe Glows */}
      <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-primary/5 blur-[160px] -z-10 rounded-full" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[800px] h-[800px] bg-blue-500/5 blur-[160px] -z-10 rounded-full" />
    </div>
  );
}
