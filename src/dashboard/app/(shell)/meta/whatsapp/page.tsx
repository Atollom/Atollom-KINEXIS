"use client";

import { useState } from "react";
import { useToast } from "@/components/ToastProvider";
import { mockWhatsAppTemplates, mockWhatsAppBroadcasts, mockWhatsAppStats } from "@/lib/mockData";
import type { WhatsAppTemplate, WhatsAppBroadcast } from "@/lib/mockData";

const CATEGORY_CFG: Record<WhatsAppTemplate["category"], { label: string; color: string; bg: string }> = {
  marketing:      { label: "Marketing",      color: "text-[#CCFF00]",  bg: "bg-[#CCFF00]/10"  },
  utility:        { label: "Utilidad",        color: "text-blue-400",   bg: "bg-blue-400/10"   },
  authentication: { label: "Autenticación",   color: "text-amber-400",  bg: "bg-amber-400/10"  },
};

const BCAST_STATUS_CFG: Record<WhatsAppBroadcast["status"], { label: string; color: string; bg: string; icon: string }> = {
  draft:     { label: "Borrador",   color: "text-on-surface/40", bg: "bg-white/5",          icon: "edit_note"       },
  scheduled: { label: "Programado", color: "text-amber-400",     bg: "bg-amber-400/10",     icon: "schedule"        },
  sending:   { label: "Enviando",   color: "text-blue-400",      bg: "bg-blue-400/10",      icon: "sync"            },
  completed: { label: "Completado", color: "text-[#CCFF00]",     bg: "bg-[#CCFF00]/10",     icon: "check_circle"    },
  failed:    { label: "Fallido",    color: "text-red-400",       bg: "bg-red-400/10",       icon: "cancel"          },
};

function fmtDate(iso: string) {
  const d = new Date(iso);
  return `${d.getDate()}/${d.getMonth() + 1} ${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function MetricBar({ value, total, color }: { value: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[9px] font-black text-on-surface/50 w-6 text-right">{pct}%</span>
    </div>
  );
}

export default function WhatsAppManagementPage() {
  const { showToast } = useToast();
  const [tab, setTab] = useState<"templates" | "broadcasts">("templates");

  return (
    <div className="space-y-10 animate-in">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="text-[0.75rem] font-bold label-tracking text-[#CCFF00] drop-shadow-[0_0_8px_rgba(204,255,0,0.3)]">
              Meta / WhatsApp Business
            </span>
            <span className="px-2 py-1 rounded-full bg-[#25D366]/10 border border-[#25D366]/20 text-[9px] font-black label-tracking text-[#25D366]">
              AGENTE WA
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tight-tracking text-on-surface">
            WhatsApp Business
          </h1>
          <p className="text-sm text-on-surface-variant">
            Templates · Broadcasts · {mockWhatsAppStats.messages_sent_month.toLocaleString()} mensajes este mes
          </p>
        </div>
        <div className="flex gap-3 self-start md:self-auto">
          <button
            onClick={() => showToast({ type: "info", title: "Nuevo template", message: "Agente WA abriendo editor de plantilla" })}
            className="px-5 py-2.5 glass-card border-white/5 rounded-2xl text-[10px] font-black label-tracking text-on-surface-variant hover:border-[#25D366]/30 transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined !text-[16px]">add</span>
            TEMPLATE
          </button>
          <button
            onClick={() => showToast({ type: "success", title: "Nuevo broadcast", message: "Configurando campaña WhatsApp" })}
            className="px-5 py-2.5 rounded-2xl text-[10px] font-black label-tracking transition-all flex items-center gap-2 text-black"
            style={{ backgroundColor: "#25D366" }}
          >
            <span className="material-symbols-outlined !text-[16px]">campaign</span>
            BROADCAST
          </button>
        </div>
      </header>

      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Mensajes (mes)",   value: mockWhatsAppStats.messages_sent_month.toLocaleString(), icon: "chat",        color: "text-[#25D366]"  },
          { label: "Tasa Entrega",     value: `${mockWhatsAppStats.avg_delivery_rate}%`,              icon: "done_all",    color: "text-[#CCFF00]"  },
          { label: "Tasa Lectura",     value: `${mockWhatsAppStats.avg_read_rate}%`,                  icon: "visibility",  color: "text-blue-400"   },
          { label: "Tasa Respuesta",   value: `${mockWhatsAppStats.avg_reply_rate}%`,                 icon: "reply",       color: "text-amber-400"  },
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

      {/* Tab switcher */}
      <div className="flex gap-2">
        {(["templates", "broadcasts"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2.5 rounded-xl text-[10px] font-black label-tracking transition-all ${
              tab === t
                ? "text-black"
                : "glass-card border border-white/5 text-on-surface-variant hover:border-[#25D366]/20"
            }`}
            style={tab === t ? { backgroundColor: "#25D366" } : undefined}
          >
            {t === "templates"
              ? `TEMPLATES (${mockWhatsAppStats.total_templates})`
              : `BROADCASTS (${mockWhatsAppStats.total_broadcasts})`}
          </button>
        ))}
      </div>

      {/* TEMPLATES */}
      {tab === "templates" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {mockWhatsAppTemplates.map(tpl => {
            const cCfg = CATEGORY_CFG[tpl.category];
            return (
              <div key={tpl.id} className="glass-card rounded-[2rem] border border-white/5 p-6 hover:bg-white/[0.02] transition-colors group">
                {/* Template header */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-xs font-black text-on-surface font-mono">{tpl.name}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-[8px] font-black ${cCfg.color} ${cCfg.bg}`}>
                        {cCfg.label.toUpperCase()}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[8px] font-black ${
                        tpl.status === "approved" ? "text-[#25D366] bg-[#25D366]/10" :
                        tpl.status === "pending"  ? "text-amber-400 bg-amber-400/10" :
                        "text-red-400 bg-red-400/10"
                      }`}>
                        {tpl.status === "approved" ? "✓ APROBADA" : tpl.status === "pending" ? "PENDIENTE" : "RECHAZADA"}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-on-surface">{tpl.total_sent.toLocaleString()}</p>
                    <p className="text-[9px] text-on-surface/30">enviados</p>
                  </div>
                </div>

                {/* Components preview */}
                <div className="space-y-2 mb-4">
                  {tpl.components.map((comp, i) => (
                    <div key={i} className="rounded-xl bg-white/[0.03] border border-white/5 p-3">
                      <p className="text-[8px] font-black label-tracking text-on-surface/30 uppercase mb-1">{comp.type}</p>
                      <p className="text-[10px] text-on-surface/70 leading-relaxed">{comp.content}</p>
                      {comp.variables && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {comp.variables.map((v, j) => (
                            <span key={j} className="px-1.5 py-0.5 rounded bg-blue-400/10 text-blue-400 text-[8px] font-mono">
                              {`{{${v}}}`}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-[9px] text-on-surface/30">
                    {tpl.last_sent ? `Último envío ${fmtDate(tpl.last_sent)}` : "Sin envíos aún"}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => showToast({ type: "info", title: "Test enviado", message: `"${tpl.name}" enviado a tu WhatsApp` })}
                      className="px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 text-on-surface/60 text-[9px] font-black hover:bg-white/10 transition-colors"
                    >
                      TEST
                    </button>
                    {tpl.status === "approved" && (
                      <button
                        onClick={() => showToast({ type: "success", title: "Broadcast iniciado", message: `Usando template "${tpl.name}"` })}
                        className="px-2.5 py-1 rounded-xl text-black text-[9px] font-black transition-colors"
                        style={{ backgroundColor: "#25D366" }}
                      >
                        BROADCAST
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* BROADCASTS */}
      {tab === "broadcasts" && (
        <div className="space-y-4">
          {mockWhatsAppBroadcasts.map(bc => {
            const sCfg = BCAST_STATUS_CFG[bc.status];
            return (
              <div key={bc.id} className="glass-card rounded-[2rem] border border-white/5 p-6">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-black text-on-surface">{bc.name}</h3>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-black ${sCfg.color} ${sCfg.bg}`}>
                        <span className="material-symbols-outlined !text-[9px]">{sCfg.icon}</span>
                        {sCfg.label.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-[10px] text-on-surface/40 font-mono">{bc.template_name}</p>
                    {bc.scheduled_at && (
                      <p className="text-[9px] text-on-surface/30 mt-0.5">
                        {bc.status === "completed" && bc.completed_at ? `Completado ${fmtDate(bc.completed_at)}` : `Programado ${fmtDate(bc.scheduled_at)}`}
                      </p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-lg font-black text-on-surface">{bc.recipients.toLocaleString()}</p>
                    <p className="text-[9px] text-on-surface/30">destinatarios</p>
                  </div>
                </div>

                {bc.status === "completed" || bc.status === "sending" ? (
                  <div className="space-y-2">
                    {[
                      { label: "Entregados", value: bc.delivered, color: "bg-[#CCFF00]" },
                      { label: "Leídos",     value: bc.read,      color: "bg-blue-400"  },
                      { label: "Respuestas", value: bc.replied,   color: "bg-amber-400" },
                    ].map(m => (
                      <div key={m.label} className="grid grid-cols-[80px_1fr_40px] items-center gap-3">
                        <span className="text-[9px] font-black text-on-surface/40 label-tracking">{m.label.toUpperCase()}</span>
                        <MetricBar value={m.value} total={bc.recipients} color={m.color} />
                        <span className="text-[9px] font-black text-on-surface text-right">{m.value.toLocaleString()}</span>
                      </div>
                    ))}
                    {bc.failed > 0 && (
                      <p className="text-[9px] text-red-400">{bc.failed} fallidos</p>
                    )}
                  </div>
                ) : bc.status === "scheduled" ? (
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined !text-[14px] text-amber-400">schedule</span>
                    <p className="text-[10px] text-amber-400">Envío automático programado</p>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}

      <div className="h-10" />
    </div>
  );
}
