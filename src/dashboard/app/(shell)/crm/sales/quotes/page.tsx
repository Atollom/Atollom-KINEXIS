"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/components/ToastProvider";

interface Quote {
  id: string;
  folio: string;
  client: string;
  rfc: string;
  amount: number;
  items: number;
  status: "draft" | "sent" | "viewed" | "accepted" | "rejected";
  created_at: string;
  expires_at: string;
  agent: string;
  channel: string;
}

interface QuotesStats {
  total: number;
  draft: number;
  sent: number;
  viewed: number;
  accepted: number;
  rejected: number;
  total_amount: number;
  accepted_amount: number;
  conversion_rate: number;
  avg_ticket: number;
}

type FilterKey = "all" | "draft" | "sent" | "viewed" | "accepted" | "rejected";

const FALLBACK_QUOTES: Quote[] = [
  { id: "q1", folio: "COT-2026-089", client: "Constructora ABC S.A.",     rfc: "CAB850101ABC", amount: 87450,  items: 12, status: "accepted", created_at: "2026-05-01", expires_at: "2026-05-31", agent: "Ana López",  channel: "WhatsApp" },
  { id: "q2", folio: "COT-2026-090", client: "Ferretería El Martillo",    rfc: "FEM920301XYZ", amount: 34200,  items: 6,  status: "viewed",   created_at: "2026-05-03", expires_at: "2026-06-02", agent: "Carlos R.",  channel: "Email"    },
  { id: "q3", folio: "COT-2026-091", client: "Industrias Monterrey S.A.", rfc: "IMO780615DEF", amount: 156780, items: 23, status: "sent",     created_at: "2026-05-05", expires_at: "2026-06-04", agent: "María G.",   channel: "Email"    },
  { id: "q4", folio: "COT-2026-092", client: "Grupo Constructor Norte",   rfc: "GCN910204GHI", amount: 45300,  items: 8,  status: "draft",    created_at: "2026-05-07", expires_at: "2026-06-06", agent: "Roberto M.", channel: "Directo"  },
  { id: "q5", folio: "COT-2026-093", client: "Tornillos y Perfiles SA",   rfc: "TYP850722JKL", amount: 23100,  items: 4,  status: "rejected", created_at: "2026-05-02", expires_at: "2026-05-22", agent: "Ana López",  channel: "WhatsApp" },
  { id: "q6", folio: "COT-2026-094", client: "Herramientas Durango S.A.", rfc: "HDU930918MNO", amount: 98560,  items: 17, status: "viewed",   created_at: "2026-05-08", expires_at: "2026-06-07", agent: "Carlos R.",  channel: "Email"    },
];

const FALLBACK_STATS: QuotesStats = {
  total: 6, draft: 1, sent: 1, viewed: 2, accepted: 1, rejected: 1,
  total_amount: 445390, accepted_amount: 87450, conversion_rate: 16.7, avg_ticket: 74232,
};

const STATUS_CFG: Record<Quote["status"], { label: string; color: string; bg: string; icon: string }> = {
  draft:    { label: "Borrador",  color: "text-on-surface/50", bg: "bg-white/5",      icon: "edit_note"    },
  sent:     { label: "Enviada",   color: "text-blue-400",      bg: "bg-blue-400/10",  icon: "send"         },
  viewed:   { label: "Vista",     color: "text-amber-400",     bg: "bg-amber-400/10", icon: "visibility"   },
  accepted: { label: "Aceptada",  color: "text-[#CCFF00]",     bg: "bg-[#CCFF00]/10", icon: "check_circle" },
  rejected: { label: "Rechazada", color: "text-red-400",       bg: "bg-red-400/10",   icon: "cancel"       },
};

function fmtDate(iso: string) {
  const d = new Date(iso);
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear().toString().slice(-2)}`;
}
function fmtK(n: number) { return n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${n}`; }

// Builds a demo PDF payload from a quote row (uses placeholder items matching the known total)
function quoteToPayload(q: Quote) {
  const unitPrice = Math.round(q.amount / 1.16 / q.items);
  return {
    customer: { name: q.client, rfc: q.rfc, contact: q.agent, email: `ventas@${q.client.toLowerCase().replace(/\s/g, "").slice(0, 12)}.mx` },
    items: Array.from({ length: q.items }, (_, i) => ({
      sku:         `SKU-${(i + 1).toString().padStart(3, "0")}`,
      description: `Producto ${i + 1}`,
      quantity:    1,
      unit_price:  unitPrice,
    })),
    payment_terms: "30_days",
    valid_until:   q.expires_at,
    notes:         "",
    tax_rate:      0.16,
  };
}

export default function CRMQuotesPage() {
  const { showToast } = useToast();
  const [filter, setFilter] = useState<FilterKey>("all");
  const [search, setSearch] = useState("");
  const [quotes, setQuotes] = useState<Quote[]>(FALLBACK_QUOTES);
  const [stats, setStats] = useState<QuotesStats>(FALLBACK_STATS);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/crm/quotes")
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d.quotes))      setQuotes(d.quotes);
        if (d.stats?.total !== undefined) setStats(d.stats);
      })
      .catch(() => {});
  }, []);

  const base = filter === "all" ? quotes : quotes.filter(q => q.status === filter);
  const visible = search
    ? base.filter(q =>
        q.client.toLowerCase().includes(search.toLowerCase()) ||
        q.folio.toLowerCase().includes(search.toLowerCase()) ||
        q.rfc.toLowerCase().includes(search.toLowerCase())
      )
    : base;

  const counts: Record<FilterKey, number> = {
    all:      quotes.length,
    draft:    stats.draft,
    sent:     stats.sent,
    viewed:   stats.viewed,
    accepted: stats.accepted,
    rejected: stats.rejected,
  };

  async function downloadPDF(q: Quote) {
    setDownloadingId(q.id);
    try {
      const res = await fetch("/api/quotes/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(quoteToPayload(q)),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `${q.folio}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      showToast({ type: "success", title: "PDF descargado", message: `${q.folio} → descarga iniciada` });
    } catch {
      showToast({ type: "error", title: "Error PDF", message: "No se pudo generar el PDF. Verifica la conexión." });
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <div className="space-y-10 animate-in">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="text-[0.75rem] font-bold label-tracking text-purple-400 drop-shadow-[0_0_8px_rgba(192,132,252,0.3)]">
              CRM / Ventas / Cotizaciones
            </span>
            <span className="px-2 py-1 rounded-full bg-purple-400/10 border border-purple-400/20 text-[9px] font-black label-tracking text-purple-400">
              AGENTE #32
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tight-tracking text-on-surface">
            Cotizaciones
          </h1>
          <p className="text-sm text-on-surface-variant">
            {stats.total} cotizaciones ·{" "}
            <span className="text-purple-400 font-bold">${(stats.total_amount / 1000).toFixed(0)}k</span>{" "}
            en pipeline
          </p>
        </div>
        <div className="flex gap-3 self-start md:self-auto">
          <button
            onClick={() => showToast({ type: "info", title: "Exportando", message: "Generando reporte de cotizaciones → Excel" })}
            className="px-6 py-3 glass-card border-white/5 rounded-2xl text-[10px] font-black label-tracking text-on-surface-variant hover:border-purple-400/20 transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined !text-[16px]">download</span>
            EXPORTAR
          </button>
          <button
            onClick={() => showToast({ type: "success", title: "Cotización creada", message: "Agente #32 generó borrador COT-2026-095" })}
            className="px-6 py-3 rounded-2xl bg-purple-500 text-white text-[10px] font-black label-tracking hover:bg-purple-400 transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined !text-[16px]">add_circle</span>
            NUEVA COTIZACIÓN
          </button>
        </div>
      </header>

      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: "Total Pipeline",  value: `$${(stats.total_amount / 1000).toFixed(0)}k`,    icon: "paid",            color: "text-purple-400" },
          { label: "Aceptadas",       value: `$${(stats.accepted_amount / 1000).toFixed(0)}k`, icon: "check_circle",    color: "text-[#CCFF00]"  },
          { label: "Conversión",      value: `${stats.conversion_rate}%`,                       icon: "percent",         color: "text-amber-400"  },
          { label: "Ticket Promedio", value: `$${(stats.avg_ticket / 1000).toFixed(0)}k`,       icon: "receipt_long",    color: "text-blue-400"   },
          { label: "Pendientes",      value: stats.sent + stats.viewed,                         icon: "pending_actions", color: "text-orange-400" },
        ].map(kpi => (
          <div key={kpi.label} className="glass-card rounded-[1.5rem] border border-white/5 p-6">
            <div className="flex items-center gap-3 mb-3">
              <span className={`material-symbols-outlined !text-[18px] ${kpi.color}`}>{kpi.icon}</span>
              <span className="text-[9px] font-black label-tracking text-on-surface/40 uppercase">{kpi.label}</span>
            </div>
            <p className="text-2xl font-black tight-tracking text-on-surface">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Filters + Search */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          {(["all", "draft", "sent", "viewed", "accepted", "rejected"] as FilterKey[]).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black label-tracking transition-all ${
                filter === f
                  ? "bg-purple-500 text-white"
                  : "glass-card border border-white/5 text-on-surface-variant hover:border-purple-400/20"
              }`}
            >
              {f === "all" ? "TODAS" : f === "draft" ? "BORRADOR" : f === "sent" ? "ENVIADAS" : f === "viewed" ? "VISTAS" : f === "accepted" ? "ACEPTADAS" : "RECHAZADAS"}
              {" "}({counts[f]})
            </button>
          ))}
        </div>
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface/30 !text-[16px]">search</span>
          <input
            type="text"
            placeholder="Buscar cliente, folio, RFC..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-[11px] font-medium text-on-surface placeholder:text-on-surface/30 focus:border-purple-400/50 outline-none w-64"
          />
        </div>
      </div>

      {/* Quotes table */}
      <div className="glass-card rounded-[2rem] border border-white/5 overflow-hidden">
        <div className="grid grid-cols-[1fr_1.8fr_1fr_0.8fr_0.8fr_1fr_1fr_auto] gap-3 px-8 py-4 border-b border-white/5">
          {["Folio", "Cliente", "RFC", "Monto", "Items", "Creada", "Vence", ""].map((h, i) => (
            <span key={i} className="text-[9px] font-black label-tracking text-on-surface/30 uppercase">{h}</span>
          ))}
        </div>

        <div className="divide-y divide-white/5">
          {visible.map(q => {
            const sCfg = STATUS_CFG[q.status];
            const isExpiring = new Date(q.expires_at).getTime() < Date.now() + 5 * 86400000;
            const isActive   = q.status !== "accepted" && q.status !== "rejected";
            const isLoading  = downloadingId === q.id;
            return (
              <div
                key={q.id}
                className="grid grid-cols-[1fr_1.8fr_1fr_0.8fr_0.8fr_1fr_1fr_auto] gap-3 items-center px-8 py-5 hover:bg-white/[0.02] transition-colors group"
              >
                <div className="min-w-0">
                  <p className="text-xs font-black text-on-surface font-mono">{q.folio}</p>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-black mt-1 ${sCfg.color} ${sCfg.bg}`}>
                    <span className="material-symbols-outlined !text-[9px]">{sCfg.icon}</span>
                    {sCfg.label.toUpperCase()}
                  </span>
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-bold text-on-surface truncate">{q.client}</p>
                  <p className="text-[9px] text-on-surface/40 mt-0.5">{q.agent} · {q.channel}</p>
                </div>

                <span className="text-[10px] font-mono text-on-surface/50 truncate">{q.rfc}</span>
                <span className="text-xs font-black text-on-surface">{fmtK(q.amount)}</span>
                <span className="text-xs text-on-surface/50">{q.items} art.</span>
                <span className="text-[10px] text-on-surface/50">{fmtDate(q.created_at)}</span>

                <div>
                  <span className={`text-[10px] font-bold ${isExpiring && isActive ? "text-amber-400" : "text-on-surface/50"}`}>
                    {fmtDate(q.expires_at)}
                  </span>
                  {isExpiring && isActive && (
                    <p className="text-[8px] text-amber-400/70">Pronto a vencer</p>
                  )}
                </div>

                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => downloadPDF(q)}
                    disabled={isLoading}
                    className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-on-surface/60 text-[9px] font-black hover:bg-white/10 transition-colors flex items-center gap-1 disabled:opacity-40"
                  >
                    {isLoading
                      ? <span className="material-symbols-outlined !text-[10px] animate-spin">progress_activity</span>
                      : <span className="material-symbols-outlined !text-[10px]">picture_as_pdf</span>
                    }
                    PDF
                  </button>
                  {isActive && (
                    <button
                      onClick={() => showToast({ type: "success", title: "Cotización enviada", message: `${q.folio} → ${q.client}` })}
                      className="px-2 py-1 rounded-lg bg-purple-400/10 border border-purple-400/20 text-purple-400 text-[9px] font-black hover:bg-purple-400/20 transition-colors whitespace-nowrap flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined !text-[10px]">send</span>
                      ENVIAR
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="h-10" />
    </div>
  );
}
