"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";
import { ShieldCheck, Zap, ArrowRight } from "lucide-react";

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
      router.push("/dashboard"); // Redirect to the definitive dashboard route
    }
  };

  return (
    <div className="min-h-screen bg-[#040f1b] relative overflow-hidden flex items-center justify-center p-6 selection:bg-[#CCFF00] selection:text-black font-inter">
      
      {/* ── Neural Atmospheric Background ────────────────────────── */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-20%] left-[-20%] w-[70%] h-[70%] bg-[#CCFF00]/5 blur-[160px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-blue-500/3 blur-[140px] rounded-full" />
      </div>

      {/* ── Login Interface ────────────────────────────────────── */}
      <div className="relative z-10 w-full max-w-[500px] animate-in fade-in zoom-in duration-1000">
        
        {/* Brand Identity: DEFINITIVE V4 */}
        <div className="text-center mb-12 flex flex-col items-center">
          <div className="relative group mb-8">
             <div className="absolute inset-0 bg-[#CCFF00]/10 blur-2xl rounded-full group-hover:bg-[#CCFF00]/20 transition-all duration-700" />
             <img 
               src="/branding/logo.png" 
               alt="KINEXIS Logo" 
               className="w-28 h-28 object-contain relative z-10 animate-[pulse_4s_ease-in-out_infinite]"
             />
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase mb-2">
            KINEXIS <span className="text-[#CCFF00]">COMMAND</span>
          </h1>
          <p className="text-white/20 text-[10px] uppercase font-black tracking-[0.5em]">
            Integrated AI Systems · Atollom Labs
          </p>
        </div>

        {/* Access Container: 3.5rem Zero-Border */}
        <div className="bg-white/5 backdrop-blur-3xl rounded-[3.5rem] p-12 shadow-[0_40px_100px_rgba(0,0,0,0.5)] border-none relative overflow-hidden">
          
          <div className="flex bg-white/5 p-1.5 rounded-full mb-10 relative z-10">
            <button 
              onClick={() => setActiveTab("login")}
              className={`flex-1 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-500 ${activeTab === 'login' ? 'bg-[#CCFF00] text-black shadow-glow' : 'text-white/20 hover:text-white'}`}
            >
              Access
            </button>
            <button 
              onClick={() => setActiveTab("register")}
              className={`flex-1 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-500 ${activeTab === 'register' ? 'bg-[#CCFF00] text-black shadow-glow' : 'text-white/20 hover:text-white'}`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-8 relative z-10">
            <div className="space-y-3">
              <label className="text-[9px] font-black uppercase tracking-[0.4em] text-white/20 ml-6">Neural Identity</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="IDENTITY@ATOLLOM.LABS"
                className="w-full bg-white/5 rounded-full px-8 py-5 text-sm text-white placeholder:text-white/5 outline-none focus:bg-white/10 transition-all font-bold"
              />
            </div>

            <div className="space-y-3">
              <label className="text-[9px] font-black uppercase tracking-[0.4em] text-white/20 ml-6">Security Sequence</label>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-white/5 rounded-full px-8 py-5 text-sm text-white placeholder:text-white/5 outline-none focus:bg-white/10 transition-all font-bold"
              />
            </div>

            {error && (
              <div className="p-4 rounded-2xl bg-red-500/10 flex items-center gap-4 animate-in slide-in-from-top-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">{error}</p>
              </div>
            )}

            <button 
              type="submit"
              disabled={loading}
              className="w-full py-6 bg-[#CCFF00] text-black rounded-full font-black uppercase tracking-[0.3em] text-[11px] shadow-glow hover:scale-[1.02] active:scale-[0.98] transition-all duration-500 disabled:opacity-20 flex items-center justify-center gap-3"
            >
              {loading ? (
                <div className="w-5 h-5 border-3 border-black/20 border-t-black rounded-full animate-spin" />
              ) : (
                <>
                  Connect Terminal
                  <Zap className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Global Footer */}
        <div className="mt-16 text-center space-y-4 opacity-30">
          <div className="flex justify-center gap-8 items-center">
            <div className="flex items-center gap-2">
               <ShieldCheck className="w-3 h-3 text-[#CCFF00]" />
               <span className="text-[8px] font-black uppercase tracking-widest text-white">Quantum Encryption</span>
            </div>
            <div className="w-[1px] h-3 bg-white/20" />
            <span className="text-[8px] font-black uppercase tracking-widest text-[#CCFF00]">Relativity Cluster</span>
          </div>
          <p className="text-[8px] font-black uppercase tracking-[0.5em] text-white">
            Atollom OS v4.2.16 · Final Audit Pass
          </p>
        </div>
      </div>
    </div>
  );
}