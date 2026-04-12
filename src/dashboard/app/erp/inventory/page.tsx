// src/dashboard/app/erp/inventory/page.tsx
"use client";

import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useInventory } from "@/hooks/useInventory";
import type { UserRole } from "@/types";

export default function InventoryPage() {
  const { inventory, isLoading } = useInventory();
  const [role, setRole] = useState<UserRole | null>(null);
  const [restocking, setRestocking] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    async function loadRole() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("user_profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      if (data?.role) setRole(data.role as UserRole);
    }
    loadRole();
  }, [supabase]);

  const canRestock = role === "owner" || role === "admin";

  async function handleRestock(sku: string) {
    setRestocking(sku);
    try {
      await fetch("/api/erp/purchase-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "restock_request", sku }),
      });
    } catch {
      // non-critical — restock is advisory
    } finally {
      setRestocking(null);
    }
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "ok":       return { color: "bg-success",      label: "Saludable", text: "text-success" };
      case "warning":  return { color: "bg-secondary",    label: "Preventivo", text: "text-secondary" };
      case "critical": return { color: "bg-[#ff9900]",    label: "Crítico",   text: "text-[#ff9900]" };
      case "out":      return { color: "bg-error",         label: "Agotado",  text: "text-error" };
      default:         return { color: "bg-outline",       label: "Unknown",  text: "text-outline" };
    }
  };

  const colSpan = canRestock ? 5 : 4;

  return (
    <div className="p-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline tracking-tight text-on-surface">Inventario Central</h1>
          <p className="text-on-surface-variant text-xs uppercase tracking-widest mt-1">
            Monitoreo de Stock & Velocidad de Desplazamiento
          </p>
        </div>
      </div>

      <div className="bg-surface-container-low rounded-2xl overflow-hidden glass-panel border border-white/5">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/5 bg-white/5">
              <th className="px-6 py-4 label-sm text-on-surface-variant">Producto / SKU</th>
              <th className="px-6 py-4 label-sm text-on-surface-variant text-center">Stock</th>
              <th className="px-6 py-4 label-sm text-on-surface-variant">Proyección (Días)</th>
              <th className="px-6 py-4 label-sm text-on-surface-variant">Estatus</th>
              {canRestock && (
                <th className="px-6 py-4 label-sm text-on-surface-variant">Acción</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {isLoading ? (
              [1, 2, 3, 4, 5].map(i => (
                <tr key={i} className="animate-pulse">
                  <td className="px-6 py-4"><div className="h-4 bg-white/5 rounded w-3/4" /></td>
                  <td className="px-6 py-4"><div className="h-4 bg-white/5 rounded w-1/2 mx-auto" /></td>
                  <td className="px-6 py-4"><div className="h-4 bg-white/5 rounded w-1/2" /></td>
                  <td className="px-6 py-4"><div className="h-4 bg-white/5 rounded w-1/3" /></td>
                  {canRestock && <td className="px-6 py-4" />}
                </tr>
              ))
            ) : inventory.length === 0 ? (
              <tr>
                <td colSpan={colSpan} className="px-6 py-12 text-center text-on-surface-variant italic label-sm">
                  Sin datos de inventario disponibles
                </td>
              </tr>
            ) : (
              inventory.map((item) => {
                const isOut = item.stock === 0;
                const config = getStatusConfig(item.status);
                // Health bar: (days_remaining / 30) * 100, clamped 0–100
                // If stock=0: full red bar
                const barPct   = isOut ? 100 : Math.min(Math.max((item.days_remaining / 30) * 100, 0), 100);
                const barColor = isOut ? "bg-error" : config.color;

                return (
                  <tr key={item.sku} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-5">
                      <p className="text-sm font-bold text-on-surface group-hover:text-primary-container transition-colors">
                        {item.name}
                      </p>
                      <p className="text-[10px] text-on-surface-variant font-mono mt-0.5">{item.sku}</p>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className={`text-sm font-bold font-headline ${isOut ? "text-error" : ""}`}>
                        {item.stock}
                      </span>
                      <p className="text-[8px] text-on-surface-variant uppercase">Unidades</p>
                    </td>
                    <td className="px-6 py-5">
                      {isOut ? (
                        <span className="label-sm text-error font-bold uppercase tracking-widest">SIN STOCK</span>
                      ) : (
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${barColor} transition-all duration-1000`}
                              style={{ width: `${barPct}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold font-headline w-8">
                            {item.days_remaining === 999 ? "∞" : item.days_remaining}d
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${config.color}`} />
                        <span className={`label-sm ${config.text}`}>{config.label}</span>
                      </div>
                    </td>
                    {canRestock && (
                      <td className="px-6 py-5">
                        <button
                          onClick={() => handleRestock(item.sku)}
                          disabled={restocking === item.sku}
                          className="btn-glass text-[10px] px-3 py-1.5 flex items-center gap-1.5 disabled:opacity-40"
                          aria-label={`Solicitar reabastecimiento de ${item.name}`}
                        >
                          <span
                            className={`material-symbols-outlined text-sm ${restocking === item.sku ? "animate-spin" : ""}`}
                            aria-hidden="true"
                          >
                            {restocking === item.sku ? "sync" : "add_shopping_cart"}
                          </span>
                          REABASTECER
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
