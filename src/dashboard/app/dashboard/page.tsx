import React from "react";

export default function DashboardPage() {
  return (
    <div className="flex flex-col h-full gap-8">
      <header>
        <h1 className="text-4xl font-bold text-white tracking-tighter">Terminal de Comando</h1>
        <p className="text-white/40 mt-2">Estado del Sistema: <span className="text-[#CCFF00]">Operativo</span></p>
      </header>

      {/* BENTO GRID ESTRATÉGICO */}
      <div className="grid grid-cols-3 grid-rows-3 gap-6 flex-1">
        <div className="col-span-2 row-span-2 bg-white/10 rounded-[3.5rem] p-10 shadow-inner">
          <div className="h-full w-full bg-white/5 rounded-[2.5rem]" />
        </div>
        <div className="col-span-1 row-span-1 bg-white/10 rounded-[3.5rem] p-8" />
        <div className="col-span-1 row-span-1 bg-[#CCFF00]/10 rounded-[3.5rem] p-8" />
        <div className="col-span-3 row-span-1 bg-white/10 rounded-[3.5rem] p-8" />
      </div>
    </div>
  );
}
