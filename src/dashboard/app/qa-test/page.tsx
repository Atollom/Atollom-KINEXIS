"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function QATestPage() {
  const router = useRouter();
  const [currentMock, setCurrentMock] = useState<string>("enterprise");

  useEffect(() => {
    const saved = localStorage.getItem("kinexis_mock_plan") || "enterprise";
    setCurrentMock(saved);
  }, []);

  const setPlan = (plan: string) => {
    localStorage.setItem("kinexis_mock_plan", plan);
    setCurrentMock(plan);
    window.location.href = "/";
  };

  const clearMock = () => {
    localStorage.removeItem("kinexis_mock_plan");
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-[#040f1b] flex flex-col items-center justify-center p-12 relative overflow-hidden">
      
      {/* Header Section: Pristine Centering */}
      <div className="text-center space-y-8 max-w-4xl relative z-10 mb-20 animate-in fade-in duration-1000">
         <div className="inline-flex items-center gap-4 px-10 py-3 bg-white/5 rounded-full mb-6 shadow-xl">
            <span className="w-2.5 h-2.5 rounded-full bg-[#CCFF00] animate-pulse shadow-[0_0_20px_#CCFF00]" />
            <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.5em]">Audit Simulation Core</span>
         </div>
         <h1 className="text-9xl font-black tracking-tighter text-white leading-[0.85]">Stress Test<br/>Controller</h1>
         <p className="text-2xl font-medium text-white/20 tracking-tight max-w-2xl mx-auto leading-relaxed mt-10">
            Seleccione el perfil de suscripción para validar el aislamiento de nodos operativos. Solo sombras, cero líneas.
         </p>
      </div>

      {/* Stress Test Grid: Organic Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-12 w-full max-w-7xl relative z-10">
         
         {/* Starter Card */}
         <button 
           onClick={() => setPlan("starter")}
           className={`luxe-card p-16 text-left transition-all duration-700 group relative overflow-hidden ${currentMock === 'starter' ? 'bg-[#CCFF00]/10 shadow-[0_60px_120px_rgba(204,255,0,0.1)]' : 'hover:scale-[1.02]'}`}
         >
            <div className="relative z-10 space-y-12">
               <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-700">
                  <span className="material-symbols-outlined text-[#CCFF00] !text-6xl">shopping_bag</span>
               </div>
               <div>
                  <h3 className="text-5xl font-black text-white tracking-tight">Starter</h3>
                  <p className="text-[10px] font-bold text-white/10 uppercase tracking-[0.4em] mt-4">Retail Access Only</p>
               </div>
               <p className="text-xl font-medium text-white/30 leading-relaxed">
                  ERP y CRM removidos del DOM. Aislamiento total pro-ecommerce.
               </p>
               <div className="pt-10 flex items-center gap-6">
                  <span className="text-xs font-black tracking-[0.4em] text-[#CCFF00] uppercase">INJECT PLAN</span>
                  <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-[#CCFF00] group-hover:text-black transition-all">
                    <span className="material-symbols-outlined !text-[24px]">east</span>
                  </div>
               </div>
            </div>
            {currentMock === 'starter' && <div className="absolute top-12 right-12 w-4 h-4 rounded-full bg-[#CCFF00] shadow-[0_0_30px_#CCFF00]" />}
         </button>

         {/* Growth Card */}
         <button 
           onClick={() => setPlan("growth")}
           className={`luxe-card p-16 text-left transition-all duration-700 group relative overflow-hidden ${currentMock === 'growth' ? 'bg-blue-500/10 shadow-[0_60px_120px_rgba(59,130,246,0.1)]' : 'hover:scale-[1.02]'}`}
         >
            <div className="relative z-10 space-y-12">
               <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-700">
                  <span className="material-symbols-outlined text-blue-400 !text-6xl">warehouse</span>
               </div>
               <div>
                  <h3 className="text-5xl font-black text-white tracking-tight">Growth</h3>
                  <p className="text-[10px] font-bold text-white/10 uppercase tracking-[0.4em] mt-4">Logistics Enabled</p>
               </div>
               <p className="text-xl font-medium text-white/30 leading-relaxed">
                  Ecommerce + ERP. Activación de telemetría de inventarios.
               </p>
               <div className="pt-10 flex items-center gap-6">
                  <span className="text-xs font-black tracking-[0.4em] text-blue-400 uppercase">INJECT PLAN</span>
                  <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-blue-400 group-hover:text-black transition-all">
                    <span className="material-symbols-outlined !text-[24px]">east</span>
                  </div>
               </div>
            </div>
            {currentMock === 'growth' && <div className="absolute top-12 right-12 w-4 h-4 rounded-full bg-blue-500 shadow-[0_0_30px_#3b82f6]" />}
         </button>

         {/* Enterprise Card */}
         <button 
           onClick={() => setPlan("enterprise")}
           className={`luxe-card p-16 text-left transition-all duration-700 group relative overflow-hidden ${currentMock === 'enterprise' ? 'bg-emerald-500/10 shadow-[0_60px_120px_rgba(16,185,129,0.1)]' : 'hover:scale-[1.02]'}`}
         >
            <div className="relative z-10 space-y-12">
               <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-700">
                  <span className="material-symbols-outlined text-emerald-400 !text-6xl">hub</span>
               </div>
               <div>
                  <h3 className="text-5xl font-black text-white tracking-tight">Enterprise</h3>
                  <p className="text-[10px] font-bold text-white/10 uppercase tracking-[0.4em] mt-4">Full Orchestration</p>
               </div>
               <p className="text-xl font-medium text-white/30 leading-relaxed">
                  Desbloqueo total. Todos los módulos operativos en el Nexus.
               </p>
               <div className="pt-10 flex items-center gap-6">
                  <span className="text-xs font-black tracking-[0.4em] text-emerald-400 uppercase">INJECT PLAN</span>
                  <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-emerald-400 group-hover:text-black transition-all">
                    <span className="material-symbols-outlined !text-[24px]">east</span>
                  </div>
               </div>
            </div>
            {currentMock === 'enterprise' && <div className="absolute top-12 right-12 w-4 h-4 rounded-full bg-emerald-500 shadow-[0_0_30px_#10b981]" />}
         </button>
      </div>

      <div className="flex flex-col items-center gap-12 pt-20 relative z-10">
         <button 
           onClick={clearMock}
           className="pill-button bg-white/5 px-16 py-7 text-[10px] font-black uppercase tracking-[0.6em] text-white/20 hover:text-[#CCFF00] hover:bg-white/10 shadow-2xl"
         >
           RESET AUDIT OVERRIDE
         </button>
      </div>

      {/* Ambient Pristine Glows */}
      <div className="absolute top-[-20%] right-[-10%] w-[1200px] h-[1200px] bg-[#CCFF00]/5 blur-[300px] -z-0 rounded-full" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[1200px] h-[1200px] bg-blue-500/5 blur-[300px] -z-0 rounded-full" />
    </div>
  );
}
