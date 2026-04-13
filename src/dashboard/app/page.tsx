"use client";

import useSWR from "swr";
import { KpiCard } from "@/components/KpiCard";
import { AgentsFeed } from "@/components/AgentsFeed";
import { useKPIs } from "@/hooks/useKPIs";
import { useInventory } from "@/hooks/useInventory";
import { useLeads } from "@/hooks/useLeads";
import { usePurchaseOrders } from "@/hooks/usePurchaseOrders";
import type { Order, DashboardKPIs, InventoryItem, Lead, PurchaseOrder } from "@/types";

// ──────────────────────────────────────────────────────────────────────────────
// Fetcher
// ──────────────────────────────────────────────────────────────────────────────
const fetcher = (url: string) => fetch(url).then((r) => r.json());

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    critical:         { bg: "bg-red-500/10",    text: "text-red-400",    label: "Crítico" },
    warning:          { bg: "bg-amber-500/10",  text: "text-amber-400",  label: "Bajo" },
    negotiating:      { bg: "bg-blue-500/10",   text: "text-blue-400",   label: "Negociando" },
    quote_sent:       { bg: "bg-purple-500/10", text: "text-purple-400", label: "Cotización" },
    contacted:        { bg: "bg-cyan-500/10",   text: "text-cyan-400",   label: "Contactado" },
    new:              { bg: "bg-green-500/10",  text: "text-green-400",  label: "Nuevo" },
    won:              { bg: "bg-emerald-500/10",text: "text-emerald-400",label: "Ganado" },
    lost:             { bg: "bg-gray-500/10",   text: "text-gray-400",   label: "Perdido" },
    PENDING_APPROVAL: { bg: "bg-amber-500/10",  text: "text-amber-400",  label: "Pendiente" },
    DRAFT:            { bg: "bg-gray-500/10",   text: "text-gray-400",   label: "Borrador" },
    APPROVED:         { bg: "bg-green-500/10",  text: "text-green-400",  label: "Aprobado" },
    REJECTED:         { bg: "bg-red-500/10",    text: "text-red-400",    label: "Rechazado" },
    RECEIVED:         { bg: "bg-blue-500/10",   text: "text-blue-400",   label: "Recibido" },
  };
  const c = config[status] || { bg: "bg-gray-500/10", text: "text-gray-400", label: status };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${c.bg} ${c.text}`}
    >
      {c.label}
    </span>
  );
}

function SectionHeader({
  title,
  icon,
  color,
  count,
  href,
}: {
  title: string;
  icon: string;
  color: string;
  count?: number;
  href?: string;
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${color}15` }}
        >
          <span className="material-symbols-outlined text-lg" style={{ color }} aria-hidden="true">
            {icon}
          </span>
        </div>
        <h2 className="text-base font-headline font-bold text-on-surface">{title}</h2>
        {count !== undefined && (
          <span className="text-[10px] font-bold text-on-surface-variant bg-white/[0.06] px-2 py-0.5 rounded-md">
            {count}
          </span>
        )}
      </div>
      {href && (
        <a
          href={href}
          className="text-[11px] font-bold text-on-surface-variant hover:text-on-surface transition-colors uppercase tracking-wider"
        >
          Ver todo →
        </a>
      )}
    </div>
  );
}

function SkeletonRow({ cols = 1 }: { cols?: number }) {
  return (
    <div className={`grid gap-3 animate-pulse`} style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
      {Array.from({ length: cols }).map((_, i) => (
        <div key={i} className="h-6 rounded-md bg-white/[0.06]" />
      ))}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Ecommerce Platform breakdown (inline SWR — today's orders aggregated by platform)
// ──────────────────────────────────────────────────────────────────────────────
const PLATFORM_META: Record<string, { label: string; icon: string; color: string }> = {
  ml:      { label: "Mercado Libre", icon: "shopping_bag",   color: "#FFE600" },
  amazon:  { label: "Amazon",        icon: "inventory_2",    color: "#FF9900" },
  shopify: { label: "Shopify",       icon: "shopping_cart",  color: "#96BF48" },
  b2b:     { label: "B2B",           icon: "handshake",      color: "#60A5FA" },
};

function EcommerceSection() {
  const { data, isLoading } = useSWR<{ orders: Order[]; pagination: { total: number } }>(
    "/api/ecommerce/orders?date=today&limit=1000",
    fetcher,
    { refreshInterval: 60_000 }
  );

  // Aggregate by platform
  type PlatformAgg = { orders: number; revenue: number };
  const byPlatform: Record<string, PlatformAgg> = {};
  if (data?.orders) {
    for (const o of data.orders) {
      const p = o.platform;
      if (!byPlatform[p]) byPlatform[p] = { orders: 0, revenue: 0 };
      byPlatform[p].orders += 1;
      byPlatform[p].revenue += o.total || 0;
    }
  }

  const platforms = Object.keys(PLATFORM_META);
  const maxOrders = Math.max(...platforms.map((p) => byPlatform[p]?.orders ?? 0), 1);

  return (
    <section aria-label="Ecommerce">
      <SectionHeader title="Ecommerce — Ventas del día" icon="storefront" color="#3B82F6" href="/ecommerce" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5 animate-pulse h-36" />
            ))
          : platforms.filter((p) => byPlatform[p]?.orders).map((p) => {
              const meta = PLATFORM_META[p];
              const agg = byPlatform[p];
              return (
                <div
                  key={p}
                  className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5 hover:bg-white/[0.05] hover:border-white/[0.1] transition-all duration-200"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${meta.color}18` }}
                      >
                        <span className="material-symbols-outlined text-base" style={{ color: meta.color }}>
                          {meta.icon}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-on-surface">{meta.label}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] text-on-surface-variant uppercase tracking-wider mb-1">Órdenes</p>
                      <p className="text-2xl font-headline font-bold text-on-surface">
                        {agg.orders.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-on-surface-variant uppercase tracking-wider mb-1">Ingresos</p>
                      <p className="text-2xl font-headline font-bold text-on-surface">
                        ${agg.revenue.toLocaleString("es-MX", { maximumFractionDigits: 0 })}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 h-1 w-full bg-white/[0.04] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${(agg.orders / maxOrders) * 100}%`,
                        backgroundColor: meta.color,
                        boxShadow: `0 0 8px ${meta.color}40`,
                      }}
                    />
                  </div>
                </div>
              );
            })}

        {/* Empty state when no orders today */}
        {!isLoading && Object.keys(byPlatform).length === 0 && (
          <div className="md:col-span-3 bg-white/[0.03] border border-white/[0.06] rounded-xl p-8 text-center text-on-surface-variant text-sm">
            Sin órdenes registradas hoy
          </div>
        )}
      </div>
    </section>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Page
// ──────────────────────────────────────────────────────────────────────────────
export default function HomePage() {
  const { kpis, isLoading: kpisLoading } = useKPIs();
  const { inventory, isLoading: invLoading } = useInventory();
  const { leads, isLoading: leadsLoading } = useLeads();
  const { purchaseOrders, isLoading: posLoading } = usePurchaseOrders();

  // Derive critical/warning SKUs sorted by days remaining
  const criticalSkus: InventoryItem[] = inventory
    .filter((i) => i.status === "critical" || i.status === "warning")
    .sort((a, b) => a.days_remaining - b.days_remaining)
    .slice(0, 5);

  // Top leads by score
  const topLeads: Lead[] = [...leads].sort((a, b) => b.score - a.score).slice(0, 5);

  // Pending purchase orders
  const pendingPOs: PurchaseOrder[] = (purchaseOrders as PurchaseOrder[])
    .filter((po) => po.status === "PENDING_APPROVAL" || po.status === "DRAFT")
    .slice(0, 4);

  // Format helpers
  const fmtRevenue = (v?: number) =>
    v !== undefined ? `$${v.toLocaleString("es-MX", { maximumFractionDigits: 0 })}` : "—";
  const fmtCount = (v?: number) =>
    v !== undefined ? v.toString().padStart(2, "0") : "—";

  return (
    <div className="px-4 md:px-8 py-6 max-w-screen-2xl mx-auto space-y-8">

      {/* ── Top KPI Row ──────────────────────────────────────────── */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4" aria-label="KPIs del día">
        <KpiCard
          label="Órdenes del día"
          value={kpisLoading ? "…" : (kpis?.orders_today?.toLocaleString() ?? "—")}
          trend="Hoy"
          trendIcon="trending_up"
          trendColor="primary"
          accent="primary"
        />
        <KpiCard
          label="Ventas totales"
          value={kpisLoading ? "…" : fmtRevenue(kpis?.revenue_today)}
          trend="Hoy"
          trendIcon="payments"
          trendColor="outline"
          accent="secondary"
        />
        <KpiCard
          label="Alertas críticas"
          value={kpisLoading ? "…" : fmtCount(kpis?.critical_stock_count)}
          trend={kpis?.critical_stock_count ? "Acción requerida" : "Todo en orden"}
          trendIcon={kpis?.critical_stock_count ? "warning" : "check_circle"}
          trendColor={kpis?.critical_stock_count ? "error" : "primary"}
          accent="error"
        />
        <KpiCard
          label="Agentes activos"
          value={kpisLoading ? "…" : `${kpis?.active_agents ?? "—"}/43`}
          trend="Todos los sistemas OK"
          trendIcon="bolt"
          trendColor="primary"
          accent="outline"
        />
      </section>

      {/* ═══════════════════════════════════════════════════════════
          SECCIÓN: ECOMMERCE — Ventas por plataforma
          ═══════════════════════════════════════════════════════════ */}
      <EcommerceSection />

      {/* ═══════════════════════════════════════════════════════════
          SECCIÓN: ERP — Inventario crítico + CFDI + Compras
          ═══════════════════════════════════════════════════════════ */}
      <section aria-label="ERP">
        <SectionHeader title="ERP — Operaciones" icon="account_tree" color="#22C55E" href="/erp" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* SKUs Críticos — 5 cols */}
          <div className="lg:col-span-5 bg-white/[0.03] border border-white/[0.06] rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-headline font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-red-400 text-base" aria-hidden="true">
                  warning
                </span>
                SKUs Críticos
              </h3>
              {!invLoading && (
                <span className="text-[10px] font-bold text-red-400 bg-red-400/10 px-2 py-0.5 rounded-md">
                  {criticalSkus.filter((s) => s.status === "critical").length} urgentes
                </span>
              )}
            </div>

            {invLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-12 rounded-lg bg-white/[0.04] animate-pulse" />
                ))}
              </div>
            ) : criticalSkus.length === 0 ? (
              <p className="text-sm text-on-surface-variant text-center py-6">Sin alertas de inventario</p>
            ) : (
              <div className="space-y-2">
                {criticalSkus.map((item) => (
                  <div
                    key={item.sku}
                    className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-white/[0.04] transition-colors border-l-2"
                    style={{ borderLeftColor: item.status === "critical" ? "#ef4444" : "#f59e0b" }}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-on-surface truncate">{item.name}</p>
                      <p className="text-[10px] text-on-surface-variant">{item.sku}</p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="text-right">
                        <p className="text-sm font-bold text-on-surface">{item.stock}</p>
                        <p className="text-[10px] text-on-surface-variant">{item.days_remaining.toFixed(1)}d</p>
                      </div>
                      <StatusBadge status={item.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* CFDI pendientes — 3 cols */}
          <div className="lg:col-span-3 bg-white/[0.03] border border-white/[0.06] rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-green-400 text-base" aria-hidden="true">
                description
              </span>
              <h3 className="text-sm font-headline font-bold text-on-surface">CFDI Pendientes</h3>
            </div>

            <div className="space-y-4">
              <div className="text-center py-4">
                {kpisLoading ? (
                  <div className="h-12 w-16 mx-auto rounded-lg bg-white/[0.06] animate-pulse" />
                ) : (
                  <>
                    <p className="text-4xl font-headline font-bold text-on-surface">
                      {kpis?.cfdi_pending ?? "—"}
                    </p>
                    <p className="text-[10px] text-on-surface-variant uppercase tracking-wider mt-1">
                      Por timbrar
                    </p>
                  </>
                )}
              </div>

              <div className="flex items-center justify-between text-[11px] pt-2 border-t border-white/[0.06]">
                <span className="text-on-surface-variant">Ver detalle</span>
                <a href="/erp/cfdi" className="text-[#A8E63D] font-bold hover:underline">
                  Ir a CFDI →
                </a>
              </div>
            </div>
          </div>

          {/* Compras pendientes — 4 cols */}
          <div className="lg:col-span-4 bg-white/[0.03] border border-white/[0.06] rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-headline font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-400 text-base" aria-hidden="true">
                  shopping_basket
                </span>
                Compras Pendientes
              </h3>
              {!posLoading && (
                <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-md">
                  {pendingPOs.length} órdenes
                </span>
              )}
            </div>

            {posLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-20 rounded-lg bg-white/[0.04] animate-pulse" />
                ))}
              </div>
            ) : pendingPOs.length === 0 ? (
              <p className="text-sm text-on-surface-variant text-center py-6">Sin compras pendientes</p>
            ) : (
              <div className="space-y-3">
                {pendingPOs.map((po) => (
                  <div
                    key={po.po_id}
                    className="bg-white/[0.03] rounded-lg p-3.5 hover:bg-white/[0.06] transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono font-bold text-on-surface">{po.po_id}</span>
                      <StatusBadge status={po.status} />
                    </div>
                    <p className="text-sm text-on-surface-variant truncate">{po.supplier}</p>
                    <div className="flex items-center justify-between mt-2 text-[11px]">
                      <span className="text-on-surface-variant">{po.items.length} artículos</span>
                      <span className="text-on-surface font-bold">
                        ${po.total.toLocaleString("es-MX", { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          SECCIÓN: CRM — Pipeline de leads
          ═══════════════════════════════════════════════════════════ */}
      <section aria-label="CRM">
        <SectionHeader
          title="CRM — Pipeline"
          icon="group"
          color="#F59E0B"
          count={leadsLoading ? undefined : topLeads.length}
          href="/crm"
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Leads table — 8 cols */}
          <div className="lg:col-span-8 bg-white/[0.03] border border-white/[0.06] rounded-xl overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-12 gap-2 px-5 py-3 border-b border-white/[0.06] text-[10px] text-on-surface-variant uppercase tracking-wider font-bold">
              <span className="col-span-4">Lead</span>
              <span className="col-span-2 text-center">Score</span>
              <span className="col-span-2 text-center">Estado</span>
              <span className="col-span-2 text-center">Valor</span>
              <span className="col-span-2 text-center">Canal</span>
            </div>

            {leadsLoading ? (
              <div className="p-5 space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-10 rounded-lg bg-white/[0.04] animate-pulse" />
                ))}
              </div>
            ) : topLeads.length === 0 ? (
              <p className="text-sm text-on-surface-variant text-center py-8">Sin leads activos</p>
            ) : (
              topLeads.map((lead) => (
                <div
                  key={lead.lead_id}
                  className="grid grid-cols-12 gap-2 items-center px-5 py-3.5 border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors"
                >
                  <div className="col-span-4">
                    <p className="text-sm text-on-surface font-medium truncate">{lead.name}</p>
                    {lead.company && (
                      <p className="text-[10px] text-on-surface-variant truncate">{lead.company}</p>
                    )}
                  </div>
                  <div className="col-span-2 text-center">
                    <span
                      className={`inline-flex items-center justify-center w-10 h-6 rounded-md text-[11px] font-bold
                        ${lead.score >= 80 ? "bg-green-500/10 text-green-400"
                          : lead.score >= 60 ? "bg-amber-500/10 text-amber-400"
                          : "bg-gray-500/10 text-gray-400"}`}
                    >
                      {lead.score}
                    </span>
                  </div>
                  <div className="col-span-2 text-center">
                    <StatusBadge status={lead.deal_stage} />
                  </div>
                  <div className="col-span-2 text-center text-sm text-on-surface font-medium">
                    {lead.value !== undefined
                      ? `$${lead.value.toLocaleString("es-MX", { maximumFractionDigits: 0 })}`
                      : "—"}
                  </div>
                  <div className="col-span-2 text-center text-[11px] text-on-surface-variant">
                    {lead.channel}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Agents Feed — 4 cols */}
          <div className="lg:col-span-4">
            <AgentsFeed />
          </div>
        </div>
      </section>
    </div>
  );
}
