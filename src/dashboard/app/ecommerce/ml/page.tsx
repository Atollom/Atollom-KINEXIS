"use client";

export default function EcommerceMLPage() {
  return (
    <div className="px-4 md:px-8 py-6 max-w-screen-2xl mx-auto space-y-6">
      <div className="mb-2">
        <h1 className="text-2xl font-headline font-bold text-on-surface mb-2">
          Mercado Libre
        </h1>
        <p className="text-on-surface-variant text-sm">
          Gestión completa de tu tienda Mercado Libre.
        </p>
      </div>

      {/* KPIs Principales */}
      <section className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
          <p className="text-xs text-on-surface-variant uppercase tracking-wider mb-1">Publicaciones Activas</p>
          <p className="text-2xl font-bold text-yellow-400">127</p>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
          <p className="text-xs text-on-surface-variant uppercase tracking-wider mb-1">Publicaciones Estrella</p>
          <p className="text-2xl font-bold text-green-400">18</p>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
          <p className="text-xs text-on-surface-variant uppercase tracking-wider mb-1">Pedidos Por Surtir</p>
          <p className="text-2xl font-bold text-amber-400">7</p>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
          <p className="text-xs text-on-surface-variant uppercase tracking-wider mb-1">Preguntas Cliente</p>
          <p className="text-2xl font-bold text-blue-400">8</p>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
          <p className="text-xs text-on-surface-variant uppercase tracking-wider mb-1">Ventas Hoy</p>
          <p className="text-2xl font-bold text-purple-400">$18,742</p>
        </div>
      </section>

      {/* Publicaciones Estrella */}
      <section className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5">
        <h3 className="font-bold text-on-surface mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-yellow-400">star</span>
          Publicaciones Estrella
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="px-3 py-2 text-left text-xs text-on-surface-variant uppercase tracking-wider">Producto</th>
                <th className="px-3 py-2 text-center text-xs text-on-surface-variant uppercase tracking-wider">SKU</th>
                <th className="px-3 py-2 text-center text-xs text-on-surface-variant uppercase tracking-wider">Stock</th>
                <th className="px-3 py-2 text-center text-xs text-on-surface-variant uppercase tracking-wider">Precio</th>
                <th className="px-3 py-2 text-center text-xs text-on-surface-variant uppercase tracking-wider">Ventas Semana</th>
                <th className="px-3 py-2 text-center text-xs text-on-surface-variant uppercase tracking-wider">Estado</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: "Cargador Portátil 20000mAh", sku: "SKU-00123", stock: 47, price: 299, sales: 89, status: "Excelente" },
                { name: "Audífonos Bluetooth Pro", sku: "SKU-00456", stock: 12, price: 549, sales: 67, status: "Bajo Stock" },
                { name: "Protector Pantalla Cristal", sku: "SKU-00789", stock: 234, price: 99, sales: 156, status: "Excelente" },
                { name: "Funda Silicona Premium", sku: "SKU-00145", stock: 89, price: 149, sales: 45, status: "Normal" },
              ].map((prod, i) => (
                <tr key={i} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                  <td className="px-3 py-3 text-sm text-on-surface">{prod.name}</td>
                  <td className="px-3 py-3 text-sm text-on-surface-variant text-center font-mono">{prod.sku}</td>
                  <td className="px-3 py-3 text-sm text-center font-bold">{prod.stock}</td>
                  <td className="px-3 py-3 text-sm text-center font-bold">${prod.price}</td>
                  <td className="px-3 py-3 text-sm text-center font-bold text-green-400">{prod.sales}</td>
                  <td className="px-3 py-3 text-center">
                    <span className={`px-2 py-1 rounded-md text-xs font-bold ${
                      prod.status === "Excelente" ? "bg-green-500/20 text-green-400" :
                      prod.status === "Bajo Stock" ? "bg-amber-500/20 text-amber-400" :
                      "bg-blue-500/20 text-blue-400"
                    }`}>
                      {prod.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Bandeja de Preguntas */}
      <section className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-400">question_answer</span>
            Bandeja de Preguntas
          </h3>
          <div className="flex items-center gap-3">
            <span className="text-xs text-on-surface-variant">Respuesta Automática: 🟢 ACTIVA</span>
            <button className="px-3 py-1.5 bg-white/[0.06] text-on-surface rounded-lg text-xs font-bold hover:bg-white/[0.1] transition-all">
              Ver todas
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {[
            { user: "María González", question: "¿Este producto es compatible con iPhone 15?", time: "Hace 12 min", auto_responded: true, response: "Si, es perfectamente compatible con iPhone 15 y todos los modelos anteriores." },
            { user: "Juan Pérez", question: "¿Cuánto tiempo tarda en llegar?", time: "Hace 28 min", auto_responded: true, response: "El tiempo de entrega es de 2 a 4 días hábiles por Mercado Envíos." },
            { user: "Ana Martínez", question: "Tienen factura?", time: "Hace 1h", auto_responded: false, response: null },
          ].map((q, i) => (
            <div key={i} className="bg-white/[0.04] rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-bold text-sm text-on-surface">{q.user}</p>
                  <p className="text-xs text-on-surface-variant">{q.time}</p>
                </div>
                {q.auto_responded && (
                  <span className="px-2 py-1 rounded-md text-xs bg-[#A8E63D]/20 text-[#A8E63D] font-bold">🤖 Respondido por IA</span>
                )}
                {!q.auto_responded && (
                  <span className="px-2 py-1 rounded-md text-xs bg-amber-500/20 text-amber-400 font-bold">⏳ Pendiente</span>
                )}
              </div>
              <p className="text-sm text-on-surface mb-2">❝ {q.question} ❞</p>
              {q.response && (
                <div className="bg-[#A8E63D]/5 border-l-2 border-[#A8E63D] rounded-r-lg p-2 ml-4">
                  <p className="text-sm text-on-surface">{q.response}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Ajustes de Precio */}
      <section className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-purple-400">price_change</span>
            Sugerencias de Ajuste de Precio
          </h3>
          <button className="px-3 py-1.5 bg-purple-400/10 text-purple-400 rounded-lg text-xs font-bold hover:bg-purple-400/20 transition-all">
            Aplicar todos
          </button>
        </div>

        <div className="space-y-3">
          {[
            { product: "Cargador Portátil 20000mAh", current: 299, suggested: 279, reason: "Competencia redujo precio", impact: "+12% ventas estimadas" },
            { product: "Audífonos Bluetooth Pro", current: 549, suggested: 519, reason: "Demanda estacional alta", impact: "+8% ventas estimadas" },
          ].map((adj, i) => (
            <div key={i} className="bg-white/[0.04] rounded-lg p-4 flex items-center justify-between">
              <div>
                <p className="font-bold text-sm text-on-surface">{adj.product}</p>
                <p className="text-xs text-on-surface-variant">{adj.reason}</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-xs text-on-surface-variant">Actual</p>
                  <p className="font-bold text-on-surface">${adj.current}</p>
                </div>
                <span className="material-symbols-outlined text-green-400">arrow_forward</span>
                <div className="text-center">
                  <p className="text-xs text-on-surface-variant">Sugerido</p>
                  <p className="font-bold text-green-400">${adj.suggested}</p>
                </div>
                <div className="flex gap-2">
                  <button className="px-3 py-1.5 bg-green-400/10 text-green-400 rounded text-xs font-bold hover:bg-green-400/20">Aceptar</button>
                  <button className="px-3 py-1.5 bg-white/[0.06] text-on-surface rounded text-xs font-bold hover:bg-white/[0.1]">Ignorar</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}