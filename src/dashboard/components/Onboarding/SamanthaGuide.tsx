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
    <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[100] w-full max-w-2xl px-4 animate-in fade-in slide-in-from-top-10 duration-1000">
       <div className="crystal-bubble px-12 py-8 flex items-center gap-10">
          <div className="relative shrink-0">
             <div className="w-16 h-16 rounded-full bg-[#CCFF00]/10 flex items-center justify-center animate-pulse">
                <span className="material-symbols-outlined text-[#CCFF00] !text-[32px]">neurology</span>
             </div>
             <div className="absolute -inset-4 bg-[#CCFF00]/10 blur-3xl rounded-full -z-10" />
          </div>
          <div className="flex-1 min-w-0">
             <div className="flex items-center gap-3 mb-2 opacity-80">
                <span className="w-1.5 h-1.5 rounded-full bg-[#CCFF00] shadow-[0_0_10px_#CCFF00]" />
                <p className="text-[10px] font-bold text-[#CCFF00] uppercase tracking-[0.4em]">Samantha Neural Guide</p>
             </div>
             <p className="text-xl font-bold text-white leading-tight tracking-tight italic opacity-95">"{message}"</p>
          </div>
       </div>
    </div>
  );
}
