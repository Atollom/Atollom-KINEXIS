"use client";

export function SystemMetrics() {
  return (
    <section
      className="
        col-span-12 glass-card rounded-[3rem] p-10 
        relative overflow-hidden min-h-[220px] flex flex-col justify-end
        border border-white/5 group transition-all duration-700
      "
      aria-label="System Neural Metrics"
    >
      {/* ── Neural Grid Background ── */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" aria-hidden="true">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ccff00_1px,transparent_1px),linear-gradient(to_bottom,#ccff00_1px,transparent_1px)] bg-[size:40px_40px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
      </div>

      <div className="absolute top-0 right-0 w-96 h-96 bg-[#ccff00]/5 rounded-full blur-[100px] pointer-events-none group-hover:bg-[#ccff00]/10 transition-colors duration-1000" />

      {/* ── Metrics Matrix ── */}
      <div className="relative z-10 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-10 items-end">
        <div className="space-y-2">
          <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.4em] italic leading-none">Global Latency</p>
          <p className="text-3xl font-black italic tracking-tighter text-[#ccff00] leading-none">14.0 MS</p>
        </div>
        
        <div className="space-y-2">
          <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.4em] italic leading-none">Daily Inference</p>
          <p className="text-3xl font-black italic tracking-tighter text-white leading-none">88.4 M</p>
        </div>

        <div className="space-y-4">
          <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.4em] italic leading-none">Neural Capacity</p>
          <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden p-0.5">
            <div
              className="h-full w-[65%] bg-[#ccff00] rounded-full shadow-volt relative"
              role="progressbar"
              aria-valuenow={65}
              aria-valuemin={0}
              aria-valuemax={100}
            >
               <div className="absolute inset-0 bg-white/40 animate-pulse" />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.4em] italic leading-none">Temporal Delta</p>
          <p className="text-3xl font-black italic tracking-tighter text-white leading-none">0.002 S</p>
        </div>

        <div className="space-y-2">
          <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.4em] italic leading-none">Neural Integrity</p>
          <p className="text-3xl font-black italic tracking-tighter text-[#ccff00] leading-none font-mono">100 %</p>
        </div>

        <div className="flex items-end h-full">
          <button
            className="w-full h-14 bg-white/[0.03] border border-white/5 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] italic text-white/40 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all duration-500"
            aria-label="Download System Log"
          >
            Terminal Logs
          </button>
        </div>
      </div>
    </section>
  );
}
