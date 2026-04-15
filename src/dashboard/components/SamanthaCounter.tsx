"use client";

interface SamanthaCounterProps {
  used: number;
  total: number;
  status: "active" | "warning" | "critical";
}

export function SamanthaCounter({ used, total, status }: SamanthaCounterProps) {
  const percentage = (used / total) * 100;
  
  const statusConfig = {
    active: { color: "bg-[#A8E63D]", text: "text-[#A8E63D]", label: "🟢 Activa" },
    warning: { color: "bg-amber-400", text: "text-amber-400", label: "🟡 Advertencia" },
    critical: { color: "bg-red-400", text: "text-red-400", label: "🔴 Crítico" }
  };

  const config = statusConfig[status];

  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#A8E63D] text-base">smart_toy</span>
          <span className="text-sm font-bold text-on-surface">Samantha</span>
        </div>
        <span className={`text-xs font-bold ${config.text}`}>
          {config.label}
        </span>
      </div>

      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-on-surface-variant">Consumo</span>
        <span className="text-sm font-bold text-on-surface">
          {used.toLocaleString()} / {total.toLocaleString()}
        </span>
      </div>

      <div className="h-2 w-full bg-white/[0.06] rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all duration-500 ${config.color}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>

      {percentage >= 95 && (
        <p className="text-xs text-red-400 mt-2">
          ⚠️ Quedan menos de 150 conversaciones. Contrata un pack adicional.
        </p>
      )}
    </div>
  );
}