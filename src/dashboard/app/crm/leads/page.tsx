"use client";

export default function CRMLeadsPage() {
  return (
    <div className="px-4 md:px-8 py-6 max-w-screen-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-headline font-bold text-on-surface mb-2">
          Leads
        </h1>
        <p className="text-on-surface-variant text-sm">
          Gestión de leads y pipeline de ventas.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5">
          <h3 className="text-sm font-bold text-on-surface mb-2">Leads Activos</h3>
          <p className="text-3xl font-bold text-blue-400">147</p>
          <p className="text-xs text-on-surface-variant">Leads en pipeline</p>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5">
          <h3 className="text-sm font-bold text-on-surface mb-2">Nuevos Hoy</h3>
          <p className="text-3xl font-bold text-green-400">12</p>
          <p className="text-xs text-on-surface-variant">Leads capturados hoy</p>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5">
          <h3 className="text-sm font-bold text-on-surface mb-2">Tasa Conversión</h3>
          <p className="text-3xl font-bold text-purple-400">18.4%</p>
          <p className="text-xs text-on-surface-variant">Tasa de conversión promedio</p>
        </div>
      </div>
    </div>
  );
}