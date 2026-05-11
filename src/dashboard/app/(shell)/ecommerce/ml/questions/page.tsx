"use client";

import { useState } from "react";
import { useToast } from "@/components/ToastProvider";
import { mockMLQuestions, mockMLStats } from "@/lib/mockData";
import type { MLQuestion } from "@/lib/mockData";

type FilterKey = "all" | "unanswered" | "answered";

const SAMANTHA_SUGGESTIONS: Record<string, string> = {
  "1": "Hola! Sí, el compresor incluye manguera de 8 metros y pistola de inflado. Además tiene regulador de presión integrado. ¡Saludos!",
  "2": "Hola! Sí generamos CFDI 4.0. Al concretar tu compra envíanos tus datos fiscales por mensaje y emitimos la factura en el día. ¡Saludos!",
  "3": "Hola! El taladro está disponible en color negro con detalles en verde. ¡Te va a encantar! ¡Saludos!",
};

function fmtRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const hrs = Math.floor(diff / 3_600_000);
  if (hrs < 1) return `hace ${Math.floor(diff / 60000)} min`;
  if (hrs < 24) return `hace ${hrs} hr${hrs > 1 ? "s" : ""}`;
  return `hace ${Math.floor(hrs / 24)} día${Math.floor(hrs / 24) > 1 ? "s" : ""}`;
}

export default function MLQuestionsPage() {
  const { showToast } = useToast();
  const [filter, setFilter] = useState<FilterKey>("all");
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [answered, setAnswered] = useState<Set<string>>(new Set());

  const questions = mockMLQuestions.map(q => ({
    ...q,
    status: answered.has(q.id) ? "answered" as const : q.status,
    answer: answered.has(q.id) ? (drafts[q.id] ?? q.answer) : q.answer,
  }));

  const filtered = filter === "all" ? questions : questions.filter(q => q.status === filter);

  const counts = {
    all:        questions.length,
    unanswered: questions.filter(q => q.status === "unanswered").length,
    answered:   questions.filter(q => q.status === "answered").length,
  };

  function handleSuggest(q: MLQuestion) {
    const suggestion = SAMANTHA_SUGGESTIONS[q.id] ??
      `Hola! Gracias por tu pregunta sobre ${q.item_title}. Con gusto te ayudamos. ¡Saludos!`;
    setDrafts(prev => ({ ...prev, [q.id]: suggestion }));
    showToast({ type: "info", title: "Samantha sugiere", message: "Respuesta AI generada — revísala y envía" });
  }

  function handleAnswer(q: MLQuestion) {
    const text = drafts[q.id]?.trim();
    if (!text) { showToast({ type: "warning", title: "Respuesta vacía", message: "Escribe o usa la sugerencia de Samantha" }); return; }
    setAnswered(prev => new Set([...prev, q.id]));
    showToast({ type: "success", title: "Respondida", message: `${q.from_nickname} → ML API · Agente #27` });
  }

  function handleBulkAuto() {
    const pending = questions.filter(q => q.status === "unanswered");
    if (pending.length === 0) { showToast({ type: "info", title: "Sin pendientes", message: "Todas las preguntas ya fueron respondidas" }); return; }
    const newDrafts: Record<string, string> = {};
    const newAnswered = new Set(answered);
    pending.forEach(q => {
      const suggestion = SAMANTHA_SUGGESTIONS[q.id] ??
        `Hola! Gracias por tu pregunta sobre ${q.item_title}. Te respondemos a la brevedad. ¡Saludos!`;
      newDrafts[q.id] = suggestion;
      newAnswered.add(q.id);
    });
    setDrafts(prev => ({ ...prev, ...newDrafts }));
    setAnswered(newAnswered);
    showToast({ type: "success", title: `${pending.length} preguntas respondidas`, message: "Agente #27 — Respuestas enviadas a ML API" });
  }

  return (
    <div className="space-y-10 animate-in">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="text-[0.75rem] font-bold label-tracking text-[#FFE600] drop-shadow-[0_0_8px_rgba(255,230,0,0.3)]">
              Channel Intelligence / Mercado Libre / Preguntas
            </span>
            <span className="px-2 py-1 rounded-full bg-primary/10 border border-primary/20 text-[9px] font-black label-tracking text-primary">
              AGENTE #27
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tight-tracking text-on-surface">
            Preguntas ML
          </h1>
          <p className="text-sm text-on-surface-variant">
            {counts.unanswered > 0
              ? <><span className="text-red-400 font-bold">{counts.unanswered} sin responder</span> · tiempo máx. ML: 24 hrs</>
              : "Todas las preguntas respondidas ✓"
            }
          </p>
        </div>

        <button onClick={handleBulkAuto}
          className="px-8 py-4 rounded-2xl bg-primary text-black text-[10px] font-black label-tracking hover:bg-primary/90 transition-all flex items-center gap-2 self-start md:self-auto"
        >
          <span className="material-symbols-outlined !text-[16px]">auto_awesome</span>
          RESPONDER TODO CON SAMANTHA
        </button>
      </header>

      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Sin Responder",    value: counts.unanswered,                         icon: "mark_chat_unread", color: "text-red-400"    },
          { label: "Respondidas",      value: counts.answered,                            icon: "mark_chat_read",  color: "text-[#CCFF00]"  },
          { label: "Tiempo Respuesta", value: `${mockMLStats.avg_response_time_hrs} hrs`, icon: "schedule",         color: "text-amber-400"  },
          { label: "Total Preguntas",  value: counts.all,                                 icon: "help",             color: "text-on-surface" },
        ].map(kpi => (
          <div key={kpi.label} className="glass-card rounded-[1.5rem] border border-white/5 p-6">
            <div className="flex items-center gap-3 mb-2">
              <span className={`material-symbols-outlined !text-[18px] ${kpi.color}`}>{kpi.icon}</span>
              <span className="text-[9px] font-black label-tracking text-on-surface/40 uppercase">{kpi.label}</span>
            </div>
            <p className="text-3xl font-black tight-tracking text-on-surface">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {(["all", "unanswered", "answered"] as FilterKey[]).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-[10px] font-black label-tracking transition-all ${
              filter === f ? "bg-primary text-black" : "glass-card border border-white/5 text-on-surface-variant hover:border-primary/20"
            }`}
          >
            {f === "all" ? "TODAS" : f === "unanswered" ? "PENDIENTES" : "RESPONDIDAS"} ({counts[f]})
          </button>
        ))}
      </div>

      {/* Questions list */}
      <div className="space-y-4">
        {filtered.length === 0 && (
          <div className="glass-card rounded-[2rem] border border-white/5 flex flex-col items-center gap-3 py-16 text-center">
            <span className="material-symbols-outlined !text-[40px] text-primary/40">mark_chat_read</span>
            <p className="text-sm font-bold text-on-surface/30">Sin preguntas en esta categoría</p>
          </div>
        )}

        {filtered.map(q => {
          const isPending = q.status === "unanswered";
          return (
            <div key={q.id}
              className={`glass-card rounded-[2rem] border transition-colors p-8 space-y-5 ${
                isPending ? "border-red-400/20 bg-red-400/[0.02]" : "border-white/5"
              }`}
            >
              {/* Question header */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 min-w-0 flex-1">
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1.5 ${
                    isPending ? "bg-red-400 shadow-[0_0_6px_rgba(255,0,85,0.4)] animate-pulse" : "bg-[#CCFF00]/40"
                  }`} />

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="material-symbols-outlined !text-[14px] text-on-surface/40">storefront</span>
                      <span className="text-[10px] font-black label-tracking text-on-surface/50 uppercase">{q.item_title}</span>
                      <span className="text-[9px] text-on-surface/30 font-mono">· {q.item_sku}</span>
                    </div>
                    <p className="text-sm font-bold text-on-surface leading-relaxed">"{q.question}"</p>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <p className="text-[10px] font-black text-on-surface/60">{q.from_nickname}</p>
                  <p className="text-[9px] text-on-surface/30 mt-0.5">{fmtRelative(q.date_created)}</p>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-black label-tracking mt-2 ${
                    isPending ? "bg-red-400/10 text-red-400" : "bg-[#CCFF00]/10 text-[#CCFF00]"
                  }`}>
                    <span className="material-symbols-outlined !text-[9px]">{isPending ? "schedule" : "check_circle"}</span>
                    {isPending ? "PENDIENTE" : "RESPONDIDA"}
                  </span>
                </div>
              </div>

              {/* Answer area */}
              {isPending ? (
                <div className="space-y-3 pl-6">
                  <textarea
                    rows={3}
                    value={drafts[q.id] ?? ""}
                    onChange={e => setDrafts(prev => ({ ...prev, [q.id]: e.target.value }))}
                    placeholder="Escribe tu respuesta..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-on-surface placeholder-on-surface/20 outline-none focus:border-primary/40 resize-none transition-colors"
                  />
                  <div className="flex items-center gap-3">
                    <button onClick={() => handleSuggest(q)}
                      className="flex items-center gap-2 px-4 py-2 glass-card border border-primary/20 rounded-xl text-[10px] font-black label-tracking text-primary hover:bg-primary/10 transition-colors"
                    >
                      <span className="material-symbols-outlined !text-[14px]">auto_awesome</span>
                      SAMANTHA SUGIERE
                    </button>
                    <button onClick={() => handleAnswer(q)}
                      className="flex items-center gap-2 px-6 py-2 bg-primary text-black rounded-xl text-[10px] font-black label-tracking hover:bg-primary/90 transition-all"
                    >
                      <span className="material-symbols-outlined !text-[14px]">send</span>
                      RESPONDER
                    </button>
                  </div>
                </div>
              ) : (
                <div className="pl-6 border-l-2 border-[#CCFF00]/20 ml-3.5 space-y-1">
                  <p className="text-[9px] font-black label-tracking text-on-surface/30 uppercase">Tu respuesta</p>
                  <p className="text-sm text-on-surface-variant leading-relaxed">"{q.answer}"</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="h-10" />
    </div>
  );
}
