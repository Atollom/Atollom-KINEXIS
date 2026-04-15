"use client";

import { useState, useEffect } from "react";
import Image from 'next/image';
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

  // Reset error when switching tabs
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
      setError("Credenciales incorrectas. Por favor verifica.");
      setLoading(false);
    } else {
      router.refresh();
      router.push("/");
    }
  };

  return (
    <div className="min-h-screen bg-[#040f1b] relative overflow-hidden flex items-center justify-center p-6 selection:bg-primary selection:text-background">
      {/* ── Background Mesh ────────────────────────────────────── */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-500/10 blur-[120px] rounded-full" />
      </div>

      {/* ── Login Card ─────────────────────────────────────────── */}
      <div className="relative z-10 w-full max-w-[480px] animate-luxe">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-12 bg-primary text-background px-6 py-2 rounded-full text-xs font-black tracking-widest">
          ✅ ACTUALIZADO 15 ABRIL 2026
        </div>
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-surface/40 backdrop-blur-2xl border border-white/10 shadow-2xl mb-6 group transition-all hover:scale-105 active:scale-95">
            <span className="material-symbols-outlined text-4xl text-primary drop-shadow-[0_0_8px_var(--primary)] group-hover:rotate-12 transition-transform">
              offline_bolt
            </span>
          </div>
          <h1 className="text-4xl font-headline font-black text-white tracking-tighter mb-2">
            KINEXIS <span className="text-primary">OS</span>
          </h1>
          <p className="text-on-surface-variant text-sm font-medium tracking-tight opacity-70">
            Neural Operations Interface — 2026 Edition
          </p>
        </div>

        <div className="bg-surface/30 backdrop-blur-3xl border border-white/5 rounded-[2.5rem] p-10 shadow-2xl shadow-black/50">
          {/* Tabs */}
          <div className="flex bg-white/5 p-1.5 rounded-2xl mb-8">
            <button 
              onClick={() => setActiveTab("login")}
              className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'login' ? 'bg-primary text-background shadow-lg shadow-primary/20' : 'text-on-surface-variant hover:text-on-surface'}`}
            >
              Access
            </button>
            <button 
              onClick={() => setActiveTab("register")}
              className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'register' ? 'bg-primary text-background shadow-lg shadow-primary/20' : 'text-on-surface-variant hover:text-on-surface'}`}
            >
              Onboard
            </button>
          </div>

          {activeTab === "login" ? (
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant ml-1">Authentication ID</label>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm transition-colors group-focus-within:text-primary">alternate_email</span>
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@atollom.com"
                    className="w-full bg-white/[0.03] border border-white/[0.05] rounded-2xl py-4 pl-12 pr-6 text-sm text-white placeholder:text-white/20 outline-none focus:border-primary/50 focus:bg-white/[0.05] transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant ml-1">Security Key</label>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm transition-colors group-focus-within:text-primary">key</span>
                  <input 
                    type="password" 
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-white/[0.03] border border-white/[0.05] rounded-2xl py-4 pl-12 pr-6 text-sm text-white placeholder:text-white/20 outline-none focus:border-primary/50 focus:bg-white/[0.05] transition-all"
                  />
                </div>
              </div>

              {error && (
                <div className="p-4 rounded-2xl bg-error/10 border border-error/20 flex items-center gap-3 animate-shake">
                  <span className="material-symbols-outlined text-error text-lg">error</span>
                  <p className="text-[11px] font-bold text-error uppercase tracking-tight">{error}</p>
                </div>
              )}

              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-background h-14 rounded-2xl font-black uppercase tracking-[0.15em] text-xs shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-background/20 border-t-background rounded-full animate-spin" />
                ) : (
                  <>
                    Initialize Session
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="py-8 text-center space-y-6 animate-in">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-primary text-3xl">verified_user</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Join the Ecosystem</h3>
                <p className="text-sm text-on-surface-variant leading-relaxed">
                  KINEXIS deployment is currently limited to selected pilot clients. Contact our concierge to initialize your neural instance.
                </p>
              </div>
              <button 
                onClick={() => setActiveTab('login')}
                className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline"
              >
                Return to Access
              </button>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="mt-12 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-on-surface-variant opacity-30">
            System Identity: KINEXIS-A1-2026
          </p>
        </div>
      </div>

      <style jsx global>{`
        @keyframes luxeFade {
          0% { opacity: 0; transform: translateY(20px) scale(0.95); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-luxe {
          animation: luxeFade 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.4s ease-in-out;
        }
      `}</style>
    </div>
  );
}