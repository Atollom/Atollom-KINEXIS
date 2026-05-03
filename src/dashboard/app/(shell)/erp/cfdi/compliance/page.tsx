"use client";

import { useState } from "react";
import { CFDI_STATS } from "@/lib/mockData";
import { useToast } from "@/components/ToastProvider";

const OBLIGACIONES = [
  { concepto: "Declaración Mensual IVA", mes: "Abril 2026", fecha_limite: "2026-05-17", status: "pendiente" as const },
  { concepto: "Declaración Mensual ISR", mes: "Abril 2026", fecha_limite: "2026-05-17", status: "pendiente" as const },
  { concepto: "DIOT — Operaciones con Terceros", mes: "Abril 2026", fecha_limite: "2026-05-17", status: "pendiente" as const },
  { concepto: "Declaración Mensual IVA", mes: "Marzo 2026", fecha_limite: "2026-04-17", status: "cumplida" as const },
  { concepto: "Declaración Mensual ISR", mes: "Marzo 2026", fecha_limite: "2026-04-17", status: "cumplida" as const },
  { concepto: "DIOT — Operaciones con Terceros", mes: "Marzo 2026", fecha_limite: "2026-04-17", status: "cumplida" as const },
];

const AUDIT_EVENTS = [
  { fecha: "2026-05-02", evento: "Timbrado exitoso F-2026-047", tipo: "success" as const },
  { fecha: "2026-05-01", evento: "Timbrado exitoso F-2026-046", tipo: "success" as const },
  { fecha: "2026-04-28", evento: "Cancelación SAT F-2026-043 aceptada", tipo: "warning" as const },
  { fecha: "2026-04-25", evento: "Certificado SAT validado — sin errores", tipo: "success" as const },
  { fecha: "2026-04-17", evento: "Declaración Mensual presentada — Marzo 2026", tipo: "success" as const },
  { fecha: "2026-04-10", evento: "Intento de timbrado rechazado — RFC inválido", tipo: "error" as const },
];

const SCORE = 94;

export default function CompliancePage() {
  const { showToast } = useToast();
  const [tab, setTab] = useState<"overview" | "obligaciones" | "auditoria">("overview");

  const sat = CFDI_STATS.sat;
  const diasVigencia = Math.round(
    (new Date(sat.vigencia_certificado).getTime() - new Date("2026-05-03").getTime()) / 86_400_000
  );

  function handleReporte() {
    showToast({ type: "info", title: "Generando Reporte", message: "El reporte fiscal mensual se descargará en PDF" });
  }

  function handleVerificar() {
    showToast({ type: "success", title: "Certificado Verificado", message: `PAC ${sat.pac} — latencia ${sat.pac_latencia_ms}ms` });
  }

  return (
    <div className="space-y-10 animate-in">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <span className="text-[0.75rem] font-bold label-tracking text-[#FFE600] drop-shadow-[0_0_8px_rgba(255,230,0,0.3)]">
            ERP · CFDI 4.0 / Compliance SAT
          </span>
          <h1 className="text-4xl md:text-5xl font-black tight-tracking text-on-surface">
            Compliance SAT
          </h1>
          <p className="text-sm text-on-surface-variant">
            RFC: <span className="font-mono text-primary">KAP890123ABC</span> · Kap Tools S.A. de C.V.
          </p>
        </div>
        <button
          onClick={handleReporte}
          className="px-8 py-4 neon-disruptor rounded-2xl text-[10px] font-black label-tracking shadow-glow self-start md:self-auto flex items-center gap-2"
        >
          <span className="material-symbols-outlined !text-[16px]">picture_as_pdf</span>
          REPORTE FISCAL
        </button>
      </header>

      {/* Score + Cert strip */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Compliance Score */}
        <div className="glass-card p-8 rounded-[1.5rem] border border-white/5 flex flex-col items-center justify-center gap-4">
          <div className="relative w-28 h-28">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
              <circle
                cx="50" cy="50" r="42" fill="none"
                stroke="#CCFF00" strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 42 * SCORE / 100} ${2 * Math.PI * 42}`}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-black tight-tracking text-primary">{SCORE}</span>
              <span className="text-[8px] font-black label-tracking text-on-surface/40">SCORE</span>
            </div>
          </div>
          <div className="text-center">
            <p className="text-[11px] font-black text-on-surface">Cumplimiento Fiscal</p>
            <p className="text-[9px] text-on-surface/40">Excelente · Mayo 2026</p>
          </div>
        </div>

        {/* Certificado SAT */}
        <div className="glass-card p-6 rounded-[1.5rem] border border-white/5 space-y-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined !text-[18px] text-[#CCFF00]">verified_user</span>
            <span className="text-[9px] font-black label-tracking text-on-surface/40 uppercase">Certificado SAT</span>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-on-surface/60">Estado</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black label-tracking text-[#CCFF00] bg-[#CCFF00]/10">
                <span className="material-symbols-outlined !text-[10px]">verified</span>
                VIGENTE
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-on-surface/60">Vigencia</span>
              <span className="text-[10px] font-bold text-on-surface">{sat.vigencia_certificado} <span className="text-on-surface/40">({diasVigencia}d)</span></span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-on-surface/60">PAC</span>
              <span className="text-[10px] font-bold text-on-surface">{sat.pac}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-on-surface/60">Latencia PAC</span>
              <span className="text-[10px] font-bold text-[#CCFF00]">{sat.pac_latencia_ms}ms</span>
            </div>
          </div>
          <button
            onClick={handleVerificar}
            className="w-full py-2 rounded-xl text-[9px] font-black label-tracking border border-white/10 hover:border-primary/30 hover:bg-primary/5 transition-all text-on-surface/60"
          >
            VERIFICAR CONEXIÓN
          </button>
        </div>

        {/* Sellos */}
        <div className="glass-card p-6 rounded-[1.5rem] border border-white/5 space-y-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined !text-[18px] text-blue-400">approval</span>
            <span className="text-[9px] font-black label-tracking text-on-surface/40 uppercase">Sellos Digitales</span>
          </div>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between mb-1.5">
                <span className="text-[10px] text-on-surface/60">Usados este mes</span>
                <span className="text-[10px] font-bold text-on-surface">{sat.sellos_usados_mes.toLocaleString()} / {sat.sellos_disponibles.toLocaleString()}</span>
              </div>
              <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full rounded-full bg-blue-400"
                  style={{ width: `${(sat.sellos_usados_mes / sat.sellos_disponibles) * 100}%` }}
                />
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-on-surface/60">Disponibles</span>
              <span className="text-[10px] font-bold text-[#CCFF00]">{(sat.sellos_disponibles - sat.sellos_usados_mes).toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-on-surface/60">Complementos pendientes</span>
              <span className="text-[10px] font-bold text-amber-400">{CFDI_STATS.complementos.pendientes}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-on-surface/60">Monto cubierto</span>
              <span className="text-[10px] font-bold text-on-surface">
                {new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(CFDI_STATS.complementos.monto_cubierto)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {(["overview", "obligaciones", "auditoria"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl text-[10px] font-black label-tracking transition-all ${
              tab === t
                ? "bg-primary text-black"
                : "glass-card border border-white/5 text-on-surface-variant hover:border-primary/20"
            }`}
          >
            {t === "overview" ? "RESUMEN" : t === "obligaciones" ? "OBLIGACIONES" : "AUDITORÍA"}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { icon: "receipt_long", label: "Emitidas mes", value: CFDI_STATS.emitidas.total, sub: `${CFDI_STATS.emitidas.vigentes} vigentes`, color: "text-primary" },
            { icon: "inbox", label: "Recibidas mes", value: CFDI_STATS.recibidas.total, sub: `${CFDI_STATS.recibidas.pagadas} pagadas`, color: "text-blue-400" },
            { icon: "pending_actions", label: "Complementos pendientes", value: CFDI_STATS.complementos.pendientes, sub: "de 12 emitidos", color: "text-amber-400" },
            { icon: "cancel", label: "Canceladas mes", value: CFDI_STATS.emitidas.canceladas, sub: "0 reclamadas SAT", color: "text-red-400" },
          ].map(k => (
            <div key={k.label} className="glass-card p-6 rounded-[1.5rem] border border-white/5 flex items-center gap-5">
              <div className={`w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center flex-shrink-0`}>
                <span className={`material-symbols-outlined !text-[24px] ${k.color}`}>{k.icon}</span>
              </div>
              <div>
                <p className="text-[9px] font-black label-tracking text-on-surface/40 uppercase">{k.label}</p>
                <p className="text-3xl font-black tight-tracking text-on-surface">{k.value}</p>
                <p className="text-[9px] text-on-surface/40">{k.sub}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "obligaciones" && (
        <div className="glass-card rounded-[2rem] border border-white/5 overflow-hidden">
          <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-4 px-8 py-4 border-b border-white/5">
            {["Obligación", "Período", "Fecha Límite", "Estado"].map((h, i) => (
              <span key={i} className="text-[9px] font-black label-tracking text-on-surface/30 uppercase">{h}</span>
            ))}
          </div>
          <div className="divide-y divide-white/5">
            {OBLIGACIONES.map((o, i) => (
              <div key={i} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-4 items-center px-8 py-5">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined !text-[16px] text-on-surface/30">gavel</span>
                  <span className="text-[11px] font-bold text-on-surface">{o.concepto}</span>
                </div>
                <span className="text-[10px] text-on-surface/60">{o.mes}</span>
                <span className="text-[10px] font-mono text-on-surface/60">{o.fecha_limite}</span>
                {o.status === "cumplida" ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black label-tracking text-[#CCFF00] bg-[#CCFF00]/10">
                    <span className="material-symbols-outlined !text-[10px]">check_circle</span>
                    CUMPLIDA
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black label-tracking text-amber-400 bg-amber-400/10">
                    <span className="material-symbols-outlined !text-[10px]">schedule</span>
                    PENDIENTE
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "auditoria" && (
        <div className="glass-card rounded-[2rem] border border-white/5 overflow-hidden">
          <div className="grid grid-cols-[0.6fr_2fr_auto] gap-4 px-8 py-4 border-b border-white/5">
            {["Fecha", "Evento", "Tipo"].map((h, i) => (
              <span key={i} className="text-[9px] font-black label-tracking text-on-surface/30 uppercase">{h}</span>
            ))}
          </div>
          <div className="divide-y divide-white/5">
            {AUDIT_EVENTS.map((e, i) => {
              const iconMap = { success: { icon: "check_circle", color: "text-[#CCFF00]" }, warning: { icon: "warning", color: "text-amber-400" }, error: { icon: "error", color: "text-red-400" } };
              const { icon, color } = iconMap[e.tipo];
              return (
                <div key={i} className="grid grid-cols-[0.6fr_2fr_auto] gap-4 items-center px-8 py-4">
                  <span className="text-[9px] font-mono text-on-surface/40">{e.fecha}</span>
                  <span className="text-[11px] text-on-surface">{e.evento}</span>
                  <span className={`material-symbols-outlined !text-[18px] ${color}`}>{icon}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="h-10" />
    </div>
  );
}
