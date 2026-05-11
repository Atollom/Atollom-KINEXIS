"use client";

import { useState } from "react";
import { useToast } from "@/components/ToastProvider";
import { mockLeads, mockLeadScoringStats } from "@/lib/mockData";
import type { Lead } from "@/lib/mockData";

type GradeFilter = "all" | "A" | "B" | "C" | "D";

const GRADE_CFG: Record<Lead["grade"], { color: string; bg: string; border: string; label: string }> = {
  A: { color: "text-[#CCFF00]",  bg: "bg-[#CCFF00]/10",  border: "border-[#CCFF00]/30",  label: "HOT"    },
  B: { color: "text-blue-400",   bg: "bg-blue-400/10",   border: "border-blue-400/30",   label: "WARM"   },
  C: { color: "text-amber-400",  bg: "bg-amber-400/10",  border: "border-amber-400/30",  label: "COOL"   },
  D: { color: "text-on-surface/40", bg: "bg-white/5",    border: "border-white/10",      label: "COLD"   },
};

function ScoreBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[9px] font-black text-on-surface/50 w-8 text-right">{value}/{max}</span>
    </div>
  );
}

function ScoreRing({ score, grade }: { score: number; grade: Lead["grade"] }) {
  const cfg = GRADE_CFG[grade];
  const circumference = 2 * Math.PI * 20;
  const dash = (score / 100) * circumference;
  return (
    <div className="relative w-14 h-14 flex-shrink-0">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 48 48">
        <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
        <circle
          cx="24" cy="24" r="20" fill="none"
          stroke={grade === "A" ? "#CCFF00" : grade === "B" ? "#60a5fa" : grade === "C" ? "#fbbf24" : "rgba(255,255,255,0.2)"}
          strokeWidth="4" strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference - dash}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-xs font-black leading-none ${cfg.color}`}>{score}</span>
        <span className={`text-[7px] font-black ${cfg.color}`}>{grade}</span>
      </div>
    </div>
  );
}

export default function LeadScorerPage() {
  const { showToast } = useToast();
  const [gradeFilter, setGradeFilter] = useState<GradeFilter>("all");
  const [search, setSearch] = useState("");

  const base = gradeFilter === "all" ? mockLeads : mockLeads.filter(l => l.grade === gradeFilter);
  const leads = search
    ? base.filter(l =>
        l.name.toLowerCase().includes(search.toLowerCase()) ||
        l.company.toLowerCase().includes(search.toLowerCase())
      )
    : base;

  const sorted = [...leads].sort((a, b) => b.score - a.score);

  return (
    <div className="space-y-10 animate-in">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="text-[0.75rem] font-bold label-tracking text-purple-400 drop-shadow-[0_0_8px_rgba(192,132,252,0.3)]">
              CRM / Pipeline / Lead Scorer
            </span>
            <span className="px-2 py-1 rounded-full bg-purple-400/10 border border-purple-400/20 text-[9px] font-black label-tracking text-purple-400">
              AGENTE #31
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tight-tracking text-on-surface">
            Lead Scorer
          </h1>
          <p className="text-sm text-on-surface-variant">
            {mockLeadScoringStats.total_leads} leads · Score promedio{" "}
            <span className="text-purple-400 font-bold">{mockLeadScoringStats.avg_score}</span> ·{" "}
            Pipeline{" "}
            <span className="text-[#CCFF00] font-bold">${(mockLeadScoringStats.total_potential / 1000000).toFixed(1)}M</span>
          </p>
        </div>
        <div className="flex gap-3 self-start md:self-auto">
          <button
            onClick={() => showToast({ type: "success", title: "Re-scoring completado", message: "Agente #31 actualizó 6 scores con datos recientes" })}
            className="px-6 py-3 rounded-2xl bg-purple-500 text-white text-[10px] font-black label-tracking hover:bg-purple-400 transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined !text-[16px]">auto_fix_high</span>
            RE-SCORE AUTO
          </button>
        </div>
      </header>

      {/* Grade KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {([
          { grade: "A", count: mockLeadScoringStats.grade_a, label: "Grade A — HOT",  sub: "Alta prioridad",    value: "$" + (mockLeads.filter(l => l.grade === "A").reduce((s, l) => s + l.potential_value, 0) / 1000).toFixed(0) + "k" },
          { grade: "B", count: mockLeadScoringStats.grade_b, label: "Grade B — WARM", sub: "Media prioridad",   value: "$" + (mockLeads.filter(l => l.grade === "B").reduce((s, l) => s + l.potential_value, 0) / 1000).toFixed(0) + "k" },
          { grade: "C", count: mockLeadScoringStats.grade_c, label: "Grade C — COOL", sub: "Baja prioridad",    value: "$" + (mockLeads.filter(l => l.grade === "C").reduce((s, l) => s + l.potential_value, 0) / 1000).toFixed(0) + "k" },
          { grade: "D", count: mockLeadScoringStats.grade_d, label: "Grade D — COLD", sub: "Nurturing/archivo", value: "$" + (mockLeads.filter(l => l.grade === "D").reduce((s, l) => s + l.potential_value, 0) / 1000).toFixed(0) + "k" },
        ] as const).map(g => {
          const cfg = GRADE_CFG[g.grade];
          return (
            <div key={g.grade} className={`glass-card rounded-[1.5rem] border ${cfg.border} p-6`}>
              <div className="flex items-center justify-between mb-3">
                <span className={`text-[9px] font-black label-tracking ${cfg.color} uppercase`}>{g.label}</span>
                <span className={`text-2xl font-black ${cfg.color}`}>{g.count}</span>
              </div>
              <p className="text-xs font-black text-on-surface">{g.value} potencial</p>
              <p className={`text-[9px] mt-0.5 ${cfg.color}/60`}>{g.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Filters + Search */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          {(["all", "A", "B", "C", "D"] as GradeFilter[]).map(f => (
            <button key={f} onClick={() => setGradeFilter(f)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black label-tracking transition-all ${
                gradeFilter === f
                  ? "bg-purple-500 text-white"
                  : "glass-card border border-white/5 text-on-surface-variant hover:border-purple-400/20"
              }`}
            >
              {f === "all" ? "TODOS" : `GRADE ${f}`}
            </button>
          ))}
        </div>
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface/30 !text-[16px]">search</span>
          <input
            type="text"
            placeholder="Buscar nombre, empresa..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-[11px] font-medium text-on-surface placeholder:text-on-surface/30 focus:border-purple-400/50 outline-none w-60"
          />
        </div>
      </div>

      {/* Lead cards */}
      <div className="space-y-4">
        {sorted.map(lead => {
          const cfg = GRADE_CFG[lead.grade];
          return (
            <div key={lead.id} className={`glass-card rounded-[2rem] border ${cfg.border} p-6 hover:bg-white/[0.02] transition-colors group`}>
              <div className="flex items-start gap-5">
                {/* Score ring */}
                <ScoreRing score={lead.score} grade={lead.grade} />

                {/* Main info */}
                <div className="flex-1 min-w-0 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="text-sm font-black text-on-surface">{lead.name}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-black ${cfg.color} ${cfg.bg} border ${cfg.border}`}>
                          {cfg.label}
                        </span>
                        {lead.days_inactive <= 2 && (
                          <span className="px-2 py-0.5 rounded-full text-[8px] font-black text-[#CCFF00] bg-[#CCFF00]/10 border border-[#CCFF00]/20">
                            ACTIVO
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-on-surface/50">{lead.company} · {lead.source} · {lead.stage}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs font-black text-on-surface">${(lead.potential_value / 1000).toFixed(0)}k</p>
                      <p className="text-[9px] text-on-surface/40">potencial</p>
                    </div>
                  </div>

                  {/* Scoring factors */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {lead.scoring_factors.map(f => (
                      <div key={f.label}>
                        <p className="text-[8px] font-black text-on-surface/30 uppercase mb-1">{f.label}</p>
                        <ScoreBar
                          value={f.score} max={f.max}
                          color={
                            lead.grade === "A" ? "bg-[#CCFF00]" :
                            lead.grade === "B" ? "bg-blue-400" :
                            lead.grade === "C" ? "bg-amber-400" : "bg-white/20"
                          }
                        />
                      </div>
                    ))}
                  </div>

                  {/* Engagement + actions */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {[
                        { icon: "email",         value: lead.engagement.emails_opened,    label: "emails abiertos" },
                        { icon: "chat",          value: lead.engagement.messages_replied, label: "respuestas"      },
                        { icon: "language",      value: lead.engagement.site_visits,      label: "visitas sitio"   },
                        { icon: "schedule",      value: `${lead.days_inactive}d`,          label: "sin actividad"   },
                      ].map(e => (
                        <div key={e.icon} className="flex items-center gap-1">
                          <span className="material-symbols-outlined !text-[12px] text-on-surface/30">{e.icon}</span>
                          <span className="text-[9px] font-black text-on-surface/50">{e.value}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => showToast({ type: "success", title: "Seguimiento creado", message: `${lead.name} → recordatorio en 24h` })}
                        className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-on-surface/60 text-[9px] font-black hover:bg-white/10 transition-colors flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined !text-[11px]">notifications</span>
                        SEGUIR
                      </button>
                      <button
                        onClick={() => showToast({ type: "info", title: "Cotización iniciada", message: `Agente #32 preparando propuesta para ${lead.company}` })}
                        className="px-3 py-1.5 rounded-xl bg-purple-400/10 border border-purple-400/20 text-purple-400 text-[9px] font-black hover:bg-purple-400/20 transition-colors flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined !text-[11px]">description</span>
                        COTIZAR
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="h-10" />
    </div>
  );
}
