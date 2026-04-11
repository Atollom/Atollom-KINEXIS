import type { Platform } from "@/types";
import { PlatformBadge } from "./PlatformBadge";

export type LiveOrderStatus = "PENDIENTE" | "ETIQUETA" | "ENVIADO" | "ENTREGADO";

export interface LiveOrder {
  id: string;
  external_id: string;
  platform: Platform;
  product: string;
  total: number;
  status: LiveOrderStatus;
  customer: string;
  minutes_ago: number;
}

interface OrderCardProps {
  order: LiveOrder;
}

const STATUS_CONFIG: Record<LiveOrderStatus, { label: string; className: string }> = {
  PENDIENTE: { label: "PENDIENTE",  className: "chip-warning" },
  ETIQUETA:  { label: "ETIQUETA",   className: "chip-active" },
  ENVIADO:   { label: "ENVIADO",    className: "bg-success/10 text-success border border-success/25 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest inline-flex items-center gap-1" },
  ENTREGADO: { label: "ENTREGADO",  className: "bg-outline/10 text-outline border border-outline/25 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest inline-flex items-center gap-1" },
};

export function OrderCard({ order }: OrderCardProps) {
  const { label, className } = STATUS_CONFIG[order.status];

  return (
    <div
      className="
        flex items-center justify-between
        px-4 py-3 rounded-xl
        bg-surface-container
        hover:bg-surface-container-high
        transition-colors duration-150 group
      "
      role="row"
    >
      {/* Left: platform + order info */}
      <div className="flex items-center gap-3 min-w-0">
        <PlatformBadge platform={order.platform} />
        <div className="min-w-0">
          <p className="text-xs font-bold text-on-surface font-mono truncate">
            #{order.external_id}
          </p>
          <p className="text-[10px] text-on-surface-variant truncate max-w-[180px]">
            {order.product}
          </p>
        </div>
      </div>

      {/* Center: customer */}
      <p className="hidden md:block text-[10px] text-on-surface-variant truncate max-w-[120px] mx-4">
        {order.customer}
      </p>

      {/* Right: total + status + time */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <p className="text-sm font-bold font-headline text-on-surface">
          ${order.total.toLocaleString("es-MX")}
        </p>
        <span className={className} aria-label={`Estado: ${label}`}>
          {label}
        </span>
        <span className="label-sm text-outline hidden sm:block">
          {order.minutes_ago}m
        </span>
      </div>
    </div>
  );
}
