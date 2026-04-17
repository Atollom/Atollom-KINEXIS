"use client";

export default function CRMB2BPage() {
  return (
    <div className="px-4 md:px-8 py-6 max-w-screen-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-headline font-bold text-on-surface mb-2">
          Ventas B2B
        </h1>
        <p className="text-on-surface-variant text-sm">
          Gestión de clientes corporativos y ventas mayoristas.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5">
          <h3 className="text-sm font-bold text-on-surface mb-2">Clientes Corporativos</h3>
          <p className="text-3xl font-bold text-blue-400">24</p>
          <p className="text-xs text-on-surface-variant">Cuentas B2B activas</p>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5">
          <h3 className="text-sm font-bold text-on-surface mb-2">Ventas Mes Actual</h3>
          <p className="text-3xl font-bold text-green-400">$87,420</p>
          <p className="text-xs text-on-surface-variant">Ingresos B2B este mes</p>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5">
          <h3 className="text-sm font-bold text-on-surface mb-2">Cotizaciones Pendientes</h3>
          <p className="text-3xl font-bold text-amber-400">7</p>
          <p className="text-xs text-on-surface-variant">Cotizaciones por aprobar</p>
        </div>
      </div>
    </div>
  );
}