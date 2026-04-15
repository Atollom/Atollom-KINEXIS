"use client";

export default function EcommerceMercadoLibrePage() {
  return (
    <div className="px-4 md:px-8 py-6 max-w-screen-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-headline font-bold text-on-surface mb-2">
          Mercado Libre
        </h1>
        <p className="text-on-surface-variant text-sm">
          Gestión y sincronización de Mercado Libre.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5">
          <h3 className="text-sm font-bold text-on-surface mb-2">Publicaciones Activas</h3>
          <p className="text-3xl font-bold text-yellow-400">127</p>
          <p className="text-xs text-on-surface-variant">Publicaciones sincronizadas</p>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5">
          <h3 className="text-sm font-bold text-on-surface mb-2">Órdenes Hoy</h3>
          <p className="text-3xl font-bold text-green-400">18</p>
          <p className="text-xs text-on-surface-variant">Ordenes recibidas hoy</p>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5">
          <h3 className="text-sm font-bold text-on-surface mb-2">Preguntas Pendientes</h3>
          <p className="text-3xl font-bold text-blue-400">7</p>
          <p className="text-xs text-on-surface-variant">Preguntas de compradores sin responder</p>
        </div>
      </div>
    </div>
  );
}