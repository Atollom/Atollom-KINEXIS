// src/dashboard/lib/samantha-tools.ts
// Extracted Samantha tool handlers — pure functions for testability.
// Each handler receives the Supabase client + auth context to enforce tenant isolation.
import { SupabaseClient } from "@supabase/supabase-js";
import { TenantUser } from "../types";

// ── get_today_sales ───────────────────────────────────────────────────────────
// Returns real order count and revenue for today in CDMX timezone.
export async function getTodaySales(
  supabase: SupabaseClient,
  auth: TenantUser
): Promise<string> {
  const cdmxStr = new Date().toLocaleString("en-US", { timeZone: "America/Mexico_City" });
  const cdmxDate = new Date(cdmxStr);
  const y = cdmxDate.getFullYear();
  const m = String(cdmxDate.getMonth() + 1).padStart(2, "0");
  const d = String(cdmxDate.getDate()).padStart(2, "0");
  const dateStr = `${y}-${m}-${d}`;

  const { data, error } = await supabase
    .from("orders")
    .select("total, status, platform")
    .eq("tenant_id", auth.tenant_id)
    .gte("created_at", `${dateStr}T00:00:00Z`)
    .lte("created_at", `${dateStr}T23:59:59Z`)
    .not("status", "in", '("cancelled","returned")');

  if (error) {
    return JSON.stringify({ error: "No se pudo obtener datos de ventas" });
  }

  const orders = data || [];
  const total_revenue = orders.reduce((sum, o) => sum + Number(o.total || 0), 0);

  // Determine top platform by order count
  const platformCounts: Record<string, number> = {};
  for (const o of orders) {
    if (o.platform) platformCounts[o.platform] = (platformCounts[o.platform] || 0) + 1;
  }
  const top_platform = Object.entries(platformCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";

  return JSON.stringify({
    sales_count: orders.length,
    total_revenue: Math.round(total_revenue * 100) / 100,
    top_platform,
    date: dateStr,
  });
}

// ── get_order_status ──────────────────────────────────────────────────────────
// Returns the status of a specific order. Enforces tenant_id to prevent cross-tenant leaks.
export async function getOrderStatus(
  supabase: SupabaseClient,
  auth: TenantUser,
  orderId: string
): Promise<string> {
  const { data, error } = await supabase
    .from("orders")
    .select("id, status, carrier, platform, total, created_at")
    .eq("tenant_id", auth.tenant_id)
    .eq("id", orderId)
    .single();

  if (error || !data) {
    return JSON.stringify({ error: `Orden ${orderId} no encontrada` });
  }

  return JSON.stringify({
    order_id: data.id,
    status: data.status,
    carrier: data.carrier || "N/A",
    platform: data.platform || "N/A",
    total: data.total,
  });
}

// ── get_critical_inventory ────────────────────────────────────────────────────
// Returns SKUs at critical stock level for this tenant.
export async function getCriticalInventory(
  supabase: SupabaseClient,
  auth: TenantUser
): Promise<string> {
  // Read tenant threshold (default 7 days)
  const { data: rules } = await supabase
    .from("tenant_business_rules")
    .select("stock_critical_days")
    .eq("tenant_id", auth.tenant_id)
    .single();

  const threshold = rules?.stock_critical_days || 7;

  const { data, error } = await supabase
    .from("inventory")
    .select("sku, product_name, days_remaining, quantity")
    .eq("tenant_id", auth.tenant_id)
    .lte("days_remaining", threshold)
    .order("days_remaining", { ascending: true })
    .limit(20);

  if (error) {
    return JSON.stringify({ error: "No se pudo obtener inventario crítico" });
  }

  const items = (data || []).map((i) => ({
    sku: i.sku,
    name: i.product_name,
    days_remaining: i.days_remaining,
    quantity: i.quantity,
  }));

  return JSON.stringify({
    critical_skus_count: items.length,
    threshold_days: threshold,
    items,
  });
}

// ── generate_weekly_report ────────────────────────────────────────────────────
// Creates a report_requests record; the background worker generates the PDF.
export async function generateWeeklyReport(
  supabase: SupabaseClient,
  auth: TenantUser
): Promise<string> {
  const { error } = await supabase.from("report_requests").insert({
    tenant_id: auth.tenant_id,
    requested_by: auth.id,
    report_type: "weekly_analytics",
    status: "pending",
    created_at: new Date().toISOString(),
  });

  if (error) {
    return JSON.stringify({ status: "error", message: "No se pudo iniciar la generación del reporte" });
  }

  return JSON.stringify({
    status: "success",
    pdf_ready: false,
    message: "Reporte semanal en proceso — te notificaremos cuando esté listo.",
  });
}

// ── escalate_to_human ─────────────────────────────────────────────────────────
// Creates a support ticket and queues a WhatsApp notification for critical priority.
// Uses supabase client directly — no server-to-server HTTP calls that would fail auth.
export async function escalateToHuman(
  supabase: SupabaseClient,
  auth: TenantUser,
  issueSummary: string,
  priority: string
): Promise<string> {
  const { error: ticketError } = await supabase.from("support_tickets").insert({
    tenant_id: auth.tenant_id,
    subject: `[Escalado Samantha] ${issueSummary}`,
    priority,
    status: "open",
    created_at: new Date().toISOString(),
  });

  if (ticketError) {
    return JSON.stringify({ status: "error", message: "No se pudo crear el ticket" });
  }

  // WhatsApp notification only for high/critical — queued via system_notifications
  if (priority === "high" || priority === "critical") {
    await supabase.from("system_notifications").insert({
      recipient_phone: "+525646060947",
      channel: "whatsapp",
      message: `[KINEXIS ALERT] Nuevo ticket de tenant ${auth.tenant_id}: ${issueSummary}`,
      severity: priority === "critical" ? "critical" : "high",
      status: "pending",
      created_at: new Date().toISOString(),
    });
  }

  return JSON.stringify({
    status: "Escalado realizado",
    assigned_to: "Human Team",
    ticket_created: true,
    whatsapp_queued: priority === "high" || priority === "critical",
  });
}
