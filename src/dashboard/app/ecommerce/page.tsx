"use client";

import { MLFeed } from "@/components/ecommerce/MLFeed";
import { ApprovalQueue } from "@/components/ApprovalQueue";

export default function EcommercePage() {
  return (
    <div className="px-4 md:px-8 py-6 max-w-screen-2xl mx-auto space-y-6">

      {/* ── Module header ──────────────────────────────────────────── */}
      <header>
        <h1 className="font-headline text-4xl font-bold tracking-tight text-on-surface leading-none mb-2">
          Ecommerce
        </h1>
        <p className="text-on-surface-variant font-body mb-4">
          ML · Amazon · Shopify — Live Feed
        </p>
        {/* Platform status chips */}
        <div className="flex flex-wrap gap-2">
          {(["ML", "Amazon", "Shopify"] as const).map((p) => (
            <span key={p} className="chip-active">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-container animate-pulse" aria-hidden="true" />
              {p} ACTIVO
            </span>
          ))}
        </div>
      </header>

      {/* ── KPI row — platform breakdown ──────────────────────────── */}
      <section className="grid grid-cols-3 gap-4 md:gap-6" aria-label="KPIs por plataforma">
        {/* ML */}
        <div className="kpi-card kpi-accent-secondary">
          <p className="label-sm text-on-surface-variant mb-2">Órdenes ML hoy</p>
          <p className="text-3xl font-bold font-headline text-on-surface">24</p>
          <div className="flex items-center gap-2 mt-3">
            <span className="w-1.5 h-1.5 rounded-full bg-[#ffe600] animate-pulse flex-shrink-0" aria-hidden="true" />
            <span className="label-sm text-[#ffe600]">CORTE 9:00 AM</span>
          </div>
        </div>
        {/* Amazon */}
        <div className="kpi-card kpi-accent-primary">
          <p className="label-sm text-on-surface-variant mb-2">Órdenes Amazon</p>
          <p className="text-3xl font-bold font-headline text-on-surface">8</p>
          <div className="flex items-center gap-1 mt-3">
            <span className="material-symbols-outlined text-xs text-primary-container" aria-hidden="true">bolt</span>
            <span className="label-sm text-primary-container">2 SAME-DAY</span>
          </div>
        </div>
        {/* Shopify */}
        <div className="kpi-card kpi-accent-outline">
          <p className="label-sm text-on-surface-variant mb-2">Órdenes Shopify</p>
          <p className="text-3xl font-bold font-headline text-on-surface">5</p>
          <div className="flex items-center gap-1 mt-3">
            <span className="material-symbols-outlined text-xs text-on-surface-variant" aria-hidden="true">local_shipping</span>
            <span className="label-sm text-on-surface-variant">3 GUÍAS PENDIENTES</span>
          </div>
        </div>
      </section>

      {/* ── Alertas Operativas ────────────────────────────────────── */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Por Surtir */}
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
          <p className="text-xs text-on-surface-variant uppercase tracking-wider mb-1">Por Surtir</p>
          <p className="text-2xl font-bold text-amber-400">7</p>
        </div>
        {/* En Camino */}
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
          <p className="text-xs text-on-surface-variant uppercase tracking-wider mb-1">En Camino</p>
          <p className="text-2xl font-bold text-purple-400">23</p>
        </div>
        {/* Entregados */}
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
          <p className="text-xs text-on-surface-variant uppercase tracking-wider mb-1">Entregados Hoy</p>
          <p className="text-2xl font-bold text-green-400">12</p>
        </div>
        {/* Cancelados */}
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
          <p className="text-xs text-on-surface-variant uppercase tracking-wider mb-1">Cancelados</p>
          <p className="text-2xl font-bold text-red-400">2</p>
        </div>
      </section>

      {/* ── Acciones Pendientes ────────────────────────────────────── */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Preguntas sin responder */}
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <span className="material-symbols-outlined text-amber-400">question_answer</span>
            <h3 className="font-bold text-on-surface">Preguntas Pendientes</h3>
          </div>
          <p className="text-3xl font-bold text-amber-400 mb-2">14</p>
          <p className="text-xs text-on-surface-variant">Mercado Libre: 8 · Amazon: 4 · Shopify: 2</p>
          <button className="mt-4 w-full py-2 bg-amber-400/10 text-amber-400 rounded-lg text-sm font-bold hover:bg-amber-400/20 transition-all">
            Ver todas las preguntas
          </button>
        </div>

        {/* Ajustes de Precio */}
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <span className="material-symbols-outlined text-blue-400">price_change</span>
            <h3 className="font-bold text-on-surface">Ajustes de Precio</h3>
          </div>
          <p className="text-3xl font-bold text-blue-400 mb-2">7</p>
          <p className="text-xs text-on-surface-variant">Agentes recomendaron ajustes de precio para optimizar ventas</p>
          <button className="mt-4 w-full py-2 bg-blue-400/10 text-blue-400 rounded-lg text-sm font-bold hover:bg-blue-400/20 transition-all">
            Revisar sugerencias
          </button>
        </div>

        {/* Alertas de Stock */}
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <span className="material-symbols-outlined text-red-400">inventory_2</span>
            <h3 className="font-bold text-on-surface">Alertas de Stock</h3>
          </div>
          <p className="text-3xl font-bold text-red-400 mb-2">4</p>
          <p className="text-xs text-on-surface-variant">SKUs bajo nivel mínimo de stock</p>
          <button className="mt-4 w-full py-2 bg-red-400/10 text-red-400 rounded-lg text-sm font-bold hover:bg-red-400/20 transition-all">
            Ver alertas
          </button>
        </div>
      </section>

      {/* ── Main grid: Feed (8) + Approval (4) ────────────────────── */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6" aria-label="Feed principal">
        <div className="lg:col-span-8">
          <MLFeed />
        </div>
        <div className="lg:col-span-4">
          <ApprovalQueue />
        </div>
      </section>

      {/* ── Amazon FBA ─────────────────────────────────────────────── */}
      <section className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-on-surface">Amazon FBA</h3>
          <span className="text-xs text-green-400">🟢 Full Activo</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-on-surface-variant mb-1">Unidades en FBA</p>
            <p className="text-xl font-bold text-on-surface">1,247</p>
          </div>
          <div>
            <p className="text-xs text-on-surface-variant mb-1">En Tránsito</p>
            <p className="text-xl font-bold text-on-surface">342</p>
          </div>
          <div>
            <p className="text-xs text-on-surface-variant mb-1">Órdenes Pendientes</p>
            <p className="text-xl font-bold text-on-surface">12</p>
          </div>
          <div>
            <p className="text-xs text-on-surface-variant mb-1">Rotación</p>
            <p className="text-xl font-bold text-on-surface">17 días</p>
          </div>
        </div>
      </section>

    </div>
  );
}