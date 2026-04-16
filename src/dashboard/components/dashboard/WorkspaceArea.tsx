// components/dashboard/WorkspaceArea.tsx
'use client'

export function WorkspaceArea({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex-1 h-full overflow-y-auto custom-scrollbar p-10 bg-[#040f1b]">
      
      {/* Bento Grid Container */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
        
        {/* Children (Dynamic Content) */}
        {children}

        {/* Card Example: 3.5rem Radius */}
        <div className="col-span-1 md:col-span-2 bg-white/5 backdrop-blur-3xl p-12 rounded-[3.5rem] shadow-ambient group cursor-pointer hover:bg-white/8 transition-all duration-500">
          <div className="flex flex-col gap-6">
            <div className="w-16 h-16 rounded-[1.5rem] bg-white/5 flex items-center justify-center">
              <span className="material-symbols-outlined text-[#CCFF00] !text-4xl">inventory_2</span>
            </div>
            <h4 className="text-2xl font-black text-white tracking-tighter uppercase">Órdenes Pendientes</h4>
            <div className="h-24 flex items-end gap-2">
               {[40, 70, 45, 90, 65, 80, 50, 60].map((h, i) => (
                 <div key={i} className="flex-1 bg-white/5 rounded-full relative overflow-hidden h-full">
                    <div 
                      className="absolute bottom-0 w-full bg-[#CCFF00]/20 rounded-full transition-all duration-1000" 
                      style={{ height: `${h}%` }}
                    />
                 </div>
               ))}
            </div>
          </div>
        </div>

        {/* Neon Accent Card (Solo jerarquía ultra-alta) */}
        <div className="col-span-1 bg-[#CCFF00]/5 backdrop-blur-3xl p-12 rounded-[3.5rem] shadow-glow flex flex-col items-center justify-center text-center animate-pulse">
          <h2 className="text-7xl font-black text-[#CCFF00] tracking-tighter mb-4 leading-none">42</h2>
          <p className="text-[10px] font-black text-[#CCFF00] uppercase tracking-[0.5em] opacity-60">Agentes Activos</p>
        </div>

      </div>
    </main>
  )
}
