"use client";

export default function EcommerceShopifyPage() {
  return (
    <div className="px-4 md:px-8 py-6 max-w-screen-2xl mx-auto space-y-6">
      <div className="mb-2">
        <h1 className="text-2xl font-headline font-bold text-on-surface mb-2">
          Shopify
        </h1>
        <p className="text-on-surface-variant text-sm">
          Gestión completa de tu tienda Shopify Plus.
        </p>
      </div>

      {/* KPIs Principales */}
      <section className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
          <p className="text-xs text-on-surface-variant uppercase tracking-wider mb-1">Productos Activos</p>
          <p className="text-2xl font-bold text-green-500">214</p>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
          <p className="text-xs text-on-surface-variant uppercase tracking-wider mb-1">Ventas Hoy</p>
          <p className="text-2xl font-bold text-green-400">$12,847</p>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
          <p className="text-xs text-on-surface-variant uppercase tracking-wider mb-1">Órdenes Pendientes</p>
          <p className="text-2xl font-bold text-amber-400">3</p>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
          <p className="text-xs text-on-surface-variant uppercase tracking-wider mb-1">Carritos Abandonados</p>
          <p className="text-2xl font-bold text-purple-400">23</p>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
          <p className="text-xs text-on-surface-variant uppercase tracking-wider mb-1">Valor Promedio</p>
          <p className="text-2xl font-bold text-blue-400">$847</p>
        </div>
      </section>

      {/* Carritos Abandonados */}
      <section className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-purple-400">remove_shopping_cart</span>
            Carritos Abandonados
          </h3>
          <div className="flex items-center gap-3">
            <span className="text-xs text-amber-400">💰 Valor potencial: $47,230</span>
            <button className="px-3 py-1.5 bg-purple-400/10 text-purple-400 rounded-lg text-xs font-bold hover:bg-purple-400/20 transition-all">
              Recuperación Automática
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="px-3 py-2 text-left text-xs text-on-surface-variant uppercase tracking-wider">Cliente</th>
                <th className="px-3 py-2 text-left text-xs text-on-surface-variant uppercase tracking-wider">Email</th>
                <th className="px-3 py-2 text-center text-xs text-on-surface-variant uppercase tracking-wider">Artículos</th>
                <th className="px-3 py-2 text-center text-xs text-on-surface-variant uppercase tracking-wider">Valor</th>
                <th className="px-3 py-2 text-center text-xs text-on-surface-variant uppercase tracking-wider">Hace</th>
                <th className="px-3 py-2 text-center text-xs text-on-surface-variant uppercase tracking-wider">Estado</th>
              </tr>
            </thead>
            <tbody>
              {[
                { client: "María González", email: "maria@email.com", items: 3, value: 2847, time: "2h", status: "No contactado" },
                { client: "Juan Pérez", email: "juan@email.com", items: 1, value: 1297, time: "4h", status: "Email enviado" },
                { client: "Ana Martínez", email: "ana@email.com", items: 2, value: 1847, time: "6h", status: "Abierto" },
                { client: "Carlos Ramírez", email: "carlos@email.com", items: 4, value: 4120, time: "12h", status: "Clickeado" },
              ].map((cart, i) => (
                <tr key={i} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                  <td className="px-3 py-3 text-sm text-on-surface">{cart.client}</td>
                  <td className="px-3 py-3 text-sm text-on-surface-variant">{cart.email}</td>
                  <td className="px-3 py-3 text-sm text-center font-bold">{cart.items}</td>
                  <td className="px-3 py-3 text-sm text-center font-bold">${cart.value}</td>
                  <td className="px-3 py-3 text-sm text-center text-on-surface-variant">{cart.time}</td>
                  <td className="px-3 py-3 text-center">
                    <span className={`px-2 py-1 rounded-md text-xs font-bold ${
                      cart.status === "No contactado" ? "bg-gray-500/20 text-gray-400" :
                      cart.status === "Email enviado" ? "bg-blue-500/20 text-blue-400" :
                      "bg-green-500/20 text-green-400"
                    }`}>
                      {cart.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Recuperación Automática */}
      <section className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5">
        <h3 className="font-bold text-on-surface mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-green-400">smart_toy</span>
          Recuperación Automática por Samantha
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/[0.04] rounded-lg p-4">
            <p className="text-xs text-on-surface-variant mb-1">Tasa de Recuperación</p>
            <p className="text-2xl font-bold text-green-400">18.7%</p>
            <p className="text-xs text-on-surface-variant mt-1">Promedio industria: 10-12%</p>
          </div>
          <div className="bg-white/[0.04] rounded-lg p-4">
            <p className="text-xs text-on-surface-variant mb-1">Recuperado Mes Actual</p>
            <p className="text-2xl font-bold text-green-400">$124,780</p>
            <p className="text-xs text-on-surface-variant mt-1">+32% vs mes anterior</p>
          </div>
          <div className="bg-white/[0.04] rounded-lg p-4">
            <p className="text-xs text-on-surface-variant mb-1">Mensajes Enviados Hoy</p>
            <p className="text-2xl font-bold text-blue-400">47</p>
            <p className="text-xs text-on-surface-variant mt-1">12 respuestas recibidas</p>
          </div>
        </div>
      </section>
    </div>
  );
}