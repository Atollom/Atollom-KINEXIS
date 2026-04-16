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
    <div className="min-h-screen bg-[#040f1b] flex items-center justify-center p-8 relative overflow-hidden">
      
      {/* Samantha Guide: Floating Bubble */}
      <SamanthaGuide step={step} />

      {/* Main Luxe Card: Organic 3.5rem Radius */}
      <div className="luxe-card w-full max-w-4xl p-20 animate-in zoom-in-95 duration-1000 relative z-10">
         
         {/* Sequence Indicator: Pill Style */}
         <div className="mb-20 flex justify-between items-center">
            <div className="flex gap-4">
               {[1, 2, 3].map(s => (
                 <div key={s} className={`h-1.5 rounded-full transition-all duration-1000 ${step === s ? 'w-24 bg-[#CCFF00] shadow-[0_0_25px_#CCFF00]' : step > s ? 'w-10 bg-white/20' : 'w-10 bg-white/5'}`} />
               ))}
            </div>
            <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">Section 0{step}</span>
         </div>

         {/* STEP 1: IDENTIDAD */}
         {step === 1 && (
           <div className="space-y-16 animate-in slide-in-from-right-10 duration-700">
              <div className="space-y-6">
                 <h2 className="text-8xl font-black text-white tracking-tighter leading-[0.9]">Identidad<br/>Operativa</h2>
                 <p className="text-xl font-medium text-white/30 tracking-tight">Establezca el identificador maestro de su terminal.</p>
              </div>

              <div className="space-y-12">
                 <div className="space-y-4">
                    <label className="text-[10px] font-bold text-white/20 tracking-[0.3em] uppercase ml-10">Corporación</label>
                    <input 
                      type="text" 
                      placeholder="Nombre de la Entidad"
                      className="w-full bg-white/5 rounded-full px-12 py-10 text-3xl font-bold text-white placeholder:text-white/5 focus:bg-white/10 transition-all shadow-inner outline-none"
                      value={formData.companyName}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    />
                 </div>

                 <div className="space-y-6">
                    <label className="text-[10px] font-bold text-white/20 tracking-[0.3em] uppercase ml-10">Ecosistema</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                       {["Retail", "E-commerce", "B2B", "Lujo"].map(ind => (
                         <button 
                           key={ind}
                           onClick={() => setFormData({ ...formData, industry: ind })}
                           className={`pill-button px-8 py-6 text-[10px] font-bold uppercase tracking-widest ${formData.industry === ind ? 'bg-[#CCFF00] text-black shadow-[0_20px_40px_rgba(204,255,0,0.3)]' : 'bg-white/5 text-white/20 hover:bg-white/10'}`}
                         >
                            {ind}
                         </button>
                       ))}
                    </div>
                 </div>
              </div>

              <div className="pt-8">
                <button 
                  onClick={nextStep}
                  disabled={!formData.companyName}
                  className="w-full pill-button bg-[#CCFF00] py-10 text-xs tracking-[0.4em] font-black uppercase text-black shadow-[0_30px_60px_rgba(204,255,0,0.3)] hover:scale-[1.02] active:scale-95 disabled:opacity-10"
                >
                   INICIAR APROVISIONAMIENTO
                </button>
              </div>
           </div>
         )}

         {/* STEP 2: APROVISIONAMIENTO */}
         {step === 2 && (
           <div className="space-y-16 animate-in slide-in-from-right-10 duration-700">
              <div className="space-y-6">
                 <h2 className="text-8xl font-black text-white tracking-tighter leading-[0.9]">Red Operativa</h2>
                 <p className="text-xl font-medium text-white/30 tracking-tight">Módulos habilitados para el plan <span className="text-[#CCFF00] font-black uppercase">{mockPlan}</span>.</p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                 {[
                   { id: "ecommerce", name: "Escaparate Digital", status: "Enabled", color: "text-[#CCFF00]" },
                   { id: "crm", name: "Relaciones Neurales", status: mockPlan === 'starter' ? 'Gated' : 'Enabled', color: "text-blue-400" },
                   { id: "erp", name: "Recursos Core", status: mockPlan === 'enterprise' ? 'Enabled' : 'Gated', color: "text-emerald-400" },
                 ].map(mod => (
                   <div key={mod.id} className="bg-white/3 p-10 rounded-[3rem] flex items-center justify-between">
                      <div className="flex items-center gap-10">
                         <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center">
                            <span className={`material-symbols-outlined !text-4xl ${mod.color}`}>neurology</span>
                         </div>
                         <div>
                            <p className="text-2xl font-bold text-white tracking-tight">{mod.name}</p>
                            <p className="text-[10px] font-bold text-white/10 uppercase tracking-[0.3em]">{mod.status === 'Enabled' ? 'SISTEMA LISTO' : 'REQUIERE UPGRADE'}</p>
                         </div>
                      </div>
                      {mod.status === 'Gated' ? (
                        <button className="pill-button bg-white/10 px-8 py-4 text-[9px] tracking-[0.2em] font-bold uppercase text-[#CCFF00] hover:bg-white/20">RESERVAR</button>
                      ) : (
                        <div className="px-8 py-4 bg-[#CCFF00]/10 rounded-full flex items-center gap-3">
                           <span className="w-2 h-2 rounded-full bg-[#CCFF00] animate-pulse shadow-[0_0_8px_#CCFF00]" />
                           <span className="text-[9px] font-bold text-[#CCFF00] uppercase tracking-widest">ACTIVO</span>
                        </div>
                      )}
                   </div>
                 ))}
              </div>

              <div className="flex gap-6 pt-8">
                 <button onClick={prevStep} className="flex-1 pill-button bg-white/10 py-7 text-[10px] tracking-[0.2em] font-bold uppercase text-white/30 hover:bg-white/20">VOLVER</button>
                 <button onClick={nextStep} className="flex-[2] pill-button bg-[#CCFF00] py-7 text-[11px] tracking-[0.3em] font-black uppercase text-black shadow-[0_20px_40px_rgba(204,255,0,0.1)]">CONFIRMAR CONEXIÓN</button>
              </div>
           </div>
         )}

         {/* STEP 3: SINCRONIZACIÓN */}
         {step === 3 && (
           <div className="space-y-16 animate-in slide-in-from-right-10 duration-700">
              <div className="space-y-6">
                 <h2 className="text-8xl font-black text-white tracking-tighter leading-[0.9]">Sincronización</h2>
                 <p className="text-xl font-medium text-white/30 tracking-tight">Vincule sus ecosistemas con el núcleo Kinexis.</p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                 {[
                   { id: "shopify", name: "Shopify / ML", icon: "hub" },
                   { id: "meta", name: "Meta (WhatsApp)", icon: "chat" },
                   { id: "sat", name: "SAT / Fiscal", icon: "shield" },
                 ].map(end => (
                   <button 
                     key={end.id}
                     onClick={() => performSync(end.id as any)}
                     disabled={syncStatus[end.id as keyof typeof syncStatus] !== 'idle'}
                     className="bg-white/3 p-10 rounded-[3rem] flex items-center justify-between group hover:bg-white/5 transition-all"
                   >
                       <div className="flex items-center gap-10">
                          <span className="material-symbols-outlined !text-3xl text-white/20 group-hover:text-[#CCFF00] transition-colors">{end.icon}</span>
                          <p className="text-xl font-bold text-white uppercase tracking-[0.2em]">{end.name}</p>
                       </div>
                       <div>
                          {syncStatus[end.id as keyof typeof syncStatus] === 'idle' ? (
                            <span className="text-[10px] font-bold text-white/10 group-hover:text-[#CCFF00] transition-colors tracking-[0.3em]">CONECTAR</span>
                          ) : syncStatus[end.id as keyof typeof syncStatus] === 'syncing' ? (
                            <span className="material-symbols-outlined !text-[24px] text-[#CCFF00] animate-spin">sync</span>
                          ) : (
                            <span className="material-symbols-outlined !text-[32px] text-[#CCFF00] drop-shadow-[0_0_15px_#CCFF00]">check_circle</span>
                          )}
                       </div>
                   </button>
                 ))}
              </div>

              <div className="pt-12">
                <button 
                  onClick={finalize}
                  className="w-full pill-button bg-[#CCFF00] py-10 text-[13px] tracking-[0.5em] font-black uppercase text-black shadow-[0_40px_80px_rgba(0,0,0,0.5)] hover:scale-[1.01]"
                >
                   ESTABLECER CONEXIÓN TOTAL
                </button>
              </div>
           </div>
         )}

         {/* STEP 4: FINALIZING */}
         {step === 4 && (
           <div className="py-24 text-center space-y-16 animate-in zoom-in-50 duration-1000">
              <div className="relative inline-block">
                 <div className="w-40 h-40 rounded-full border-[10px] border-[#CCFF00]/5 border-t-[#CCFF00] animate-spin" />
                 <div className="absolute inset-0 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[#CCFF00] !text-6xl drop-shadow-[0_0_30px_#CCFF00]">bolt</span>
                 </div>
              </div>
              <div className="space-y-6">
                 <h2 className="text-6xl font-black text-white uppercase tracking-[0.6em] opacity-90 leading-none">Sistemas<br/>Online</h2>
                 <p className="text-xs font-bold text-[#CCFF00] animate-pulse uppercase tracking-[0.5em]">Inyectando Arquitectura Pristine...</p>
              </div>
           </div>
         )}

      </div>

      {/* Ambient Pristine Glows */}
      <div className="absolute top-[-20%] right-[-10%] w-[1000px] h-[1000px] bg-[#CCFF00]/5 blur-[250px] -z-10 rounded-full" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[1000px] h-[1000px] bg-blue-500/5 blur-[250px] -z-10 rounded-full" />
    </div>
  );
}
