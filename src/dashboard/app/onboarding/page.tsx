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
      
      {/* Samantha Guide */}
      <SamanthaGuide step={step} />

      {/* Main Luxe Card */}
      <div className="w-full max-w-4xl bg-white/5 backdrop-blur-[50px] rounded-[3.5rem] shadow-[0_40px_100px_rgba(0,0,0,0.7)] p-20 relative z-10 animate-in zoom-in-95 duration-1000">
         
         {/* Sequence Indicator */}
         <div className="mb-20 flex justify-between items-center">
            <div className="flex gap-4">
               {[1, 2, 3].map(s => (
                 <div key={s} className={`h-1.5 rounded-full transition-all duration-1000 ${step === s ? 'w-20 bg-[#CCFF00] shadow-[0_0_20px_rgba(204,255,0,0.4)]' : step > s ? 'w-10 bg-white/20' : 'w-10 bg-white/5'}`} />
               ))}
            </div>
            <span className="text-[10px] font-bold text-white/20 uppercase tracking-[0.4em]">Section 0{step}</span>
         </div>

         {/* STEP 1: IDENTIDAD */}
         {step === 1 && (
           <div className="space-y-16 animate-in slide-in-from-right-10 duration-700">
              <div className="space-y-6">
                 <h2 className="text-7xl font-black text-white tracking-tighter leading-none">Identidad Operativa</h2>
                 <p className="text-lg font-medium text-white/30 leading-relaxed">Establezca el identificador maestro de su terminal.</p>
              </div>

              <div className="space-y-12">
                 <div className="space-y-6">
                    <label className="text-[10px] font-bold text-white/10 tracking-[0.3em] uppercase ml-8">Corporación</label>
                    <input 
                      type="text" 
                      placeholder="Nombre de la Entidad"
                      className="w-full bg-white/5 rounded-[2rem] px-10 py-10 text-3xl font-bold text-white placeholder:text-white/5 focus:bg-white/10 outline-none transition-all shadow-inner"
                      value={formData.companyName}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    />
                 </div>

                 <div className="space-y-6">
                    <label className="text-[10px] font-bold text-white/10 tracking-[0.3em] uppercase ml-8">Ecosistema</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                       {["Retail", "E-commerce", "B2B", "Lujo"].map(ind => (
                         <button 
                           key={ind}
                           onClick={() => setFormData({ ...formData, industry: ind })}
                           className={`px-8 py-6 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all duration-700 ${formData.industry === ind ? 'bg-[#CCFF00] text-black shadow-[0_20px_40px_rgba(204,255,0,0.2)]' : 'bg-white/5 text-white/20 hover:bg-white/10'}`}
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
                  className="w-full bg-[#CCFF00] rounded-full px-12 py-8 text-[11px] tracking-[0.3em] font-bold uppercase text-black shadow-[0_30px_60px_rgba(204,255,0,0.2)] hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-5"
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
                 <h2 className="text-7xl font-black text-white tracking-tighter leading-none">Red Operativa</h2>
                 <p className="text-lg font-medium text-white/30 leading-relaxed">Módulos habilitados para el plan <span className="text-[#CCFF00] font-black uppercase">{mockPlan}</span>.</p>
              </div>

              <div className="grid grid-cols-1 gap-6">
                 {[
                   { id: "ecommerce", name: "Escaparate Digital", status: "Enabled", color: "text-[#CCFF00]" },
                   { id: "crm", name: "Relaciones Neurales", status: mockPlan === 'starter' ? 'Gated' : 'Enabled', color: "text-blue-400" },
                   { id: "erp", name: "Recursos Core", status: mockPlan === 'enterprise' ? 'Enabled' : 'Gated', color: "text-emerald-400" },
                 ].map(mod => (
                   <div key={mod.id} className="bg-white/5 p-10 rounded-[2.5rem] flex items-center justify-between shadow-sm">
                      <div className="flex items-center gap-10">
                         <div className="w-20 h-20 rounded-[1.5rem] bg-white/5 flex items-center justify-center">
                            <span className={`material-symbols-outlined !text-4xl ${mod.color}`}>neurology</span>
                         </div>
                         <div>
                            <p className="text-2xl font-bold text-white tracking-tight">{mod.name}</p>
                            <p className="text-[10px] font-bold text-white/10 uppercase tracking-[0.3em]">{mod.status === 'Enabled' ? 'SISTEMA LISTO' : 'REQUIERE UPGRADE'}</p>
                         </div>
                      </div>
                      {mod.status === 'Gated' ? (
                        <button className="bg-white/10 backdrop-blur-md rounded-full px-8 py-4 text-[9px] tracking-[0.2em] font-bold uppercase text-[#CCFF00] hover:bg-white/20 transition-all">RESERVAR</button>
                      ) : (
                        <div className="px-8 py-4 bg-[#CCFF00]/10 rounded-full flex items-center gap-3">
                           <span className="w-2 h-2 rounded-full bg-[#CCFF00] animate-pulse" />
                           <span className="text-[9px] font-bold text-[#CCFF00] uppercase tracking-widest">ACTIVO</span>
                        </div>
                      )}
                   </div>
                 ))}
              </div>

              <div className="flex gap-6 pt-8">
                 <button onClick={prevStep} className="flex-1 bg-white/10 backdrop-blur-md rounded-full px-10 py-7 text-[10px] tracking-[0.2em] font-bold uppercase text-white/20 hover:bg-white/20 transition-all">VOLVER</button>
                 <button onClick={nextStep} className="flex-[2] bg-[#CCFF00] rounded-full px-10 py-7 text-[11px] tracking-[0.2em] font-bold uppercase text-black shadow-[0_20px_40px_rgba(204,255,0,0.1)]">CONFIRMAR CONEXIÓN</button>
              </div>
           </div>
         )}

         {/* STEP 3: SINCRONIZACIÓN */}
         {step === 3 && (
           <div className="space-y-16 animate-in slide-in-from-right-10 duration-700">
              <div className="space-y-6">
                 <h2 className="text-7xl font-black text-white tracking-tighter leading-none">Sincronización</h2>
                 <p className="text-lg font-medium text-white/30 leading-relaxed">Vincule sus ecosistemas con el núcleo Kinexis.</p>
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
                     className="bg-white/5 p-8 rounded-[2rem] flex items-center justify-between group hover:bg-white/10 transition-all"
                   >
                       <div className="flex items-center gap-10">
                          <span className="material-symbols-outlined !text-3xl text-white/20 group-hover:text-[#CCFF00] transition-colors">{end.icon}</span>
                          <p className="text-lg font-bold text-white uppercase tracking-[0.2em]">{end.name}</p>
                       </div>
                       <div>
                          {syncStatus[end.id as keyof typeof syncStatus] === 'idle' ? (
                            <span className="text-[10px] font-bold text-white/10 group-hover:text-[#CCFF00] transition-colors tracking-widest">CONECTAR</span>
                          ) : syncStatus[end.id as keyof typeof syncStatus] === 'syncing' ? (
                            <span className="material-symbols-outlined !text-[24px] text-[#CCFF00] animate-spin">sync</span>
                          ) : (
                            <span className="material-symbols-outlined !text-[24px] text-[#CCFF00] shadow-[0_0_20px_rgba(204,255,0,0.5)]">check_circle</span>
                          )}
                       </div>
                   </button>
                 ))}
              </div>

              <div className="pt-12">
                <button 
                  onClick={finalize}
                  className="w-full bg-[#CCFF00] rounded-full px-12 py-10 text-[13px] tracking-[0.4em] font-bold uppercase text-black shadow-[0_40px_80px_rgba(0,0,0,0.4)] hover:scale-[1.01] transition-all"
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
                    <span className="material-symbols-outlined text-[#CCFF00] !text-6xl drop-shadow-[0_0_20px_rgba(204,255,0,0.6)]">bolt</span>
                 </div>
              </div>
              <div className="space-y-6">
                 <h2 className="text-5xl font-black text-white uppercase tracking-[0.6em] opacity-90">Sistemas Online</h2>
                 <p className="text-[11px] font-bold text-[#CCFF00] animate-pulse uppercase tracking-[0.5em]">Inyectando Arquitectura Luxe...</p>
              </div>
           </div>
         )}

      </div>

      {/* Ambinet Luxe Glows */}
      <div className="absolute top-[-20%] right-[-10%] w-[1000px] h-[1000px] bg-[#CCFF00]/5 blur-[200px] -z-10 rounded-full" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[1000px] h-[1000px] bg-blue-500/5 blur-[200px] -z-10 rounded-full" />
    </div>
  );
}
