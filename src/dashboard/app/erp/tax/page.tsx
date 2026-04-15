"use client";

export default function ERPTaxPage() {
  return (
    <div className="px-4 md:px-8 py-6 max-w-screen-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-headline font-bold text-on-surface mb-2">
          Fiscal
        </h1>
        <p className="text-on-surface-variant text-sm">
          Gestión fiscal y declaraciones.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
          <p className="text-xs text-on-surface-variant uppercase tracking-wider mb-1">CFDI Emitidos Mes</p>
          <p className="text-2xl font-bold text-green-400">147</p>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
          <p className="text-xs text-on-surface-variant uppercase tracking-wider mb-1">IVA Pendiente</p>
          <p className="text-2xl font-bold text-amber-400">$28,470</p>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
          <p className="text-xs text-on-surface-variant uppercase tracking-wider mb-1">Retenciones</p>
          <p className="text-2xl font-bold text-blue-400">$12,840</p>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
          <p className="text-xs text-on-surface-variant uppercase tracking-wider mb-1">Próxima declaración</p>
          <p className="text-2xl font-bold text-purple-400">23 Abr</p>
        </div>
      </div>

      <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-10 text-center">
        <span className="material-symbols-outlined text-5xl text-on-surface-variant mb-4">gavel</span>
        <h3 className="text-lg font-bold text-on-surface mb-2">Fiscal y Contabilidad</h3>
        <p className="text-sm text-on-surface-variant mb-4">
          Gestión de impuestos, declaraciones y reportes fiscales.
        </p>
      </div>
    </div>
  );
}