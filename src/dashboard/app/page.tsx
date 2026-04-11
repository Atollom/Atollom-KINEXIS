import { KpiCard } from "@/components/KpiCard";
import { ApprovalQueue } from "@/components/ApprovalQueue";
import { AgentsFeed } from "@/components/AgentsFeed";
import { SystemMetrics } from "@/components/SystemMetrics";

export default function DashboardPage() {
  return (
    <div className="px-4 md:px-8 py-6 max-w-screen-2xl mx-auto space-y-6">

      {/* ── KPI Row ─────────────────────────────────────────────────── */}
      <section
        className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6"
        aria-label="KPIs del día"
      >
        <KpiCard
          label="Órdenes del día"
          value="1,842"
          trend="+14.2% VS LMT"
          trendIcon="trending_up"
          trendColor="primary"
          accent="primary"
        />
        <KpiCard
          label="Ventas totales"
          value="$42,300"
          trend="14 min tiempo promedio"
          trendIcon="schedule"
          trendColor="outline"
          accent="secondary"
        />
        <KpiCard
          label="Alertas críticas"
          value="09"
          trend="Acción requerida"
          trendIcon="warning"
          trendColor="error"
          accent="error"
        />
        <KpiCard
          label="Agentes activos"
          value="43/43"
          trend="Todos los sistemas OK"
          trendIcon="bolt"
          trendColor="primary"
          accent="outline"
        />
      </section>

      {/* ── Main bento: Approval Queue (8/12) + Agents Feed (4/12) ── */}
      <section
        className="grid grid-cols-1 lg:grid-cols-12 gap-6"
        aria-label="Panel principal"
      >
        {/* Approval Queue — 8 cols */}
        <div className="lg:col-span-8">
          <ApprovalQueue />
        </div>

        {/* Agents Feed — 4 cols */}
        <div className="lg:col-span-4 min-h-[480px] flex flex-col">
          <AgentsFeed />
        </div>
      </section>

      {/* ── System Metrics bar ──────────────────────────────────────── */}
      <section className="grid grid-cols-12">
        <div className="col-span-12">
          <SystemMetrics />
        </div>
      </section>

    </div>
  );
}
