"use client";

export default function EcommerceReviewsPage() {
  return (
    <div className="px-4 md:px-8 py-6 max-w-screen-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-headline font-bold text-on-surface mb-2">
          Reseñas
        </h1>
        <p className="text-on-surface-variant text-sm">
          Gestión y respuesta a reseñas de clientes.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5">
          <h3 className="text-sm font-bold text-on-surface mb-2">Rating Promedio</h3>
          <p className="text-3xl font-bold text-yellow-400">4.7/5</p>
          <p className="text-xs text-on-surface-variant">Puntuación promedio general</p>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5">
          <h3 className="text-sm font-bold text-on-surface mb-2">Reseñas Pendientes</h3>
          <p className="text-3xl font-bold text-amber-400">8</p>
          <p className="text-xs text-on-surface-variant">Reseñas sin responder</p>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5">
          <h3 className="text-sm font-bold text-on-surface mb-2">Respuestas Automáticas</h3>
          <p className="text-3xl font-bold text-green-400">92%</p>
          <p className="text-xs text-on-surface-variant">Respuestas gestionadas por Samantha</p>
        </div>
      </div>
    </div>
  );
}