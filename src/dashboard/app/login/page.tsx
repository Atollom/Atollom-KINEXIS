"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createBrowserSupabaseClient();

  useEffect(() => setError(null), [activeTab]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError("AUTHENTICATION_FAILED: Verification required.");
      setLoading(false);
    } else {
      router.refresh();
      router.push("/");
    }
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden flex items-center justify-center p-6 selection:bg-[#ccff00] selection:text-black">
      
      {/* ── Neural Atmospheric Background ────────────────────────── */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-20%] left-[-20%] w-[70%] h-[70%] bg-[#ccff00]/5 blur-[160px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[70%] h-[70%] bg-[#00f2ff]/3 blur-[160px] rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.02)_0%,transparent_70%)]" />
      </div>

      {/* ── Terminal Interface ────────────────────────────────────── */}
      <div className="relative z-10 w-full max-w-[520px] animate-luxe">
        
        {/* System Status Badge */}
        <div className="flex justify-center mb-12">
           <div className="bg-white/5 border border-white/5 backdrop-blur-3xl px-6 py-2 rounded-full flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ccff00] animate-pulse shadow-volt" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#ccff00] italic">Neural Link: Online</span>
           </div>
        </div>

        {/* Brand Core */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-[2.5rem] bg-white/5 border border-white/10 shadow-2xl mb-8 group transition-all duration-700 hover:rotate-[360deg] hover:border-[#ccff00]/40">
            <span className="material-symbols-outlined text-5xl text-[#ccff00] shadow-volt italic font-black">
              offline_bolt
            </span>
          </div>
          <h1 className="text-5xl font-black text-white tracking-tighter uppercase mb-3 leading-none italic">
            Kinexis <span className="text-[#ccff00]">OS</span>
          </h1>
          <p className="text-white/20 text-[10px] uppercase font-black tracking-[0.4em] italic leading-relaxed">
            Neural Operations Shell · Deployment 2026/A1
          </p>
        </div>

        {/* Control Cluster */}
        <div className="glass-card rounded-[3.5rem] border border-white/5 p-12 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#ccff00]/5 rounded-full blur-[100px] pointer-events-none group-hover:bg-[#ccff00]/10 transition-colors duration-1000" />
          
          {/* Module Selector */}
          <div className="flex bg-white/5 p-1.5 rounded-2xl mb-10 relative z-10">
            <button 
              onClick={() => setActiveTab("login")}
              className={`flex-1 h-12 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-500 italic ${activeTab === 'login' ? 'bg-white text-black shadow-2xl' : 'text-white/20 hover:text-white'}`}
            >
              Access Link
            </button>
            <button 
              onClick={() => setActiveTab("register")}
              className={`flex-1 h-12 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-500 italic ${activeTab === 'register' ? 'bg-white text-black shadow-2xl' : 'text-white/20 hover:text-white'}`}
            >
              Init Module
            </button>
          </div>

          {activeTab === "login" ? (
            <form onSubmit={handleLogin} className="space-y-8 relative z-10">
              <div className="space-y-3">
                <label className="text-[9px] font-black uppercase tracking-[0.4em] text-white/30 ml-2 italic">Neural Identity Key</label>
                <div className="relative group/input">
                  <span className="material-symbols-outlined absolute left-6 top-1/2 -translate-y-1/2 text-white/10 text-xl transition-all duration-500 group-focus-within/input:text-[#ccff00] group-focus-within/input:shadow-volt">alternate_email</span>
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="IDENTITY@ATOLLOM.NET"
                    className="w-full h-16 bg-white/[0.03] border border-white/5 rounded-2xl pl-16 pr-8 text-sm text-white placeholder:text-white/5 outline-none focus:border-[#ccff00]/30 transition-all font-medium uppercase tracking-tight italic"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[9px] font-black uppercase tracking-[0.4em] text-white/30 ml-2 italic">Security Sequence</label>
                <div className="relative group/input">
                  <span className="material-symbols-outlined absolute left-6 top-1/2 -translate-y-1/2 text-white/10 text-xl transition-all duration-500 group-focus-within/input:text-[#ccff00] group-focus-within/input:shadow-volt">shield_lock</span>
                  <input 
                    type="password" 
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full h-16 bg-white/[0.03] border border-white/5 rounded-2xl pl-16 pr-8 text-sm text-white placeholder:text-white/5 outline-none focus:border-[#ccff00]/30 transition-all font-medium italic"
                  />
                </div>
              </div>

              {error && (
                <div className="p-5 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center gap-4 animate-shake">
                  <span className="material-symbols-outlined text-red-500 text-xl italic font-black">warning</span>
                  <p className="text-[10px] font-black text-red-500 uppercase tracking-widest italic">{error}</p>
                </div>
              )}

              <button 
                type="submit"
                disabled={loading}
                className="w-full h-16 bg-[#ccff00] text-black rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] shadow-volt hover:scale-[1.03] active:scale-[0.97] transition-all duration-500 disabled:opacity-20 flex items-center justify-center gap-3 italic"
              >
                {loading ? (
                  <div className="w-6 h-6 border-3 border-black/20 border-t-black rounded-full animate-spin" />
                ) : (
                  <>
                    Initialize Core
                    <span className="material-symbols-outlined text-lg">bolt</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="py-12 text-center space-y-8 animate-luxe relative z-10">
              <div className="w-20 h-20 rounded-full bg-white/5 border border-white/5 flex items-center justify-center mx-auto transition-all duration-700 hover:shadow-volt hover:border-[#ccff00]/20">
                <span className="material-symbols-outlined text-[#ccff00] text-4xl italic">diversity_3</span>
              </div>
              <div className="space-y-4">
                <h3 className="text-xl font-black text-white uppercase tracking-tighter italic">Join the Cluster</h3>
                <p className="text-[11px] text-white/20 uppercase tracking-[0.2em] leading-relaxed font-bold max-w-[280px] mx-auto italic">
                  Neural deployment limited to whitelisted node instances. Contact system admin for allocation.
                </p>
              </div>
              <button 
                onClick={() => setActiveTab('login')}
                className="text-[10px] font-black uppercase tracking-[0.4em] text-[#ccff00] italic underline underline-offset-8 decoration-[#ccff00]/20 hover:decoration-[#ccff00] transition-all"
              >
                Return to Access
              </button>
            </div>
          )}
        </div>

        {/* Temporal Synchrony */}
        <div className="mt-16 text-center space-y-2 opacity-20">
          <p className="text-[9px] font-black uppercase tracking-[0.5em] text-white italic">
            OS Identity: Kinexis-Core_A16
          </p>
          <p className="text-[8px] font-black uppercase tracking-[0.3em] text-white italic">
            Encrypted End-to-End Terminal Link
          </p>
        </div>
      </div>
    </div>
  );
}