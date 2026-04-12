// src/dashboard/app/crm/page.tsx
"use client";

import { useLeads } from "@/hooks/useLeads";
import type { LeadStage, Lead } from "@/types";

const STAGES: { id: LeadStage; label: string; color: string }[] = [
  { id: 'new',         label: 'Nuevo',      color: 'border-primary-container' },
  { id: 'contacted',   label: 'Contactado', color: 'border-secondary' },
  { id: 'quote_sent',  label: 'Cotizado',   color: 'border-outline' },
  { id: 'negotiating', label: 'Negociando', color: 'border-primary-dim' },
  { id: 'won',         label: 'Ganado',     color: 'border-success' },
  { id: 'lost',        label: 'Perdido',    color: 'border-white/10' },
];

export default function CRMPage() {
  const { leads, isLoading } = useLeads();

  const getLeadsByStage = (stage: LeadStage) => {
    return (leads || []).filter(l => l.deal_stage === stage);
  };

  return (
    <div className="p-6 h-[calc(100vh-64px)] overflow-hidden flex flex-col">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline tracking-tight text-on-surface">Leads Pipeline</h1>
          <p className="text-on-surface-variant text-xs uppercase tracking-widest mt-1">Gestión de Prospectos AI</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-surface-container-high px-4 py-2 rounded-xl flex items-center gap-3">
            <span className="label-sm text-on-surface-variant">Total:</span>
            <span className="text-primary-container font-bold font-headline">{(leads || []).length}</span>
          </div>
        </div>
      </div>

      {/* Pipeline Grid */}
      <div className="flex-1 overflow-x-auto pb-4 custom-scrollbar">
        <div className="flex gap-4 h-full min-w-[1200px]">
          {STAGES.map((stage) => {
            const stageLeads = getLeadsByStage(stage.id);
            return (
              <div key={stage.id} className="flex-1 min-w-[200px] flex flex-col h-full bg-surface-container-low/30 rounded-2xl border border-white/5">
                {/* Column Header */}
                <div className={`p-4 border-l-4 ${stage.color} glass-panel rounded-t-2xl flex items-center justify-between`}>
                  <h3 className="label-sm font-bold text-on-surface">{stage.label}</h3>
                  <span className="text-[10px] text-on-surface-variant bg-surface-container py-0.5 px-2 rounded-full">
                    {stageLeads.length}
                  </span>
                </div>

                {/* Column Content */}
                <div className="p-3 flex-1 overflow-y-auto space-y-3 custom-scrollbar">
                  {isLoading ? (
                    <div className="animate-pulse space-y-3">
                      {[1, 2, 3].map(i => <div key={i} className="h-24 bg-surface-container rounded-xl" />)}
                    </div>
                  ) : stageLeads.length === 0 ? (
                    <div className="h-40 flex items-center justify-center border border-dashed border-white/5 rounded-xl">
                      <p className="text-[10px] text-white/20 uppercase tracking-widest">Vacío</p>
                    </div>
                  ) : (
                    stageLeads.map((lead) => {
                      // Score 0–10 scale: < 4 red · 4–6 yellow · > 7 Electric Lime
                      const scoreDot =
                        lead.score > 7 ? 'bg-primary-container' :
                        lead.score >= 4 ? 'bg-[#ffe600]' :
                        'bg-error';
                      const scoreText =
                        lead.score > 7 ? 'text-primary-container' :
                        lead.score >= 4 ? 'text-[#ffe600]' :
                        'text-error';
                      // Lost column: grey + 40% opacity per spec
                      const isLost = lead.deal_stage === 'lost';
                      return (
                      <div key={lead.lead_id} className={`bg-surface-container hover:bg-surface-bright transition-all p-4 rounded-xl shadow-lg border border-white/5 group relative overflow-hidden${isLost ? ' opacity-40 grayscale' : ''}`}>
                        {/* Score Indicator */}
                        <div className="absolute top-4 right-4 flex items-center gap-1">
                          <span className={`w-1.5 h-1.5 rounded-full ${scoreDot}`} />
                          <span className={`text-[10px] font-bold ${scoreText}`}>{lead.score}</span>
                        </div>
                        
                        <p className="text-xs font-bold text-on-surface group-hover:text-primary-container transition-colors truncate pr-8">
                          {lead.name}
                        </p>
                        <p className="text-[10px] text-on-surface-variant mt-1 uppercase tracking-tight truncate">
                          {lead.company}
                        </p>
                        
                        <div className="mt-4 flex items-center justify-between">
                          <div className="flex items-center gap-1.5 opacity-60">
                            <span className="material-symbols-outlined text-[14px]">
                              {lead.channel === 'whatsapp' ? 'chat' : lead.channel === 'instagram' ? 'photo_camera' : 'language'}
                            </span>
                            <span className="text-[9px] uppercase tracking-tighter">{lead.channel}</span>
                          </div>
                          {lead.value && (
                            <span className="text-xs font-bold font-headline text-on-surface">
                              ${lead.value.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                      );
                    })}
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
