"use client";

import { useState } from "react";

const messageBundles = [
  { id: "msg-250", count: 250, price: 250, bestValue: false },
  { id: "msg-500", count: 500, price: 500, bestValue: false },
  { id: "msg-800", count: 800, price: 800, bestValue: true },
  { id: "msg-1000", count: 1000, price: 1000, bestValue: false },
];

export default function BillingPage() {
  const [purchasing, setPurchasing] = useState<string | null>(null);

  const handlePurchase = (id: string) => {
    setPurchasing(id);
    // Simulate Stripe Checkout redirect
    setTimeout(() => {
      alert("Redirigiendo a Stripe Checkout para el paquete de mensajes...");
      setPurchasing(null);
    }, 1000);
  };

  return (
    <div className="px-4 md:px-8 py-8 max-w-5xl mx-auto">
      <div className="mb-10">
        <h1 className="text-3xl font-headline font-bold text-white mb-2">Facturación y Planes</h1>
        <p className="text-on-surface-variant text-sm">Gestiona tu suscripción, compra paquetes de mensajes y revisa tu consumo.</p>
      </div>

      {/* Plan Actual */}
      <div className="bg-white/[0.03] border border-white/[0.08] rounded-[2rem] p-8 mb-10 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-[#CCFF00]/10 flex items-center justify-center border border-[#CCFF00]/20">
            <span className="material-symbols-outlined text-[#CCFF00] text-3xl">workspace_premium</span>
          </div>
          <div>
            <p className="text-[10px] text-on-surface-variant uppercase font-bold tracking-[0.2em] mb-1">Tu Plan Actual</p>
            <h2 className="text-2xl font-headline font-bold text-white">Plan Enterprise</h2>
            <p className="text-sm text-[#A8E63D] font-bold mt-1">Suscripción Activa</p>
          </div>
        </div>
        <div className="flex gap-4">
           <button className="px-6 py-3 bg-white/[0.06] text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-white/[0.1] transition-all">
            Ver Facturas
          </button>
          <button className="px-6 py-3 bg-red-500/10 text-red-500 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-red-500/20 transition-all">
            Cancelar Plan
          </button>
        </div>
      </div>

      {/* Paquetes de Mensajes */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-headline font-bold text-white">Paquetes de Mensajes</h3>
            <p className="text-xs text-on-surface-variant uppercase tracking-widest mt-1">Créditos de Samantha para CRM y WhatsApp</p>
          </div>
          <div className="bg-white/[0.03] border border-white/[0.06] px-4 py-2 rounded-xl">
             <span className="text-xs text-on-surface-variant mr-2 uppercase font-bold tracking-widest">Saldo:</span>
             <span className="text-sm font-bold text-[#A8E63D]">12,450 MSG</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {messageBundles.map((bundle) => (
            <div 
              key={bundle.id}
              className={`
                bg-white/[0.03] border rounded-[1.8rem] p-6 text-center transition-all duration-300 flex flex-col items-center
                ${bundle.bestValue ? "border-[#CCFF00] shadow-[0_0_30px_rgba(204,255,0,0.1)] scale-105" : "border-white/[0.06] hover:border-white/20"}
              `}
            >
              {bundle.bestValue && (
                <span className="bg-[#CCFF00] text-black text-[9px] font-bold px-3 py-1 rounded-full uppercase tracking-widest mb-4">
                  Más Popular
                </span>
              )}
              <p className="text-[10px] text-on-surface-variant uppercase font-bold tracking-widest mb-2">Paquete de</p>
              <h4 className="text-3xl font-headline font-bold text-white mb-1">{bundle.count}</h4>
              <p className="text-[11px] text-[#8DA4C4] mb-6">Mensajes</p>
              
              <div className="text-2xl font-bold text-on-surface mb-8">
                <span className="text-sm align-top mr-0.5 mt-1 opacity-60">$</span>
                {bundle.price}
              </div>

              <button 
                onClick={() => handlePurchase(bundle.id)}
                disabled={purchasing !== null}
                className={`
                  w-full py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all
                  ${bundle.bestValue 
                    ? "bg-[#CCFF00] text-black hover:shadow-[0_0_20px_rgba(204,255,0,0.3)]" 
                    : "bg-white/[0.06] text-white hover:bg-white/[0.1]"
                  }
                `}
              >
                {purchasing === bundle.id ? "Procesando..." : "Comprar Ahora"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
