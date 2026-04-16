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
    <div className="fixed top-12 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-1000">
       <div className="bg-white/5 backdrop-blur-[50px] px-12 py-8 rounded-full flex items-center gap-10 shadow-[0_40px_100px_rgba(0,0,0,0.6)]">
          <div className="relative">
             <div className="w-16 h-16 rounded-full bg-[#CCFF00]/10 flex items-center justify-center animate-pulse">
                <span className="material-symbols-outlined text-[#CCFF00] !text-[32px]">neurology</span>
             </div>
             <div className="absolute -inset-4 bg-[#CCFF00]/10 blur-3xl rounded-full -z-10" />
          </div>
          <div className="max-w-xl">
             <p className="text-[10px] font-bold text-[#CCFF00] uppercase tracking-[0.4em] mb-2 opacity-80">Samantha — Neural Guide</p>
             <p className="text-xl font-bold text-white leading-tight tracking-tight italic opacity-90">"{message}"</p>
          </div>
       </div>
    </div>
  );
}
