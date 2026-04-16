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
    <div className="fixed top-8 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-2 duration-1000">
       <div className="bg-white/5 backdrop-blur-2xl px-10 py-5 rounded-full flex items-center gap-8 shadow-[0_40px_100px_rgba(0,0,0,0.4)] border-none">
          <div className="relative">
             <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
                <span className="material-symbols-outlined text-primary !text-[28px]">neurology</span>
             </div>
             <div className="absolute -inset-2 bg-primary/5 blur-2xl rounded-full -z-10" />
          </div>
          <div className="max-w-lg">
             <p className="text-[11px] font-black text-primary uppercase tracking-[0.3em] mb-1.5 opacity-80">Samantha — Neural Guide</p>
             <p className="text-[15px] font-bold text-on-surface leading-tight tracking-tight italic opacity-90">"{message}"</p>
          </div>
       </div>
    </div>
  );
}
