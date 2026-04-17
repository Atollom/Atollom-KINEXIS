"use client";

import { useState } from "react";

interface Lead {
  lead_id: string;
  name: string;
  company?: string;
  phone: string;
  score: number;
  deal_stage: string;
  value?: number;
  channel: string;
  last_contact: string;
}

const demoLeads: Lead[] = [
  { lead_id: "L-12345", name: "María González", company: "Empresa ABC", phone: "5512345678", score: 87, deal_stage: "negotiating", value: 18500, channel: "WhatsApp", last_contact: "Hace 2h" },
  { lead_id: "L-12346", name: "Juan Pérez", phone: "5587654321", score: 62, deal_stage: "contacted", value: 4200, channel: "Instagram", last_contact: "Hace 4h" },
  { lead_id: "L-12347", name: "Carlos Ramírez", company: "XYZ S.A.", phone: "5544556677", score: 94, deal_stage: "quote_sent", value: 47000, channel: "Llamada", last_contact: "Hace 6h" },
  { lead_id: "L-12348", name: "Ana Martínez", phone: "5511223344", score: 38, deal_stage: "new", value: 2400, channel: "Facebook", last_contact: "Ayer" },
  { lead_id: "L-12349", name: "Roberto Sánchez", company: "Inversiones SC", phone: "5599887766", score: 71, deal_stage: "negotiating", value: 28900, channel: "WhatsApp", last_contact: "Ayer" },
];

const stageColors: Record<string, string> = {
  new: "bg-green-500/20 text-green-400",
  contacted: "bg-cyan-500/20 text-cyan-400",
  negotiating: "bg-blue-500/20 text-blue-400",
  quote_sent: "bg-purple-500/20 text-purple-400",
  won: "bg-emerald-500/20 text-emerald-400",
  lost: "bg-gray-500/20 text-gray-400",
};

const stageLabels: Record<string, string> = {
  new: "Nuevo",
  contacted: "Contactado",
  negotiating: "Negociando",
  quote_sent: "Cotización",
  won: "Ganado",
  lost: "Perdido",
};

export default function CRMLeadsPage() {
  return (
    <div className="px-4 md:px-8 py-6 max-w-screen-2xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-headline font-bold text-on-surface mb-2">
            Leads
          </h1>
          <p className="text-on-surface-variant text-sm">
            Gestión de prospectos y pipeline de ventas.
          </p>
        </div>

        <button className="px-4 py-2 bg-[#A8E63D] text-[#0D1B3E] rounded-lg font-bold text-sm hover:bg-[#8BCF34] transition-all">
          <span className="material-symbols-outlined mr-2 vertical-align-middle text-base">person_add</span>
          Nuevo Lead
        </button>
      </div>

      {/* Pipeline Kanban */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        {Object.entries(stageLabels).map(([key, label]) => (
          <div key={key} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
            <h3 className="font-bold text-sm text-on-surface mb-3">{label}</h3>
            <div className="space-y-2">
              {demoLeads.filter(l => l.deal_stage === key).map(lead => (
                <div key={lead.lead_id} className="bg-white/[0.06] rounded-lg p-3 cursor-pointer hover:bg-white/[0.1] transition-colors">
                  <p className="font-bold text-sm text-on-surface">{lead.name}</p>
                  <p className="text-xs text-on-surface-variant mb-2">{lead.company || lead.phone}</p>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs px-1.5 py-0.5 rounded-md ${lead.score >= 80 ? 'bg-green-500/20 text-green-400' : lead.score >= 60 ? 'bg-amber-500/20 text-amber-400' : 'bg-gray-500/20 text-gray-400'}`}>
                      {lead.score} pts
                    </span>
                    {lead.value && <span className="text-xs font-bold text-on-surface">${lead.value.toLocaleString()}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Tabla de leads */}
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="px-4 py-3 text-left text-xs text-on-surface-variant uppercase tracking-wider">Lead</th>
                <th className="px-4 py-3 text-left text-xs text-on-surface-variant uppercase tracking-wider">Empresa</th>
                <th className="px-4 py-3 text-center text-xs text-on-surface-variant uppercase tracking-wider">Score</th>
                <th className="px-4 py-3 text-left text-xs text-on-surface-variant uppercase tracking-wider">Valor</th>
                <th className="px-4 py-3 text-left text-xs text-on-surface-variant uppercase tracking-wider">Etapa</th>
                <th className="px-4 py-3 text-left text-xs text-on-surface-variant uppercase tracking-wider">Canal</th>
                <th className="px-4 py-3 text-left text-xs text-on-surface-variant uppercase tracking-wider">Último</th>
              </tr>
            </thead>
            <tbody>
              {demoLeads.map((lead) => (
                <tr key={lead.lead_id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-bold text-sm text-on-surface">{lead.name}</p>
                    <p className="text-xs text-on-surface-variant">{lead.phone}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-on-surface-variant">{lead.company || "—"}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 rounded-md text-xs font-bold ${lead.score >= 80 ? 'bg-green-500/20 text-green-400' : lead.score >= 60 ? 'bg-amber-500/20 text-amber-400' : 'bg-gray-500/20 text-gray-400'}`}>
                      {lead.score}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm font-bold text-on-surface">{lead.value ? `$${lead.value.toLocaleString()}` : "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-md text-xs font-bold ${stageColors[lead.deal_stage]}`}>
                      {stageLabels[lead.deal_stage]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-on-surface">{lead.channel}</td>
                  <td className="px-4 py-3 text-sm text-on-surface-variant">{lead.last_contact}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}