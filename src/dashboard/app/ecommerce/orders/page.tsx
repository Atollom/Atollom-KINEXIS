"use client";

export default function EcommerceOrdersPage() {
  return (
    <div className="px-4 md:px-8 py-6 max-w-screen-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-headline font-bold text-on-surface mb-2">
          Órdenes
        </h1>
        <p className="text-on-surface-variant text-sm">
          Todas las órdenes de todas las plataformas.
        </p>
      </div>

      <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-10 text-center">
        <span className="material-symbols-outlined text-5xl text-on-surface-variant mb-4">receipt_long</span>
        <h3 className="text-lg font-bold text-on-surface mb-2">Órdenes</h3>
        <p className="text-sm text-on-surface-variant mb-4">
          Esta sección muestra todas las órdenes sincronizadas desde Mercado Libre, Amazon y Shopify.
        </p>
      </div>
    </div>
  );
}