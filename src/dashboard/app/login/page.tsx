// src/dashboard/app/login/page.tsx
import Image from 'next/image';
import { Space_Grotesk } from 'next/font/google';
import { LoginForm } from '@/components/auth/LoginForm';

const spaceGrotesk = Space_Grotesk({ 
  subsets: ['latin'],
  weight: ['700'],
});

export default function LoginPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 py-12">
      {/* Brand Section */}
      <div className="flex flex-col items-center mb-12 space-y-4">
        <div className="relative">
          <div className="absolute inset-0 rounded-full blur-2xl bg-lime-400/20 animate-pulse"></div>
          <Image 
            src="/ATOLLOM_AI_ICON.png" 
            alt="Atollom AI" 
            width={80} 
            height={80}
            className="relative drop-shadow-[0_0_15px_rgba(202,253,0,0.5)]"
          />
        </div>
        
        <div className="text-center">
          <h1 className={`${spaceGrotesk.className} text-5xl tracking-tighter text-[#cafd00] font-bold`}>
            KINEXIS
          </h1>
          <p className="text-[#96adcc] text-xs uppercase tracking-[0.2em] mt-1 font-medium">
            Operations Hub
          </p>
        </div>
      </div>

      {/* Login Interaction */}
      <div className="w-full max-w-md">
        <div className="bg-[#0a1a2f]/50 backdrop-blur-xl border border-white/5 p-8 rounded-2xl shadow-2xl">
          <LoginForm />
        </div>
        
        <p className="text-center text-white/20 text-[10px] mt-8 uppercase tracking-widest">
          Consola Privada — Acceso Restringido
        </p>
      </div>
    </div>
  );
}
