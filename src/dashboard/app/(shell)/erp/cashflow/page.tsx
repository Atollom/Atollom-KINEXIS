"use client";

export default function ERPCashflowPage() {
  return (
    <div className="px-4 md:px-8 py-6 max-w-screen-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-headline font-bold text-on-surface mb-2">
          Flujo de Caja
        </h1>
        <p className="text-on-surface-variant text-sm">
          Control de entradas y salidas de efectivo.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
          <p className="text-xs text-on-surface-variant uppercase tracking-wider mb-1">Ingresos Hoy</p>
          <p className="text-2xl font-bold text-green-400">$18,742</p>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
          <p className="text-xs text-on-surface-variant uppercase tracking-wider mb-1">Egresos Hoy</p>
          <p className="text-2xl font-bold text-red-400">$7,230</p>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
          <p className="text-xs text-on-surface-variant uppercase tracking-wider mb-1">Balance Semanal</p>
          <p className="text-2xl font-bold text-blue-400">$89,450</p>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
          <p className="text-xs text-on-surface-variant uppercase tracking-wider mb-1">Proyectado Mes</p>
          <p className="text-2xl font-bold text-purple-400">$324,500</p>
        </div>
      </div>

      <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-10 text-center">
        <span className="material-symbols-outlined text-5xl text-on-surface-variant mb-4">account_balance</span>
        <h3 className="text-lg font-bold text-on-surface mb-2">Flujo de Caja</h3>
        <p className="text-sm text-on-surface-variant mb-4">
          Visualización detallada de movimientos bancarios y proyecciones.
        </p>
      </div>
    </div>
  );
}