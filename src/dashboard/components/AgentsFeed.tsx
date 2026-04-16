"use client";

interface AgentStatus {
  id: string;
  name: string;
  task: string;
  agent_status: "active" | "syncing" | "idle" | "error";
  icon: string;
}

const AGENTS: AgentStatus[] = [
  { id: "1",  name: "ML Fulfillment",      task: "Processing 12 orders...",    agent_status: "active",  icon: "local_shipping" },
  { id: "2",  name: "Price Sync",           task: "Syncing 34 SKUs",       agent_status: "syncing", icon: "price_change" },
  { id: "3",  name: "Inventory Monitor",    task: "Stock check complete",      agent_status: "active",  icon: "inventory_2" },
  { id: "4",  name: "CFDI Billing",         task: "3 invoices in queue",          agent_status: "active",  icon: "receipt_long" },
  { id: "5",  name: "Instagram Publisher",  task: "Awaiting approval...",     agent_status: "syncing", icon: "photo_camera" },
  { id: "6",  name: "Amazon FBA Manager",   task: "FBA Monitor active",          agent_status: "active",  icon: "deployed_code" },
  { id: "7",  name: "WhatsApp Handler",     task: "2 open threads",   agent_status: "active",  icon: "chat" },
  { id: "8",  name: "Warehouse Coord.",     task: "Daily briefing sent",         agent_status: "active",  icon: "warehouse" },
  { id: "9",  name: "NPS Satisfaction",     task: "Cooldown mode (89D)",       agent_status: "idle",    icon: "star" },
  { id: "10", name: "Crisis Response",      task: "Standby protocol",                agent_status: "idle",    icon: "emergency" },
  { id: "11", name: "Returns & Refunds",    task: "0 active returns",      agent_status: "idle",    icon: "assignment_return" },
  { id: "12", name: "Leads Pipeline",       task: "14 qualified nodes",    agent_status: "active",  icon: "funnel" },
];

const COLORS = {
  active:  "#ccff00",
  syncing: "#ffffff",
  idle:    "rgba(255,255,255,0.2)",
  error:   "#ef4444",
};

export function AgentsFeed() {
  const activeCount = AGENTS.filter((a) => a.agent_status === "active").length;

  return (
    <section
      className="glass-card rounded-[2.5rem] border border-white/5 flex flex-col h-full overflow-hidden relative group"
      aria-label="Agent Neural Status"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#ccff00]/5 rounded-full blur-[60px] pointer-events-none group-hover:bg-[#ccff00]/10 transition-colors duration-1000" />

      {/* Header */}
      <div className="px-8 py-8 flex items-center justify-between border-b border-white/5 relative z-10">
        <div className="flex items-center gap-4">
           <div className="w-9 h-9 rounded-xl bg-[#ccff00]/10 flex items-center justify-center border border-[#ccff00]/20">
              <span className="material-symbols-outlined text-[#ccff00] text-lg shadow-volt" aria-hidden="true">smart_toy</span>
           </div>
           <div>
              <h2 className="text-sm font-black text-white uppercase tracking-tighter italic leading-none">Sub-Agents</h2>
              <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] mt-1">Autonomous Cluster</p>
           </div>
        </div>
        <div className="px-3 py-1 bg-white/5 border border-white/5 rounded-full">
           <span className="text-[9px] font-black text-[#ccff00] italic">{activeCount} / {AGENTS.length} LIVE</span>
        </div>
      </div>

      {/* Scrollable list */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2 custom-scrollbar relative z-10" role="list">
        {AGENTS.map((agent) => {
          const color = COLORS[agent.agent_status];
          return (
            <div
              key={agent.id}
              role="listitem"
              className="w-full text-left p-4 rounded-[1.5rem] flex items-center justify-between transition-all duration-500 border border-transparent hover:border-white/5 hover:bg-white/[0.02] group/row"
              aria-label={`${agent.name}: ${agent.task}`}
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="relative flex-shrink-0">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/5 group-hover/row:border-white/10 transition-all">
                    <span className="material-symbols-outlined text-base text-white/30" aria-hidden="true">
                      {agent.icon}
                    </span>
                  </div>
                  <div
                    className={`
                      absolute -bottom-0.5 -right-0.5
                      w-2 h-2 rounded-full border-2 border-black
                      ${agent.agent_status === "active" ? "animate-pulse" : ""}
                    `}
                    style={{ backgroundColor: color, boxShadow: agent.agent_status === 'active' ? `0 0 5px ${color}` : 'none' }}
                    aria-hidden="true"
                  />
                </div>
                
                <div className="min-w-0">
                  <p className="text-[11px] font-black text-white uppercase tracking-tight group-hover/row:text-[#ccff00] transition-colors">{agent.name}</p>
                  <p className="text-[9px] font-black text-white/20 truncate uppercase tracking-widest italic">{agent.task}</p>
                </div>
              </div>
              
              <span
                className="text-[8px] font-black px-2 py-0.5 rounded-lg border italic opacity-0 group-hover/row:opacity-100 transition-all duration-500 uppercase tracking-widest"
                style={{ color, borderColor: `${color}33`, backgroundColor: `${color}11` }}
              >
                {agent.agent_status}
              </span>
            </div>
          );
        })}
      </div>

      {/* Footer button */}
      <div className="p-6 border-t border-white/5 bg-black/20 flex-shrink-0 relative z-10">
        <button
          className="
            w-full h-12 bg-white/5 border border-white/5 rounded-2xl
            text-[9px] font-black text-white/40 uppercase tracking-[0.2em] italic 
            hover:text-white hover:bg-white/10 hover:border-white/20 transition-all duration-500
          "
          aria-label="View All Sub-Agents"
        >
          Expand Registry (43 nodes)
        </button>
      </div>
    </section>
  );
}
