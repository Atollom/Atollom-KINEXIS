"use client";

import { useState } from "react";
import { CFDI_EMITIDAS } from "@/lib/mockData";
import { useToast } from "@/components/ToastProvider";

const FMT = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" });
type PrintFormat = "A4" | "thermal" | "carta";

export default function ImpresionFiscalPage() {
  const { showToast } = useToast();
  const [selectedId, setSelectedId] = useState(CFDI_EMITIDAS[0].id);
  const [format, setFormat] = useState<PrintFormat>("A4");

  const factura = CFDI_EMITIDAS.find(f => f.id === selectedId)!;

  function handlePrint() {
    showToast({ type: "success", title: "Enviando a Impresora", message: `${factura.folio} · Formato ${format}` });
  }

  function handlePdf() {
    showToast({ type: "success", title: "PDF Generado", message: `${factura.folio}.pdf listo para descargar` });
  }

  function handleEmail() {
    showToast({ type: "info", title: "Factura Enviada", message: `${factura.folio} enviada al receptor por email` });
  }

  return (
    <div className="space-y-10 animate-in">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <span className="text-[0.75rem] font-bold label-tracking text-[#FFE600] drop-shadow-[0_0_8px_rgba(255,230,0,0.3)]">
            ERP · CFDI 4.0 / Agente #24
          </span>
          <h1 className="text-4xl md:text-5xl font-black tight-tracking text-on-surface">
            Impresión Fiscal
          </h1>
          <p className="text-sm text-on-surface-variant">
            Previsualización y envío de comprobantes CFDI 4.0
          </p>
        </div>
        <div className="flex gap-2 self-start md:self-auto">
          <button
            onClick={handleEmail}
            className="px-5 py-3 glass-card rounded-2xl text-[10px] font-black label-tracking border border-white/10 hover:border-primary/30 text-on-surface/70 flex items-center gap-2 transition-all"
          >
            <span className="material-symbols-outlined !text-[15px]">mail</span>
            ENVIAR
          </button>
          <button
            onClick={handlePdf}
            className="px-5 py-3 glass-card rounded-2xl text-[10px] font-black label-tracking border border-white/10 hover:border-primary/30 text-on-surface/70 flex items-center gap-2 transition-all"
          >
            <span className="material-symbols-outlined !text-[15px]">picture_as_pdf</span>
            PDF
          </button>
          <button
            onClick={handlePrint}
            className="px-8 py-3 neon-disruptor rounded-2xl text-[10px] font-black label-tracking shadow-glow flex items-center gap-2"
          >
            <span className="material-symbols-outlined !text-[15px]">print</span>
            IMPRIMIR
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-6">
        {/* Left: selector + options */}
        <div className="space-y-4">
          {/* Invoice selector */}
          <div className="glass-card rounded-[1.5rem] border border-white/5 p-5 space-y-3">
            <p className="text-[9px] font-black label-tracking text-on-surface/40 uppercase">Seleccionar Factura</p>
            <div className="space-y-1.5">
              {CFDI_EMITIDAS.filter(f => f.status === "vigente").map(f => (
                <button
                  key={f.id}
                  onClick={() => setSelectedId(f.id)}
                  className={`w-full text-left px-4 py-3 rounded-xl transition-all ${
                    selectedId === f.id
                      ? "bg-primary/10 border border-primary/30"
                      : "hover:bg-white/[0.03] border border-transparent"
                  }`}
                >
                  <p className={`text-[10px] font-black tight-tracking ${selectedId === f.id ? "text-primary" : "text-on-surface"}`}>
                    {f.folio}
                  </p>
                  <p className="text-[9px] text-on-surface/40 truncate">{f.receptor_nombre}</p>
                  <p className="text-[9px] font-bold text-on-surface/60">{FMT.format(f.total)}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Format selector */}
          <div className="glass-card rounded-[1.5rem] border border-white/5 p-5 space-y-3">
            <p className="text-[9px] font-black label-tracking text-on-surface/40 uppercase">Formato de Impresión</p>
            <div className="space-y-1.5">
              {([
                { id: "A4", label: "A4 Estándar", desc: "210 × 297 mm" },
                { id: "carta", label: "Carta", desc: "216 × 279 mm" },
                { id: "thermal", label: "Ticket Térmico", desc: "80 mm · Agente #24" },
              ] as { id: PrintFormat; label: string; desc: string }[]).map(f => (
                <button
                  key={f.id}
                  onClick={() => setFormat(f.id)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                    format === f.id
                      ? "bg-primary/10 border border-primary/30"
                      : "hover:bg-white/[0.03] border border-transparent"
                  }`}
                >
                  <div className="text-left">
                    <p className={`text-[10px] font-bold ${format === f.id ? "text-primary" : "text-on-surface"}`}>{f.label}</p>
                    <p className="text-[9px] text-on-surface/40">{f.desc}</p>
                  </div>
                  {format === f.id && (
                    <span className="material-symbols-outlined !text-[16px] text-primary">radio_button_checked</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: invoice preview */}
        <div className="glass-card rounded-[2rem] border border-white/5 overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined !text-[16px] text-on-surface/40">preview</span>
              <span className="text-[9px] font-black label-tracking text-on-surface/40 uppercase">Previsualización — {format}</span>
            </div>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black label-tracking ${
              factura.timbrado ? "text-[#CCFF00] bg-[#CCFF00]/10" : "text-amber-400 bg-amber-400/10"
            }`}>
              <span className="material-symbols-outlined !text-[10px]">{factura.timbrado ? "verified" : "pending"}</span>
              {factura.timbrado ? "TIMBRADO" : "SIN TIMBRAR"}
            </span>
          </div>

          {/* Simulated invoice layout */}
          <div className="p-8 space-y-6">
            {/* Issuer header */}
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[18px] font-black tight-tracking text-on-surface">Kap Tools S.A. de C.V.</p>
                <p className="text-[10px] font-mono text-on-surface/50">RFC: KAP890123ABC</p>
                <p className="text-[9px] text-on-surface/40">Régimen: 601 — General de Ley Personas Morales</p>
                <p className="text-[9px] text-on-surface/40">Lugar de expedición: 72000, Puebla, Pue.</p>
              </div>
              <div className="text-right">
                <p className="text-[20px] font-black tight-tracking text-primary">{factura.folio}</p>
                <p className="text-[9px] font-mono text-on-surface/40">{factura.serie}</p>
                <p className="text-[9px] text-on-surface/40">
                  {new Date(factura.fecha_emision).toLocaleDateString("es-MX", { day: "2-digit", month: "long", year: "numeric" })}
                </p>
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-white/5" />

            {/* Receptor */}
            <div className="space-y-1">
              <p className="text-[9px] font-black label-tracking text-on-surface/30 uppercase">Receptor</p>
              <p className="text-[13px] font-bold text-on-surface">{factura.receptor_nombre}</p>
              <p className="text-[10px] font-mono text-on-surface/50">RFC: {factura.receptor_rfc}</p>
              <p className="text-[9px] text-on-surface/40">Uso CFDI: G03 — Gastos en general</p>
            </div>

            {/* Divider */}
            <div className="h-px bg-white/5" />

            {/* Conceptos (simplified) */}
            <div className="space-y-2">
              <p className="text-[9px] font-black label-tracking text-on-surface/30 uppercase">Conceptos</p>
              <div className="grid grid-cols-[2fr_0.5fr_0.8fr_0.8fr] gap-3 py-2 border-b border-white/5">
                {["Descripción", "Cant.", "P. Unit.", "Importe"].map((h, i) => (
                  <span key={i} className="text-[8px] font-black label-tracking text-on-surface/30 uppercase">{h}</span>
                ))}
              </div>
              <div className="grid grid-cols-[2fr_0.5fr_0.8fr_0.8fr] gap-3 py-2">
                <span className="text-[10px] text-on-surface">Servicios de ferretería y herramientas industriales</span>
                <span className="text-[10px] text-on-surface/60">1.00</span>
                <span className="text-[10px] text-on-surface">{FMT.format(factura.subtotal)}</span>
                <span className="text-[10px] font-bold text-on-surface">{FMT.format(factura.subtotal)}</span>
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-white/5" />

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-56 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-[10px] text-on-surface/50">Subtotal</span>
                  <span className="text-[10px] text-on-surface">{FMT.format(factura.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[10px] text-on-surface/50">IVA 16%</span>
                  <span className="text-[10px] text-on-surface">{FMT.format(factura.iva)}</span>
                </div>
                <div className="h-px bg-white/10 my-1" />
                <div className="flex justify-between">
                  <span className="text-[12px] font-black text-on-surface">Total</span>
                  <span className="text-[12px] font-black text-primary">{FMT.format(factura.total)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[9px] text-on-surface/40">Método de pago</span>
                  <span className="text-[9px] text-on-surface/60">{factura.metodo_pago} · {factura.forma_pago}</span>
                </div>
              </div>
            </div>

            {/* QR / UUID stub */}
            <div className="flex items-start gap-4 pt-2 border-t border-white/5">
              <div className="w-16 h-16 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined !text-[32px] text-on-surface/20">qr_code_2</span>
              </div>
              <div className="space-y-0.5">
                <p className="text-[8px] font-black label-tracking text-on-surface/30 uppercase">Folio Fiscal (UUID)</p>
                <p className="text-[9px] font-mono text-on-surface/50 break-all">{factura.uuid}</p>
                <p className="text-[8px] text-on-surface/30 mt-1">
                  Este documento es una representación impresa de un CFDI. Su validez requiere verificación en el portal del SAT.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="h-10" />
    </div>
  );
}
