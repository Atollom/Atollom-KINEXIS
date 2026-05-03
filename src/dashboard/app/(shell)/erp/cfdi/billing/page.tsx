"use client";

import { useState, useMemo } from "react";
import { CFDI_RECIBIDAS, CFDI_STATS, type CFDIRecibida } from "@/lib/mockData";
import { useToast } from "@/components/ToastProvider";

type Filter = "todas" | "pagadas" | "por_pagar" | "vencidas";

const FMT = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" });

const today = new Date("2026-05-03");

function isVencida(r: CFDIRecibida) {
  return !r.pagada && new Date(r.fecha_vencimiento) < today;
}

function PayBadge({ factura }: { factura: CFDIRecibida }) {
  if (factura.status === "cancelada") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black label-tracking text-red-400 bg-red-400/10">
        <span className="material-symbols-outlined !text-[10px]">cancel</span>
        CANCELADA
      </span>
    );
  }
  if (factura.pagada) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black label-tracking text-[#CCFF00] bg-[#CCFF00]/10">
        <span className="material-symbols-outlined !text-[10px]">check_circle</span>
        PAGADA
      </span>
    );
  }
  if (isVencida(factura)) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black label-tracking text-red-400 bg-red-400/10">
        <span className="material-symbols-outlined !text-[10px]">error</span>
        VENCIDA
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black label-tracking text-amber-400 bg-amber-400/10">
      <span className="material-symbols-outlined !text-[10px]">schedule</span>
      POR PAGAR
    </span>
  );
}

export default function FacturasRecibidasPage() {
  const { showToast } = useToast();
  const [filter, setFilter] = useState<Filter>("todas");

  const filtered = useMemo(() => {
    if (filter === "pagadas") return CFDI_RECIBIDAS.filter(f => f.pagada);
    if (filter === "por_pagar") return CFDI_RECIBIDAS.filter(f => !f.pagada && !isVencida(f) && f.status !== "cancelada");
    if (filter === "vencidas") return CFDI_RECIBIDAS.filter(f => isVencida(f));
    return CFDI_RECIBIDAS;
  }, [filter]);

  const totalFiltrado = filtered.reduce((s, f) => s + f.total, 0);

  const counts = {
    todas: CFDI_RECIBIDAS.length,
    pagadas: CFDI_RECIBIDAS.filter(f => f.pagada).length,
    por_pagar: CFDI_RECIBIDAS.filter(f => !f.pagada && !isVencida(f) && f.status !== "cancelada").length,
    vencidas: CFDI_RECIBIDAS.filter(f => isVencida(f)).length,
  };

  function handlePay(folio: string) {
    showToast({ type: "success", title: "Pago Registrado", message: `Factura ${folio} marcada como pagada` });
  }

  function handleXml(folio: string) {
    showToast({ type: "success", title: "XML Descargado", message: `Factura ${folio}` });
  }

  return (
    <div className="space-y-10 animate-in">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <span className="text-[0.75rem] font-bold label-tracking text-[#FFE600] drop-shadow-[0_0_8px_rgba(255,230,0,0.3)]">
            ERP · CFDI 4.0 / Facturas Recibidas
          </span>
          <h1 className="text-4xl md:text-5xl font-black tight-tracking text-on-surface">
            Facturas Recibidas
          </h1>
          <p className="text-sm text-on-surface-variant">
            {filtered.length} documentos · <span className="text-primary font-bold">{FMT.format(totalFiltrado)}</span>
          </p>
        </div>
        <button
          onClick={() => showToast({ type: "info", title: "Importar XML", message: "Arrastra un XML del SAT para importar la factura recibida" })}
          className="px-8 py-4 neon-disruptor rounded-2xl text-[10px] font-black label-tracking shadow-glow self-start md:self-auto flex items-center gap-2"
        >
          <span className="material-symbols-outlined !text-[16px]">upload_file</span>
          IMPORTAR XML
        </button>
      </header>

      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Recibidas (mes)", value: CFDI_STATS.recibidas.total, icon: "inbox", color: "text-primary" },
          { label: "Total Por Pagar", value: FMT.format(CFDI_STATS.recibidas.monto_total), icon: "payments", color: "text-amber-400" },
          { label: "Pendientes de Pago", value: CFDI_STATS.recibidas.pendientes, icon: "schedule", color: "text-orange-400" },
          { label: "Vencidas", value: CFDI_STATS.recibidas.vencidas, icon: "error", color: "text-red-400" },
        ].map(k => (
          <div key={k.label} className="glass-card p-6 rounded-[1.5rem] border border-white/5">
            <div className="flex items-center gap-2 mb-3">
              <span className={`material-symbols-outlined !text-[18px] ${k.color}`}>{k.icon}</span>
              <span className="text-[9px] font-black label-tracking text-on-surface/40 uppercase">{k.label}</span>
            </div>
            <p className="text-2xl font-black tight-tracking text-on-surface">{k.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {(["todas", "pagadas", "por_pagar", "vencidas"] as Filter[]).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-[10px] font-black label-tracking transition-all ${
              filter === f
                ? "bg-primary text-black"
                : "glass-card border border-white/5 text-on-surface-variant hover:border-primary/20"
            }`}
          >
            {f === "todas" ? "TODAS" : f === "por_pagar" ? "POR PAGAR" : f.toUpperCase()} ({counts[f]})
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="glass-card rounded-[2rem] border border-white/5 overflow-hidden">
        <div className="grid grid-cols-[1.5fr_1.8fr_0.8fr_0.8fr_0.8fr_1fr_auto] gap-4 px-8 py-4 border-b border-white/5">
          {["Folio / UUID", "Emisor", "Subtotal", "IVA", "Total", "Estado", ""].map((h, i) => (
            <span key={i} className="text-[9px] font-black label-tracking text-on-surface/30 uppercase">{h}</span>
          ))}
        </div>

        <div className="divide-y divide-white/5">
          {filtered.map(f => (
            <div
              key={f.id}
              className="grid grid-cols-[1.5fr_1.8fr_0.8fr_0.8fr_0.8fr_1fr_auto] gap-4 items-center px-8 py-5 hover:bg-white/[0.02] transition-colors group"
            >
              {/* Folio */}
              <div>
                <p className="text-[11px] font-black text-primary tight-tracking">{f.folio}</p>
                <p className="text-[9px] text-on-surface/30 font-mono">{f.uuid.substring(0, 8)}…</p>
                <p className="text-[9px] text-on-surface/40 mt-0.5">
                  Vence: {new Date(f.fecha_vencimiento).toLocaleDateString("es-MX")}
                </p>
              </div>

              {/* Emisor */}
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-on-surface truncate">{f.emisor_nombre}</p>
                <p className="text-[9px] font-mono text-on-surface/40">{f.emisor_rfc}</p>
                <p className="text-[9px] text-on-surface/30">
                  {new Date(f.fecha_emision).toLocaleDateString("es-MX")}
                </p>
              </div>

              {/* Subtotal */}
              <p className="text-[11px] font-bold text-on-surface">{FMT.format(f.subtotal)}</p>

              {/* IVA */}
              <p className="text-[11px] text-on-surface/60">{FMT.format(f.iva)}</p>

              {/* Total */}
              <p className="text-[12px] font-black text-on-surface">{FMT.format(f.total)}</p>

              {/* Status */}
              <PayBadge factura={f} />

              {/* Actions */}
              <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleXml(f.folio)}
                  className="px-2 py-1 rounded-lg text-[9px] font-black label-tracking text-blue-400 bg-blue-400/10 hover:bg-blue-400/20 transition-colors"
                  title="Descargar XML"
                >
                  XML
                </button>
                {!f.pagada && f.status !== "cancelada" && (
                  <button
                    onClick={() => handlePay(f.folio)}
                    className="px-2 py-1 rounded-lg text-[9px] font-black label-tracking text-[#CCFF00] bg-[#CCFF00]/10 hover:bg-[#CCFF00]/20 transition-colors"
                    title="Registrar pago"
                  >
                    PAGAR
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="h-10" />
    </div>
  );
}
