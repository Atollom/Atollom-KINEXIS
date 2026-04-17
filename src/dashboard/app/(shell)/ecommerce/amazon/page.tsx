"use client";

export default function EcommerceAmazonPage() {
  return (
    <div className="px-4 md:px-8 py-6 max-w-screen-2xl mx-auto space-y-6">
      <div className="mb-2">
        <h1 className="text-2xl font-headline font-bold text-on-surface mb-2">
          Amazon
        </h1>
        <p className="text-on-surface-variant text-sm">
          Gestión completa de Amazon Seller Central y FBA.
        </p>
        <div className="flex gap-2 mt-3">
          {[7, 8, 9, 10].map(id => (
            <div key={id} className="flex items-center gap-1.5 px-2 py-1 bg-[#CCFF00]/10 border border-[#CCFF00]/20 rounded-lg">
              <span className="w-1.5 h-1.5 rounded-full bg-[#CCFF00] animate-pulse" />
              <span className="text-[9px] font-bold text-[#CCFF00] uppercase tracking-wider">Agent #{id}</span>
            </div>
          ))}
        </div>
      </div>

      {/* KPIs Principales */}
      <section className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
          <p className="text-xs text-on-surface-variant uppercase tracking-wider mb-1">Listings Activos</p>
          <p className="text-2xl font-bold text-orange-400">89</p>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
          <p className="text-xs text-on-surface-variant uppercase tracking-wider mb-1">Unidades FBA</p>
          <p className="text-2xl font-bold text-blue-400">1,247</p>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
          <p className="text-xs text-on-surface-variant uppercase tracking-wider mb-1">Órdenes Hoy</p>
          <p className="text-2xl font-bold text-green-400">8</p>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
          <p className="text-xs text-on-surface-variant uppercase tracking-wider mb-1">Reviews Pendientes</p>
          <p className="text-2xl font-bold text-amber-400">12</p>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
          <p className="text-xs text-on-surface-variant uppercase tracking-wider mb-1">Ventas Hoy</p>
          <p className="text-2xl font-bold text-purple-400">$7,230</p>
        </div>
      </section>

      {/* FBA Dashboard */}
      <section className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5">
        <h3 className="font-bold text-on-surface mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-orange-400">inventory_2</span>
          Fulfillment by Amazon (FBA)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div>
            <p className="text-xs text-on-surface-variant mb-1">Unidades Disponibles</p>
            <p className="text-xl font-bold text-green-400">1,247</p>
          </div>
          <div>
            <p className="text-xs text-on-surface-variant mb-1">En Tránsito</p>
            <p className="text-xl font-bold text-blue-400">342</p>
          </div>
          <div>
            <p className="text-xs text-on-surface-variant mb-1">En Proceso</p>
            <p className="text-xl font-bold text-amber-400">128</p>
          </div>
          <div>
            <p className="text-xs text-on-surface-variant mb-1">Rotación Promedio</p>
            <p className="text-xl font-bold text-purple-400">17 días</p>
          </div>
        </div>

        <div className="bg-white/[0.04] rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-bold text-on-surface">Reabastecimiento Recomendado</p>
            <span className="text-xs text-amber-400 font-bold">⚠️ 5 SKUs</span>
          </div>
          <p className="text-xs text-on-surface-variant">
            El sistema recomienda enviar mercancía para los siguientes SKUs: SKU-00123, SKU-00456, SKU-00789
          </p>
        </div>
      </section>

      {/* FBM */}
      <section className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-400">local_shipping</span>
            Fulfillment by Merchant (FBM)
          </h3>
          <span className="px-2 py-1 rounded-md text-xs bg-amber-400/20 text-amber-400 font-bold">3 Órdenes Pendientes</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="px-3 py-2 text-left text-xs text-on-surface-variant uppercase tracking-wider">Orden</th>
                <th className="px-3 py-2 text-left text-xs text-on-surface-variant uppercase tracking-wider">Cliente</th>
                <th className="px-3 py-2 text-center text-xs text-on-surface-variant uppercase tracking-wider">SKU</th>
                <th className="px-3 py-2 text-center text-xs text-on-surface-variant uppercase tracking-wider">Total</th>
                <th className="px-3 py-2 text-center text-xs text-on-surface-variant uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {[
                { order: "AMZ-1234567", client: "Carlos Ramírez", sku: "SKU-00123", total: 897 },
                { order: "AMZ-1234568", client: "Laura Sánchez", sku: "SKU-00456", total: 549 },
                { order: "AMZ-1234569", client: "Roberto Díaz", sku: "SKU-00789", total: 1297 },
              ].map((ord, i) => (
                <tr key={i} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                  <td className="px-3 py-3 text-sm font-mono text-on-surface">{ord.order}</td>
                  <td className="px-3 py-3 text-sm text-on-surface">{ord.client}</td>
                  <td className="px-3 py-3 text-sm text-center font-mono text-on-surface-variant">{ord.sku}</td>
                  <td className="px-3 py-3 text-sm text-center font-bold">${ord.total}</td>
                  <td className="px-3 py-3 text-center">
                    <button className="flex items-center gap-1 px-3 py-1.5 bg-[#CCFF00] text-black rounded text-xs font-bold hover:shadow-[0_0_10px_rgba(204,255,0,0.3)] transition-all">
                      <span className="material-symbols-outlined text-sm">print</span>
                      Guía Skydrop
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Reviews */}
      <section className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-yellow-400">star_rate</span>
            Reviews y Calificaciones
          </h3>
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-400">4.7<span className="text-lg">/5</span></p>
            <p className="text-xs text-on-surface-variant">Rating general</p>
          </div>
        </div>

        <div className="space-y-3">
          {[
            { user: "Cliente Amazon", rating: 5, comment: "Excelente producto, llegó super rápido. Muy recomendado.", time: "Hace 2h", responded: true },
            { user: "Usuario Verificado", rating: 4, comment: "Buen producto, aunque la caja llegó un poco golpeada.", time: "Hace 1d", responded: false },
          ].map((rev, i) => (
            <div key={i} className="bg-white/[0.04] rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-bold text-sm text-on-surface">{rev.user}</p>
                  <div className="flex items-center gap-1 mb-1">
                    {Array(rev.rating).fill(0).map((_, j) => (
                      <span key={j} className="material-symbols-outlined text-sm text-yellow-400">star</span>
                    ))}
                  </div>
                  <p className="text-xs text-on-surface-variant">{rev.time}</p>
                </div>
                {rev.responded && (
                  <span className="px-2 py-1 rounded-md text-xs bg-green-500/20 text-green-400 font-bold">✓ Respondido</span>
                )}
              </div>
              <p className="text-sm text-on-surface">❝ {rev.comment} ❞</p>
              {!rev.responded && (
                <button className="mt-2 px-3 py-1.5 bg-blue-400/10 text-blue-400 rounded text-xs font-bold hover:bg-blue-400/20">
                  Responder
                </button>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}