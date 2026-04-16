import React from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen w-full bg-[#040f1b] p-6 gap-6 overflow-hidden">
      
      {/* COLUMNA 1: Sidebar (Fijo 280px) */}
      <aside className="w-[280px] flex-shrink-0 bg-white/5 backdrop-blur-3xl rounded-[3.5rem] p-8 flex flex-col shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
        <div className="mb-10">
          <div className="h-8 w-32 bg-[#CCFF00] rounded-full" /> {/* Logo Placeholder */}
        </div>
        <nav className="flex flex-col gap-6 flex-1">
          <div className="h-4 w-3/4 bg-white/10 rounded-full" />
          <div className="h-4 w-1/2 bg-white/10 rounded-full" />
          <div className="h-4 w-2/3 bg-white/10 rounded-full" />
        </nav>
      </aside>

      {/* COLUMNA 2: Main Workspace (Flexible) */}
      <main className="flex-1 bg-white/5 backdrop-blur-3xl rounded-[3.5rem] p-8 flex flex-col overflow-y-auto shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
        {children}
      </main>

      {/* COLUMNA 3: Samantha Panel (Fijo 320px - NO BURBUJA) */}
      <aside className="w-[320px] flex-shrink-0 bg-white/5 backdrop-blur-3xl rounded-[3.5rem] p-8 flex flex-col shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-white tracking-tight">Samantha</h2>
          <div className="h-1 w-12 bg-[#CCFF00] rounded-full mt-2" />
        </div>
        
        <div className="flex-1 bg-black/20 rounded-[2.5rem] p-6 flex flex-col justify-end">
          <p className="text-white/70 text-sm mb-6 leading-relaxed">¿Cómo puedo optimizar tu comando hoy, Arquitecto?</p>
          <div className="w-full bg-white/10 rounded-full px-6 py-4 text-white/40 text-sm">
            Escribir comando...
          </div>
        </div>
      </aside>

    </div>
  );
}
