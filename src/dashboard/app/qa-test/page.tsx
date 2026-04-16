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
    <div className="min-h-[80vh] flex flex-col items-center justify-center space-y-12 animate-in p-10">
      
      <div className="text-center space-y-4 max-w-2xl">
         <div className="inline-flex items-center gap-3 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full mb-4">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Kinexis Audit Mode v3.0</span>
         </div>
         <h1 className="text-5xl font-black tight-tracking text-on-surface">Stress Test Controller</h1>
         <p className="text-sm font-medium text-on-surface-variant opacity-60 leading-relaxed">
            Esta página simula la configuración de tenant para la auditoría de mañana. Selecciona un nivel de suscripción para verificar el aislamiento de módulos y la estabilidad del layout dinámico.
         </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl">
         {/* Starter Card */}
         <button 
           onClick={() => setPlan("starter")}
           className={`glass-card p-10 rounded-[3rem] border text-left transition-all group relative overflow-hidden ${currentMock === 'starter' ? 'border-primary bg-primary/5' : 'border-white/5 hover:border-white/20'}`}
         >
            <div className="relative z-10 space-y-6">
               <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                  <span className="material-symbols-outlined text-on-surface/40 group-hover:text-primary !text-3xl">shopping_bag</span>
               </div>
               <div>
                  <h3 className="text-2xl font-black text-on-surface">Starter E-commerce</h3>
                  <p className="text-[10px] font-bold text-on-surface/30 uppercase label-tracking mt-1">Tenant: Tienda de Charms</p>
               </div>
               <p className="text-[12px] font-medium text-on-surface-variant leading-relaxed">
                  Solo Ecommerce. El Sidebar debe ocultar CRM y ERP por completo.
               </p>
               <div className="pt-4 flex items-center gap-2">
                  <span className="text-[10px] font-black label-tracking text-primary uppercase">Simular Plan</span>
                  <span className="material-symbols-outlined !text-[16px] text-primary group-hover:translate-x-1 transition-transform">east</span>
               </div>
            </div>
            {currentMock === 'starter' && <div className="absolute top-6 right-6 w-3 h-3 rounded-full bg-primary shadow-glow" />}
         </button>

         {/* Growth Card */}
         <button 
           onClick={() => setPlan("growth")}
           className={`glass-card p-10 rounded-[3rem] border text-left transition-all group relative overflow-hidden ${currentMock === 'growth' ? 'border-blue-400 bg-blue-400/5' : 'border-white/5 hover:border-white/20'}`}
         >
            <div className="relative z-10 space-y-6">
               <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-blue-400/10 transition-colors">
                  <span className="material-symbols-outlined text-on-surface/40 group-hover:text-blue-400 !text-3xl">warehouse</span>
               </div>
               <div>
                  <h3 className="text-2xl font-black text-on-surface">Growth Operativo</h3>
                  <p className="text-[10px] font-bold text-on-surface/30 uppercase label-tracking mt-1">Tenant: Distribuidora Regional</p>
               </div>
               <p className="text-[12px] font-medium text-on-surface-variant leading-relaxed">
                  Ecommerce + ERP. El Sidebar debe ocultar el CRM dinámicamente.
               </p>
               <div className="pt-4 flex items-center gap-2">
                  <span className="text-[10px] font-black label-tracking text-blue-400 uppercase">Simular Plan</span>
                  <span className="material-symbols-outlined !text-[16px] text-blue-400 group-hover:translate-x-1 transition-transform">east</span>
               </div>
            </div>
            {currentMock === 'growth' && <div className="absolute top-6 right-6 w-3 h-3 rounded-full bg-blue-400 shadow-[0_0_10px_#3B82F6]" />}
         </button>

         {/* Enterprise Card */}
         <button 
           onClick={() => setPlan("enterprise")}
           className={`glass-card p-10 rounded-[3rem] border text-left transition-all group relative overflow-hidden ${currentMock === 'enterprise' ? 'border-emerald-500 bg-emerald-500/5' : 'border-white/5 hover:border-white/20'}`}
         >
            <div className="relative z-10 space-y-6">
               <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-emerald-500/10 transition-colors">
                  <span className="material-symbols-outlined text-on-surface/40 group-hover:text-emerald-500 !text-3xl">hub</span>
               </div>
               <div>
                  <h3 className="text-2xl font-black text-on-surface">Enterprise Full</h3>
                  <p className="text-[10px] font-bold text-on-surface/30 uppercase label-tracking mt-1">Tenant: Atollom HQ</p>
               </div>
               <p className="text-[12px] font-medium text-on-surface-variant leading-relaxed">
                  Sincronización total. Desbloqueo de todos los módulos del Nexus.
               </p>
               <div className="pt-4 flex items-center gap-2">
                  <span className="text-[10px] font-black label-tracking text-emerald-500 uppercase">Simular Plan</span>
                  <span className="material-symbols-outlined !text-[16px] text-emerald-500 group-hover:translate-x-1 transition-transform">east</span>
               </div>
            </div>
            {currentMock === 'enterprise' && <div className="absolute top-6 right-6 w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_10px_#10B981]" />}
         </button>
      </div>

      <div className="flex flex-col items-center gap-6">
         <button 
           onClick={clearMock}
           className="px-10 py-4 glass-card border-white/10 rounded-2xl text-[10px] font-black label-tracking text-on-surface/30 hover:text-white hover:border-white/20 transition-all uppercase"
         >
           Resetear Mock Operativo
         </button>
         <div className="flex items-center gap-2 text-on-surface/20 text-[9px] font-bold uppercase tracking-[0.2em]">
            <span className="material-symbols-outlined !text-[14px]">shield</span>
            Audit Mode Locked to LocalStorage
         </div>
      </div>

    </div>
  );
}
