"use client";

import { useState, useMemo } from "react";
import { CFDI_EMITIDAS, CFDI_STATS, type CFDIFactura } from "@/lib/mockData";
import { useToast } from "@/components/ToastProvider";

type Filter = "todas" | "vigentes" | "canceladas" | "ppd";

const FMT = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" });

function StatusBadge({ status, complemento }: { status: CFDIFactura["status"]; complemento?: boolean }) {
  if (status === "cancelada") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black label-tracking text-red-400 bg-red-400/10">
        <span className="material-symbols-outlined !text-[10px]">cancel</span>
        CANCELADA
      </span>
    );
  }
  if (complemento) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black label-tracking text-amber-400 bg-amber-400/10">
        <span className="material-symbols-outlined !text-[10px]">pending</span>
        COMP. PEND.
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black label-tracking text-[#CCFF00] bg-[#CCFF00]/10">
      <span className="material-symbols-outlined !text-[10px]">verified</span>
      VIGENTE
    </span>
  );
}

export default function FacturasEmitidasPage() {
  const { showToast } = useToast();
  const [filter, setFilter] = useState<Filter>("todas");

  const filtered = useMemo(() => {
    if (filter === "vigentes") return CFDI_EMITIDAS.filter(f => f.status === "vigente" && !f.complemento_pendiente);
    if (filter === "canceladas") return CFDI_EMITIDAS.filter(f => f.status === "cancelada");
    if (filter === "ppd") return CFDI_EMITIDAS.filter(f => f.metodo_pago === "PPD");
    return CFDI_EMITIDAS;
  }, [filter]);

  const totalFiltrado = filtered.reduce((s, f) => s + f.total, 0);

  const counts = {
    todas: CFDI_EMITIDAS.length,
    vigentes: CFDI_EMITIDAS.filter(f => f.status === "vigente" && !f.complemento_pendiente).length,
    canceladas: CFDI_EMITIDAS.filter(f => f.status === "cancelada").length,
    ppd: CFDI_EMITIDAS.filter(f => f.metodo_pago === "PPD").length,
  };

  function toast(action: string, folio: string) {
    const cfg: Record<string, { type: "success" | "warning" | "info"; title: string }> = {
      xml:    { type: "success", title: "XML Descargado" },
      pdf:    { type: "success", title: "PDF Generado" },
      cancel: { type: "warning", title: "Cancelación Enviada al SAT" },
      comp:   { type: "info",    title: "Complemento de Pago" },
    };
    showToast({ ...cfg[action], message: `Factura ${folio}` });
  }

  return (
    <div className="space-y-10 animate-in">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <span className="text-[0.75rem] font-bold label-tracking text-[#FFE600] drop-shadow-[0_0_8px_rgba(255,230,0,0.3)]">
            ERP · CFDI 4.0 / Facturas Emitidas
          </span>
          <h1 className="text-4xl md:text-5xl font-black tight-tracking text-on-surface">
            Facturas Emitidas
          </h1>
          <p className="text-sm text-on-surface-variant">
            {filtered.length} documentos · <span className="text-primary font-bold">{FMT.format(totalFiltrado)}</span>
          </p>
        </div>
        <a
          href="/erp/cfdi/generate"
          className="px-8 py-4 neon-disruptor rounded-2xl text-[10px] font-black label-tracking shadow-glow self-start md:self-auto flex items-center gap-2"
        >
          <span className="material-symbols-outlined !text-[16px]">add</span>
          NUEVA FACTURA
        </a>
      </header>

      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Emitidas (mes)", value: CFDI_STATS.emitidas.total, icon: "receipt_long", color: "text-primary" },
          { label: "Total Facturado", value: FMT.format(CFDI_STATS.emitidas.monto_total), icon: "payments", color: "text-blue-400" },
          { label: "IVA Acumulado", value: FMT.format(CFDI_STATS.emitidas.iva_total), icon: "account_balance", color: "text-amber-400" },
          { label: "Canceladas", value: CFDI_STATS.emitidas.canceladas, icon: "cancel", color: "text-red-400" },
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
        {(["todas", "vigentes", "canceladas", "ppd"] as Filter[]).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-[10px] font-black label-tracking transition-all ${
              filter === f
                ? "bg-primary text-black"
                : "glass-card border border-white/5 text-on-surface-variant hover:border-primary/20"
            }`}
          >
            {f === "todas" ? "TODAS" : f === "ppd" ? "PPD" : f.toUpperCase()} ({counts[f]})
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="glass-card rounded-[2rem] border border-white/5 overflow-hidden">
        <div className="grid grid-cols-[1.5fr_1.8fr_0.8fr_0.8fr_0.8fr_1fr_auto] gap-4 px-8 py-4 border-b border-white/5">
          {["Folio / UUID", "Receptor", "Subtotal", "IVA", "Total", "Estado", ""].map((h, i) => (
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
                  {new Date(f.fecha_emision).toLocaleDateString("es-MX")}
                </p>
              </div>

              {/* Receptor */}
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-on-surface truncate">{f.receptor_nombre}</p>
                <p className="text-[9px] font-mono text-on-surface/40">{f.receptor_rfc}</p>
                <p className="text-[9px] text-on-surface/30">{f.metodo_pago} · {f.forma_pago}</p>
              </div>

              {/* Subtotal */}
              <p className="text-[11px] font-bold text-on-surface">{FMT.format(f.subtotal)}</p>

              {/* IVA */}
              <p className="text-[11px] text-on-surface/60">{FMT.format(f.iva)}</p>

              {/* Total */}
              <p className="text-[12px] font-black text-on-surface">{FMT.format(f.total)}</p>

              {/* Status */}
              <StatusBadge status={f.status} complemento={f.complemento_pendiente} />

              {/* Actions */}
              <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => toast("xml", f.folio)}
                  className="px-2 py-1 rounded-lg text-[9px] font-black label-tracking text-blue-400 bg-blue-400/10 hover:bg-blue-400/20 transition-colors"
                  title="Descargar XML"
                >
                  XML
                </button>
                <button
                  onClick={() => toast("pdf", f.folio)}
                  className="px-2 py-1 rounded-lg text-[9px] font-black label-tracking text-purple-400 bg-purple-400/10 hover:bg-purple-400/20 transition-colors"
                  title="Descargar PDF"
                >
                  PDF
                </button>
                {f.complemento_pendiente && (
                  <button
                    onClick={() => toast("comp", f.folio)}
                    className="px-2 py-1 rounded-lg text-[9px] font-black label-tracking text-amber-400 bg-amber-400/10 hover:bg-amber-400/20 transition-colors"
                    title="Emitir complemento de pago"
                  >
                    COMP
                  </button>
                )}
                {f.status === "vigente" && (
                  <button
                    onClick={() => toast("cancel", f.folio)}
                    className="w-7 h-7 rounded-lg border border-white/10 hover:border-red-400/40 hover:bg-red-400/10 flex items-center justify-center transition-colors"
                    title="Solicitar cancelación SAT"
                  >
                    <span className="material-symbols-outlined !text-[13px] text-on-surface/30">cancel</span>
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
