"use client";

interface SamanthaCounterProps {
  used: number;
  total: number;
  status: "active" | "warning" | "critical";
}

const STATUS_CONFIG = {
  active:   { color: "#ccff00", label: "SAMANTHA_ONLINE",  icon: "check_circle" },
  warning:  { color: "#f59e0b", label: "SIGNAL_LOW",      icon: "warning" },
  critical: { color: "#ef4444", label: "CRITICAL_FAULT",  icon: "emergency" }
};

export function SamanthaCounter({ used, total, status }: SamanthaCounterProps) {
  const percentage = (used / total) * 100;
  const config = STATUS_CONFIG[status];

  return (
    <div className="glass-card rounded-[2.5rem] p-8 border border-white/5 relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#ccff00]/5 rounded-full blur-[60px] pointer-events-none group-hover:bg-[#ccff00]/10 transition-colors duration-1000" />
      
      <div className="flex items-center justify-between mb-8 relative z-10">
        <div className="flex items-center gap-4">
           <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center border border-white/5">
              <span className="material-symbols-outlined text-[#ccff00] text-lg shadow-volt">smart_toy</span>
           </div>
           <div>
              <h3 className="text-[11px] font-black text-white uppercase tracking-tighter italic leading-none">Samantha</h3>
              <p className="text-[8px] font-black text-white/20 uppercase tracking-[0.3em] mt-1 italic">Neural Load</p>
           </div>
        </div>
        
        <div className="flex flex-col items-end gap-1">
           <span className="text-[8px] font-black uppercase tracking-widest italic" style={{ color: config.color }}>
             {config.label}
           </span>
           <span className="text-[8px] font-black text-white/10 uppercase tracking-widest">{used.toLocaleString()} / {total.toLocaleString()}</span>
        </div>
      </div>

      <div className="space-y-4 relative z-10">
         <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden p-0.5">
            <div 
              className={`h-full rounded-full transition-all duration-1000 shadow-lg relative`}
              style={{ 
                width: `${Math.min(percentage, 100)}%`, 
                backgroundColor: config.color,
                boxShadow: `0 0 10px ${config.color}`
              }}
            >
               <div className="absolute inset-0 bg-white/20 animate-pulse" />
            </div>
         </div>

         {percentage >= 95 && (
            <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/10 rounded-2xl animate-pulse">
               <span className="material-symbols-outlined text-red-500 text-sm">warning</span>
               <p className="text-[9px] font-black text-red-500 uppercase tracking-widest italic leading-tight">
                 Threshold Critical: Allocation refill required.
               </p>
            </div>
         )}
      </div>

      <div className="w-8 h-1 bg-white/5 rounded-full mt-6" />
    </div>
  );
}