"use client";

import { useEffect, useState } from "react";

interface SamanthaGuideProps {
  step: number;
}

export function SamanthaGuide({ step }: SamanthaGuideProps) {
  const [message, setMessage] = useState("");

  const messages = [
     "Bienvenido, Comandante. Iniciemos la configuración de su red neural. ¿Cómo debemos identificar a su empresa?",
     "Excelente. Ahora, verifiquemos los módulos asignados a su nivel de suscripción actual.",
     "Casi listos. Comandante, conectemos sus canales de venta para iniciar la telemetría en tiempo real.",
     "Sincronización completa. Preparando el acceso al Nexus..."
  ];

  useEffect(() => {
    setMessage(messages[step - 1] || "");
  }, [step]);

  return (
    <div className="fixed top-12 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-700">
       <div className="glass-card px-8 py-4 rounded-3xl border border-primary/20 flex items-center gap-6 shadow-[0_0_40px_rgba(204,255,0,0.1)]">
          <div className="relative">
             <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center border border-primary/40 animate-pulse">
                <span className="material-symbols-outlined text-primary !text-[24px]">neurology</span>
             </div>
             <div className="absolute -inset-1 bg-primary/10 blur-lg rounded-full -z-10" />
          </div>
          <div className="max-w-md">
             <p className="text-[10px] font-black text-primary uppercase label-tracking mb-1">Samantha Guide</p>
             <p className="text-sm font-bold text-on-surface leading-tight italic">"{message}"</p>
          </div>
       </div>
    </div>
  );
}
