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

      {/* ── Main grid: Feed (8) + Approval (4) ────────────────────── */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6" aria-label="Feed principal">
        <div className="lg:col-span-8">
          <MLFeed />
        </div>
        <div className="lg:col-span-4">
          <ApprovalQueue />
        </div>
      </section>

    </div>
  );
}
