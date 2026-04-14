// src/dashboard/components/auth/LoginForm.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserSupabaseClient } from '@/lib/supabase-browser';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();
  const supabase = createBrowserSupabaseClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      // Fetch profile to determine redirect
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (profile?.role === 'atollom_admin') {
          router.push('/atollom');
        } else {
          router.push('/');
        }
      } else {
        router.push('/');
      }
      
      router.refresh(); // Asegura que el middleware vea el nuevo token
    } catch {
      // Never expose raw Supabase error details to the client
      setError('Credenciales incorrectas. Verifica tu email y contraseña.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin} className="space-y-6">
      <div className="space-y-1">
        <label className="text-[10px] text-[#96adcc] uppercase tracking-wider ml-1">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full bg-[#0a1a2f] border-b border-white/10 focus:border-[#cafd00] focus:ring-0 text-white px-4 py-3 transition-all duration-300 outline-none"
          placeholder="nombre@kinexis.app"
        />
      </div>

      <div className="space-y-1">
        <label className="text-[10px] text-[#96adcc] uppercase tracking-wider ml-1">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full bg-[#0a1a2f] border-b border-white/10 focus:border-[#cafd00] focus:ring-0 text-white px-4 py-3 transition-all duration-300 outline-none"
          placeholder="••••••••"
        />
      </div>

      {error && (
        <p className="text-[#ff4444] text-xs font-medium px-1">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-[#cafd00] hover:bg-[#d9ff40] text-[#000f21] font-bold py-4 rounded-xl transition-all duration-300 transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(202,253,0,0.3)]"
      >
        {loading ? 'AUTENTICANDO...' : 'INICIAR SESIÓN'}
      </button>
    </form>
  );
}
