import type { CFDIStatus } from "@/types";

interface CFDIStatusChipProps {
  status: CFDIStatus;
}

const CONFIG: Record<CFDIStatus, { label: string; className: string }> = {
  TIMBRADO: {
    label: "TIMBRADO",
    className: "bg-success/10 text-success border-success/25 text-success",
  },
  ERROR_PAC: {
    label: "ERROR PAC",
    className: "bg-error/10 text-error border-error/25",
  },
  ERROR_VALIDACION: {
    label: "ERROR VALIDACIÓN",
    className: "bg-error/10 text-error border-error/25",
  },
  CANCELADO: {
    label: "CANCELADO",
    className: "bg-outline/10 text-outline border-outline/25 line-through",
  },
  CANCELACION_PENDIENTE: {
    label: "CANCELACIÓN PEND.",
    className: "bg-secondary/10 text-secondary border-secondary/25",
  },
};

export function CFDIStatusChip({ status }: CFDIStatusChipProps) {
  const { label, className } = CONFIG[status];
  return (
    <span
      className={`
        inline-flex items-center gap-1
        px-2 py-0.5 rounded-full border
        text-[9px] font-bold uppercase tracking-widest
        ${className}
      `}
      aria-label={`Estado CFDI: ${label}`}
    >
      {label}
    </span>
  );
}
