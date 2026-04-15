"use client";

import { useEffect, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";

interface AgentStatus {
  id: number;
  name: string;
  latency: number;
  status: "active" | "idle" | "error";
}

export default function AtollomCentralPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [agents, setAgents] = useState<AgentStatus[]>([]);
  const supabase = createBrowserSupabaseClient();
  const router = useRouter();

  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth/login");
        return;
      }

      const { data: profile } = await supabase
        .from("user_profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile?.role !== "atollom_admin") {
        router.push("/"); // No autorizado
        return;
      }

      setIsAdmin(true);
      setLoading(false);
      generateMockAgents();
    }
    checkAuth();
  }, [supabase, router]);

  const generateMockAgents = () => {
    const mockAgents: AgentStatus[] = Array.from({ length: 43 }, (_, i) => ({
      id: i + 1,
      name: `Neural Agent #${String(i + 1).padStart(2, "0")}`,
      latency: Math.floor(Math.random() * 150) + 20,
      status: Math.random() > 0.05 ? "active" : "error",
    }));
    setAgents(mockAgents);
  };

  if (loading || !isAdmin) {
    return (
      <div className="min-h-screen bg-[#000103] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#CCFF00]/10 border-t-[#CCFF00] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-screen-2xl mx-auto space-y-12 animate-in">
      {/* ── Header Mission Control ──────────────────────────────── */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-[#CCFF00] animate-ping" />
            <span className="text-[10px] font-bold text-[#CCFF00] uppercase tracking-[0.3em]">System Level Root</span>
          </div>
          <h1 className="text-5xl font-headline font-bold text-white tracking-tighter">
            Atollom <span className="text-[#CCFF00]">Central</span>
          </h1>
          <p className="text-on-surface-variant text-sm mt-2 max-w-md">
            Panel de control maestro para el ecosistema KINEXIS. Monitoreo de latencia neuronal y métricas SaaS en tiempo real.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-8">
          <div>
            <p className="text-[10px] text-on-surface-variant uppercase tracking-widest mb-1">Total Tenants</p>
            <p className="text-3xl font-bold text-white">128</p>
          </div>
          <div>
            <p className="text-[10px] text-on-surface-variant uppercase tracking-widest mb-1">MRR Global</p>
            <p className="text-3xl font-bold text-[#CCFF00]">$42.5K</p>
          </div>
          <div>
            <p className="text-[10px] text-on-surface-variant uppercase tracking-widest mb-1">Uptime 30d</p>
            <p className="text-3xl font-bold text-white">99.98%</p>
          </div>
        </div>
      </header>

      {/* ── Grid de Agentes ─────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-headline font-bold text-white">Neural Network Grid (43 Agents)</h2>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#CCFF00]" />
              <span className="text-[10px] text-on-surface-variant font-bold uppercase">Active</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#FF3333]" />
              <span className="text-[10px] text-on-surface-variant font-bold uppercase">Malfunction</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
          {agents.map((agent) => (
            <div 
              key={agent.id}
              className={`
                relative p-4 rounded-2xl border transition-all duration-300
                ${agent.status === "active" 
                  ? "bg-white/[0.02] border-white/[0.04] hover:border-[#CCFF00]/30" 
                  : "bg-[#FF3333]/5 border-[#FF3333]/20 animate-pulse"
                }
              `}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] text-on-surface-variant font-mono">#{String(agent.id).padStart(2, "0")}</span>
                <span className={`w-1.5 h-1.5 rounded-full ${agent.status === "active" ? "bg-[#CCFF00]" : "bg-[#FF3333]"}`} />
              </div>
              <p className="text-[11px] font-bold text-white mb-1 truncate">{agent.name}</p>
              <p className={`text-[10px] font-mono ${agent.latency > 100 ? "text-amber-400" : "text-on-surface-variant"}`}>
                {agent.latency}ms
              </p>
              
              {agent.status === "active" && (
                <div className="mt-3 h-0.5 w-full bg-white/[0.05] rounded-full overflow-hidden">
                  <div className="h-full bg-[#CCFF00]/40 rounded-full" style={{ width: `${Math.random() * 100}%` }} />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── SaaS Economics ──────────────────────────────────────── */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white/[0.02] border border-white/[0.04] rounded-[2.5rem] p-8">
          <h3 className="text-xl font-headline font-bold text-white mb-6">Tenant Expansion</h3>
          <div className="space-y-4">
             {[
               { name: "Pro Plan", count: 86, color: "#CCFF00" },
               { name: "Enterprise", count: 24, color: "#3B82F6" },
               { name: "Starter", count: 18, color: "#F59E0B" },
             ].map((plan) => (
               <div key={plan.name}>
                 <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider mb-2">
                   <span className="text-on-surface-variant">{plan.name}</span>
                   <span className="text-white">{plan.count}</span>
                 </div>
                 <div className="h-2 w-full bg-white/[0.04] rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${(plan.count / 128) * 100}%`, backgroundColor: plan.color }} />
                 </div>
               </div>
             ))}
          </div>
        </div>

        <div className="bg-white/[0.02] border border-white/[0.04] rounded-[2.5rem] p-8 flex flex-col justify-center text-center">
          <p className="text-[10px] text-on-surface-variant uppercase tracking-[0.3em] font-bold mb-4">Total Ecosystem Revenue</p>
          <p className="text-6xl font-headline font-bold text-[#CCFF00] tracking-tighter">$1,248,500</p>
          <p className="text-xs text-on-surface-variant mt-4">Total facturado periodo fiscal actual (KINEXIS Unified)</p>
        </div>
      </section>
    </div>
  );
}
