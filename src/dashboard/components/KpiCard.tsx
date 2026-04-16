"use client";

interface KpiCardProps {
  label: string;
  value: string;
  trend?: string;
  trendIcon?: string;
  trendColor?: "primary" | "secondary" | "error" | "outline";
  accent?: "primary" | "secondary" | "error" | "outline";
}

const ACCENT_GLOWS: Record<string, string> = {
  primary: "bg-[#ccff00]/5",
  secondary: "bg-white/5",
  error: "bg-[#ef4444]/5",
  outline: "bg-white/[0.02]",
};

const TEXT_COLORS: Record<string, string> = {
  primary: "text-[#ccff00]",
  secondary: "text-white",
  error: "text-red-500",
  outline: "text-white/20",
};

const TREND_TEXT_COLORS: Record<string, string> = {
  primary: "text-[#ccff00]",
  secondary: "text-white/40",
  error: "text-red-400",
  outline: "text-white/10",
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
    <div 
      className={`
        glass-card rounded-[2.5rem] p-10 border border-white/5 relative overflow-hidden group transition-all duration-700 hover:border-white/10
        ${ACCENT_GLOWS[accent]}
      `}
      role="article" 
      aria-label={label}
    >
      {/* Dynamic Accent Glow */}
      <div className={`absolute top-0 right-0 w-32 h-32 blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none ${accent === 'primary' ? 'bg-[#ccff00]/10' : accent === 'error' ? 'bg-[#ef4444]/10' : 'bg-white/5'}`} />

      <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.4em] mb-4 italic leading-none">{label}</p>
      
      <p
        className={`text-4xl font-black italic tracking-tighter leading-none ${TEXT_COLORS[accent]}`}
        aria-live="polite"
      >
        {value}
      </p>

      {trend && (
        <div
          className={`flex items-center gap-2 mt-6 ${TREND_TEXT_COLORS[trendColor]}`}
        >
          <div className={`w-5 h-5 rounded-lg flex items-center justify-center bg-white/5 border border-white/5`}>
             <span className="material-symbols-outlined text-[10px] font-black" aria-hidden="true">
               {trendIcon}
             </span>
          </div>
          <span className="text-[9px] font-black uppercase tracking-[0.2em] italic">{trend}</span>
        </div>
      )}
      
      <div className="w-8 h-1 bg-white/5 rounded-full mt-6 group-hover:bg-white/10 transition-colors" />
    </div>
  );
}
