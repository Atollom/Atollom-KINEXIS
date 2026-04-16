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
    <div className="min-h-screen bg-black neural-gradient flex items-center justify-center p-6 relative overflow-hidden">
      
      {/* Samantha Guide */}
      <SamanthaGuide step={step} />

      {/* Wizard Card */}
      <div className="w-full max-w-2xl glass-card p-12 rounded-[3.5rem] border border-white/5 shadow-2xl relative z-10 animate-in zoom-in-95 duration-700">
         
         <div className="mb-12 flex justify-between items-center">
            <div className="flex gap-2">
               {[1, 2, 3].map(s => (
                 <div key={s} className={`h-1.5 rounded-full transition-all duration-500 ${step === s ? 'w-12 bg-primary' : step > s ? 'w-6 bg-primary/40' : 'w-6 bg-white/5'}`} />
               ))}
            </div>
            <span className="text-[10px] font-black text-on-surface/20 uppercase label-tracking">Step {step} of 3</span>
         </div>

         {/* STEP 1: IDENTIDAD */}
         {step === 1 && (
           <div className="space-y-10 animate-in slide-in-from-right-8 duration-500">
              <div className="space-y-4">
                 <h2 className="text-4xl font-black text-on-surface tight-tracking">Empresa & Identidad</h2>
                 <p className="text-sm font-medium text-on-surface-variant opacity-60">Establezcamos las bases de su consola de comando.</p>
              </div>

              <div className="space-y-8">
                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-on-surface/30 label-tracking uppercase ml-4">Nombre de la Empresa</label>
                    <input 
                      type="text" 
                      placeholder="Ej. Cyberdyne Systems"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 text-lg font-black focus:border-primary/50 outline-none transition-all"
                      value={formData.companyName}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    />
                 </div>

                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-on-surface/30 label-tracking uppercase ml-4">Industria Predominante</label>
                    <div className="grid grid-cols-2 gap-4">
                       {["Retail", "E-commerce", "Manufactura", "Logística", "Servicios"].map(ind => (
                         <button 
                           key={ind}
                           onClick={() => setFormData({ ...formData, industry: ind })}
                           className={`p-4 rounded-xl text-[11px] font-black uppercase label-tracking border transition-all ${formData.industry === ind ? 'bg-primary text-black border-primary' : 'bg-white/5 border-white/5 text-on-surface/40 hover:border-white/20'}`}
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
                className="w-full py-6 neon-disruptor rounded-2xl text-[12px] font-black uppercase label-tracking shadow-glow hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-20"
              >
                 CONTINUAR CONFIGURACIÓN
              </button>
           </div>
         )}

         {/* STEP 2: APROVISIONAMIENTO */}
         {step === 2 && (
           <div className="space-y-10 animate-in slide-in-from-right-8 duration-500">
              <div className="space-y-4">
                 <h2 className="text-4xl font-black text-on-surface tight-tracking">Módulos A la Carta</h2>
                 <p className="text-sm font-medium text-on-surface-variant opacity-60">Aprovisionando sistemas basados en su plan <span className="text-primary font-black uppercase">{mockPlan}</span>.</p>
              </div>

              <div className="grid grid-cols-1 gap-6">
                 {[
                   { id: "ecommerce", name: "Ecommerce Pack", icon: "shopping_bag", status: "Available", color: "text-blue-400" },
                   { id: "crm", name: "CRM Neural", icon: "forum", status: mockPlan === 'starter' ? 'Locked' : 'Available', color: "text-amber-500" },
                   { id: "erp", name: "ERP Logistics", icon: "warehouse", status: mockPlan === 'enterprise' ? 'Available' : 'Locked', color: "text-emerald-500" },
                 ].map(mod => (
                   <div key={mod.id} className="glass-card p-6 rounded-3xl border border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-6">
                         <div className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-white/5 border border-white/10`}>
                            <span className={`material-symbols-outlined !text-3xl ${mod.color}`}>{mod.icon}</span>
                         </div>
                         <div>
                            <p className="text-lg font-black text-on-surface">{mod.name}</p>
                            <p className="text-[10px] font-black text-on-surface/30 uppercase">{mod.status}</p>
                         </div>
                      </div>
                      {mod.status === 'Locked' ? (
                        <button className="px-6 py-2 border border-primary/20 rounded-xl text-[9px] font-black text-primary uppercase label-tracking hover:bg-primary/10 transition-all">UPGRADE</button>
                      ) : (
                        <div className="flex items-center gap-2">
                           <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                           <span className="text-[10px] font-black text-primary uppercase">Provisioning...</span>
                        </div>
                      )}
                   </div>
                 ))}
              </div>

              <div className="flex gap-4">
                 <button onClick={prevStep} className="flex-1 py-6 glass-card rounded-2xl text-[12px] font-black uppercase text-on-surface/40 hover:text-white transition-all">VOLVER</button>
                 <button onClick={nextStep} className="flex-[2] py-6 neon-disruptor rounded-2xl text-[12px] font-black uppercase label-tracking shadow-glow">CONFIRMAR MÓDULOS</button>
              </div>
           </div>
         )}

         {/* STEP 3: SINCRONIZACIÓN */}
         {step === 3 && (
           <div className="space-y-10 animate-in slide-in-from-right-8 duration-500">
              <div className="space-y-4">
                 <h2 className="text-4xl font-black text-on-surface tight-tracking">Nodos de Sincronización</h2>
                 <p className="text-sm font-medium text-on-surface-variant opacity-60">Conecte sus activos externos al núcleo Kinexis.</p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                 {[
                   { id: "shopify", name: "Shopify / ML", icon: "hub", color: "text-blue-400" },
                   { id: "meta", name: "WhatsApp / Meta", icon: "chat", color: "text-[#25D366]" },
                   { id: "sat", name: "Fiscal SAT (e.firma)", icon: "shield", color: "text-amber-500" },
                 ].map(end => (
                   <button 
                     key={end.id}
                     onClick={() => performSync(end.id as any)}
                     disabled={syncStatus[end.id as keyof typeof syncStatus] !== 'idle'}
                     className="glass-card p-5 rounded-2xl border border-white/5 flex items-center justify-between group hover:border-primary/20 transition-all"
                   >
                       <div className="flex items-center gap-6">
                          <span className={`material-symbols-outlined !text-2xl ${end.color}`}>{end.icon}</span>
                          <p className="text-sm font-black text-on-surface uppercase label-tracking">{end.name}</p>
                       </div>
                       <div>
                          {syncStatus[end.id as keyof typeof syncStatus] === 'idle' ? (
                            <span className="text-[10px] font-black text-on-surface/20 group-hover:text-primary transition-colors">CONECTAR</span>
                          ) : syncStatus[end.id as keyof typeof syncStatus] === 'syncing' ? (
                            <span className="material-symbols-outlined !text-[20px] text-primary animate-spin">sync</span>
                          ) : (
                            <span className="material-symbols-outlined !text-[20px] text-primary">check_circle</span>
                          )}
                       </div>
                   </button>
                 ))}
              </div>

              <div className="pt-6">
                <button 
                  onClick={finalize}
                  className="w-full py-8 bg-white text-black rounded-3xl text-sm font-black uppercase label-tracking hover:bg-primary transition-all shadow-glow hover:scale-[1.01]"
                >
                   INICIAR SISTEMAS KINEXIS
                </button>
              </div>
           </div>
         )}

         {/* STEP 4: FINALIZING */}
         {step === 4 && (
           <div className="py-20 text-center space-y-8 animate-in zoom-in-50 duration-1000">
              <div className="relative inline-block">
                 <div className="w-24 h-24 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                 <div className="absolute inset-0 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary !text-4xl">bolt</span>
                 </div>
              </div>
              <div className="space-y-4">
                 <h2 className="text-3xl font-black text-on-surface uppercase tracking-widest">Estabilizando Red...</h2>
                 <p className="text-sm font-bold text-primary animate-pulse uppercase label-tracking">Telemetría al 100%</p>
              </div>
           </div>
         )}

      </div>

      {/* Decorative Gradients */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] -z-10 rounded-full" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/5 blur-[120px] -z-10 rounded-full" />
    </div>
  );
}
