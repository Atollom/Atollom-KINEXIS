"use client";

import { useState } from "react";

export default function AccountingPage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState("Abril 2026");

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => setIsGenerating(false), 2000);
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center space-y-12 animate-in pb-20">
      
      {/* Visual Identity */}
      <div className="relative">
         <div className="w-32 h-32 rounded-[2.5rem] bg-gradient-to-br from-primary to-emerald-500 flex items-center justify-center shadow-[0_0_50px_rgba(204,255,0,0.3)] animate-float">
            <span className="material-symbols-outlined !text-6xl text-black">folder_zip</span>
         </div>
         <div className="absolute -inset-4 bg-primary/20 blur-[60px] -z-10 rounded-full" />
      </div>

      <div className="text-center space-y-4 max-w-xl">
         <span className="text-[0.75rem] font-black label-tracking text-primary uppercase">Accounting Concierge / Operational Export</span>
         <h1 className="text-5xl font-black tight-tracking text-on-surface">Digital Assets Dispatch</h1>
         <p className="text-sm font-medium text-on-surface-variant opacity-60 leading-relaxed">
            Genera un paquete comprimido (.zip) con todos los recursos fiscales, XMLs de facturación y reportes de inventario necesarios para tu contador.
         </p>
      </div>

      {/* Control Card */}
      <div className="glass-card p-10 rounded-[3rem] border border-white/5 w-full max-w-2xl flex flex-col items-center gap-10 shadow-2xl relative overflow-hidden">
         <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full relative z-10">
            <div className="space-y-3">
               <label className="text-[10px] font-black text-on-surface/30 label-tracking uppercase ml-4">Periodo Contable</label>
               <select 
                 className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-sm font-black focus:border-primary/50 outline-none appearance-none cursor-pointer"
                 value={selectedMonth}
                 onChange={(e) => setSelectedMonth(e.target.value)}
               >
                  <option>Abril 2026</option>
                  <option>Marzo 2026</option>
                  <option>Febrero 2026</option>
               </select>
            </div>
            <div className="space-y-3">
               <label className="text-[10px] font-black text-on-surface/30 label-tracking uppercase ml-4">Tipo de Paquete</label>
               <div className="flex bg-white/5 rounded-2xl p-1 border border-white/10">
                  <button className="flex-1 py-4 bg-primary text-black rounded-xl text-[10px] font-black uppercase tracking-widest shadow-glow">FULL FISCAL</button>
                  <button className="flex-1 py-4 text-on-surface-variant text-[10px] font-black uppercase tracking-widest">MINIMAL</button>
               </div>
            </div>
         </div>

         <div className="w-full bg-white/[0.02] border border-white/5 rounded-[2rem] p-8 space-y-6 relative z-10">
            <h4 className="text-[10px] font-black label-tracking text-on-surface/40 uppercase">Contenido del Manifiesto</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {[
                 { label: "XMLs Facturación (Emitidos)", count: 245 },
                 { label: "PDFs Comprobantes Pago", count: 18 },
                 { label: "Reporte Valuación Almacén", type: "XLSX" },
                 { label: "Resumen de Ventas Omnichannel", type: "PDF" },
               ].map((item, i) => (
                 <div key={i} className="flex items-center gap-4 text-left">
                    <span className="material-symbols-outlined text-primary !text-[18px]">check_circle</span>
                    <div>
                       <p className="text-[11px] font-bold text-on-surface leading-tight">{item.label}</p>
                       <p className="text-[9px] font-black text-on-surface-variant">{item.count || item.type} detectados</p>
                    </div>
                 </div>
               ))}
            </div>
         </div>

         <button 
           onClick={handleGenerate}
           disabled={isGenerating}
           className={`w-full py-6 rounded-2xl text-xs font-black uppercase label-tracking transition-all shadow-glow relative z-10 ${isGenerating ? 'bg-white/10 text-on-surface/30' : 'neon-disruptor hover:scale-[1.02]'}`}
         >
            {isGenerating ? 'COMPRIMIENDO ACTIVOS NEURALES...' : 'GENERAR Y DESCARGAR ZIP'}
         </button>

         {/* Ambient Glow */}
         <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[120px] pointer-events-none" />
      </div>

      <div className="flex items-center gap-3 text-on-surface/30">
         <span className="material-symbols-outlined !text-[16px]">verified_user</span>
         <p className="text-[10px] font-bold uppercase label-tracking tracking-[0.2em]">Paquete verificado y firmado por Samantha AI</p>
      </div>

    </div>
  );
}
