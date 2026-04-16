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
    <div className="min-h-[90vh] flex flex-col items-center justify-center space-y-20 animate-in p-12 bg-[#040f1b]">
      
      <div className="text-center space-y-8 max-w-3xl">
         <div className="inline-flex items-center gap-4 px-8 py-3 bg-white/5 rounded-full mb-6 shadow-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-[#CCFF00] animate-pulse shadow-[0_0_15px_rgba(204,255,0,0.8)]" />
            <span className="text-[10px] font-bold text-white/40 uppercase tracking-[0.4em]">Audit Simulation Mode</span>
         </div>
         <h1 className="text-8xl font-black tracking-tighter text-white leading-none">Stress Test Controller</h1>
         <p className="text-xl font-medium text-white/30 leading-relaxed max-w-2xl mx-auto">
            Seleccione el perfil de suscripción para validar el aislamiento de nodos operativos.
         </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-10 w-full max-w-7xl">
         {/* Starter Card */}
         <button 
           onClick={() => setPlan("starter")}
           className={`bg-white/5 backdrop-blur-[50px] p-16 rounded-[3.5rem] text-left transition-all duration-700 group relative overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.5)] ${currentMock === 'starter' ? 'bg-[#CCFF00]/5 shadow-[0_60px_120px_rgba(204,255,0,0.1)]' : 'hover:bg-white/10'}`}
         >
            <div className="relative z-10 space-y-12">
               <div className="w-20 h-20 rounded-[1.5rem] bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-[#CCFF00] !text-5xl">shopping_bag</span>
               </div>
               <div>
                  <h3 className="text-4xl font-black text-white tracking-tight">Starter</h3>
                  <p className="text-[10px] font-bold text-white/10 uppercase tracking-[0.3em] mt-2">Retail Access Only</p>
               </div>
               <p className="text-lg font-medium text-white/30 leading-relaxed">
                  ERP y CRM removidos del DOM. Aislamiento total pro-ecommerce.
               </p>
               <div className="pt-8 flex items-center gap-4">
                  <span className="text-[10px] font-bold tracking-[0.3em] text-[#CCFF00] uppercase">INJECT PLAN</span>
                  <span className="material-symbols-outlined !text-[20px] text-[#CCFF00] group-hover:translate-x-3 transition-transform">east</span>
               </div>
            </div>
            {currentMock === 'starter' && <div className="absolute top-12 right-12 w-4 h-4 rounded-full bg-[#CCFF00] shadow-[0_0_20px_rgba(204,255,0,0.8)]" />}
         </button>

         {/* Growth Card */}
         <button 
           onClick={() => setPlan("growth")}
           className={`bg-white/5 backdrop-blur-[50px] p-16 rounded-[3.5rem] text-left transition-all duration-700 group relative overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.5)] ${currentMock === 'growth' ? 'bg-blue-500/5 shadow-[0_60px_120px_rgba(59,130,246,0.1)]' : 'hover:bg-white/10'}`}
         >
            <div className="relative z-10 space-y-12">
               <div className="w-20 h-20 rounded-[1.5rem] bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-blue-400 !text-5xl">warehouse</span>
               </div>
               <div>
                  <h3 className="text-4xl font-black text-white tracking-tight">Growth</h3>
                  <p className="text-[10px] font-bold text-white/10 uppercase tracking-[0.3em] mt-2">Logistics Enabled</p>
               </div>
               <p className="text-lg font-medium text-white/30 leading-relaxed">
                  Ecommerce + ERP. Activación de telemetría de inventarios.
               </p>
               <div className="pt-8 flex items-center gap-4">
                  <span className="text-[10px] font-bold tracking-[0.3em] text-blue-400 uppercase">INJECT PLAN</span>
                  <span className="material-symbols-outlined !text-[20px] text-blue-400 group-hover:translate-x-3 transition-transform">east</span>
               </div>
            </div>
            {currentMock === 'growth' && <div className="absolute top-12 right-12 w-4 h-4 rounded-full bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.8)]" />}
         </button>

         {/* Enterprise Card */}
         <button 
           onClick={() => setPlan("enterprise")}
           className={`bg-white/5 backdrop-blur-[50px] p-16 rounded-[3.5rem] text-left transition-all duration-700 group relative overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.5)] ${currentMock === 'enterprise' ? 'bg-emerald-500/5 shadow-[0_60px_120px_rgba(16,185,129,0.1)]' : 'hover:bg-white/10'}`}
         >
            <div className="relative z-10 space-y-12">
               <div className="w-20 h-20 rounded-[1.5rem] bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-emerald-400 !text-5xl">hub</span>
               </div>
               <div>
                  <h3 className="text-4xl font-black text-white tracking-tight">Enterprise</h3>
                  <p className="text-[10px] font-bold text-white/10 uppercase tracking-[0.3em] mt-2">Full Orchestration</p>
               </div>
               <p className="text-lg font-medium text-white/30 leading-relaxed">
                  Desbloqueo total. Todos los módulos operativos en el Nexus.
               </p>
               <div className="pt-8 flex items-center gap-4">
                  <span className="text-[10px] font-bold tracking-[0.3em] text-emerald-400 uppercase">INJECT PLAN</span>
                  <span className="material-symbols-outlined !text-[20px] text-emerald-400 group-hover:translate-x-3 transition-transform">east</span>
               </div>
            </div>
            {currentMock === 'enterprise' && <div className="absolute top-12 right-12 w-4 h-4 rounded-full bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.8)]" />}
         </button>
      </div>

      <div className="flex flex-col items-center gap-10 pt-10">
         <button 
           onClick={clearMock}
           className="bg-white/10 backdrop-blur-md rounded-full px-12 py-6 text-[11px] tracking-[0.4em] font-bold uppercase text-white/30 hover:text-white transition-all shadow-lg"
         >
           RESET AUDIT OVERRIDE
         </button>
      </div>

    </div>
  );
}
