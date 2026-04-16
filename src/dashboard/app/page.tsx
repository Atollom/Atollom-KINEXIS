"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="space-y-10 animate-in">
      {/* Hero Header Section */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <span className="text-[0.75rem] font-bold label-tracking text-primary drop-shadow-[0_0_8px_rgba(204,255,0,0.3)]">
            System Overview
          </span>
          <h1 className="text-4xl md:text-5xl font-black tight-tracking text-on-surface leading-tight">
            Operations Dashboard
          </h1>
        </div>
        <div className="flex gap-3">
          <button className="px-6 py-3 rounded-full bg-white/5 border border-white/10 text-on-surface font-bold text-[11px] uppercase tracking-widest hover:bg-white/10 transition-all active:scale-95">
            Export Logs
          </button>
          <button className="px-6 py-3 rounded-full neon-disruptor text-[11px] uppercase tracking-widest shadow-[0_0_20px_rgba(204,255,0,0.3)] hover:scale-105 transition-all active:scale-95">
            System Refresh
          </button>
        </div>
      </section>

      {/* KPI Bento Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Throughput */}
        <div className="glass-card p-8 space-y-6 group cursor-pointer hover:bg-white/[0.08] transition-all">
          <div className="flex justify-between items-start">
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-primary">
              <span className="material-symbols-outlined !text-[24px]">speed</span>
            </div>
            <span className="text-primary font-black text-xs label-tracking">+12.4%</span>
          </div>
          <div>
            <h3 className="text-on-surface-variant text-[10px] font-black label-tracking">Throughput</h3>
            <p className="text-3xl font-black tight-tracking mt-1">1.2 GB/s</p>
          </div>
        </div>

        {/* System Health */}
        <div className="glass-card p-8 space-y-6 group cursor-pointer hover:bg-white/[0.08] transition-all">
          <div className="flex justify-between items-start">
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-primary">
              <span className="material-symbols-outlined !text-[24px]">health_and_safety</span>
            </div>
            <span className="text-primary font-black text-xs label-tracking">Stable</span>
          </div>
          <div>
            <h3 className="text-on-surface-variant text-[10px] font-black label-tracking">System Health</h3>
            <p className="text-3xl font-black tight-tracking mt-1">99.98%</p>
          </div>
        </div>

        {/* Latency */}
        <div className="glass-card p-8 space-y-6 group cursor-pointer hover:bg-white/[0.08] transition-all">
          <div className="flex justify-between items-start">
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-secondary">
              <span className="material-symbols-outlined !text-[24px]">timer</span>
            </div>
            <span className="text-red-500 font-black text-xs label-tracking">+2ms</span>
          </div>
          <div>
            <h3 className="text-on-surface-variant text-[10px] font-black label-tracking">Latency</h3>
            <p className="text-3xl font-black tight-tracking mt-1">14ms</p>
          </div>
        </div>

        {/* Active Agents */}
        <div className="glass-card p-8 space-y-6 group cursor-pointer hover:bg-white/[0.08] transition-all">
          <div className="flex justify-between items-start">
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-on-surface">
              <span className="material-symbols-outlined !text-[24px]">memory</span>
            </div>
            <span className="text-primary font-black text-xs label-tracking">Active</span>
          </div>
          <div>
            <h3 className="text-on-surface-variant text-[10px] font-black label-tracking">Active Agents</h3>
            <p className="text-3xl font-black tight-tracking mt-1">2,842</p>
          </div>
        </div>
      </section>

      {/* Main Content Area: Chart + Sidebar */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Visualization Area */}
        <div className="lg:col-span-2 glass-card p-8 space-y-8 relative overflow-hidden group">
          <div className="flex justify-between items-center relative z-10">
            <h2 className="text-xl font-black tight-tracking">Network Propagation</h2>
            <div className="flex items-center gap-4 text-[10px] font-black label-tracking text-on-surface-variant">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span> Edge Nodes
              </span>
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-white/20"></span> Core Relay
              </span>
            </div>
          </div>
          
          <div className="aspect-[21/9] w-full bg-white/5 rounded-2xl overflow-hidden relative group">
             <div className="absolute inset-x-8 bottom-8 flex items-end gap-1.5 h-3/4">
               {[40, 55, 45, 70, 60, 85, 75, 90, 80, 65, 50, 40, 60, 70, 55, 80, 65, 95].map((h, i) => (
                 <div 
                   key={i} 
                   className="flex-1 bg-white/5 hover:bg-primary transition-all rounded-t-sm"
                   style={{ height: `${h}%` }}
                 />
               ))}
             </div>
             {/* Decorative grid */}
             <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_80%)]" />
          </div>

          {/* Background glow */}
          <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-primary/5 blur-[100px] rounded-full group-hover:bg-primary/10 transition-colors" />
        </div>

        {/* Priority Alerts & Meta */}
        <div className="space-y-6">
           <div className="neon-disruptor rounded-2xl p-8 shadow-[0_20px_40px_rgba(204,255,0,0.15)] relative overflow-hidden group">
              <div className="relative z-10 space-y-4">
                <h2 className="text-2xl font-black tight-tracking leading-none">Deploy New<br/>Neural Edge</h2>
                <p className="text-[12px] opacity-70 font-bold leading-relaxed">Scale infrastructure instantly with AI-optimized nodes across 42 regions.</p>
                <button className="w-full py-4 bg-black text-white font-black text-[11px] uppercase tracking-widest rounded-xl hover:scale-[1.02] transition-all active:scale-95 shadow-2xl">
                  Initialize Deployment
                </button>
              </div>
              <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/20 rounded-full blur-3xl group-hover:scale-150 transition-all duration-700" />
           </div>

           <div className="glass-card p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-[10px] font-black label-tracking text-on-surface-variant">Critical Alerts</h3>
                <span className="px-2 py-0.5 bg-red-500 text-white text-[9px] font-black rounded-full animate-pulse">3 ACTIVE</span>
              </div>
              <div className="space-y-3">
                {[
                  { icon: "warning", title: "Latency Spike", desc: "US-East-1 Cluster B", color: "text-red-500" },
                  { icon: "bolt", title: "Auto-Scale", desc: "EU-West nodes +12", color: "text-primary" },
                ].map((alert, i) => (
                  <div key={i} className="flex gap-4 items-start p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all cursor-pointer">
                    <span className={`material-symbols-outlined ${alert.color} !text-lg`}>{alert.icon}</span>
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-tight">{alert.title}</p>
                      <p className="text-[10px] text-on-surface-variant font-bold">{alert.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
           </div>
        </div>
      </section>
    </div>
  );
}
