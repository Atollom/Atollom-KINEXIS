"use client";

export default function ERPPage() {
  return (
    <div className="px-4 md:px-8 py-6 max-w-screen-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-headline font-bold text-on-surface mb-2">
          ERP — Administración
        </h1>
        <p className="text-on-surface-variant text-sm">
          Gestión de almacén, facturación, compras y logística.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5">
          <h3 className="text-sm font-bold text-on-surface mb-2">Almacén</h3>
          <p className="text-xs text-on-surface-variant">
            Control de stock, movimientos y alertas de stock crítico.
          </p>
        </div>

        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5">
          <h3 className="text-sm font-bold text-on-surface mb-2">Facturación CFDI</h3>
          <p className="text-xs text-on-surface-variant">
            Timbrado, cancelación y reportes fiscales.
          </p>
        </div>

        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5">
          <h3 className="text-sm font-bold text-on-surface mb-2">Compras</h3>
          <p className="text-xs text-on-surface-variant">
            Órdenes de compra, proveedores y recepciones.
          </p>
        </div>
      </div>
    </div>
  );
}