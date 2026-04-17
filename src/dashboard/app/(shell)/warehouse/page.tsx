"use client";

import { useState, useEffect } from "react";
import { CutoffAlert } from "@/components/warehouse/CutoffAlert";
import { TaskCard, type WarehouseTask } from "@/components/warehouse/TaskCard";

function getMxTime(): Date {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: "America/Mexico_City" })
  );
}

const MOCK_TASKS: WarehouseTask[] = [
  {
    order_id: "ord-1",
    external_id: "3109228834",
    platform: "ml",
    priority: 1,
    customer_name: "Roberto Hernández",
    products: [
      { name: "Pinzas de Precisión RC-02", qty: 3 },
      { name: "Destornillador Magnético DM-4", qty: 1 },
    ],
    created_at: new Date().toISOString(),
    status: "pending",
  },
  {
    order_id: "ord-2",
    external_id: "702-4453821",
    platform: "amazon",
    priority: 2,
    customer_name: "Ana Garza",
    products: [{ name: "Kit Herramientas KT-07", qty: 1 }],
    created_at: new Date().toISOString(),
    status: "pending",
  },
  {
    order_id: "ord-3",
    external_id: "3109228912",
    platform: "ml",
    priority: 1,
    customer_name: "María López",
    products: [{ name: "Taladro Inalámbrico T-12", qty: 1 }],
    created_at: new Date().toISOString(),
    status: "printed",
  },
  {
    order_id: "ord-4",
    external_id: "SHY-10042",
    platform: "shopify",
    priority: 3,
    customer_name: "Luis Reyes",
    address: "Calle Insurgentes Sur 1045, Benito Juárez, CDMX",
    products: [{ name: "Cortadora Multipropósito CM-1", qty: 1 }],
    created_at: new Date().toISOString(),
    status: "pending",
  },
  {
    order_id: "ord-5",
    external_id: "702-4453905",
    platform: "amazon",
    priority: 2,
    customer_name: "Carlos Méndez",
    products: [{ name: "Pinzas de Precisión RC-02", qty: 2 }],
    created_at: new Date().toISOString(),
    status: "pending",
  },
];

export default function WarehousePage() {
  const [tasks, setTasks] = useState<WarehouseTask[]>(MOCK_TASKS);
  const [now, setNow] = useState(getMxTime());

  useEffect(() => {
    const id = setInterval(() => setNow(getMxTime()), 60_000);
    return () => clearInterval(id);
  }, []);

  function handleConfirm(orderId: string) {
    setTasks((prev) =>
      prev.map((t) => (t.order_id === orderId ? { ...t, status: "confirmed" } : t))
    );
  }

  const pending   = tasks.filter((t) => t.status !== "confirmed").length;
  const confirmed = tasks.filter((t) => t.status === "confirmed").length;
  const mlCount      = tasks.filter((t) => t.platform === "ml"      && t.status !== "confirmed").length;
  const amazonCount  = tasks.filter((t) => t.platform === "amazon"  && t.status !== "confirmed").length;
  const shopifyCount = tasks.filter((t) => t.platform === "shopify" && t.status !== "confirmed").length;

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-luxe pb-24">
      
      {/* ── Dynamic Header ─────────────────────────────────────────── */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-4">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-2xl bg-[#ccff00]/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-[#ccff00] text-xl">warehouse</span>
             </div>
             <div>
                <h1 className="text-3xl font-black tracking-tighter text-white uppercase leading-none">Logistics Ops</h1>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#ccff00]/60 italic mt-1">Warehouse Neural Commander</p>
             </div>
          </div>
        </div>

        <div className="text-right">
           <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">
             {now.toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" })}
           </p>
           <p className="text-xl font-black text-[#ccff00] uppercase tracking-tighter mt-1">
             {now.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })} <span className="text-[10px] text-white/20">GMT-6</span>
           </p>
        </div>
      </header>

      {/* ── ML Cutoff Alert ─────────────────────────────────────────── */}
      <div className="px-4">
        <CutoffAlert />
      </div>

      {/* ── Mission Critical Summary ─────────────────────────────────── */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-6 px-4">
        <div className="glass-card p-6 rounded-[2rem] border border-white/5 flex flex-col items-center text-center group cursor-default">
           <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em] mb-4">Total Pending</span>
           <span className="text-4xl font-black text-white group-hover:text-[#ccff00] transition-colors">{pending}</span>
           <div className="w-8 h-1 bg-white/5 rounded-full mt-4" />
        </div>

        <div className="glass-card p-6 rounded-[2rem] border border-white/5 flex flex-col items-center text-center hover:shadow-volt transition-all">
           <div className="w-10 h-10 rounded-xl bg-[#ccff00]/5 flex items-center justify-center mb-3">
              <span className="material-symbols-outlined text-[#ccff00] text-lg">shopping_bag</span>
           </div>
           <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em]">ML Queue</span>
           <span className="text-2xl font-black text-white mt-1">{mlCount}</span>
        </div>

        <div className="glass-card p-6 rounded-[2rem] border border-white/5 flex flex-col items-center text-center hover:shadow-volt transition-all">
           <div className="w-10 h-10 rounded-xl bg-[#ff9900]/5 flex items-center justify-center mb-3">
              <span className="material-symbols-outlined text-[#ff9900] text-lg">inventory_2</span>
           </div>
           <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em]">Amazon SP</span>
           <span className="text-2xl font-black text-white mt-1">{amazonCount}</span>
        </div>

        <div className="glass-card p-6 rounded-[2rem] border border-white/5 flex flex-col items-center text-center hover:shadow-volt transition-all">
           <div className="w-10 h-10 rounded-xl bg-[#96bf48]/5 flex items-center justify-center mb-3">
              <span className="material-symbols-outlined text-[#96bf48] text-lg">shopping_cart</span>
           </div>
           <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em]">Shopify Core</span>
           <span className="text-2xl font-black text-white mt-1">{shopifyCount}</span>
        </div>
      </section>

      {/* ── Deployment Progress ───────────────────────────────────────── */}
      <section className="px-4">
         <div className="glass-card p-8 rounded-[2.5rem] border border-white/5 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#ccff00]/5 rounded-full blur-[100px] pointer-events-none" />
            
            <div className="flex items-center justify-between mb-6">
               <div>
                  <h3 className="text-[11px] font-black text-white uppercase tracking-[0.4em]">Daily Mission Progress</h3>
                  <p className="text-[9px] text-white/20 uppercase mt-1">Operational Sync Status</p>
               </div>
               <div className="text-right">
                  <span className="text-xl font-black text-[#ccff00]">{confirmed}</span>
                  <span className="text-[10px] font-black text-white/20 mx-2 uppercase">of</span>
                  <span className="text-xl font-black text-white/40">{tasks.length}</span>
               </div>
            </div>

            <div className="h-4 w-full bg-white/5 rounded-full overflow-hidden p-1 shadow-inner">
               <div 
                  className="h-full bg-[#ccff00] rounded-full transition-all duration-1000 shadow-volt"
                  style={{ width: `${tasks.length > 0 ? (confirmed / tasks.length) * 100 : 0}%` }}
               />
            </div>
         </div>
      </section>

      {/* ── Operational Queue ─────────────────────────────────────────── */}
      <section className="px-4 space-y-6">
         <div className="flex items-center justify-between px-2">
            <h2 className="text-[11px] font-black text-white uppercase tracking-[0.5em] flex items-center gap-3">
               <span className="w-1.5 h-1.5 rounded-full bg-[#ccff00] shadow-volt animate-pulse" />
               Pending Deployment Matrix ({pending})
            </h2>
         </div>

         <div className="grid gap-6">
            {tasks.map((task, i) => (
               <div key={task.order_id} className="animate-luxe" style={{ animationDelay: `${i * 100}ms` }}>
                  <TaskCard task={task} onConfirm={handleConfirm} />
               </div>
            ))}
         </div>

         {pending === 0 && (
           <div className="glass-card py-24 rounded-[3rem] border border-white/5 flex flex-col items-center justify-center text-center border-dashed">
              <div className="w-16 h-16 rounded-full bg-[#ccff00]/10 flex items-center justify-center mb-6 shadow-volt">
                 <span className="material-symbols-outlined text-[#ccff00] text-3xl">verified</span>
              </div>
              <h3 className="text-xl font-black text-white uppercase tracking-widest">Awaiting New Orders</h3>
              <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mt-2 italic">Neural Matrix fully synchronized</p>
           </div>
         )}
      </section>

    </div>
  );
}
