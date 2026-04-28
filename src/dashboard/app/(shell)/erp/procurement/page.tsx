// src/dashboard/app/erp/procurement/page.tsx
// Procurement completo: OCs por status + acciones por estado + RBAC
"use client";

import { useCallback, useEffect, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";
import { usePurchaseOrders } from "@/hooks/usePurchaseOrders";
import type { PurchaseOrder, POStatus, UserRole } from "@/types";

// ──────────────────────────────────────────────────────────────────────────────
// Constantes
// ──────────────────────────────────────────────────────────────────────────────
type StatusFilter = "all" | POStatus;

const STATUS_CONFIG: Record<POStatus, { label: string; color: string; icon: string; bg: string }> = {
  DRAFT:             { label: "Borrador",          color: "#8DA4C4", icon: "edit_note",     bg: "bg-slate-500/10" },
  PENDING_APPROVAL:  { label: "Pendiente",         color: "#F59E0B", icon: "hourglass_top", bg: "bg-amber-500/10" },
  APPROVED:          { label: "Aprobada",          color: "#22C55E", icon: "check_circle",  bg: "bg-green-500/10" },
  REJECTED:          { label: "Rechazada",         color: "#EF4444", icon: "cancel",        bg: "bg-red-500/10" },
  RECEIVED:          { label: "Recibida",          color: "#3B82F6", icon: "inventory",     bg: "bg-blue-500/10" },
};

const STATUS_ORDER: POStatus[] = ["PENDING_APPROVAL", "DRAFT", "APPROVED", "RECEIVED", "REJECTED"];

/** Horas restantes hasta expiración (CDMX timezone) */
function hoursUntilExpiry(expiresAt: string): number {
  const nowCdmx = new Date(
    new Date().toLocaleString("en-US", { timeZone: "America/Mexico_City" })
  );
  const expiry = new Date(expiresAt);
  return Math.floor((expiry.getTime() - nowCdmx.getTime()) / (1000 * 60 * 60));
}

// ──────────────────────────────────────────────────────────────────────────────
// Componente principal
// ──────────────────────────────────────────────────────────────────────────────
export default function ProcurementPage() {
  const { purchaseOrders, isLoading, mutate } = usePurchaseOrders();
  const [role, setRole] = useState<UserRole | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const supabase = createBrowserSupabaseClient();

  // Obtener rol del usuario
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

  // RBAC: solo owner/admin/socia ven Procurement
  const canApprove = role === "owner" || role === "socia";
  const canManage = role === "owner" || role === "admin" || role === "socia";

  // Acción genérica sobre OC
  const handleAction = useCallback(async (poId: string, action: string) => {
    setActionLoading(poId);
    setError(null);
    try {
      const res = await fetch("/api/erp/purchase-orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ po_id: poId, action }),
      });
      if (!res.ok) {
        const data = await res.json() as { error?: string };
        throw new Error(data.error ?? "Error en acción");
      }
      mutate();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setActionLoading(null);
    }
  }, [mutate]);

  // Guardia RBAC visual
  if (role !== null && !canManage) {
    return (
      <div className="px-6 py-20 text-center">
        <span className="material-symbols-outlined text-[#EF4444] text-5xl mb-4 block">lock</span>
        <h1 className="text-xl font-bold font-headline text-[color:var(--text-primary)]">Acceso Restringido</h1>
        <p className="text-[color:var(--text-secondary)] text-[12px] mt-2">Solo personal administrativo puede gestionar Órdenes de Compra</p>
      </div>
    );
  }

  // Filtrar OCs
  const orders = (purchaseOrders as PurchaseOrder[]) || [];
  const filtered = orders
    .filter(po => statusFilter === "all" || po.status === statusFilter)
    .sort((a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status));

  // Contadores por status
  const counts: Record<StatusFilter, number> = {
    all: orders.length,
    DRAFT: orders.filter(po => po.status === "DRAFT").length,
    PENDING_APPROVAL: orders.filter(po => po.status === "PENDING_APPROVAL").length,
    APPROVED: orders.filter(po => po.status === "APPROVED").length,
    REJECTED: orders.filter(po => po.status === "REJECTED").length,
    RECEIVED: orders.filter(po => po.status === "RECEIVED").length,
  };

  return (
    <div className="px-4 md:px-6 py-6">
      {/* ── Header ──────────────────────────────────────────────── */}
      <header className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#22C55E]/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-[#22C55E] text-lg">shopping_basket</span>
          </div>
          <div>
            <h1 className="text-2xl font-headline font-bold text-[color:var(--text-primary)]">Órdenes de Compra</h1>
            <p className="text-[11px] text-[color:var(--text-secondary)]">Gestión & Aprobación de Procura</p>
          </div>
        </div>

        {/* KPIs */}
        <div className="hidden md:flex items-center gap-3">
          <div className="bg-[#F59E0B]/10 rounded-xl px-4 py-2 text-center">
            <p className="text-[9px] text-[#F59E0B] uppercase tracking-wider">Pendientes</p>
            <p className="text-lg font-headline font-bold text-[#F59E0B]">{counts.PENDING_APPROVAL}</p>
          </div>
          <div className="bg-white/[0.04] rounded-xl px-4 py-2 text-center">
            <p className="text-[9px] text-[color:var(--text-secondary)] uppercase tracking-wider">Total</p>
            <p className="text-lg font-headline font-bold text-[color:var(--text-primary)]">{counts.all}</p>
          </div>
        </div>
      </header>

      {/* ── Error banner ─────────────────────────────────────────── */}
      {error && (
        <div className="mb-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl px-4 py-2.5 text-[12px] flex items-center justify-between" role="alert">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">error</span>
            {error}
          </div>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      {/* ── Filtros por status ────────────────────────────────────── */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {(["all", ...STATUS_ORDER] as StatusFilter[]).map(s => {
          const cfg = s === "all" ? null : STATUS_CONFIG[s as POStatus];
          const label = s === "all" ? "Todos" : cfg?.label || s;
          const isActive = statusFilter === s;

          return (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider
                whitespace-nowrap transition-all duration-200 border
                ${isActive
                  ? cfg
                    ? `border-[${cfg.color}]/20 text-[${cfg.color}]`
                    : "bg-white/[0.06] text-[color:var(--text-primary)] border-white/[0.08]"
                  : "bg-white/[0.03] text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] border-transparent"
                }
              `}
              style={isActive && cfg ? { color: cfg.color, backgroundColor: `${cfg.color}15`, borderColor: `${cfg.color}30` } : {}}
            >
              {cfg && <span className="material-symbols-outlined text-sm">{cfg.icon}</span>}
              {label}
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                isActive ? "bg-white/[0.1]" : "bg-white/[0.04]"
              }`}>
                {counts[s]}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Lista de órdenes ─────────────────────────────────────── */}
      <div className="space-y-3">
        {isLoading ? (
          [1, 2, 3].map(i => <div key={i} className="h-36 bg-white/[0.04] rounded-2xl animate-pulse" />)
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center bg-white/[0.02] rounded-2xl border border-dashed border-white/[0.06]">
            <span className="material-symbols-outlined text-4xl text-[#506584] mb-3 block opacity-40">fact_check</span>
            <p className="text-[12px] text-[color:var(--text-secondary)]">
              {statusFilter === "all" ? "Sin órdenes de compra" : `Sin órdenes con status "${STATUS_CONFIG[statusFilter as POStatus]?.label}"`}
            </p>
          </div>
        ) : (
          filtered.map((po) => {
            const cfg = STATUS_CONFIG[po.status];
            const hoursLeft = hoursUntilExpiry(po.approval_expires_at);
            const isUrgent = hoursLeft < 6 && hoursLeft >= 0;
            const isExpired = hoursLeft < 0;
            const isProcessing = actionLoading === po.po_id;

            return (
              <div
                key={po.po_id}
                className="bg-white/[0.03] border border-white/[0.04] rounded-2xl p-5 hover:bg-white/[0.04] transition-all"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Info izquierda */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      {/* Badge de estado */}
                      <span
                        className="text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full flex items-center gap-1"
                        style={{ color: cfg.color, backgroundColor: `${cfg.color}15` }}
                      >
                        <span className="material-symbols-outlined text-[12px]">{cfg.icon}</span>
                        {cfg.label}
                      </span>

                      {/* Timer de expiración (solo para PENDING_APPROVAL) */}
                      {po.status === "PENDING_APPROVAL" && (
                        <span className={`text-[10px] font-bold flex items-center gap-1 ${
                          isExpired ? "text-[#EF4444]" :
                          isUrgent ? "text-[#F59E0B] animate-pulse" :
                          "text-[color:var(--text-secondary)]"
                        }`}>
                          <span className="material-symbols-outlined text-sm">schedule</span>
                          {isExpired ? "EXPIRADO" : `${hoursLeft}h restantes`}
                        </span>
                      )}
                    </div>

                    <h2 className="text-sm font-bold text-[color:var(--text-primary)] mb-1">{po.supplier}</h2>
                    <p className="text-[10px] text-[color:var(--text-secondary)] font-mono">OC #{po.po_id.split("-")[0].toUpperCase()}</p>

                    {/* Items */}
                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                      {po.items?.map((item, i) => (
                        <span key={i} className="text-[10px] text-[color:var(--text-secondary)] bg-white/[0.04] px-2 py-0.5 rounded">
                          {item.name} ×{item.qty}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Monto */}
                  <div className="text-center md:text-right md:px-6 md:border-l border-white/[0.06]">
                    <p className="text-[9px] text-[color:var(--text-secondary)] uppercase tracking-wider mb-0.5">Total</p>
                    <p className="text-2xl font-headline font-bold text-[color:var(--text-primary)]">
                      ${po.total.toLocaleString("es-MX")}
                    </p>
                    <p className="text-[9px] text-[#506584] mt-0.5">
                      {new Date(po.created_at).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })}
                    </p>
                  </div>

                  {/* Acciones según estado */}
                  <div className="flex flex-col gap-2 md:ml-4 md:min-w-[160px]">
                    {/* DRAFT → Enviar a aprobación */}
                    {po.status === "DRAFT" && canManage && (
                      <ActionButton
                        label="Enviar a aprobación"
                        icon="send"
                        color="#3B82F6"
                        loading={isProcessing}
                        onClick={() => handleAction(po.po_id, "submit")}
                      />
                    )}

                    {/* PENDING_APPROVAL → Aprobar (solo socias/owner) */}
                    {po.status === "PENDING_APPROVAL" && canApprove && !isExpired && (
                      <>
                        <ActionButton
                          label="Aprobar"
                          icon="check"
                          color="#A8E63D"
                          primary
                          loading={isProcessing}
                          onClick={() => handleAction(po.po_id, "approve")}
                        />
                        <ActionButton
                          label="Rechazar"
                          icon="close"
                          color="#EF4444"
                          loading={isProcessing}
                          onClick={() => handleAction(po.po_id, "reject")}
                        />
                      </>
                    )}

                    {/* APPROVED → Marcar enviada */}
                    {po.status === "APPROVED" && canManage && (
                      <ActionButton
                        label="Marcar enviada"
                        icon="local_shipping"
                        color="#22C55E"
                        loading={isProcessing}
                        onClick={() => handleAction(po.po_id, "mark_sent")}
                      />
                    )}

                    {/* PENDING_APPROVAL expirada */}
                    {po.status === "PENDING_APPROVAL" && isExpired && (
                      <span className="text-[10px] text-[#EF4444] font-bold text-center py-2 bg-red-500/10 rounded-lg">
                        EXPIRADA — No disponible
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Sub-componente: Botón de acción
// ──────────────────────────────────────────────────────────────────────────────
function ActionButton({
  label,
  icon,
  color,
  primary = false,
  loading = false,
  onClick,
}: {
  label: string;
  icon: string;
  color: string;
  primary?: boolean;
  loading?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`
        w-full flex items-center justify-center gap-2
        px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider
        transition-all duration-200
        disabled:opacity-40 disabled:cursor-not-allowed
        ${primary
          ? "text-[#0D1B3E]"
          : "border hover:bg-white/[0.06]"
        }
      `}
      style={primary
        ? { backgroundColor: color, boxShadow: `0 0 12px ${color}30` }
        : { color, borderColor: `${color}30` }
      }
    >
      <span className={`material-symbols-outlined text-sm ${loading ? "animate-spin" : ""}`}>
        {loading ? "sync" : icon}
      </span>
      {loading ? "Procesando…" : label}
    </button>
  );
}
