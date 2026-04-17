'use client'

import Link from 'next/link'
import { ShieldX } from 'lucide-react'

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-[#040f1b] flex items-center justify-center">
      <div className="text-center space-y-8 px-8">
        <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
          <ShieldX className="w-10 h-10 text-red-400" />
        </div>
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase">
            Acceso <span className="text-red-400">Denegado</span>
          </h1>
          <p className="text-white/30 font-bold uppercase tracking-widest text-[10px] mt-3">
            Tu rol no tiene permisos para esta sección
          </p>
        </div>
        <Link
          href="/dashboard"
          className="inline-block bg-[#CCFF00]/10 hover:bg-[#CCFF00] text-[#CCFF00] hover:text-black font-black uppercase tracking-widest text-[11px] px-8 py-4 rounded-full transition-all"
        >
          Volver al Dashboard
        </Link>
      </div>
    </div>
  )
}
