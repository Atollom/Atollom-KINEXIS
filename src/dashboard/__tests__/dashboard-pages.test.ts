// src/dashboard/__tests__/dashboard-pages.test.ts
// H1 security tests for dashboard page API routes:
//   /api/erp/purchase-orders — RBAC + tenant isolation + flow enforcement
//   /api/meta/conversations  — RBAC on POST (reply)
//
// Tests:
//   1. Almacenista → 403 en GET purchase-orders
//   2. Admin intenta aprobar OC (approve action) → 403
//   3. Socia puede aprobar OC → 200
//   4. Admin puede hacer submit → 200
//   5. Buyer intenta saltar flujo (DRAFT → APPROVED directo) → 409
//   6. Viewer intenta responder mensaje Meta → 403
//   7. Agente puede responder Meta → 200
//   8. Tenant isolation: OC de tenant B no visible para tenant A al hacer PATCH
//   9. Body inválido en PATCH → 400
//  10. Acción desconocida → 400

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("@/lib/supabase", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/auth",    () => ({ getAuthenticatedTenant: vi.fn() }));

import { createClient }              from "@/lib/supabase";
import { getAuthenticatedTenant }    from "@/lib/auth";
import { GET as poGet, PATCH as poPatch, POST as poPost } from "../app/api/erp/purchase-orders/route";
import { GET as metaGet, POST as metaPost }               from "../app/api/meta/conversations/route";

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeAuth(role: string, tenantId = "tenant-abc", userId = "user-123") {
  return { id: userId, tenant_id: tenantId, role, name: "Test", email: "t@t.com" };
}

function makeReq(body: unknown, method = "PATCH"): NextRequest {
  return new NextRequest("http://localhost/api/test", {
    method,
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

/** Chainable builder that terminates on .single(), .order(), or awaiting itself */
function makeChainableBuilder(opts: {
  singleData?: any;
  singleError?: any;
  listData?: any[];
  updateError?: any;
  insertData?: any;
}) {
  const { singleData = null, singleError = null, listData = [], updateError = null, insertData = { id: "new-po-uuid" } } = opts;

  const chain: any = {
    // Chainable qualifiers — always return self so .eq().eq().single() works
    eq:     () => chain,
    order:  () => ({ limit: () => Promise.resolve({ data: listData, error: null }), ...chain, then: undefined }),
    limit:  () => Promise.resolve({ data: listData, error: null }),
    single: () => Promise.resolve({ data: singleData, error: singleError }),
    select: () => chain,
  };

  // Make order().limit() also work as a promise
  chain.order = () => {
    const orderChain: any = {
      limit: () => Promise.resolve({ data: listData, error: null }),
    };
    // Also resolve directly when awaited
    Object.assign(orderChain, Promise.resolve({ data: listData, error: null }));
    return orderChain;
  };

  return chain;
}

/** Build a Supabase mock where .select().eq().order() resolves with `resolveData` */
function makePoSupabase(opts: {
  listData?:    any[];
  singleData?:  any;
  singleError?: any;
  updateError?: any;
  insertData?:  any;
} = {}) {
  const {
    listData    = [],
    singleData  = null,
    singleError = null,
    updateError = null,
    insertData  = { id: "new-po-uuid" },
  } = opts;

  const builder = makeChainableBuilder({ singleData, singleError, listData, updateError, insertData });

  return {
    from: (_table: string) => ({
      ...builder,
      select: () => builder,
      update: () => ({
        eq: () => ({
          eq: () => ({
            select: () => ({
              single: () => Promise.resolve({ data: singleData, error: updateError }),
            }),
          }),
        }),
      }),
      insert: () => ({
        select: () => ({
          single: () => Promise.resolve({ data: insertData, error: null }),
        }),
      }),
    }),
  };
}

function makeMetaSupabase(opts: { insertError?: any } = {}) {
  const { insertError = null } = opts;
  return {
    from: (_table: string) => ({
      select: () => ({
        eq: () => ({
          order: () => ({
            limit: () => Promise.resolve({ data: [], error: null }),
          }),
        }),
      }),
      insert: () => Promise.resolve({ error: insertError }),
    }),
  };
}

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => vi.clearAllMocks());

// ═════════════════════════════════════════════════════════════════════════════
// TEST 1 — Almacenista → 403 en GET /api/erp/purchase-orders
// ═════════════════════════════════════════════════════════════════════════════

describe("GET /api/erp/purchase-orders — control de acceso por rol", () => {
  it("almacenista recibe 403", async () => {
    vi.mocked(getAuthenticatedTenant).mockResolvedValue(makeAuth("almacenista") as any);
    vi.mocked(createClient).mockReturnValue(makePoSupabase() as any);

    const req = new NextRequest("http://localhost/api/erp/purchase-orders", { method: "GET" });
    const res = await poGet(req);
    expect(res.status).toBe(403);
  });

  it("viewer recibe 403", async () => {
    vi.mocked(getAuthenticatedTenant).mockResolvedValue(makeAuth("viewer") as any);
    vi.mocked(createClient).mockReturnValue(makePoSupabase() as any);

    const req = new NextRequest("http://localhost/api/erp/purchase-orders", { method: "GET" });
    const res = await poGet(req);
    expect(res.status).toBe(403);
  });

  it("socia puede ver OCs → 200", async () => {
    vi.mocked(getAuthenticatedTenant).mockResolvedValue(makeAuth("socia") as any);
    vi.mocked(createClient).mockReturnValue(makePoSupabase({ listData: [] }) as any);

    const req = new NextRequest("http://localhost/api/erp/purchase-orders", { method: "GET" });
    const res = await poGet(req);
    expect(res.status).toBe(200);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// TEST 2 — Admin intenta aprobar OC → 403
// ═════════════════════════════════════════════════════════════════════════════

describe("PATCH /api/erp/purchase-orders — solo socia/owner puede aprobar", () => {
  it("admin recibe 403 al intentar aprobar", async () => {
    vi.mocked(getAuthenticatedTenant).mockResolvedValue(makeAuth("admin") as any);
    vi.mocked(createClient).mockReturnValue(makePoSupabase({
      singleData: { id: "po-1", status: "PENDING_APPROVAL", tenant_id: "tenant-abc" },
    }) as any);

    const req = makeReq({ po_id: "po-1", action: "approve" });
    const res = await poPatch(req);
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toMatch(/rol insuficiente/i);
  });

  it("almacenista recibe 403 al intentar aprobar", async () => {
    vi.mocked(getAuthenticatedTenant).mockResolvedValue(makeAuth("almacenista") as any);
    vi.mocked(createClient).mockReturnValue(makePoSupabase() as any);

    const req = makeReq({ po_id: "po-1", action: "approve" });
    const res = await poPatch(req);
    // almacenista no está en MANAGE_ROLES, así que recibe 403 en el primer check
    expect(res.status).toBe(403);
  });

  // TEST 3 — Socia puede aprobar OC
  it("socia puede aprobar OC → 200", async () => {
    vi.mocked(getAuthenticatedTenant).mockResolvedValue(makeAuth("socia") as any);
    vi.mocked(createClient).mockReturnValue(makePoSupabase({
      singleData: { id: "po-1", status: "PENDING_APPROVAL", tenant_id: "tenant-abc" },
    }) as any);

    const req = makeReq({ po_id: "po-1", action: "approve" });
    const res = await poPatch(req);
    expect(res.status).toBe(200);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// TEST 4 — Admin puede hacer submit (DRAFT → PENDING_APPROVAL)
// ═════════════════════════════════════════════════════════════════════════════

describe("PATCH — submit action permitido para admin", () => {
  it("admin puede hacer submit de DRAFT → 200", async () => {
    vi.mocked(getAuthenticatedTenant).mockResolvedValue(makeAuth("admin") as any);
    vi.mocked(createClient).mockReturnValue(makePoSupabase({
      singleData: { id: "po-2", status: "DRAFT", tenant_id: "tenant-abc" },
    }) as any);

    const req = makeReq({ po_id: "po-2", action: "submit" });
    const res = await poPatch(req);
    expect(res.status).toBe(200);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// TEST 5 — Saltar flujo: DRAFT → APPROVED directamente → 409
// ═════════════════════════════════════════════════════════════════════════════

describe("PATCH — flujo de estado no puede saltarse", () => {
  it("intentar aprobar una OC en DRAFT → 409", async () => {
    vi.mocked(getAuthenticatedTenant).mockResolvedValue(makeAuth("socia") as any);
    vi.mocked(createClient).mockReturnValue(makePoSupabase({
      singleData: { id: "po-3", status: "DRAFT", tenant_id: "tenant-abc" },
    }) as any);

    const req = makeReq({ po_id: "po-3", action: "approve" });
    const res = await poPatch(req);
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toMatch(/DRAFT/);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// TEST 6 — Viewer responde mensaje Meta → 403
// ═════════════════════════════════════════════════════════════════════════════

describe("POST /api/meta/conversations — RBAC al responder mensajes", () => {
  it("viewer recibe 403", async () => {
    vi.mocked(getAuthenticatedTenant).mockResolvedValue(makeAuth("viewer") as any);
    vi.mocked(createClient).mockReturnValue(makeMetaSupabase() as any);

    const req = makeReq({
      contact: "+52555000000",
      channel: "whatsapp",
      message: "Hola desde viewer",
    }, "POST");
    const res = await metaPost(req);
    expect(res.status).toBe(403);
  });

  it("contador recibe 403", async () => {
    vi.mocked(getAuthenticatedTenant).mockResolvedValue(makeAuth("contador") as any);
    vi.mocked(createClient).mockReturnValue(makeMetaSupabase() as any);

    const req = makeReq({
      contact: "+52555000000",
      channel: "whatsapp",
      message: "Hola desde contador",
    }, "POST");
    const res = await metaPost(req);
    expect(res.status).toBe(403);
  });

  // TEST 7 — Agente puede responder
  it("agente puede responder → 200", async () => {
    vi.mocked(getAuthenticatedTenant).mockResolvedValue(makeAuth("agente") as any);
    vi.mocked(createClient).mockReturnValue(makeMetaSupabase() as any);

    const req = makeReq({
      contact: "+52555000000",
      channel: "whatsapp",
      message: "Hola desde agente",
    }, "POST");
    const res = await metaPost(req);
    expect(res.status).toBe(200);
  });

  it("canal inválido → 400", async () => {
    vi.mocked(getAuthenticatedTenant).mockResolvedValue(makeAuth("agente") as any);
    vi.mocked(createClient).mockReturnValue(makeMetaSupabase() as any);

    const req = makeReq({
      contact: "+52555000000",
      channel: "telegram",
      message: "Canal no soportado",
    }, "POST");
    const res = await metaPost(req);
    expect(res.status).toBe(400);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// TEST 8 — Tenant isolation: OC de otro tenant → 404
// ═════════════════════════════════════════════════════════════════════════════

describe("PATCH — tenant isolation en OC", () => {
  it("OC de tenant B no accesible por usuario de tenant A → 404", async () => {
    vi.mocked(getAuthenticatedTenant).mockResolvedValue(makeAuth("socia", "tenant-A") as any);

    // OC pertenece a tenant-B — el .eq("tenant_id", "tenant-A") no la encontrará → singleData null
    vi.mocked(createClient).mockReturnValue(makePoSupabase({
      singleData:  null,
      singleError: { code: "PGRST116" },  // PostgREST: 0 rows
    }) as any);

    const req = makeReq({ po_id: "po-tenant-b", action: "approve" });
    const res = await poPatch(req);
    expect(res.status).toBe(404);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// TEST 9 & 10 — Validación de body en PATCH
// ═════════════════════════════════════════════════════════════════════════════

describe("PATCH — validación de body", () => {
  beforeEach(() => {
    vi.mocked(getAuthenticatedTenant).mockResolvedValue(makeAuth("owner") as any);
    vi.mocked(createClient).mockReturnValue(makePoSupabase() as any);
  });

  it("body sin po_id → 400", async () => {
    const req = makeReq({ action: "approve" });
    const res = await poPatch(req);
    expect(res.status).toBe(400);
  });

  it("acción desconocida → 400", async () => {
    const req = makeReq({ po_id: "po-1", action: "godmode" });
    const res = await poPatch(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/Acción desconocida/i);
  });

  it("unauthenticated → 401", async () => {
    vi.mocked(getAuthenticatedTenant).mockResolvedValue(null);
    const req = makeReq({ po_id: "po-1", action: "approve" });
    const res = await poPatch(req);
    expect(res.status).toBe(401);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// TEST — POST restock_request crea OC en estado DRAFT (no APPROVED)
// ═════════════════════════════════════════════════════════════════════════════

describe("POST /api/erp/purchase-orders — restock_request crea OC en DRAFT", () => {
  it("crea OC con status DRAFT, no APPROVED → 201", async () => {
    vi.mocked(getAuthenticatedTenant).mockResolvedValue(makeAuth("admin") as any);

    const capturedInserts: any[] = [];
    const mockSupa = {
      from: (_table: string) => ({
        insert: (data: any) => {
          capturedInserts.push(data);
          return {
            select: () => ({
              single: () => Promise.resolve({ data: { id: "new-po-uuid" }, error: null }),
            }),
          };
        },
      }),
    };
    vi.mocked(createClient).mockReturnValue(mockSupa as any);

    const req = makeReq({ action: "restock_request", sku: "SKU-001" }, "POST");
    const res = await poPost(req);
    expect(res.status).toBe(201);

    // Verificar que el insert tiene status DRAFT, nunca APPROVED
    expect(capturedInserts.length).toBeGreaterThan(0);
    expect(capturedInserts[0].status).toBe("DRAFT");
    expect(capturedInserts[0].status).not.toBe("APPROVED");
  });

  it("almacenista recibe 403 al intentar crear OC", async () => {
    vi.mocked(getAuthenticatedTenant).mockResolvedValue(makeAuth("almacenista") as any);
    vi.mocked(createClient).mockReturnValue(makePoSupabase() as any);

    const req = makeReq({ action: "restock_request", sku: "SKU-001" }, "POST");
    const res = await poPost(req);
    expect(res.status).toBe(403);
  });
});
