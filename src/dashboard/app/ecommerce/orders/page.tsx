"use client";

import { useState } from "react";
import { ShippingDimensionsCard } from "@/components/ecommerce/ShippingDimensionsCard";

interface Order {
  order_id: string;
  platform: string;
  customer_name: string;
  total: number;
  status: string;
  created_at: string;
  items: number;
  shipping_method: string;
}

const demoOrders: Order[] = [
  { order_id: "ORD-2026-12345", platform: "Mercado Libre", customer_name: "María González", total: 1847, status: "PAGO_CONFIRMADO", created_at: "2026-04-14 14:32", items: 2, shipping_method: "Skydrop" },
  { order_id: "ORD-2026-12346", platform: "Shopify", customer_name: "Juan Pérez", total: 2490, status: "POR_SURTIR", created_at: "2026-04-14 13:18", items: 1, shipping_method: "Paquete Azul" },
  { order_id: "ORD-2026-12347", platform: "Amazon", customer_name: "Carlos Ramírez", total: 987, status: "EN_CAMINO", created_at: "2026-04-14 10:45", items: 3, shipping_method: "Amazon FBA" },
  { order_id: "ORD-2026-12348", platform: "Mercado Libre", customer_name: "Ana Martínez", total: 3250, status: "PAGO_CONFIRMADO", created_at: "2026-04-14 09:22", items: 4, shipping_method: "DHL" },
  { order_id: "ORD-2026-12349", platform: "B2B", customer_name: "Empresa ABC", total: 18750, status: "PENDIENTE_APROBACION", created_at: "2026-04-13 18:55", items: 12, shipping_method: "Paquete Azul" },
  { order_id: "ORD-2026-12350", platform: "Shopify", customer_name: "Laura Sánchez", total: 1240, status: "ENTREGADO", created_at: "2026-04-13 15:30", items: 1, shipping_method: "Skydrop" },
];

const statusConfig: Record<string, { color: string; label: string }> = {
  PAGO_CONFIRMADO: { color: "bg-blue-500/20 text-blue-400", label: "Pago Confirmado" },
  POR_SURTIR: { color: "bg-amber-500/20 text-amber-400", label: "Por Surtir" },
  EN_CAMINO: { color: "bg-purple-500/20 text-purple-400", label: "En Camino" },
  ENTREGADO: { color: "bg-green-500/20 text-green-400", label: "Entregado" },
  PENDIENTE_APROBACION: { color: "bg-red-500/20 text-red-400", label: "Pendiente" },
};

export default function EcommerceOrdersPage() {
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [surtirOrder, setSurtirOrder] = useState<string | null>(null);
  const [shippingTotal, setShippingTotal] = useState<number | null>(null);
  const [needsInvoice, setNeedsInvoice] = useState<boolean | null>(null);

  const toggleOrder = (id: string) => {
    setSelectedOrders(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="px-4 md:px-8 py-6 max-w-screen-2xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-headline font-bold text-on-surface mb-2">
            Órdenes
          </h1>
          <p className="text-on-surface-variant text-sm">
            Todas las órdenes de todas las plataformas.
          </p>
        </div>

        <div className="flex gap-3">
          <button className="px-4 py-2 bg-[#A8E63D]/10 text-[#A8E63D] rounded-lg font-bold text-sm hover:bg-[#A8E63D]/20 transition-all">
            <span className="material-symbols-outlined mr-2 vertical-align-middle text-base">local_shipping</span>
            Generar Etiquetas
          </button>
          <button className="px-4 py-2 bg-white/[0.06] text-on-surface rounded-lg font-bold text-sm hover:bg-white/[0.1] transition-all">
            <span className="material-symbols-outlined mr-2 vertical-align-middle text-base">download</span>
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Resumen rápido */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
          <p className="text-xs text-on-surface-variant uppercase tracking-wider mb-1">Pendientes</p>
          <p className="text-2xl font-bold text-amber-400">7</p>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
          <p className="text-xs text-on-surface-variant uppercase tracking-wider mb-1">Hoy</p>
          <p className="text-2xl font-bold text-green-400">18</p>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
          <p className="text-xs text-on-surface-variant uppercase tracking-wider mb-1">Total Hoy</p>
          <p className="text-2xl font-bold text-blue-400">$12,847</p>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
          <p className="text-xs text-on-surface-variant uppercase tracking-wider mb-1">En Camino</p>
          <p className="text-2xl font-bold text-purple-400">23</p>
        </div>
      </div>

      {/* Tabla de órdenes */}
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="px-4 py-3 text-left text-xs text-on-surface-variant uppercase tracking-wider">ID</th>
                <th className="px-4 py-3 text-left text-xs text-on-surface-variant uppercase tracking-wider">Plataforma</th>
                <th className="px-4 py-3 text-left text-xs text-on-surface-variant uppercase tracking-wider">Cliente</th>
                <th className="px-4 py-3 text-left text-xs text-on-surface-variant uppercase tracking-wider">Artículos</th>
                <th className="px-4 py-3 text-left text-xs text-on-surface-variant uppercase tracking-wider">Total</th>
                <th className="px-4 py-3 text-left text-xs text-on-surface-variant uppercase tracking-wider">Estado</th>
                <th className="px-4 py-3 text-left text-xs text-on-surface-variant uppercase tracking-wider">Envío</th>
                <th className="px-4 py-3 text-left text-xs text-on-surface-variant uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {demoOrders.map((order) => (
                <tr 
                  key={order.order_id} 
                  className={`border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors ${selectedOrders.has(order.order_id) ? 'bg-[#A8E63D]/5' : ''}`}
                  onClick={() => toggleOrder(order.order_id)}
                >
                  <td className="px-4 py-3 font-mono text-sm text-on-surface">{order.order_id}</td>
                  <td className="px-4 py-3 text-sm text-on-surface">{order.platform}</td>
                  <td className="px-4 py-3 text-sm text-on-surface">{order.customer_name}</td>
                  <td className="px-4 py-3 text-sm text-on-surface text-center">{order.items}</td>
                  <td className="px-4 py-3 text-sm font-bold text-on-surface">${order.total.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-md text-xs font-bold ${statusConfig[order.status].color}`}>
                      {statusConfig[order.status].label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-on-surface-variant">{order.shipping_method}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setSurtirOrder(order.order_id);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-[#A8E63D]/10 hover:bg-[#A8E63D]/20 text-[#A8E63D] text-[10px] font-bold uppercase tracking-wider transition-all"
                      >
                        Surtir
                      </button>
                      <button className="p-1.5 rounded-md bg-white/[0.06] hover:bg-white/[0.1] transition-all" title="Ver detalle">
                        <span className="material-symbols-outlined text-sm">visibility</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Surtir Pedido */}
      {surtirOrder && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#000103] border border-white/[0.08] rounded-[2rem] w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-headline font-bold text-white">Surtir Pedido</h2>
                  <p className="text-xs text-on-surface-variant uppercase tracking-widest mt-1">Configuración de Envío y Facturación</p>
                </div>
                <button onClick={() => setSurtirOrder(null)} className="text-on-surface-variant hover:text-white">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="space-y-6">
                {/* Paso 1: Dimensiones */}
                <ShippingDimensionsCard onCalculated={(total) => setShippingTotal(total)} />

                {/* Paso 2: Facturación */}
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6">
                   <h3 className="text-sm font-headline font-bold text-white mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-blue-400 text-base">receipt</span>
                    ¿Requieres Factura CFDI?
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={() => setNeedsInvoice(true)}
                      className={`py-3 rounded-xl border transition-all text-[11px] font-bold uppercase tracking-wider ${needsInvoice ? "bg-blue-500/10 border-blue-500 text-blue-400" : "bg-white/[0.02] border-white/[0.06] text-on-surface-variant"}`}
                    >
                      Sí, requiero factura
                    </button>
                    <button 
                      onClick={() => setNeedsInvoice(false)}
                      className={`py-3 rounded-xl border transition-all text-[11px] font-bold uppercase tracking-wider ${needsInvoice === false ? "bg-white/[0.1] border-white text-white" : "bg-white/[0.02] border-white/[0.06] text-on-surface-variant"}`}
                    >
                      Venta al Público
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-10 flex gap-4">
                <button 
                  onClick={() => setSurtirOrder(null)}
                  className="flex-1 py-4 bg-white/[0.03] text-on-surface-variant font-bold rounded-2xl uppercase tracking-widest text-xs hover:bg-white/[0.06]"
                >
                  Cancelar
                </button>
                <button 
                  className="flex-1 py-4 bg-[#CCFF00] text-black font-bold rounded-2xl uppercase tracking-widest text-xs hover:shadow-[0_0_20px_#CCFF0040] transition-all disabled:opacity-30"
                  disabled={!shippingTotal || needsInvoice === null}
                  onClick={() => {
                    alert(`Guía generada. Facturación: ${needsInvoice ? 'CFDI Solicitado' : 'Público General'}`);
                    setSurtirOrder(null);
                  }}
                >
                  Confirmar y Generar Guía
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}