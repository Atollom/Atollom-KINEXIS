interface AgentStatus {
  id: string;
  name: string;
  task: string;
  agent_status: "active" | "syncing" | "idle" | "error";
  icon: string;
}

const AGENTS: AgentStatus[] = [
  { id: "1",  name: "ML Fulfillment",      task: "Procesando 12 órdenes...",    agent_status: "active",  icon: "local_shipping" },
  { id: "2",  name: "Price Sync",           task: "Sincronizando 34 SKUs",       agent_status: "syncing", icon: "price_change" },
  { id: "3",  name: "Inventory Monitor",    task: "Stock check completado",      agent_status: "active",  icon: "inventory_2" },
  { id: "4",  name: "CFDI Billing",         task: "3 facturas en cola",          agent_status: "active",  icon: "receipt_long" },
  { id: "5",  name: "Instagram Publisher",  task: "Esperando aprobación...",     agent_status: "syncing", icon: "photo_camera" },
  { id: "6",  name: "Amazon FBA Manager",   task: "Monitor FBA activo",          agent_status: "active",  icon: "deployed_code" },
  { id: "7",  name: "WhatsApp Handler",     task: "2 conversaciones abiertas",   agent_status: "active",  icon: "chat" },
  { id: "8",  name: "Warehouse Coord.",     task: "Briefing AM enviado",         agent_status: "active",  icon: "warehouse" },
  { id: "9",  name: "NPS Satisfaction",     task: "En cooldown (89 días)",       agent_status: "idle",    icon: "star" },
  { id: "10", name: "Crisis Response",      task: "Modo standby",                agent_status: "idle",    icon: "emergency" },
  { id: "11", name: "Returns & Refunds",    task: "0 devoluciones activas",      agent_status: "idle",    icon: "assignment_return" },
  { id: "12", name: "Leads Pipeline",       task: "14 leads calificados hoy",    agent_status: "active",  icon: "funnel" },
];

const STATUS_DOT: Record<string, string> = {
  active:  "bg-primary-container",
  syncing: "bg-secondary",
  idle:    "bg-outline",
  error:   "bg-error",
};

const STATUS_LABEL: Record<string, string> = {
  active:  "ACTIVO",
  syncing: "SYNC",
  idle:    "IDLE",
  error:   "ERROR",
};

const STATUS_TEXT: Record<string, string> = {
  active:  "text-primary-container",
  syncing: "text-secondary",
  idle:    "text-outline",
  error:   "text-error",
};

export function AgentsFeed() {
  const activeCount = AGENTS.filter((a) => a.agent_status === "active").length;

  return (
    <section
      className="bg-surface-container-high rounded-xl flex flex-col h-full"
      aria-label="Estado de agentes"
    >
      {/* Header */}
      <div className="px-6 py-4 flex items-center justify-between border-b border-surface-bright/50">
        <h2 className="font-headline font-bold text-xs uppercase tracking-widest flex items-center gap-2">
          <span className="material-symbols-outlined text-primary-container text-sm" aria-hidden="true">
            smart_toy
          </span>
          Agentes Activos
        </h2>
        <span className="label-sm text-on-surface-variant">{activeCount} / {AGENTS.length} ONLINE</span>
      </div>

      {/* Scrollable list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1" role="list">
        {AGENTS.map((agent) => (
          <div
            key={agent.id}
            role="listitem"
            className="agent-row group"
            aria-label={`${agent.name}: ${agent.task}`}
          >
            <div className="flex items-center gap-3">
              {/* Icon with status dot */}
              <div className="relative flex-shrink-0">
                <div className="w-8 h-8 rounded-lg bg-surface-container-lowest flex items-center justify-center border border-outline-variant/30">
                  <span className="material-symbols-outlined text-xs text-on-surface-variant" aria-hidden="true">
                    {agent.icon}
                  </span>
                </div>
                <div
                  className={`
                    absolute -bottom-0.5 -right-0.5
                    w-2 h-2 rounded-full
                    border border-surface-container-high
                    ${STATUS_DOT[agent.agent_status]}
                    ${agent.agent_status === "active" ? "animate-pulse" : ""}
                  `}
                  aria-hidden="true"
                />
              </div>
              {/* Name + task */}
              <div className="min-w-0">
                <p className="text-xs font-bold text-on-surface truncate">{agent.name}</p>
                <p className="text-[10px] text-on-surface-variant truncate">{agent.task}</p>
              </div>
            </div>
            {/* Status chip — visible on hover */}
            <span
              className={`
                label-sm px-2 py-0.5 rounded
                bg-surface-container-lowest
                border border-outline-variant/20
                opacity-0 group-hover:opacity-100 transition-opacity
                ${STATUS_TEXT[agent.agent_status]}
              `}
            >
              {STATUS_LABEL[agent.agent_status]}
            </span>
          </div>
        ))}
      </div>

      {/* Footer button */}
      <div className="p-4 border-t border-surface-bright/50">
        <button
          className="
            w-full py-2
            label-sm text-on-surface-variant
            border border-outline-variant rounded-lg
            hover:bg-surface-container-high transition-colors
          "
          aria-label="Ver todos los agentes"
        >
          Ver todos los agentes (43)
        </button>
      </div>
    </section>
  );
}
