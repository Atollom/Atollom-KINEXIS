"use client";

import { useState } from "react";

interface ApprovalItem {
  id: string;
  agentName: string;
  action: string;
  detail: string;
  amount?: string;
  priority: "high" | "medium" | "low";
  timestamp: string;
}

const MOCK_ITEMS: ApprovalItem[] = [
  {
    id: "1",
    agentName: "Price Sync Agent",
    action: "PRICE_ADJUSTMENT",
    detail: 'SKU-PINZAS-01 → $489 MXN on ML & Amazon (Margin: +22%)',
    amount: "$489 MXN",
    priority: "high",
    timestamp: "2M AGO",
  },
  {
    id: "2",
    agentName: "Insta Publisher",
    action: "CONTENT_QUEUE",
    detail: "FEED_POST: 'Neural Launch Arrival'. Scheduled for 19:00",
    priority: "medium",
    timestamp: "8M AGO",
  },
  {
    id: "3",
    agentName: "CFDI Billing Agent",
    action: "TAX_STAMP_PENDING",
    detail: "Order #88219 — $4,200 MXN — RFC: XAXX010101000",
    amount: "$4,200 MXN",
    priority: "high",
    timestamp: "15M AGO",
  },
];

const PRIORITY_COLORS: Record<string, string> = {
  high:   "#ccff00",
  medium: "#ffffff",
  low:    "rgba(255,255,255,0.2)",
};

export function ApprovalQueue() {
  const [items, setItems] = useState<ApprovalItem[]>(MOCK_ITEMS);

  function handleApprove(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  function handleReject(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  return (
    <section
      className="glass-card rounded-[2.5rem] border border-white/5 flex flex-col h-full overflow-hidden relative group"
      aria-label="Human-in-the-loop Approval Queue"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#ccff00]/5 rounded-full blur-[60px] pointer-events-none group-hover:bg-[#ccff00]/10 transition-colors duration-1000" />

      {/* Header */}
      <div className="px-8 py-8 flex items-center justify-between border-b border-white/5 relative z-10">
        <div className="flex items-center gap-4">
           <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center border border-white/5">
              <span className="material-symbols-outlined text-[#ccff00] text-lg shadow-volt" aria-hidden="true">verified_user</span>
           </div>
           <div>
              <h2 className="text-sm font-black text-white uppercase tracking-tighter italic leading-none">Decision Hub</h2>
              <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] mt-1">Human Validation Required</p>
           </div>
        </div>
        
        {items.length > 0 ? (
          <div className="px-3 py-1 bg-[#ccff00]/10 border border-[#ccff00]/20 rounded-full flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#ccff00] animate-pulse shadow-volt" />
            <span className="text-[9px] font-black text-[#ccff00] italic">{items.length} PENDING</span>
          </div>
        ) : (
          <div className="px-3 py-1 bg-white/5 border border-white/5 rounded-full flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
            <span className="text-[9px] font-black text-white/40 italic">CLEARED</span>
          </div>
        )}
      </div>

      {/* Items list */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4 custom-scrollbar relative z-10">
        {items.length === 0 ? (
          <div className="py-24 text-center opacity-10 flex flex-col items-center">
            <span className="material-symbols-outlined text-5xl mb-6">verified</span>
            <p className="text-[10px] font-black uppercase tracking-[0.5em] italic">No Pending Intercepts</p>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className={`
                p-8 rounded-[2rem] border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10 transition-all duration-500 group/row relative overflow-hidden
              `}
            >
              {/* Dynamic Glow */}
              <div 
                className="absolute top-0 left-0 w-24 h-24 blur-[40px] opacity-0 group-hover/row:opacity-20 transition-opacity duration-1000" 
                style={{ backgroundColor: PRIORITY_COLORS[item.priority] }} 
              />
              
              {/* Top row */}
              <div className="flex items-start justify-between mb-6 relative z-10">
                <div className="flex items-center gap-4">
                  <div
                    className={`w-2.5 h-2.5 rounded-full shadow-lg ${item.priority === 'high' ? 'animate-pulse' : ''}`}
                    style={{ backgroundColor: PRIORITY_COLORS[item.priority], boxShadow: `0 0 10px ${PRIORITY_COLORS[item.priority]}` }}
                    aria-hidden="true"
                  />
                  <div>
                    <p className="text-[11px] font-black text-white uppercase tracking-tight leading-none group-hover/row:text-[#ccff00] transition-colors">{item.agentName}</p>
                    <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] mt-2 italic">{item.action}</p>
                  </div>
                </div>
                {item.amount && (
                  <p className="text-lg font-black italic tracking-tighter text-[#ccff00]">
                    {item.amount}
                  </p>
                )}
              </div>

              {/* Detail */}
              <div className="bg-white/5 border border-white/5 rounded-2xl px-6 py-4 mb-8 relative z-10 shadow-inner">
                <p className="text-[11px] text-white/40 italic leading-relaxed font-medium">
                  &ldquo;{item.detail}&rdquo;
                </p>
              </div>

              {/* Timestamp + actions */}
              <div className="flex items-center justify-between relative z-10">
                <span className="text-[9px] font-black text-white/10 uppercase tracking-widest italic">{item.timestamp}</span>
                <div className="flex gap-4">
                  <button
                    onClick={() => handleReject(item.id)}
                    className="h-10 px-6 rounded-xl border border-white/5 text-[9px] font-black uppercase tracking-widest text-white/20 hover:text-red-500 hover:border-red-500/30 transition-all duration-500 italic"
                  >
                    Discard
                  </button>
                  <button
                    onClick={() => handleApprove(item.id)}
                    className="h-10 px-6 rounded-xl bg-white text-black text-[9px] font-black uppercase tracking-widest hover:bg-[#ccff00] hover:shadow-volt transition-all duration-500 italic"
                  >
                    Validate
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer info */}
      <div className="p-6 border-t border-white/5 bg-black/20 flex-shrink-0 relative z-10">
        <p className="text-[9px] font-black text-white/10 uppercase tracking-[0.5em] text-center italic">
          Decision Entropy Filter Active
        </p>
      </div>
    </section>
  );
}
