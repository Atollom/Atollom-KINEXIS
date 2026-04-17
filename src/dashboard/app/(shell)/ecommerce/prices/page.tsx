"use client";

export default function EcommercePricesPage() {
  return (
    <div className="px-4 md:px-8 py-6 max-w-screen-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-headline font-bold text-on-surface mb-2">
          Precios
        </h1>
        <p className="text-on-surface-variant text-sm">
          Gestión automática de precios y márgenes.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5">
          <h3 className="text-sm font-bold text-on-surface mb-2">Precio Promedio</h3>
          <p className="text-3xl font-bold text-blue-400">$847</p>
          <p className="text-xs text-on-surface-variant">Precio promedio de catálogo</p>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5">
          <h3 className="text-sm font-bold text-on-surface mb-2">Margen Promedio</h3>
          <p className="text-3xl font-bold text-green-400">38.7%</p>
          <p className="text-xs text-on-surface-variant">Margen bruto promedio</p>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5">
          <h3 className="text-sm font-bold text-on-surface mb-2">Actualizaciones Hoy</h3>
          <p className="text-3xl font-bold text-amber-400">14</p>
          <p className="text-xs text-on-surface-variant">Precios actualizados automáticamente</p>
        </div>
      </div>
    </div>
  );
}