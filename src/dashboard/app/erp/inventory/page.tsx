"use client";

import { useMemo, useState } from "react";

interface Warehouse {
  id: string;
  name: string;
  location: string;
  totalSKUs: number;
  value: number;
}

interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  stock: number;
  min: number;
  status: "ok" | "warning" | "critical";
}

const WAREHOUSES: Warehouse[] = [
  { id: "alpha", name: "Warehouse Alpha", location: "Santa Fe, CDMX", totalSKUs: 842, value: 4500000 },
  { id: "bravo", name: "Warehouse Bravo", location: "Monterrey, NL", totalSKUs: 320, value: 1200000 },
  { id: "gamma", name: "Warehouse Gamma", location: "Guadalajara, JAL", totalSKUs: 156, value: 850000 },
];

const MOCK_ITEMS: Record<string, InventoryItem[]> = {
  alpha: [
    { id: "1", sku: "NX-800", name: "Kinexis Pulse Controller", stock: 120, min: 20, status: "ok" },
    { id: "2", sku: "NX-200", name: "Neural Link Cable", stock: 15, min: 50, status: "critical" },
    { id: "3", sku: "NX-HUB", name: "Command Hub Elite", stock: 45, min: 40, status: "warning" },
  ],
  bravo: [
    { id: "4", sku: "NX-800", name: "Kinexis Pulse Controller", stock: 45, min: 10, status: "ok" },
  ],
  gamma: []
};

export default function InventoryPage() {
  const [activeWarehouse, setActiveWarehouse] = useState<string>("alpha");

  const currentItems = MOCK_ITEMS[activeWarehouse] || [];

  return (
    <div className="space-y-10 animate-in">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <span className="text-[0.75rem] font-bold label-tracking text-primary drop-shadow-glow">
            Supply Chain / Multi-Warehouse Management
          </span>
          <h1 className="text-4xl md:text-5xl font-black tight-tracking text-on-surface">
            Control de Inventarios
          </h1>
        </div>

        <div className="flex items-center gap-3">
           <button className="px-8 py-4 glass-card border-white/5 rounded-2xl text-[10px] font-black label-tracking text-on-surface-variant hover:text-on-surface transition-all flex items-center gap-2">
              <span className="material-symbols-outlined !text-[16px]">add_business</span>
              NUEVA BODEGA
           </button>
           <button className="px-8 py-4 neon-disruptor rounded-2xl text-[10px] font-black label-tracking shadow-glow">
              REPORTE DE VALUACIÓN
           </button>
        </div>
      </header>

      {/* Warehouse Selection Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         {WAREHOUSES.map(wh => (
           <button 
             key={wh.id}
             onClick={() => setActiveWarehouse(wh.id)}
             className={`p-6 rounded-[2rem] border transition-all text-left relative overflow-hidden group ${activeWarehouse === wh.id ? 'glass-card border-primary bg-primary/5' : 'glass-card border-white/5 bg-white/[0.02] hover:border-white/20'}`}
           >
              <div className="relative z-10 space-y-4">
                 <div className="flex justify-between items-start">
                    <span className={`material-symbols-outlined !text-3xl ${activeWarehouse === wh.id ? 'text-primary' : 'text-on-surface/20'}`}>warehouse</span>
                    {activeWarehouse === wh.id && <span className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-glow" />}
                 </div>
                 <div>
                    <h3 className="text-sm font-black text-on-surface">{wh.name}</h3>
                    <p className="text-[10px] font-bold text-on-surface-variant uppercase label-tracking">{wh.location}</p>
                 </div>
                 <div className="flex justify-between items-end pt-4 border-t border-white/5">
                    <div>
                       <p className="text-[9px] font-black text-on-surface/30 label-tracking uppercase">Stock Value</p>
                       <p className="text-sm font-black text-on-surface">${wh.value.toLocaleString()}</p>
                    </div>
                    <p className="text-[10px] font-black text-primary">{wh.totalSKUs} SKUs</p>
                 </div>
              </div>
              <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
           </button>
         ))}
      </div>

      {/* Items Inventory Table */}
      <section className="space-y-6">
         <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-black label-tracking text-on-surface-variant uppercase italic">Detalle de Existencias (Bodega: {activeWarehouse.toUpperCase()})</h3>
            <div className="flex gap-4">
               <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface/30 !text-[16px]">search</span>
                  <input type="text" placeholder="Search SKU..." className="bg-white/5 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-[11px] font-medium focus:border-primary/50 outline-none w-64" />
               </div>
            </div>
         </div>

         <div className="glass-card rounded-[2.5rem] border border-white/5 overflow-hidden">
             <table className="w-full text-left">
                <thead>
                   <tr className="border-b border-white/5 bg-white/[0.02]">
                      <th className="px-8 py-5 text-[10px] font-black label-tracking text-on-surface/40 uppercase">Product SKU</th>
                      <th className="px-8 py-5 text-[10px] font-black label-tracking text-on-surface/40 uppercase">Name</th>
                      <th className="px-8 py-5 text-[10px] font-black label-tracking text-on-surface/40 uppercase">Current Stock</th>
                      <th className="px-8 py-5 text-[10px] font-black label-tracking text-on-surface/40 uppercase">Safety Stock</th>
                      <th className="px-8 py-5 text-[10px] font-black label-tracking text-on-surface/40 uppercase text-right">Operational Status</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                   {currentItems.map(item => (
                     <tr key={item.id} className="group hover:bg-white/[0.02] transition-colors">
                        <td className="px-8 py-5 text-[11px] font-black text-primary">{item.sku}</td>
                        <td className="px-8 py-5 text-[11px] font-bold text-on-surface">{item.name}</td>
                        <td className="px-8 py-5 text-[13px] font-black text-on-surface">{item.stock} units</td>
                        <td className="px-8 py-5 text-[11px] font-bold text-on-surface-variant opacity-40">{item.min} min</td>
                        <td className="px-8 py-5 text-right">
                           <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase ${item.status === 'ok' ? 'bg-primary/10 text-primary' : item.status === 'warning' ? 'bg-amber-500/10 text-amber-500' : 'bg-red-500/10 text-red-500'}`}>
                              {item.status.toUpperCase()}
                           </span>
                        </td>
                     </tr>
                   ))}
                </tbody>
             </table>
             {currentItems.length === 0 && (
                <div className="py-20 text-center">
                   <p className="text-[10px] font-black text-on-surface/20 uppercase label-tracking">No items inventoried in this location</p>
                </div>
             )}
         </div>
      </section>

      <div className="h-20" />
    </div>
  );
}
