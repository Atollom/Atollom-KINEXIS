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
    // Force a reload to let DashboardShell re-bootstrap with the new plan
    window.location.href = "/";
  };

  const clearMock = () => {
    localStorage.removeItem("kinexis_mock_plan");
    window.location.href = "/";
  };

  return (
    <div className="min-h-[90vh] flex flex-col items-center justify-center space-y-16 animate-in p-12 bg-[#040f1b]">
      
      <div className="text-center space-y-6 max-w-2xl">
         <div className="inline-flex items-center gap-3 px-6 py-2 bg-primary/10 rounded-full mb-4">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_10px_rgba(204,255,0,0.8)]" />
            <span className="text-[11px] font-black text-primary uppercase tracking-[0.3em]">Audit Simulation Mode</span>
         </div>
         <h1 className="text-6xl font-black tight-tracking text-on-surface tracking-tighter">Stress Test Controller</h1>
         <p className="text-[15px] font-medium text-on-surface/40 leading-relaxed max-w-xl mx-auto">
            Seleccione el perfil de suscripción para validar el aislamiento de nodos y la integridad de la arquitectura de 3 columnas.
         </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl">
         {/* Starter Card */}
         <button 
           onClick={() => setPlan("starter")}
           className={`bg-white/[0.03] backdrop-blur-3xl p-12 rounded-[2.5rem] text-left transition-all duration-500 group relative overflow-hidden border-none shadow-[0_30px_60px_rgba(0,0,0,0.3)] ${currentMock === 'starter' ? 'bg-primary/10 shadow-[0_40px_100px_rgba(204,255,0,0.1)]' : 'hover:bg-white/[0.06]'}`}
         >
            <div className="relative z-10 space-y-8">
               <div className="w-16 h-16 rounded-3xl bg-white/[0.04] flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
                  <span className="material-symbols-outlined text-primary !text-4xl">shopping_bag</span>
               </div>
               <div>
                  <h3 className="text-3xl font-black text-on-surface tracking-tight">Starter Tier</h3>
                  <p className="text-[11px] font-black text-on-surface/20 uppercase tracking-widest mt-1">Tenant: Retail Focus</p>
               </div>
               <p className="text-[13px] font-medium text-on-surface/40 leading-relaxed">
                  Acceso restringido a Ecommerce. Los subsistemas ERP y CRM son removidos del DOM.
               </p>
               <div className="pt-6 flex items-center gap-3">
                  <span className="text-[11px] font-black tracking-widest text-primary uppercase">INJECT PLAN</span>
                  <span className="material-symbols-outlined !text-[18px] text-primary group-hover:translate-x-2 transition-transform">east</span>
               </div>
            </div>
            {currentMock === 'starter' && <div className="absolute top-8 right-8 w-4 h-4 rounded-full bg-primary shadow-[0_0_20px_rgba(204,255,0,0.8)]" />}
         </button>

         {/* Growth Card */}
         <button 
           onClick={() => setPlan("growth")}
           className={`bg-white/[0.03] backdrop-blur-3xl p-12 rounded-[2.5rem] text-left transition-all duration-500 group relative overflow-hidden border-none shadow-[0_30px_60px_rgba(0,0,0,0.3)] ${currentMock === 'growth' ? 'bg-blue-500/10 shadow-[0_40px_100px_rgba(59,130,246,0.1)]' : 'hover:bg-white/[0.06]'}`}
         >
            <div className="relative z-10 space-y-8">
               <div className="w-16 h-16 rounded-3xl bg-white/[0.04] flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
                  <span className="material-symbols-outlined text-blue-400 !text-4xl">warehouse</span>
               </div>
               <div>
                  <h3 className="text-3xl font-black text-on-surface tracking-tight">Growth Tier</h3>
                  <p className="text-[11px] font-black text-on-surface/20 uppercase tracking-widest mt-1">Tenant: Logistics Hub</p>
               </div>
               <p className="text-[13px] font-medium text-on-surface/40 leading-relaxed">
                  Ecommerce + ERP Pack. Activación de telemetría de cadena de suministro.
               </p>
               <div className="pt-6 flex items-center gap-3">
                  <span className="text-[11px] font-black tracking-widest text-blue-400 uppercase">INJECT PLAN</span>
                  <span className="material-symbols-outlined !text-[18px] text-blue-400 group-hover:translate-x-2 transition-transform">east</span>
               </div>
            </div>
            {currentMock === 'growth' && <div className="absolute top-8 right-8 w-4 h-4 rounded-full bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.8)]" />}
         </button>

         {/* Enterprise Card */}
         <button 
           onClick={() => setPlan("enterprise")}
           className={`bg-white/[0.03] backdrop-blur-3xl p-12 rounded-[2.5rem] text-left transition-all duration-500 group relative overflow-hidden border-none shadow-[0_30px_60px_rgba(0,0,0,0.3)] ${currentMock === 'enterprise' ? 'bg-emerald-500/10 shadow-[0_40px_100px_rgba(16,185,129,0.1)]' : 'hover:bg-white/[0.06]'}`}
         >
            <div className="relative z-10 space-y-8">
               <div className="w-16 h-16 rounded-3xl bg-white/[0.04] flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
                  <span className="material-symbols-outlined text-emerald-400 !text-4xl">hub</span>
               </div>
               <div>
                  <h3 className="text-3xl font-black text-on-surface tracking-tight">Enterprise Full</h3>
                  <p className="text-[11px] font-black text-on-surface/20 uppercase tracking-widest mt-1">Tenant: Atollom HQ</p>
               </div>
               <p className="text-[13px] font-medium text-on-surface/40 leading-relaxed">
                  Orquestación total. Desbloqueo de todos los nodos de la red Kinexis.
               </p>
               <div className="pt-6 flex items-center gap-3">
                  <span className="text-[11px] font-black tracking-widest text-emerald-400 uppercase">INJECT PLAN</span>
                  <span className="material-symbols-outlined !text-[18px] text-emerald-400 group-hover:translate-x-2 transition-transform">east</span>
               </div>
            </div>
            {currentMock === 'enterprise' && <div className="absolute top-8 right-8 w-4 h-4 rounded-full bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.8)]" />}
         </button>
      </div>

      <div className="flex flex-col items-center gap-8 pt-8">
         <button 
           onClick={clearMock}
           className="px-12 py-5 bg-white/5 hover:bg-white/10 rounded-full text-[11px] font-black tracking-[0.3em] text-on-surface/30 hover:text-white transition-all uppercase border-none"
         >
           RESET AUDIT OVERRIDE
         </button>
         <div className="flex items-center gap-4 text-on-surface/10 text-[10px] font-black uppercase tracking-[0.5em]">
            <span className="material-symbols-outlined !text-[16px]">shield_check</span>
            Secure Audit Mode Isolated
         </div>
      </div>

    </div>
  );
}
