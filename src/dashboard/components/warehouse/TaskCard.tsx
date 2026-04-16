"use client";

import { useState } from "react";
import type { Platform } from "@/types";
import { PlatformBadge } from "@/components/ecommerce/PlatformBadge";
import { PrintButton } from "./PrintButton";

export type TaskStatus = "pending" | "printed" | "confirmed";

export interface WarehouseTask {
  order_id: string;
  external_id: string;
  platform: Platform;
  priority: number;
  customer_name: string;
  address?: string;
  products: Array<{ name: string; qty: number }>;
  created_at: string;
  status: TaskStatus;
}

interface TaskCardProps {
  task: WarehouseTask;
  onConfirm: (id: string) => void;
}

const PRIORITY_COLOR: Record<number, string> = {
  1: "#ccff00",
  2: "#ff9900",
  3: "#ffffff",
};

export function TaskCard({ task, onConfirm }: TaskCardProps) {
  const [status, setStatus] = useState<TaskStatus>(task.status);

  function handlePrinted() {
    setStatus("printed");
  }

  function handleConfirm() {
    setStatus("confirmed");
    onConfirm(task.order_id);
  }

  const isConfirmed = status === "confirmed";

  return (
    <article
      className={`
        glass-card rounded-[2.5rem] p-8 border transition-all duration-500 relative overflow-hidden
        ${isConfirmed ? 'opacity-40 grayscale-[0.5] scale-[0.98]' : 'border-white/5 hover:border-white/10 hover:shadow-2xl shadow-volt/20'}
      `}
    >
      {/* Visual Identity Strip */}
      <div 
         className="absolute top-0 left-0 w-1.5 h-full opacity-50"
         style={{ backgroundColor: PRIORITY_COLOR[task.priority] || '#ffffff' }}
      />
      
      {/* Header Grid */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div className="flex items-center gap-6">
           <div 
              className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-black text-xl italic"
              style={{ backgroundColor: PRIORITY_COLOR[task.priority] || '#ffffff', boxShadow: `0 0 20px ${PRIORITY_COLOR[task.priority]}44` }}
           >
              {task.priority}
           </div>
           
           <div>
              <div className="flex items-center gap-3">
                 <h3 className="text-2xl font-black text-white tracking-tighter">#{task.external_id}</h3>
                 <PlatformBadge platform={task.platform} size="md" />
              </div>
              <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mt-1 italic">
                 {task.customer_name}
              </p>
           </div>
        </div>

        {isConfirmed && (
           <div className="px-6 py-2 rounded-xl bg-[#ccff00]/10 border border-[#ccff00]/30 animate-luxe">
              <span className="text-[10px] font-black text-[#ccff00] uppercase tracking-[0.3em] italic">Operation Secured</span>
           </div>
        )}
      </div>

      {/* Product Matrix */}
      <div className="bg-white/5 rounded-3xl p-6 border border-white/5 mb-8 space-y-4">
         <div className="flex justify-between px-2 mb-2">
            <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">Description</span>
            <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">Units</span>
         </div>
         {task.products.map((p, i) => (
           <div key={i} className="flex items-center justify-between group">
             <p className="text-[13px] font-black text-white/80 uppercase tracking-tight group-hover:text-white transition-colors">{p.name}</p>
             <div className="flex items-center gap-3">
                <span className="text-[10px] text-white/20 font-black italic">×</span>
                <span className="text-xl font-black text-[#ccff00] italic">{p.qty}</span>
             </div>
           </div>
         ))}
      </div>

      {/* Extended Data */}
      {task.address && task.platform === "shopify" && (
        <div className="flex items-start gap-4 mb-8 p-4 bg-white/[0.03] rounded-2xl border border-white/5 italic">
          <span className="material-symbols-outlined text-[#ccff00] text-lg">local_shipping</span>
          <p className="text-[11px] text-white/50 leading-relaxed font-medium uppercase tracking-tight">{task.address}</p>
        </div>
      )}

      {/* Mission Actions */}
      {!isConfirmed && (
        <div className="flex flex-col sm:flex-row items-center gap-4">
           <div className="w-full sm:w-auto">
              <PrintButton
                orderId={task.order_id}
                externalId={task.external_id}
                onPrinted={handlePrinted}
              />
           </div>
           
           <button
             onClick={handleConfirm}
             disabled={status === "pending"}
             className={`
               flex-1 w-full h-14 rounded-2xl flex items-center justify-center gap-4
               text-[11px] font-black uppercase tracking-[0.3em] transition-all duration-300
               ${status === "printed"
                 ? "bg-[#ccff00] text-black shadow-volt hover:scale-105 active:scale-95"
                 : "bg-white/5 text-white/10 border border-white/5 cursor-not-allowed opacity-50"
               }
             `}
           >
             <span className="material-symbols-outlined text-xl">
               {status === "printed" ? "verified" : "lock"}
             </span>
             {status === "printed" ? "Confirm Logistics Dispatch" : "Seal Print First"}
           </button>
        </div>
      )}
    </article>
  );
}
