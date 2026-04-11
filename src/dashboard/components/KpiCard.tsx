interface KpiCardProps {
  label: string;
  value: string;
  trend?: string;
  trendIcon?: string;
  trendColor?: "primary" | "secondary" | "error" | "outline";
  accent?: "primary" | "secondary" | "error" | "outline";
}

const ACCENT_CLASSES: Record<string, string> = {
  primary:   "kpi-accent-primary",
  secondary: "kpi-accent-secondary",
  error:     "kpi-accent-error",
  outline:   "kpi-accent-outline",
};

const TREND_COLOR_CLASSES: Record<string, string> = {
  primary:   "text-primary-container",
  secondary: "text-secondary",
  error:     "text-error",
  outline:   "text-on-surface-variant",
};

const VALUE_COLOR_CLASSES: Record<string, string> = {
  primary:   "text-on-surface",
  secondary: "text-on-surface",
  error:     "text-error",
  outline:   "text-primary-container",
};

export function KpiCard({
  label,
  value,
  trend,
  trendIcon = "trending_up",
  trendColor = "primary",
  accent = "primary",
}: KpiCardProps) {
  return (
    <div className={`kpi-card ${ACCENT_CLASSES[accent]}`} role="article" aria-label={label}>
      <p className="label-sm text-on-surface-variant mb-2">{label}</p>
      <p
        className={`text-3xl font-bold font-headline ${VALUE_COLOR_CLASSES[accent]}`}
        aria-live="polite"
      >
        {value}
      </p>
      {trend && (
        <div
          className={`flex items-center gap-1 mt-3 ${TREND_COLOR_CLASSES[trendColor]}`}
        >
          <span className="material-symbols-outlined text-xs" aria-hidden="true">
            {trendIcon}
          </span>
          <span className="label-sm">{trend}</span>
        </div>
      )}
    </div>
  );
}
