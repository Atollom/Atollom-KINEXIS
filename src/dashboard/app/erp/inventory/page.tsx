// src/dashboard/app/erp/inventory/page.tsx
// Inventario completo: Tabla SKUs + Crear OC + Movimientos + Filtros
"use client";

import { useCallback, useEffect, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";
import { useInventory } from "@/hooks/useInventory";
import type { InventoryItem, StockStatus, UserRole } from "@/types";

// ──────────────────────────────────────────────────────────────────────────────
// Tipos locales
// ──────────────────────────────────────────────────────────────────────────────
interface InventoryMovement {
  id: string;
  sku: string;
  product_name: string;
  type: "entrada" | "salida" | "ajuste";
  quantity: number;
  reference: string;
  created_at: string;
}

type StatusFilter = "all" | StockStatus;

// ──────────────────────────────────────────────────────────────────────────────
// Constantes
// ──────────────────────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<StockStatus, { label: string; color: string; bg: string; icon: string }> = {
  ok:       { label: "Saludable", color: "#22C55E", bg: "bg-green-500/10", icon: "check_circle" },
  warning:  { label: "Preventivo", color: "#F59E0B", bg: "bg-amber-500/10", icon: "warning" },
  critical: { label: "Crítico",   color: "#FF9900", bg: "bg-orange-500/10", icon: "error" },
  out:      { label: "Agotado",   color: "#EF4444", bg: "bg-red-500/10",   icon: "cancel" },
};

const MOVEMENT_CONFIG: Record<string, { color: string; icon: string; label: string }> = {
  entrada: { color: "#22C55E", icon: "arrow_downward", label: "Entrada" },
  salida:  { color: "#EF4444", icon: "arrow_upward",   label: "Salida" },
  ajuste:  { color: "#3B82F6", icon: "sync_alt",       label: "Ajuste" },
};

const FILTER_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all",      label: "Todos" },
  { value: "critical", label: "Crítico" },
  { value: "warning",  label: "Preventivo" },
  { value: "out",      label: "Agotado" },
  { value: "ok",       label: "Saludable" },
];

// ──────────────────────────────────────────────────────────────────────────────
// Componente principal
// ──────────────────────────────────────────────────────────────────────────────
export default function InventoryPage() {
  const { inventory, isLoading } = useInventory();
  const [role, setRole] = useState<UserRole | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [restocking, setRestocking] = useState<string | null>(null);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [movementsLoading, setMovementsLoading] = useState(true);
  const [showMovements, setShowMovements] = useState(false);

  const supabase = createBrowserSupabaseClient();

  // Cargar rol + movimientos recientes
  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("user_profiles")
        .select("role, tenant_id")
        .eq("id", user.id)
        .single();

      if (profile?.role) setRole(profile.role as UserRole);

      if (profile?.tenant_id) {
        setMovementsLoading(true);
        const { data: movData } = await supabase
          .from("inventory_movements")
          .select("*")
          .eq("tenant_id", profile.tenant_id)
          .order("created_at", { ascending: false })
          .limit(20);
        if (movData) setMovements(movData);
        setMovementsLoading(false);
      }
    }
    loadData();
  }, [supabase]);

  // RBAC: propietarios/admin pueden crear OC
  const canRestock = role === "owner" || role === "admin" || role === "socia";

  // Crear orden de compra para un SKU crítico
  const handleRestock = useCallback(async (sku: string) => {
    setRestocking(sku);
    try {
      await fetch("/api/erp/purchase-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "restock_request", sku }),
      });
    } catch {
      // Restock es advisory — no bloquear al usuario
    } finally {
      setRestocking(null);
    }
  }, []);

  // Filtrar inventario
  const filtered = (inventory || []).filter((item: InventoryItem) => {
    if (statusFilter !== "all" && item.status !== statusFilter) return false;
    if (search && !item.name.toLowerCase().includes(search.toLowerCase()) && !item.sku.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // Contadores por status
  const counts = {
    all:      (inventory || []).length,
    critical: (inventory || []).filter((i: InventoryItem) => i.status === "critical").length,
    warning:  (inventory || []).filter((i: InventoryItem) => i.status === "warning").length,
    out:      (inventory || []).filter((i: InventoryItem) => i.status === "out").length,
    ok:       (inventory || []).filter((i: InventoryItem) => i.status === "ok").length,
  };

  return (
    <div className="px-4 md:px-6 py-6">
      {/* ── Header ──────────────────────────────────────────────── */}
      <header className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#22C55E]/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-[#22C55E] text-lg">warehouse</span>
          </div>
          <div>
            <h1 className="text-2xl font-headline font-bold text-[#E8EAF0]">Inventario Central</h1>
            <p className="text-[11px] text-[#8DA4C4]">Monitoreo de Stock & Desplazamiento</p>
          </div>
        </div>

        {/* Toggle movimientos */}
        <button
          onClick={() => setShowMovements(o => !o)}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider
            transition-all duration-200
            ${showMovements
              ? "bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/20"
              : "bg-white/[0.04] text-[#8DA4C4] hover:text-[#E8EAF0]"
            }
          `}
        >
          <span className="material-symbols-outlined text-sm">history</span>
          Movimientos
        </button>
      </header>

      {/* ── KPIs rápidos ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {[
          { label: "Total SKUs", value: counts.all, color: "#E8EAF0" },
          { label: "Críticos", value: counts.critical + counts.out, color: "#EF4444" },
          { label: "Preventivos", value: counts.warning, color: "#F59E0B" },
          { label: "Saludables", value: counts.ok, color: "#22C55E" },
        ].map(kpi => (
          <div key={kpi.label} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 text-center">
            <p className="text-[9px] text-[#8DA4C4] uppercase tracking-wider mb-1">{kpi.label}</p>
            <p className="text-xl font-headline font-bold" style={{ color: kpi.color }}>{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-5">
        {/* ── Tabla principal ─────────────────────────────────────── */}
        <div className={`${showMovements ? "flex-1" : "w-full"} transition-all`}>
          {/* Filtros */}
          <div className="flex items-center gap-3 mb-4">
            {/* Búsqueda */}
            <div className="flex-1 max-w-xs relative">
              <span className="material-symbols-outlined text-sm text-[#506584] absolute left-3 top-1/2 -translate-y-1/2">search</span>
              <input
                type="text"
                placeholder="Buscar SKU o producto..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="
                  w-full bg-white/[0.03] border border-white/[0.08] rounded-lg
                  pl-9 pr-3 py-2 text-[12px] text-[#E8EAF0]
                  placeholder:text-[#506584]
                  focus:border-[#A8E63D]/30 focus:outline-none
                "
              />
            </div>

            {/* Filtros por estado */}
            <div className="flex gap-1">
              {FILTER_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setStatusFilter(opt.value)}
                  className={`
                    px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider
                    transition-all duration-200
                    ${statusFilter === opt.value
                      ? "bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/20"
                      : "bg-white/[0.03] text-[#8DA4C4] hover:text-[#E8EAF0] border border-transparent"
                    }
                  `}
                >
                  {opt.label}
                  <span className="ml-1 text-[#506584]">{counts[opt.value]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tabla */}
          <div className="bg-white/[0.02] rounded-2xl border border-white/[0.04] overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                  <th className="px-5 py-3 text-[10px] font-bold text-[#8DA4C4] uppercase tracking-wider">Producto / SKU</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-[#8DA4C4] uppercase tracking-wider text-center">Stock</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-[#8DA4C4] uppercase tracking-wider">Proyección</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-[#8DA4C4] uppercase tracking-wider">Estado</th>
                  {canRestock && (
                    <th className="px-5 py-3 text-[10px] font-bold text-[#8DA4C4] uppercase tracking-wider">Acción</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {isLoading ? (
                  [1, 2, 3, 4, 5].map(i => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-5 py-4"><div className="h-4 bg-white/[0.04] rounded w-3/4" /></td>
                      <td className="px-5 py-4"><div className="h-4 bg-white/[0.04] rounded w-1/2 mx-auto" /></td>
                      <td className="px-5 py-4"><div className="h-4 bg-white/[0.04] rounded w-2/3" /></td>
                      <td className="px-5 py-4"><div className="h-4 bg-white/[0.04] rounded w-1/3" /></td>
                      {canRestock && <td className="px-5 py-4" />}
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={canRestock ? 5 : 4} className="px-5 py-12 text-center text-[#8DA4C4] text-[12px]">
                      {search || statusFilter !== "all" ? "Sin resultados para este filtro" : "Sin datos de inventario"}
                    </td>
                  </tr>
                ) : (
                  filtered.map((item: InventoryItem) => {
                    const cfg = STATUS_CONFIG[item.status];
                    const isOut = item.stock === 0;
                    const barPct = isOut ? 100 : Math.min(Math.max((item.days_remaining / 30) * 100, 0), 100);
                    const needsRestock = item.status === "critical" || item.status === "out";

                    return (
                      <tr key={item.sku} className="hover:bg-white/[0.03] transition-colors group">
                        <td className="px-5 py-4">
                          <p className="text-[12px] font-bold text-[#E8EAF0] group-hover:text-[#A8E63D] transition-colors">{item.name}</p>
                          <p className="text-[10px] text-[#8DA4C4] font-mono mt-0.5">{item.sku}</p>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span className={`text-sm font-bold font-headline ${isOut ? "text-[#EF4444]" : ""}`}>{item.stock}</span>
                          <p className="text-[8px] text-[#8DA4C4] uppercase">uds</p>
                        </td>
                        <td className="px-5 py-4">
                          {isOut ? (
                            <span className="text-[10px] text-[#EF4444] font-bold uppercase tracking-widest">SIN STOCK</span>
                          ) : (
                            <div className="flex items-center gap-3">
                              <div className="flex-1 h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all duration-1000"
                                  style={{ width: `${barPct}%`, backgroundColor: cfg.color }}
                                />
                              </div>
                              <span className="text-[11px] font-bold font-headline text-[#E8EAF0] w-8">
                                {item.days_remaining === 999 ? "∞" : item.days_remaining}d
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cfg.color }} />
                            <span className="text-[10px] font-bold" style={{ color: cfg.color }}>{cfg.label}</span>
                          </div>
                        </td>
                        {canRestock && (
                          <td className="px-5 py-4">
                            {needsRestock && (
                              <button
                                onClick={() => handleRestock(item.sku)}
                                disabled={restocking === item.sku}
                                className="
                                  flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                                  text-[10px] font-bold uppercase tracking-wider
                                  bg-white/[0.04] text-[#8DA4C4]
                                  hover:bg-[#A8E63D]/10 hover:text-[#A8E63D]
                                  border border-white/[0.06] hover:border-[#A8E63D]/20
                                  disabled:opacity-40
                                  transition-all duration-200
                                "
                              >
                                <span className={`material-symbols-outlined text-sm ${restocking === item.sku ? "animate-spin" : ""}`}>
                                  {restocking === item.sku ? "sync" : "add_shopping_cart"}
                                </span>
                                Crear OC
                              </button>
                            )}
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

        {/* ── Panel lateral: Movimientos recientes ─────────────────── */}
        {showMovements && (
          <div className="w-[320px] flex-shrink-0 bg-white/[0.02] border border-white/[0.04] rounded-2xl overflow-hidden flex flex-col animate-in">
            <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
              <h3 className="text-[11px] font-bold text-[#E8EAF0] uppercase tracking-wider">Movimientos Recientes</h3>
              <button onClick={() => setShowMovements(false)} className="text-[#8DA4C4] hover:text-[#E8EAF0]">
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {movementsLoading ? (
                [1, 2, 3, 4].map(i => <div key={i} className="h-14 bg-white/[0.04] rounded-lg animate-pulse" />)
              ) : movements.length === 0 ? (
                <p className="text-center text-[#8DA4C4] text-[11px] py-8">Sin movimientos registrados</p>
              ) : (
                movements.map(mov => {
                  const mCfg = MOVEMENT_CONFIG[mov.type] || MOVEMENT_CONFIG.ajuste;
                  return (
                    <div key={mov.id} className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/[0.04]">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${mCfg.color}15` }}
                      >
                        <span className="material-symbols-outlined text-sm" style={{ color: mCfg.color }}>{mCfg.icon}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-bold text-[#E8EAF0] truncate">{mov.product_name || mov.sku}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[9px] font-bold" style={{ color: mCfg.color }}>
                            {mov.type === "entrada" ? "+" : mov.type === "salida" ? "−" : "±"}{mov.quantity}
                          </span>
                          <span className="text-[9px] text-[#506584]">{mCfg.label}</span>
                        </div>
                      </div>
                      <span className="text-[9px] text-[#506584] flex-shrink-0">
                        {new Date(mov.created_at).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
