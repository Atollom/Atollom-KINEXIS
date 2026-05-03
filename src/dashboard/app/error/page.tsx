"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

const REASON_MAP: Record<string, { title: string; detail: string; icon: string }> = {
  configuration: {
    title: "Error de Configuración",
    detail: "Variables de entorno críticas no encontradas. Contacta al administrador del sistema.",
    icon: "settings_alert",
  },
  unauthorized: {
    title: "No Autorizado",
    detail: "No tienes permiso para acceder a este recurso.",
    icon: "lock",
  },
};

function ErrorContent() {
  const params = useSearchParams();
  const reason = params.get("reason") ?? "unknown";
  const cfg = REASON_MAP[reason] ?? {
    title: "Error Inesperado",
    detail: "Ocurrió un problema. Por favor intenta de nuevo o contacta soporte.",
    icon: "error",
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#040f1b] p-6">
      <div className="w-full max-w-md space-y-8 text-center">
        {/* Icon */}
        <div className="mx-auto w-20 h-20 rounded-[1.5rem] bg-red-500/10 border border-red-500/20 flex items-center justify-center">
          <span className="material-symbols-outlined !text-[36px] text-red-400">{cfg.icon}</span>
        </div>

        {/* Label */}
        <div className="space-y-2">
          <p className="text-[0.7rem] font-black label-tracking text-red-400/70 uppercase">
            KINEXIS · Error del Sistema
          </p>
          <h1 className="text-3xl font-black tight-tracking text-white">
            {cfg.title}
          </h1>
          <p className="text-sm text-white/50 leading-relaxed max-w-xs mx-auto">
            {cfg.detail}
          </p>
        </div>

        {/* Code badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10">
          <span className="material-symbols-outlined !text-[14px] text-white/30">code</span>
          <span className="text-[10px] font-mono text-white/30">reason: {reason}</span>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 pt-2">
          <a
            href="/login"
            className="w-full py-4 rounded-2xl bg-[#CCFF00] text-black text-[10px] font-black label-tracking text-center hover:bg-[#CCFF00]/90 transition-all"
          >
            VOLVER AL LOGIN
          </a>
          <a
            href="mailto:contacto@atollom.com"
            className="w-full py-3 rounded-2xl border border-white/10 text-white/50 text-[10px] font-black label-tracking text-center hover:border-white/20 transition-all"
          >
            CONTACTAR SOPORTE
          </a>
        </div>
      </div>
    </div>
  );
}

export default function ErrorPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#040f1b]" />}>
      <ErrorContent />
    </Suspense>
  );
}
