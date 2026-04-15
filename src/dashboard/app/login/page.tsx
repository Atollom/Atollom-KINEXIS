"use client";

import { useState } from "react";
import Image from 'next/image';
import { Space_Grotesk } from 'next/font/google';

const spaceGrotesk = Space_Grotesk({ 
  subsets: ['latin'],
  weight: ['700'],
});

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const plans = [
    {
      id: "starter",
      name: "STARTER",
      price: "$4,500",
      period: "/mes",
      setupFee: "$2,500",
      modules: "1 Módulo a elegir",
      conversations: "1,000 mensuales",
      features: [
        "Samantha AI 24/7",
        "Onboarding dedicado",
        "Soporte Inteligente",
        "1 módulo operativo"
      ],
      popular: false,
      color: "slate"
    },
    {
      id: "growth",
      name: "GROWTH",
      price: "$7,500",
      period: "/mes",
      setupFee: "$3,500",
      modules: "2 Módulos a elegir",
      conversations: "2,000 mensuales",
      features: [
        "Samantha AI 24/7",
        "Onboarding dedicado",
        "Soporte Inteligente",
        "2 módulos operativos",
        "Prioridad en soporte"
      ],
      popular: true,
      color: "green"
    },
    {
      id: "pro",
      name: "PRO",
      price: "$12,500",
      period: "/mes",
      setupFee: "$5,000",
      modules: "Suite Completa",
      conversations: "3,000 mensuales",
      features: [
        "Samantha AI 24/7",
        "Onboarding dedicado VIP",
        "Soporte premium",
        "TODOS los 3 módulos",
        "Acceso beta nuevas funcionalidades",
        "Manager de cuenta dedicado"
      ],
      popular: false,
      color: "blue"
    }
  ];

  return (
    <div className="min-h-screen bg-[#0D1B3E] flex flex-col">
      {/* Hero Section */}
      <div className="px-8 pt-12 pb-8 text-center max-w-5xl mx-auto">
        <div className="mb-8">
          <div className="relative inline-block mb-6">
            <div className="absolute inset-0 rounded-full blur-2xl bg-lime-400/20 animate-pulse"></div>
            <Image 
              src="/kinexis-logo.png" 
              alt="KINEXIS" 
              width={80} 
              height={80}
              className="relative drop-shadow-[0_0_15px_rgba(202,253,0,0.5)] rounded-xl"
            />
          </div>
          
          <h1 className={`${spaceGrotesk.className} text-4xl tracking-tighter text-[#cafd00] font-bold mb-2`}>
            KINEXIS
          </h1>
          <p className="text-lg text-on-surface-variant max-w-2xl mx-auto">
            Plataforma de automatización multi-agente para e-commerce. 
            43 agentes IA operando en tiempo real 24/7.
          </p>
        </div>

        {/* Tabs Login / Registro */}
        <div className="flex justify-center gap-4 mb-8">
          <button
            onClick={() => setActiveTab("login")}
            className={`px-6 py-2.5 rounded-lg font-bold text-sm transition-all ${
              activeTab === "login" 
                ? "bg-[#A8E63D] text-[#0D1B3E]" 
                : "bg-white/[0.06] text-on-surface hover:bg-white/[0.1]"
            }`}
          >
            Iniciar Sesión
          </button>
          <button
            onClick={() => setActiveTab("register")}
            className={`px-6 py-2.5 rounded-lg font-bold text-sm transition-all ${
              activeTab === "register" 
                ? "bg-[#A8E63D] text-[#0D1B3E]" 
                : "bg-white/[0.06] text-on-surface hover:bg-white/[0.1]"
            }`}
          >
            Registrarse
          </button>
        </div>

        {/* Login Form */}
        {activeTab === "login" && (
          <div className="max-w-md mx-auto bg-[#0a1a2f]/50 backdrop-blur-xl border border-white/[0.06] rounded-2xl p-8">
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-on-surface-variant uppercase tracking-wider mb-2 text-left">
                  Correo Electrónico
                </label>
                <input 
                  type="email" 
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 py-3 text-on-surface focus:outline-none focus:border-[#A8E63D]/50"
                  placeholder="tu@empresa.com"
                />
              </div>
              <div>
                <label className="block text-xs text-on-surface-variant uppercase tracking-wider mb-2 text-left">
                  Contraseña
                </label>
                <input 
                  type="password" 
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 py-3 text-on-surface focus:outline-none focus:border-[#A8E63D]/50"
                  placeholder="••••••••"
                />
              </div>
              <button className="w-full bg-[#A8E63D] text-[#0D1B3E] font-bold py-3 rounded-lg hover:bg-[#8BCF34] transition-all">
                Entrar al Dashboard
              </button>
            </div>
          </div>
        )}

        {/* Plans Section */}
        {activeTab === "register" && (
          <div>
            <h2 className="text-xl font-bold text-white mb-6">
              Elige tu plan KINEXIS 2026
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {plans.map((plan) => (
                <div 
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan.id)}
                  className={`
                    bg-[#0a1a2f]/50 backdrop-blur-xl border rounded-2xl p-6 cursor-pointer transition-all
                    ${selectedPlan === plan.id 
                      ? "border-[#A8E63D] bg-[#A8E63D]/5" 
                      : "border-white/[0.06] hover:border-white/[0.15]"
                    }
                    ${plan.popular ? "relative" : ""}
                  `}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#A8E63D] text-[#0D1B3E] text-xs font-bold px-3 py-1 rounded-full">
                      MÁS POPULAR
                    </div>
                  )}
                  
                  <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                  <div className="mb-4">
                    <span className="text-3xl font-bold text-white">{plan.price}</span>
                    <span className="text-on-surface-variant">{plan.period}</span>
                  </div>
                  
                  <div className="text-sm text-on-surface-variant mb-4 text-left">
                    <p>Setup único: {plan.setupFee} MXN</p>
                    <p>{plan.modules}</p>
                    <p>{plan.conversations} conversaciones</p>
                  </div>

                  <ul className="space-y-2 mb-6 text-left">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-on-surface">
                        <span className="material-symbols-outlined text-[#A8E63D] text-sm">check_circle</span>
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <button className={`w-full py-2.5 rounded-lg font-bold transition-all ${
                    selectedPlan === plan.id
                      ? "bg-[#A8E63D] text-[#0D1B3E]"
                      : "bg-white/[0.06] text-on-surface hover:bg-white/[0.1]"
                  }`}>
                    {selectedPlan === plan.id ? "✓ Seleccionado" : "Seleccionar"}
                  </button>
                </div>
              ))}
            </div>

            {selectedPlan && (
              <div className="max-w-md mx-auto bg-[#0a1a2f]/50 backdrop-blur-xl border border-white/[0.06] rounded-2xl p-8">
                <h3 className="text-lg font-bold text-white mb-4">Crear tu cuenta</h3>
                <div className="space-y-4">
                  <input 
                    type="text" 
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 py-3 text-on-surface focus:outline-none focus:border-[#A8E63D]/50"
                    placeholder="Nombre de tu empresa"
                  />
                  <input 
                    type="email" 
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 py-3 text-on-surface focus:outline-none focus:border-[#A8E63D]/50"
                    placeholder="Correo de contacto"
                  />
                  <input 
                    type="password" 
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 py-3 text-on-surface focus:outline-none focus:border-[#A8E63D]/50"
                    placeholder="Contraseña"
                  />
                  <button className="w-full bg-[#A8E63D] text-[#0D1B3E] font-bold py-3 rounded-lg hover:bg-[#8BCF34] transition-all">
                    Comenzar Onboarding
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-auto py-6 text-center text-xs text-on-surface-variant">
        <p>© 2026 KINEXIS by Atollom AI. Todos los derechos reservados.</p>
      </div>
    </div>
  );
}