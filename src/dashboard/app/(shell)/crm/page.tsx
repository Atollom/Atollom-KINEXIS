"use client";

import { useMemo } from "react";
import Link from "next/link";

export default function CRMSummaryPage() {
  const stats = useMemo(() => [
    { label: "Prospectos Activos", value: "154", growth: "+18%", icon: "person_search", color: "text-blue-400" },
    { label: "Valor del Pipeline", value: "$2.4M", growth: "+12%", icon: "payments", color: "text-primary" },
    { label: "Tasa de Cierre", value: "24%", growth: "+5%", icon: "task_alt", color: "text-emerald-400" },
    { label: "Ciclo Promedio de Venta", value: "14d", growth: "-2d", icon: "timer", color: "text-amber-400" },
  ], []);

  const recentActivity = [
    { id: 1, type: "Cotización Aprobada", customer: "Tech Logistics", value: 125000, time: "Hace 15 min" },
    { id: 2, type: "Nuevo Prospecto", customer: "Ana González", channel: "WhatsApp", time: "Hace 1 hr" },
    { id: 3, type: "Reunión Agendada", customer: "Global Corp", contact: "Carlos Riva", time: "Hoy 14:00" },
  ];

  return (
    <div className="space-y-10 animate-in">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <span className="text-[0.75rem] font-bold label-tracking text-primary drop-shadow-glow">
            Motor de Relaciones / CRM Global
          </span>
          <h1 className="text-4xl md:text-5xl font-black tight-tracking" style={{ color: 'var(--text-primary)' }}>
            Panel de Ventas
          </h1>
        </div>

        <div className="flex items-center gap-4">
           <Link href="/crm/inbox" className="glass-card px-8 py-5 rounded-3xl flex items-center gap-4 hover:border-primary/30 transition-all group">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                 <span className="material-symbols-outlined !text-[20px]">forum</span>
              </div>
              <div className="text-left">
                 <p className="text-[10px] font-black text-on-surface-variant label-tracking uppercase">Bandeja Unificada</p>
                 <p className="text-sm font-black text-on-surface">12 Mensajes Sin Leer</p>
              </div>
           </Link>
        </div>
      </header>

      {/* Primary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         {stats.map((s, i) => (
           <div key={i} className="glass-card p-8 rounded-[2rem] relative overflow-hidden group">
              <div className="relative z-10 space-y-4">
                 <div className="flex justify-between items-start">
                    <span className={`material-symbols-outlined !text-3xl ${s.color}`}>{s.icon}</span>
                    <span className="text-[10px] font-black text-primary bg-primary/5 px-2 py-0.5 rounded-full">{s.growth}</span>
                 </div>
                 <div>
                    <p className="text-[10px] font-black label-tracking uppercase" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
                    <p className="text-3xl font-black tight-tracking" style={{ color: 'var(--text-primary)' }}>{s.value}</p>
                 </div>
              </div>
           </div>
         ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
         {/* Left Col: Pipeline Visualization & Leads */}
         <div className="lg:col-span-8 space-y-10">
            {/* Pipeline Funnel Preview */}
            <section className="glass-card p-10 rounded-[3rem] relative overflow-hidden">
               <h3 className="text-[10px] font-black label-tracking uppercase italic mb-10 relative z-10" style={{ color: 'var(--text-secondary)' }}>Velocidad del Pipeline Activo</h3>

               <div className="flex flex-col gap-8 relative z-10">
                  {[
                    { label: 'Prospectos', count: '84 Leads', value: '$1.2M Valor', width: '100%', opacity: 0.4 },
                    { label: 'Cotizaciones Enviadas', count: '32 Cots.', value: '$850k Valor', width: '70%', opacity: 0.6 },
                    { label: 'En Negociación', count: '12 Items', value: '$420k Valor', width: '40%', opacity: 1 },
                  ].map((stage, idx) => (
                    <div key={idx} className="space-y-3" style={{ paddingLeft: `${idx * 40}px` }}>
                       <div className="flex justify-between items-end">
                          <p className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>
                            {stage.label} <span className="font-medium ml-2" style={{ color: 'var(--text-muted)' }}>{stage.count}</span>
                          </p>
                          <p className="text-[11px] font-black text-primary italic">{stage.value}</p>
                       </div>
                       <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-base)' }}>
                          <div className="h-full rounded-full" style={{ width: stage.width, backgroundColor: 'var(--accent-primary)', opacity: stage.opacity }} />
                       </div>
                    </div>
                  ))}
               </div>

               <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[100px] pointer-events-none" />
            </section>

            {/* Leads Redirect Card */}
            <Link href="/crm/leads" className="group block">
               <div className="glass-card p-8 rounded-[2.5rem] group-hover:border-primary/20 transition-all flex items-center justify-between">
                  <div className="flex items-center gap-6">
                     <div className="w-14 h-14 rounded-2xl flex items-center justify-center group-hover:text-primary transition-colors" style={{ backgroundColor: 'var(--bg-base)', color: 'var(--text-muted)' }}>
                        <span className="material-symbols-outlined !text-3xl">person_search</span>
                     </div>
                     <div>
                        <h4 className="text-xl font-black tight-tracking" style={{ color: 'var(--text-primary)' }}>Agente de Inteligencia de Prospectos</h4>
                        <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Gestionar base de prospectos y scoring automático.</p>
                     </div>
                  </div>
                  <span className="material-symbols-outlined text-primary group-hover:translate-x-2 transition-transform">arrow_forward</span>
               </div>
            </Link>
         </div>

         {/* Right Col: Activity & Intent Analysis */}
         <div className="lg:col-span-4 space-y-10">
            {/* Intent Analysis AI */}
            <section className="glass-card p-8 rounded-[2.5rem] space-y-8">
               <h3 className="text-[10px] font-black label-tracking uppercase italic" style={{ color: 'var(--text-secondary)' }}>Reconocimiento de Intención (IA)</h3>

               <div className="space-y-6">
                  {[
                    { label: "Intención de Compra", pct: 72, color: 'var(--accent-primary)' },
                    { label: "Consulta de Soporte", pct: 45, color: '#60a5fa' },
                    { label: "Reclamo/Queja", pct: 12, color: 'var(--accent-danger)' },
                  ].map(intent => (
                    <div key={intent.label} className="space-y-2">
                       <div className="flex justify-between text-[11px] font-bold">
                          <span style={{ color: 'var(--text-secondary)' }}>{intent.label}</span>
                          <span style={{ color: 'var(--text-primary)' }}>{intent.pct}%</span>
                       </div>
                       <div className="w-full h-1 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-base)' }}>
                          <div className="h-full rounded-full" style={{ width: `${intent.pct}%`, backgroundColor: intent.color }} />
                       </div>
                    </div>
                  ))}
               </div>
            </section>

            {/* Recent Activity Telemetry */}
            <section className="glass-card p-8 rounded-[2.5rem]">
                <h3 className="text-[10px] font-black label-tracking uppercase italic mb-8" style={{ color: 'var(--text-secondary)' }}>Actividad Reciente</h3>
                <div className="space-y-6">
                   {recentActivity.map(act => (
                     <div key={act.id} className="flex gap-4 relative">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                        <div>
                           <p className="text-[11px] font-black" style={{ color: 'var(--text-primary)' }}>{act.type}</p>
                           <p className="text-[10px] font-bold leading-tight" style={{ color: 'var(--text-secondary)' }}>{act.customer} • {act.time}</p>
                           {act.value && <p className="text-[10px] font-black text-primary mt-1">${act.value.toLocaleString()}</p>}
                        </div>
                     </div>
                   ))}
                </div>
            </section>
         </div>
      </div>

      <div className="h-20" />
    </div>
  );
}
