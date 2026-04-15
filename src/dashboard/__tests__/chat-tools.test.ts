// src/dashboard/__tests__/chat-tools.test.ts
// H1 tests for Samantha tool handlers (lib/samantha-tools.ts):
//   Real Supabase queries, tenant isolation, and escalation behavior.
//
// Tests:
//   1. getTodaySales — returns real aggregated sales data
//   2. getTodaySales — enforces tenant_id isolation
//   3. getTodaySales — handles DB error gracefully
//   4. getOrderStatus — returns order with matching tenant_id
//   5. getOrderStatus — returns error when order not found (tenant mismatch)
//   6. getCriticalInventory — returns critical SKUs with correct threshold
//   7. getCriticalInventory — handles DB error gracefully
//   8. generateWeeklyReport — inserts report_requests with correct tenant + user
//   9. generateWeeklyReport — handles DB error gracefully
//  10. escalateToHuman — creates ticket with correct tenant_id
//  11. escalateToHuman — queues WhatsApp for "critical" priority
//  12. escalateToHuman — queues WhatsApp for "high" priority
//  13. escalateToHuman — does NOT queue WhatsApp for "low" priority
//  14. escalateToHuman — does NOT queue WhatsApp for "medium" priority
//  15. escalateToHuman — handles ticket DB error gracefully

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getTodaySales,
  getOrderStatus,
  getCriticalInventory,
  generateWeeklyReport,
  escalateToHuman,
} from "../lib/samantha-tools";

import type { TenantUser } from "../types";

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeAuth(tenantId = "tenant-abc", userId = "user-123"): TenantUser {
  return { id: userId, tenant_id: tenantId, role: "owner", name: "Test", email: "t@t.com" };
}

// Builds a chainable Supabase mock where each call in the chain returns `this`.
// Final `.single()` or termination resolves with `{ data, error }`.
function makeSupabase(opts: {
  selectData?: any;
  selectError?: any;
  insertError?: any;
  insertSpy?: ReturnType<typeof vi.fn>;
  singleData?: any;
  singleError?: any;
} = {}) {
  const {
    selectData = [],
    selectError = null,
    insertError = null,
    insertSpy = vi.fn().mockResolvedValue({ error: insertError }),
    singleData = null,
    singleError = null,
  } = opts;

  const chain: any = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: singleData, error: singleError }),
    // Resolve when awaited directly (for select without .single())
    then: (resolve: any) =>
      resolve({ data: selectData, error: selectError }),
  };

  return {
    from: vi.fn().mockReturnValue(chain),
    _chain: chain,
    _insertSpy: insertSpy,
  };
}

// ── Tests: getTodaySales ──────────────────────────────────────────────────────

describe("getTodaySales", () => {
  it("1. returns aggregated sales data from orders", async () => {
    const orders = [
      { total: 500, status: "shipped", platform: "Mercado Libre" },
      { total: 300, status: "delivered", platform: "Mercado Libre" },
      { total: 200, status: "delivered", platform: "Shopify" },
    ];
    const sb = makeSupabase({ selectData: orders });

    const result = JSON.parse(await getTodaySales(sb as any, makeAuth()));

    expect(result.sales_count).toBe(3);
    expect(result.total_revenue).toBe(1000);
    expect(result.top_platform).toBe("Mercado Libre");
    expect(result.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("2. enforces tenant_id — eq called with auth.tenant_id", async () => {
    const sb = makeSupabase({ selectData: [] });
    await getTodaySales(sb as any, makeAuth("my-tenant"));
    expect(sb.from).toHaveBeenCalledWith("orders");
    expect(sb._chain.eq).toHaveBeenCalledWith("tenant_id", "my-tenant");
  });

  it("3. handles DB error gracefully", async () => {
    const sb = makeSupabase({ selectError: { message: "DB error" } });
    const result = JSON.parse(await getTodaySales(sb as any, makeAuth()));
    expect(result.error).toBeTruthy();
  });
});

// ── Tests: getOrderStatus ─────────────────────────────────────────────────────

describe("getOrderStatus", () => {
  it("4. returns order data for matching tenant", async () => {
    const order = { id: "ORD-1", status: "EN TRANSITO", carrier: "DHL", platform: "MLA", total: 750 };
    const sb = makeSupabase({ singleData: order });

    const result = JSON.parse(await getOrderStatus(sb as any, makeAuth(), "ORD-1"));
    expect(result.order_id).toBe("ORD-1");
    expect(result.status).toBe("EN TRANSITO");
    expect(result.carrier).toBe("DHL");
  });

  it("5. returns error when order not found (enforces tenant isolation)", async () => {
    const sb = makeSupabase({ singleData: null, singleError: { message: "Not found" } });
    const result = JSON.parse(await getOrderStatus(sb as any, makeAuth(), "ORD-99"));
    expect(result.error).toMatch(/ORD-99/);
  });
});

// ── Tests: getCriticalInventory ───────────────────────────────────────────────

describe("getCriticalInventory", () => {
  it("6. returns critical SKUs using tenant threshold", async () => {
    // First call (.single()) returns tenant rules, second call (.then) returns inventory
    const chain: any = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn()
        .mockResolvedValueOnce({ data: { stock_critical_days: 5 }, error: null }) // rules
        .mockResolvedValue({ data: null, error: null }),
      then: (resolve: any) =>
        resolve({
          data: [
            { sku: "SKU-A", product_name: "Producto A", days_remaining: 3, quantity: 2 },
            { sku: "SKU-B", product_name: "Producto B", days_remaining: 5, quantity: 1 },
          ],
          error: null,
        }),
    };
    const sb = { from: vi.fn().mockReturnValue(chain) };

    const result = JSON.parse(await getCriticalInventory(sb as any, makeAuth()));
    expect(result.critical_skus_count).toBe(2);
    expect(result.threshold_days).toBe(5);
    expect(result.items[0].sku).toBe("SKU-A");
  });

  it("7. handles DB error gracefully", async () => {
    const chain: any = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }), // rules fallback
      then: (resolve: any) => resolve({ data: null, error: { message: "DB fail" } }),
    };
    const sb = { from: vi.fn().mockReturnValue(chain) };

    const result = JSON.parse(await getCriticalInventory(sb as any, makeAuth()));
    expect(result.error).toBeTruthy();
  });
});

// ── Tests: generateWeeklyReport ───────────────────────────────────────────────

describe("generateWeeklyReport", () => {
  it("8. inserts report_requests with correct tenant_id and user", async () => {
    const insertSpy = vi.fn().mockResolvedValue({ error: null });
    const chain: any = { insert: insertSpy };
    const sb = { from: vi.fn().mockReturnValue(chain) };
    const auth = makeAuth("t-xyz", "u-abc");

    const result = JSON.parse(await generateWeeklyReport(sb as any, auth));
    expect(result.status).toBe("success");
    expect(insertSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        tenant_id: "t-xyz",
        requested_by: "u-abc",
        report_type: "weekly_analytics",
        status: "pending",
      })
    );
  });

  it("9. handles DB error gracefully", async () => {
    const chain: any = { insert: vi.fn().mockResolvedValue({ error: { message: "fail" } }) };
    const sb = { from: vi.fn().mockReturnValue(chain) };

    const result = JSON.parse(await generateWeeklyReport(sb as any, makeAuth()));
    expect(result.status).toBe("error");
  });
});

// ── Tests: escalateToHuman ────────────────────────────────────────────────────

describe("escalateToHuman", () => {
  function makeEscalateSb(ticketError: any = null) {
    const insertSpy = vi.fn().mockResolvedValue({ error: ticketError });
    const sb = {
      from: vi.fn().mockReturnValue({ insert: insertSpy }),
      _insertSpy: insertSpy,
    };
    return sb;
  }

  it("10. creates support_tickets with correct tenant_id", async () => {
    const sb = makeEscalateSb();
    const auth = makeAuth("t-99");

    const result = JSON.parse(await escalateToHuman(sb as any, auth, "Sistema caído", "high"));
    expect(result.ticket_created).toBe(true);
    expect(sb._insertSpy).toHaveBeenCalledWith(
      expect.objectContaining({ tenant_id: "t-99", priority: "high", status: "open" })
    );
  });

  it("11. queues WhatsApp notification for 'critical' priority", async () => {
    const insertSpy = vi.fn().mockResolvedValue({ error: null });
    const sb = { from: vi.fn().mockReturnValue({ insert: insertSpy }) };

    const result = JSON.parse(await escalateToHuman(sb as any, makeAuth(), "Falla crítica", "critical"));
    expect(result.whatsapp_queued).toBe(true);
    // Two inserts: ticket + system_notification
    expect(insertSpy).toHaveBeenCalledTimes(2);
    expect(insertSpy).toHaveBeenCalledWith(
      expect.objectContaining({ recipient_phone: "+525646060947", severity: "critical" })
    );
  });

  it("12. queues WhatsApp notification for 'high' priority", async () => {
    const insertSpy = vi.fn().mockResolvedValue({ error: null });
    const sb = { from: vi.fn().mockReturnValue({ insert: insertSpy }) };

    const result = JSON.parse(await escalateToHuman(sb as any, makeAuth(), "Problema alto", "high"));
    expect(result.whatsapp_queued).toBe(true);
    expect(insertSpy).toHaveBeenCalledTimes(2);
  });

  it("13. does NOT queue WhatsApp for 'low' priority", async () => {
    const insertSpy = vi.fn().mockResolvedValue({ error: null });
    const sb = { from: vi.fn().mockReturnValue({ insert: insertSpy }) };

    const result = JSON.parse(await escalateToHuman(sb as any, makeAuth(), "Consulta menor", "low"));
    expect(result.whatsapp_queued).toBe(false);
    expect(insertSpy).toHaveBeenCalledTimes(1); // only ticket
  });

  it("14. does NOT queue WhatsApp for 'medium' priority", async () => {
    const insertSpy = vi.fn().mockResolvedValue({ error: null });
    const sb = { from: vi.fn().mockReturnValue({ insert: insertSpy }) };

    const result = JSON.parse(await escalateToHuman(sb as any, makeAuth(), "Duda general", "medium"));
    expect(result.whatsapp_queued).toBe(false);
    expect(insertSpy).toHaveBeenCalledTimes(1);
  });

  it("15. handles ticket insert error gracefully", async () => {
    const sb = makeEscalateSb({ message: "Connection refused" });

    const result = JSON.parse(await escalateToHuman(sb as any, makeAuth(), "Error", "low"));
    expect(result.status).toBe("error");
  });
});
