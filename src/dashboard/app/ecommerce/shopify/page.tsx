"use client";

export default function EcommerceShopifyPage() {
  return (
    <div className="px-4 md:px-8 py-6 max-w-screen-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-headline font-bold text-on-surface mb-2">
          Shopify
        </h1>
        <p className="text-on-surface-variant text-sm">
          Gestión y sincronización de Shopify Plus.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5">
          <h3 className="text-sm font-bold text-on-surface mb-2">Productos Sincronizados</h3>
          <p className="text-3xl font-bold text-green-500">214</p>
          <p className="text-xs text-on-surface-variant">Productos activos en tienda</p>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5">
          <h3 className="text-sm font-bold text-on-surface mb-2">Ventas Hoy</h3>
          <p className="text-3xl font-bold text-green-400">$12,847</p>
          <p className="text-xs text-on-surface-variant">Ingresos totales hoy</p>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5">
          <h3 className="text-sm font-bold text-on-surface mb-2">Carritos Abandonados</h3>
          <p className="text-3xl font-bold text-amber-400">23</p>
          <p className="text-xs text-on-surface-variant">Clientes con productos en carrito</p>
        </div>
      </div>
    </div>
  );
}