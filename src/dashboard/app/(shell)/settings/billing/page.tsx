"use client";

import { useState } from "react";
import { CheckCircle } from "lucide-react";

const PLANS = [
  {
    id: "starter",
    name: "Starter",
    price: "$6,500",
    period: "mes",
    features: [
      "1 Módulo a elegir",
      "500 conversaciones Samantha/mes",
      "100 Timbres CFDI",
      "3 usuarios (hasta 10)",
      "50 GB almacenamiento",
      "Soporte email 48h",
    ],
    featured: false,
  },
  {
    id: "growth",
    name: "Growth",
    price: "$10,500",
    period: "mes",
    features: [
      "2 Módulos a elegir",
      "750 conversaciones Samantha/mes",
      "150 Timbres CFDI",
      "5 usuarios (hasta 20)",
      "100 GB almacenamiento",
      "Soporte chat 24h",
      "Onboarding: Samantha + 1 sesión",
    ],
    featured: true,
  },
  {
    id: "pro",
    name: "Pro",
    price: "$16,500",
    period: "mes",
    features: [
      "3 Módulos (Suite Completa)",
      "1,000 conversaciones Samantha/mes",
      "200 Timbres CFDI",
      "Usuarios ilimitados",
      "200 GB almacenamiento",
      "Soporte WhatsApp 12h",
      "Onboarding: Sesión intensiva 90 min",
    ],
    featured: false,
  },
];

export default function BillingPage() {
  const [loading, setLoading] = useState<string | null>(null);

  const handleUpgrade = async (planId: string) => {
    setLoading(planId);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan_type: planId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Error al iniciar el pago");
      }
    } catch {
      alert("Error de red. Intenta de nuevo.");
    } finally {
      setLoading(null);
    }
  };

  const handlePortal = async () => {
    setLoading("portal");
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch {
      alert("Error al abrir el portal de facturación");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="px-4 md:px-8 py-8 max-w-5xl mx-auto">
      <div className="mb-10">
        <h1 className="text-3xl font-headline font-bold text-white mb-2">Facturación y Planes</h1>
        <p className="text-on-surface-variant text-sm">Gestiona tu suscripción y accede al portal de facturación.</p>
      </div>

      {/* Plan Actual */}
      <div className="bg-white/[0.03] border border-white/[0.08] rounded-[2rem] p-8 mb-10 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-[#CCFF00]/10 flex items-center justify-center border border-[#CCFF00]/20">
            <span className="material-symbols-outlined text-[#CCFF00] text-3xl">workspace_premium</span>
          </div>
          <div>
            <p className="text-[10px] text-on-surface-variant uppercase font-bold tracking-[0.2em] mb-1">Tu Plan Actual</p>
            <h2 className="text-2xl font-headline font-bold text-white">Plan Growth</h2>
            <p className="text-sm text-[#A8E63D] font-bold mt-1">Suscripción Activa · $10,500 MXN/mes</p>
          </div>
        </div>
        <div className="flex gap-4">
          <button
            onClick={handlePortal}
            disabled={loading === "portal"}
            className="px-6 py-3 bg-white/[0.06] text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-white/[0.1] transition-all disabled:opacity-50"
          >
            {loading === "portal" ? "Cargando..." : "Portal de Facturación"}
          </button>
        </div>
      </div>

      {/* Planes disponibles */}
      <div>
        <h3 className="text-xl font-headline font-bold text-white mb-2">Cambiar de Plan</h3>
        <p className="text-xs text-on-surface-variant uppercase tracking-widest mb-6">Precios en MXN · IVA no incluido</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-[1.8rem] p-6 border flex flex-col ${
                plan.featured
                  ? "border-[#CCFF00]/40 bg-[#CCFF00]/5 shadow-[0_0_30px_rgba(204,255,0,0.07)]"
                  : "border-white/[0.08] bg-white/[0.03]"
              }`}
            >
              {plan.featured && (
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#CCFF00] text-black text-[9px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">
                  Más Popular
                </span>
              )}

              <div className="mb-4">
                <h4 className="text-lg font-headline font-bold text-white">{plan.name}</h4>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-3xl font-bold text-white">{plan.price}</span>
                  <span className="text-sm text-on-surface-variant">MXN/{plan.period}</span>
                </div>
              </div>

              <ul className="space-y-2.5 mb-6 flex-1">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-on-surface-variant">
                    <CheckCircle className="w-4 h-4 text-[#CCFF00] flex-shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleUpgrade(plan.id)}
                disabled={loading !== null}
                className={`w-full py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all disabled:opacity-50 ${
                  plan.featured
                    ? "bg-[#CCFF00] text-black hover:shadow-[0_0_20px_rgba(204,255,0,0.3)]"
                    : "bg-white/[0.06] text-white hover:bg-white/[0.1]"
                }`}
              >
                {loading === plan.id ? "Redirigiendo..." : `Cambiar a ${plan.name}`}
              </button>
            </div>
          ))}
        </div>

        <p className="text-xs text-on-surface-variant mt-6 text-center">
          ¿Necesitas un plan personalizado?{" "}
          <a href="mailto:contacto@atollom.com" className="text-[#CCFF00] hover:underline">
            Contáctanos
          </a>
        </p>
      </div>
    </div>
  );
}
