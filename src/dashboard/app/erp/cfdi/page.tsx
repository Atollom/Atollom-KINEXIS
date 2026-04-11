"use client";

import { useState } from "react";
import { FacturapiStatus } from "@/components/erp/FacturapiStatus";
import { CFDITable } from "@/components/erp/CFDITable";
import { NewCFDIModal } from "@/components/erp/NewCFDIModal";

const FISCAL_METRICS = [
  {
    label: "SAT Code Compliance",
    value: "99.1%",
    sub: "134 CFDIs válidos / 135 emitidos",
    icon: "verified",
    trend: "+0.4% vs mes anterior",
    color: "text-primary-container",
  },
  {
    label: "Monthly Tax Summary",
    value: "$48,320",
    sub: "MXN en ingresos facturados — abril 2026",
    icon: "receipt_long",
    trend: "IVA acumulado: $7,731",
    color: "text-tertiary",
  },
];

export default function CFDIPage() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="px-4 md:px-6 py-6 max-w-5xl mx-auto space-y-6">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <header className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <p className="label-sm text-on-surface-variant mb-1 uppercase tracking-widest">
            ERP · Facturación
          </p>
          <h1 className="font-headline text-4xl font-black tracking-tight text-on-surface uppercase leading-none">
            CFDI 4.0
            <span className="ml-3 font-headline text-lg font-medium italic text-primary-container align-middle">
              Live
            </span>
          </h1>
          <p className="text-on-surface-variant text-sm mt-1">
            Status
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="btn-volt flex items-center gap-2 px-5 py-3"
          aria-label="Crear nueva factura CFDI"
        >
          <span className="material-symbols-outlined text-sm" aria-hidden="true">add</span>
          NUEVA FACTURA
        </button>
      </header>

      {/* ── Fiscal KPI cards ──────────────────────────────────────── */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4" aria-label="Métricas fiscales">
        {FISCAL_METRICS.map((m) => (
          <div key={m.label} className="kpi-card group relative overflow-hidden">
            {/* Subtle glow orb */}
            <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-primary-container/5 blur-2xl pointer-events-none" />

            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="label-sm text-on-surface-variant uppercase tracking-widest mb-3">
                  {m.label}
                </p>
                <p className={`font-headline text-5xl font-black tracking-tight ${m.color}`}>
                  {m.value}
                </p>
                <p className="text-on-surface-variant text-xs mt-2 leading-relaxed">
                  {m.sub}
                </p>
                <p className="text-on-surface-variant/60 text-[10px] mt-1 font-mono">
                  {m.trend}
                </p>
              </div>
              <span
                className={`material-symbols-outlined text-3xl opacity-30 ${m.color} ml-4`}
                aria-hidden="true"
              >
                {m.icon}
              </span>
            </div>
          </div>
        ))}
      </section>

      {/* ── Facturapi Connection ────────────────────────────────── */}
      <FacturapiStatus latencyMs={42} version="2.4.0" isConnected />

      {/* ── CFDI Table ──────────────────────────────────────────── */}
      <CFDITable />

      {/* ── Quick actions footer ────────────────────────────────── */}
      <section
        className="grid grid-cols-2 sm:grid-cols-4 gap-3"
        aria-label="Acciones rápidas CFDI"
      >
        {[
          { icon: "download",        label: "Descargar XML" },
          { icon: "picture_as_pdf",  label: "Descargar PDF" },
          { icon: "cancel",          label: "Solicitar Cancel." },
          { icon: "sync",            label: "Sincronizar SAT" },
        ].map((a) => (
          <button
            key={a.label}
            className="btn-glass flex flex-col items-center gap-2 py-4 text-center"
            aria-label={a.label}
          >
            <span className="material-symbols-outlined text-xl text-on-surface-variant" aria-hidden="true">
              {a.icon}
            </span>
            <span className="label-sm text-on-surface-variant">{a.label}</span>
          </button>
        ))}
      </section>

      {/* ── Modal ───────────────────────────────────────────────── */}
      <NewCFDIModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
