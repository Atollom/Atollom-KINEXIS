"use client";

import { useMemo, useState } from "react";

export default function FinancePage() {
  const kpis = useMemo(() => [
    { label: "Accounts Receivable", value: "$4.1M", icon: "call_received", color: "text-primary" },
    { label: "Accounts Payable", value: "$2.4M", icon: "call_made", color: "text-red-400" },
    { label: "Current Cash", value: "$1.8M", icon: "account_balance_wallet", color: "text-blue-400" },
    { label: "Net Margin", value: "28.4%", icon: "show_chart", color: "text-emerald-400" },
  ], []);

  const pendingBills = [
    { id: "INV-8801", vendor: "Optical Components Ltd", amount: 154000, due: "En 3 días", status: "pending" },
    { id: "INV-8802", vendor: "Neural Fabricators", amount: 89000, due: "En 12 días", status: "pending" },
  ];

  const incomingPayments = [
    { id: "PAY-101", customer: "Tech Logistics Corp", amount: 450000, status: "scheduled", date: "Mañana" },
    { id: "PAY-102", customer: "Retail Group MX", amount: 125000, status: "late", date: "Ayer" },
  ];

  return (
    <div className="space-y-10 animate-in">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <span className="text-[0.75rem] font-bold label-tracking text-primary drop-shadow-glow">
            Treasury / Financial Operations
          </span>
          <h1 className="text-4xl md:text-5xl font-black tight-tracking text-on-surface">
            Control Financiero
          </h1>
        </div>

        <div className="flex items-center gap-3">
           <button className="px-8 py-4 glass-card border-white/5 rounded-2xl text-[10px] font-black label-tracking text-on-surface-variant hover:text-on-surface transition-all flex items-center gap-2">
              <span className="material-symbols-outlined !text-[16px]">add_card</span>
              REGISTRAR PAGO
           </button>
           <button className="px-8 py-4 neon-disruptor rounded-2xl text-[10px] font-black label-tracking shadow-glow">
              REPORTE FISCAL
           </button>
        </div>
      </header>

      {/* Financial KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         {kpis.map((k, i) => (
           <div key={i} className="glass-card p-8 rounded-[2rem] border border-white/5 relative overflow-hidden group">
              <div className="relative z-10 flex flex-col gap-4">
                 <span className={`material-symbols-outlined !text-3xl ${k.color}`}>{k.icon}</span>
                 <div>
                    <p className="text-[10px] font-black text-on-surface/30 label-tracking uppercase">{k.label}</p>
                    <p className="text-3xl font-black text-on-surface tight-tracking">{k.value}</p>
                 </div>
              </div>
           </div>
         ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
         {/* Accounts Payable (Cuotas por Pagar) */}
         <section className="space-y-6">
            <div className="flex items-center justify-between">
               <h3 className="text-[10px] font-black label-tracking text-on-surface-variant uppercase italic">Cuentas por Pagar (Suppliers)</h3>
               <span className="text-[9px] font-bold text-red-500 bg-red-500/10 px-2 py-0.5 rounded-full">ACTION REQUIRED</span>
            </div>
            <div className="space-y-4">
               {pendingBills.map(bill => (
                 <div key={bill.id} className="glass-card p-6 rounded-3xl border border-white/5 flex items-center justify-between group hover:border-red-500/30 transition-all">
                    <div className="flex items-center gap-6">
                       <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-red-400">
                          <span className="material-symbols-outlined">payments</span>
                       </div>
                       <div>
                          <p className="text-sm font-black text-on-surface">{bill.vendor}</p>
                          <p className="text-[10px] font-bold text-on-surface-variant italic">ID: {bill.id} • Vence: {bill.due}</p>
                       </div>
                    </div>
                    <div className="flex items-center gap-8">
                       <div className="text-right">
                          <p className="text-[9px] font-black text-on-surface/20 label-tracking">TOTAL</p>
                          <p className="text-lg font-black text-on-surface italic">${bill.amount.toLocaleString()}</p>
                       </div>
                       <button className="px-6 py-2 border border-white/10 rounded-xl text-[9px] font-black uppercase label-tracking text-on-surface-variant hover:text-white hover:bg-white/10 transition-all">
                          Pagar
                       </button>
                    </div>
                 </div>
               ))}
            </div>
         </section>

         {/* Accounts Receivable (Cuentas por Cobrar) */}
         <section className="space-y-6">
            <div className="flex items-center justify-between">
               <h3 className="text-[10px] font-black label-tracking text-on-surface-variant uppercase italic">Cuentas por Cobrar (Clients)</h3>
               <span className="text-[9px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">INCOMING</span>
            </div>
            <div className="space-y-4">
               {incomingPayments.map(pay => (
                 <div key={pay.id} className="glass-card p-6 rounded-3xl border border-white/5 flex items-center justify-between group hover:border-primary/20 transition-all">
                    <div className="flex items-center gap-6">
                       <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-primary">
                          <span className="material-symbols-outlined">call_received</span>
                       </div>
                       <div>
                          <p className="text-sm font-black text-on-surface">{pay.customer}</p>
                          <p className="text-[10px] font-bold text-on-surface-variant italic">ID: {pay.id} • {pay.date}</p>
                       </div>
                    </div>
                    <div className="flex items-center gap-10">
                       <div className="text-right">
                          <p className="text-[9px] font-black text-on-surface/20 label-tracking">TOTAL</p>
                          <p className="text-lg font-black text-primary italic">${pay.amount.toLocaleString()}</p>
                       </div>
                       <span className={`text-[9px] font-black px-2 py-1 rounded-full uppercase ${pay.status === 'late' ? 'bg-red-500 text-white' : 'bg-primary/10 text-primary'}`}>
                          {pay.status}
                       </span>
                    </div>
                 </div>
               ))}
            </div>
         </section>
      </div>

      <div className="h-20" />
    </div>
  );
}
