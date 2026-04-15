"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[KINEXIS Error Boundary]", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#0D1B3E] flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Icon */}
        <div className="w-16 h-16 mx-auto rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
          <span className="material-symbols-outlined text-3xl text-red-400">
            error
          </span>
        </div>

        {/* Message */}
        <div>
          <h2 className="text-xl font-bold text-[#E8EAF0] mb-2">
            Error de Aplicación
          </h2>
          <p className="text-sm text-[#8DA4C4] leading-relaxed">
            Ocurrió un error inesperado. Esto puede deberse a un problema
            temporal con la base de datos o la sesión.
          </p>
        </div>

        {/* Error detail (dev) */}
        {error?.message && (
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 text-left">
            <p className="text-[10px] text-[#8DA4C4] uppercase tracking-wider mb-1 font-bold">
              Detalle técnico
            </p>
            <p className="text-xs text-red-400 font-mono break-all">
              {error.message}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="px-6 py-2.5 bg-[#A8E63D] text-[#0D1B3E] text-sm font-bold rounded-xl hover:shadow-[0_0_20px_#A8E63D40] transition-all"
          >
            Reintentar
          </button>
          <a
            href="/login"
            className="px-6 py-2.5 bg-white/[0.04] border border-white/[0.08] text-[#E8EAF0] text-sm font-bold rounded-xl hover:bg-white/[0.08] transition-all"
          >
            Ir al Login
          </a>
        </div>
      </div>
    </div>
  );
}
