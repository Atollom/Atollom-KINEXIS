"use client";

import { useState } from "react";

type FulfillmentChannel = "ml" | "amazon" | "shopify_b2b";

interface OrderItem {
  id: string;
  sku: string;
  name: string;
  qty: number;
}

interface Order {
  id: string;
  customer: string;
  status: "pending" | "picking" | "packing" | "shipped";
  items: OrderItem[];
  priority: "high" | "normal";
  type: string; // e.g., Full, Flex, FBA
  date: string;
}

const MOCK_ORDERS: Record<FulfillmentChannel, Order[]> = {
  ml: [
    {
       id: "ML-10293",
       customer: "Juan Perez",
       status: "pending",
       priority: "high",
       type: "FULL",
       date: "Hace 10 min",
       items: [{ id: "1", sku: "NX-800", name: "Kinexis Pulse Controller", qty: 1 }]
    },
    {
       id: "ML-10294",
       customer: "Maria Garcia",
       status: "picking",
       priority: "normal",
       type: "FLEX",
       date: "Hace 45 min",
       items: [{ id: "2", sku: "NX-200", name: "Neural Link Cable", qty: 2 }]
    }
  ],
  amazon: [
    {
       id: "AMZ-9921",
       customer: "Steve Jobs (Legacy)",
       status: "pending",
       priority: "high",
       type: "FBA",
       date: "Hace 5 min",
       items: [{ id: "3", sku: "NX-ONE", name: "Command Hub Elite", qty: 1 }]
    }
  ],
  shopify_b2b: [
    {
       id: "SH-5501",
       customer: "Industrial Optics Inc.",
       status: "pending",
       priority: "normal",
       type: "B2B",
       date: "Hoy 08:30",
       items: [{ id: "4", sku: "NX-Bulk", name: "Bulk Sensors v3", qty: 50 }]
    }
  ]
};

export default function FulfillmentPage() {
  const [activeChannel, setActiveChannel] = useState<FulfillmentChannel>("ml");

  const filteredOrders = MOCK_ORDERS[activeChannel];

  return (
    <div className="space-y-10 animate-in">
       {/* Header */}
       <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <span className="text-[0.75rem] font-bold label-tracking text-primary drop-shadow-glow">
            Logística / Inteligencia de Despacho
          </span>
          <h1 className="text-4xl md:text-5xl font-black tight-tracking text-on-surface">
            Control de Despacho
          </h1>
        </div>

        <nav className="flex gap-2 p-1 bg-white/5 rounded-2xl w-fit">
           {[
             { id: 'ml', label: 'Mercado Libre', icon: 'shopping_bag' },
             { id: 'amazon', label: 'Amazon', icon: 'inventory_2' },
             { id: 'shopify_b2b', label: 'Shopify + B2B', icon: 'hub' },
           ].map(tab => (
             <button
               key={tab.id}
               onClick={() => setActiveChannel(tab.id as FulfillmentChannel)}
               className={`
                 flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all
                 ${activeChannel === tab.id 
                   ? "neon-disruptor shadow-glow" 
                   : "text-on-surface-variant hover:text-on-surface hover:bg-white/5"}
               `}
             >
               <span className="material-symbols-outlined !text-[16px]">{tab.icon}</span>
               {tab.label}
             </button>
           ))}
        </nav>
      </header>

      {/* Stats Quick Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
         {[
           { label: "Pendientes", count: 8, color: "text-primary" },
           { label: "En Picking", count: 4, color: "text-amber-400" },
           { label: "Empacando", count: 2, color: "text-blue-400" },
           { label: "Enviados Hoy", count: 124, color: "text-on-surface-variant" },
         ].map((stat, i) => (
           <div key={i} className="glass-card p-5 rounded-2xl flex flex-col items-center justify-center border border-white/5">
              <p className="text-[9px] font-black label-tracking uppercase text-on-surface/30">{stat.label}</p>
              <p className={`text-2xl font-black tight-tracking mt-1 ${stat.color}`}>{stat.count}</p>
           </div>
         ))}
      </div>

      {/* Orders List */}
      <div className="space-y-4">
         {filteredOrders.map(order => (
           <div key={order.id} className="glass-card p-6 rounded-3xl border border-white/5 hover:border-white/10 transition-all group overflow-hidden relative">
              <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                 {/* ID & Customer */}
                 <div className="flex items-center gap-6">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-white/5 border border-white/10 group-hover:bg-primary/10 group-hover:border-primary/20 transition-all`}>
                       <span className={`material-symbols-outlined !text-2xl ${order.priority === 'high' ? 'text-primary' : 'text-on-surface/40'}`}>
                          {order.priority === 'high' ? 'priority_high' : 'package'}
                       </span>
                    </div>
                    <div>
                       <div className="flex items-center gap-2">
                          <p className="text-sm font-black text-on-surface">{order.id}</p>
                          <span className="text-[9px] font-black bg-white/5 px-2 py-0.5 rounded-full text-on-surface-variant uppercase">{order.type}</span>
                       </div>
                       <p className="text-[11px] font-bold text-on-surface-variant label-tracking mt-1 uppercase">{order.customer}</p>
                    </div>
                 </div>

                 {/* Items */}
                 <div className="flex-1 max-w-md lg:px-10">
                    {order.items.map(item => (
                       <div key={item.id} className="flex justify-between items-center bg-white/5 p-2 px-4 rounded-xl mb-1">
                          <p className="text-[10px] font-bold text-on-surface/80">{item.name}</p>
                          <p className="text-[10px] font-black text-primary">x{item.qty}</p>
                       </div>
                    ))}
                 </div>

                 {/* Status & Actions */}
                 <div className="flex items-center gap-8">
                    <div className="text-right">
                       <p className="text-[9px] font-black text-on-surface/20 label-tracking uppercase">Status</p>
                       <p className="text-xs font-black text-primary italic uppercase tracking-widest">{order.status}</p>
                    </div>
                    <button className="px-8 py-3 neon-disruptor rounded-xl text-[10px] font-black label-tracking shadow-glow hover:scale-105 transition-transform">
                       INICIAR EMPAQUE
                    </button>
                 </div>
              </div>

              {/* Progress Bar Background */}
              <div className="absolute bottom-0 left-0 h-1 bg-primary/20 w-full">
                 <div className={`h-full bg-primary transition-all duration-1000 ${order.status === 'picking' ? 'w-1/3' : order.status === 'packing' ? 'w-2/3' : 'w-0'}`} />
              </div>
           </div>
         ))}

         {filteredOrders.length === 0 && (
            <div className="py-24 text-center glass-card rounded-[3rem]">
               <span className="material-symbols-outlined !text-5xl text-primary/10 mb-6 block">done_all</span>
               <p className="text-sm font-black text-on-surface/20 uppercase label-tracking">Sin órdenes pendientes en este canal</p>
            </div>
         )}
      </div>

      <div className="h-20" />
    </div>
  );
}
