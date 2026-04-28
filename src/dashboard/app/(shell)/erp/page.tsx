"use client";

import { useKPIs } from "@/hooks/useKPIs";
import { useInventory } from "@/hooks/useInventory";

function ERPCard({
  title,
  icon,
  label,
  value,
  actionLabel,
}: {
  title: string;
  icon: string;
  label: string;
  value: string | number;
  actionLabel?: string;
}) {
  return (
    <div className="glass-card p-8 rounded-[2.5rem] flex flex-col justify-between min-h-[300px] group relative overflow-hidden transition-all duration-500">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-4">
           <div
             className="w-12 h-12 rounded-2xl flex items-center justify-center group-hover:border-[#ccff00]/30 transition-all"
             style={{ backgroundColor: 'var(--bg-base)', border: '1px solid var(--border-color)' }}
           >
              <span className="material-symbols-outlined group-hover:text-[#ccff00] transition-colors" style={{ color: 'var(--text-muted)' }}>{icon}</span>
           </div>
           <div>
              <h3 className="text-sm font-black uppercase tracking-widest italic" style={{ color: 'var(--text-primary)' }}>{title}</h3>
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>{label}</p>
           </div>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-5xl font-black group-hover:text-[#ccff00] transition-all tracking-tighter italic" style={{ color: 'var(--text-primary)' }}>
          {value}
        </h2>
      </div>

      <div className="mt-auto">
        <button className="text-[10px] font-black uppercase tracking-[0.2em] text-[#ccff00] hover:opacity-70 transition-opacity flex items-center gap-2">
           {actionLabel || "Acceder al Módulo"}
           <span className="material-symbols-outlined text-sm">arrow_forward</span>
        </button>
      </div>

      <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-[#ccff00]/5 rounded-full blur-3xl" />
    </div>
  );
}

export default function ERPPage() {
  const { kpis, isLoading: kpisLoading } = useKPIs();
  const { inventory, isLoading: invLoading } = useInventory();

  const criticalCount = inventory.filter(i => i.status === "critical").length;

  return (
    <div className="space-y-16 animate-luxe">
      {/* Module Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
             <span className="w-1.5 h-1.5 rounded-full bg-[#ccff00] animate-pulse" />
             <p className="text-[#ccff00] text-[10px] uppercase tracking-[0.3em] font-black opacity-80">
               OPS CENTRAL / ADMINISTRACIÓN ERP
             </p>
          </div>
          <h1 className="text-5xl md:text-6xl font-black tracking-[-0.05em] leading-none" style={{ color: 'var(--text-primary)' }}>
            Logística <span className="text-[#ccff00]">&</span> Almacén
          </h1>
          <p className="max-w-xl text-sm font-medium leading-relaxed italic" style={{ color: 'var(--text-muted)' }}>
             Administración centralizada de nodos de inventario, facturación CFDI 4.0 y cadena de suministro Atollom.
          </p>
        </div>

        <div className="flex items-center gap-6">
           <div className="text-right">
              <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>SKUs Activos</p>
              <p className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>{inventory?.length || 0}</p>
           </div>
           <div className="w-px h-10" style={{ backgroundColor: 'var(--border-color)' }} />
           <div className="text-right">
              <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Estado Global</p>
              <p className="text-2xl font-black text-[#ccff00]">Óptimo</p>
           </div>
        </div>
      </header>

      {/* Grid: Primary ERP Functions */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <ERPCard
          title="Control Almacén"
          icon="warehouse"
          label="Stock Crítico"
          value={invLoading ? "..." : (criticalCount).toString().padStart(2, "0")}
          actionLabel="Escanear Inventario"
        />
        <ERPCard
          title="Centro de Facturación"
          icon="receipt_long"
          label="CFDI Semanales"
          value="142"
          actionLabel="Abrir Nodo SAT"
        />
        <ERPCard
          title="Cadena de Suministro"
          icon="local_shipping"
          label="Compras Pendientes"
          value="07"
          actionLabel="Portal Proveedores"
        />
      </section>

      {/* Advanced Inventory Scanner Section */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
         <div className="lg:col-span-8 glass-card rounded-[2.5rem] p-12 flex flex-col md:flex-row gap-12 relative overflow-hidden group">
            <div className="flex-1 space-y-6 relative z-10">
               <h3 className="text-2xl font-black italic tracking-tighter" style={{ color: 'var(--text-primary)' }}>Sincronización Neural de Inventario</h3>
               <p className="text-[13px] leading-relaxed max-w-sm" style={{ color: 'var(--text-muted)' }}>
                  Arrastra tu archivo maestro de inventario para sincronizar los niveles a través de todos los nodos de venta. El sistema detectará automáticamente cambios de SKU y stock residual.
               </p>
               <div className="flex gap-4">
                  <button className="px-6 py-3 rounded-xl bg-[#ccff00] text-black text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all">
                     Subir CSV Maestro
                  </button>
                  <button
                    className="px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-70 transition-all"
                    style={{ border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}
                  >
                     Descargar Plantilla
                  </button>
               </div>
            </div>

            <div
              className="w-full md:w-64 aspect-square glass-card rounded-3xl border-2 border-dashed flex flex-col items-center justify-center gap-4 group-hover:border-[#ccff00]/30 transition-all relative z-10"
              style={{ borderColor: 'var(--border-color)' }}
            >
               <span className="material-symbols-outlined text-4xl group-hover:text-[#ccff00] transition-colors" style={{ color: 'var(--text-muted)' }}>upload_file</span>
               <p className="text-[9px] font-black uppercase tracking-widest text-center px-8" style={{ color: 'var(--text-muted)' }}>Soltar Archivo Aquí</p>
            </div>

            <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-[#ccff00]/5 to-transparent pointer-events-none" />
         </div>

         <div className="lg:col-span-4 glass-card rounded-[2.5rem] p-8 flex flex-col justify-between overflow-hidden relative group">
            <div className="space-y-1">
               <h3 className="text-sm font-black uppercase tracking-widest italic text-[#ccff00]">Nodo Fiscal</h3>
               <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>SAT v4.0 Activo</p>
            </div>

            <div className="py-8">
               <div className="flex items-center gap-4 mb-4">
                  <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-base)' }}>
                     <div className="h-full bg-[#ccff00] w-[88%]" />
                  </div>
                  <span className="text-[10px] font-black" style={{ color: 'var(--text-primary)' }}>88%</span>
               </div>
               <p className="text-[11px] font-medium leading-relaxed italic" style={{ color: 'var(--text-muted)' }}>
                  Cuota de timbrado mensual utilizada. 1,200 folios restantes en el nodo actual.
               </p>
            </div>

            <button
              className="w-full py-4 rounded-xl text-[9px] font-black uppercase tracking-widest hover:text-[#ccff00] transition-all"
              style={{ border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-base)', color: 'var(--text-muted)' }}
            >
               Renovar Folios
            </button>
         </div>
      </section>

      {/* Footer / Stats Row */}
      <section className="pb-32 grid grid-cols-2 md:grid-cols-4 gap-8">
         {[
           { label: 'Compras', val: '$420K', sub: 'Promedio Mensual' },
           { label: 'Devoluciones', val: '02', sub: 'Tasa: 0.1%' },
           { label: 'Proveedores', val: '12', sub: 'Verificados' },
           { label: 'Latencia', val: '12ms', sub: 'API SAT' },
         ].map((item, i) => (
           <div key={i} className="glass-card p-6 rounded-[2rem] space-y-1 transition-colors">
              <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>{item.label}</p>
              <p className="text-xl font-black italic" style={{ color: 'var(--text-primary)' }}>{item.val}</p>
              <p className="text-[8px] font-bold uppercase tracking-tighter" style={{ color: 'var(--text-muted)' }}>{item.sub}</p>
           </div>
         ))}
      </section>
    </div>
  );
}