"use client";

export default function EcommerceAmazonPage() {
  return (
    <div className="px-4 md:px-8 py-6 max-w-screen-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-headline font-bold text-on-surface mb-2">
          Amazon
        </h1>
        <p className="text-on-surface-variant text-sm">
          Gestión y sincronización de Amazon Seller Central.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5">
          <h3 className="text-sm font-bold text-on-surface mb-2">Listings FBA</h3>
          <p className="text-3xl font-bold text-orange-400">89</p>
          <p className="text-xs text-on-surface-variant">Productos en almacén Amazon</p>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5">
          <h3 className="text-sm font-bold text-on-surface mb-2">Órdenes Pendientes</h3>
          <p className="text-3xl font-bold text-green-400">3</p>
          <p className="text-xs text-on-surface-variant">Ordenes por procesar</p>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5">
          <h3 className="text-sm font-bold text-on-surface mb-2">Feedback Pendiente</h3>
          <p className="text-3xl font-bold text-blue-400">12</p>
          <p className="text-xs text-on-surface-variant">Reviews de clientes sin responder</p>
        </div>
      </div>
    </div>
  );
}