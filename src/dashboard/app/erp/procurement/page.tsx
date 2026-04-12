// src/dashboard/app/erp/procurement/page.tsx
"use client";

import { usePurchaseOrders } from "@/hooks/usePurchaseOrders";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useEffect, useState } from "react";
import type { PurchaseOrder, UserRole } from "@/types";

/** Compute hours remaining until expiry, CDMX-aware. */
function hoursUntilExpiry(expiresAt: string): number {
  const nowCdmx = new Date(
    new Date().toLocaleString("en-US", { timeZone: "America/Mexico_City" })
  );
  const expiry = new Date(expiresAt);
  return Math.floor((expiry.getTime() - nowCdmx.getTime()) / (1000 * 60 * 60));
}

export default function ProcurementPage() {
  const { purchaseOrders, isLoading, mutate } = usePurchaseOrders();
  const [role, setRole] = useState<UserRole | null>(null);
  const [approving, setApproving] = useState<string | null>(null);
  const [approveError, setApproveError] = useState<string | null>(null);
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

  async function handleApprove(poId: string) {
    setApproving(poId);
    setApproveError(null);
    try {
      const response = await fetch("/api/erp/purchase-orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ po_id: poId, action: "approve" }),
      });
      if (!response.ok) {
        const data = await response.json() as { error?: string };
        throw new Error(data.error ?? "Error al aprobar");
      }
      mutate();
    } catch (err: unknown) {
      setApproveError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setApproving(null);
    }
  }

  // RBAC guard — only owner|admin sees this page
  if (role !== null && !["owner", "admin"].includes(role)) {
    return (
      <div className="p-20 text-center">
        <span className="material-symbols-outlined text-error text-5xl mb-4 block">lock</span>
        <h1 className="text-xl font-bold font-headline text-on-surface">Acceso Restringido</h1>
        <p className="text-on-surface-variant label-sm mt-2">
          Solo personal administrativo puede autorizar Órdenes de Compra
        </p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-headline tracking-tight text-on-surface">Cola de Procura</h1>
        <p className="text-on-surface-variant text-xs uppercase tracking-widest mt-1">
          Autorización de Órdenes de Compra Pendientes
        </p>
      </div>

      {approveError && (
        <p className="chip-error mb-4" role="alert">{approveError}</p>
      )}

      <div className="space-y-4">
        {isLoading ? (
          [1, 2].map(i => <div key={i} className="h-40 bg-surface-container rounded-3xl animate-pulse" />)
        ) : purchaseOrders.length === 0 ? (
          <div className="py-20 text-center glass-panel rounded-3xl border border-dashed border-white/5">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant opacity-20 mb-4 block">fact_check</span>
            <p className="label-sm text-on-surface-variant">Sin órdenes de compra pendientes</p>
          </div>
        ) : (
          (purchaseOrders as PurchaseOrder[]).map((po) => {
            const hoursLeft = hoursUntilExpiry(po.approval_expires_at);
            const isUrgent  = hoursLeft < 6 && hoursLeft >= 0;
            const isExpired = hoursLeft < 0;

            return (
              <div
                key={po.po_id}
                className="glass-panel p-6 rounded-3xl border border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 hover:bg-white/5 transition-all"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="label-sm text-primary-container bg-primary-container/10 px-2 py-0.5 rounded">PENDIENTE</span>
                    <h2 className="text-lg font-bold font-headline text-on-surface truncate">{po.supplier}</h2>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-on-surface-variant font-mono">OC #{po.po_id.split("-")[0].toUpperCase()}</p>
                    <p className="text-xs text-on-surface-variant italic">
                      Concepto: {po.items?.[0]?.name ?? "Suministros"}
                      {po.items?.length > 1 && ` (+${po.items.length - 1} más)`}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-center md:items-end gap-1 px-8 border-x border-white/5">
                  <p className="label-sm text-on-surface-variant">Monto Total</p>
                  <p className="text-3xl font-bold font-headline text-on-surface">
                    ${po.total.toLocaleString("es-MX")}
                  </p>
                </div>

                <div className="flex flex-col items-center gap-4">
                  <div className={`flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-container-lowest ${
                    isExpired ? "text-error" :
                    isUrgent  ? "animate-pulse text-primary-container ring-1 ring-primary-container/30" :
                    "text-on-surface"
                  }`}>
                    <span className="material-symbols-outlined text-sm" aria-hidden="true">schedule</span>
                    <span className="label-sm font-bold">
                      {isExpired ? "EXPIRADO" : `${hoursLeft}H RESTANTES`}
                    </span>
                  </div>

                  <button
                    onClick={() => handleApprove(po.po_id)}
                    disabled={isExpired || approving === po.po_id}
                    className="btn-volt w-full md:w-48 !py-3 !text-xs shadow-[0_0_20px_rgba(202,253,0,0.3)] disabled:opacity-30 disabled:shadow-none flex items-center justify-center gap-2"
                    aria-label={`Aprobar orden de compra ${po.po_id}`}
                  >
                    {approving === po.po_id && (
                      <span className="material-symbols-outlined text-sm animate-spin" aria-hidden="true">sync</span>
                    )}
                    {isExpired ? "NO DISPONIBLE" : approving === po.po_id ? "APROBANDO…" : "APROBAR ORDEN"}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
