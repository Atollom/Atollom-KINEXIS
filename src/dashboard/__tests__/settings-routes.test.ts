// src/dashboard/__tests__/settings-routes.test.ts
// H1 security tests for Settings Module API routes.
// All route handlers are tested with mocked Supabase + auth.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ── Mocks (must be declared before any imports that use them) ─────────────────

// Track config_change_log inserts across tests
const changeLogInserts: any[] = [];

// Minimal chainable Supabase builder
function makeBuilder(resolveWith: { data?: any; error?: any } = { data: null, error: null }) {
  const builder: any = {
    select:   () => builder,
    eq:       () => builder,
    single:   () => Promise.resolve(resolveWith),
    order:    () => Promise.resolve(resolveWith),
    upsert:   () => Promise.resolve({ error: null }),
    update:   () => builder,
    insert:   (data: any) => {
      changeLogInserts.push(data);
      return Promise.resolve({ error: null });
    },
  };
  return builder;
}

function makeMockSupabase({
  userProfileData = null as any,
  updateError    = null as any,
} = {}) {
  return {
    from: (table: string) => {
      // Return a fresh builder each time; terminal .single() / .order() resolve appropriately
      const base = makeBuilder({ data: userProfileData, error: null });

      // update chain: .update({}).eq().eq() → Promise<{ error }>
      base.update = () => {
        const chain: any = {
          eq: () => chain,
        };
        // Make the chain itself thenable for the final await
        chain.eq = () => {
          const terminal: any = { eq: () => Promise.resolve({ error: updateError }) };
          return terminal;
        };
        return chain;
      };

      return base;
    },
  };
}

vi.mock("@/lib/supabase", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  getAuthenticatedTenant: vi.fn(),
}));

// Import mocked helpers + route handlers after mocks are set up
import { createClient } from "@/lib/supabase";
import { getAuthenticatedTenant } from "@/lib/auth";
import { PATCH as usersPatch }    from "../app/api/settings/users/route";
import { GET as vaultGet, PATCH as vaultPatch } from "../app/api/settings/vault/route";
import { PATCH as profilePatch }  from "../app/api/settings/profile/route";
import { PATCH as autonomyPatch } from "../app/api/settings/autonomy/route";

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeAuth(role: string, tenantId = "tenant-abc", userId = "user-123") {
  return { id: userId, tenant_id: tenantId, role, name: "Test", email: "test@test.com" };
}

function makeReq(body: unknown, method = "PATCH"): NextRequest {
  return new NextRequest("http://localhost/api/settings/test", {
    method,
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  changeLogInserts.length = 0;
  vi.clearAllMocks();
});

// ═════════════════════════════════════════════════════════════════════════════
// TEST 1 — Admin intenta cambiar rol → 403
// ═════════════════════════════════════════════════════════════════════════════

describe("users PATCH — solo owner puede cambiar roles", () => {
  it("admin recibe 403 al intentar cambiar rol", async () => {
    vi.mocked(getAuthenticatedTenant).mockResolvedValue(makeAuth("admin") as any);
    vi.mocked(createClient).mockReturnValue(makeMockSupabase() as any);

    const req = makeReq({ user_id: "other-user-uuid-0000-000000000000", role: "viewer" });
    const res = await usersPatch(req);

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toMatch(/propietario|owner/i);
  });

  it("socia recibe 403 al intentar cambiar rol", async () => {
    vi.mocked(getAuthenticatedTenant).mockResolvedValue(makeAuth("socia") as any);
    vi.mocked(createClient).mockReturnValue(makeMockSupabase() as any);

    const req = makeReq({ user_id: "other-user-uuid-0000-000000000000", role: "viewer" });
    const res = await usersPatch(req);

    expect(res.status).toBe(403);
  });

  it("viewer recibe 403 al intentar cambiar rol", async () => {
    vi.mocked(getAuthenticatedTenant).mockResolvedValue(makeAuth("viewer") as any);
    vi.mocked(createClient).mockReturnValue(makeMockSupabase() as any);

    const req = makeReq({ user_id: "other-user-uuid-0000-000000000000", role: "admin" });
    const res = await usersPatch(req);

    expect(res.status).toBe(403);
  });

  it("owner sin sesión recibe 401", async () => {
    vi.mocked(getAuthenticatedTenant).mockResolvedValue(null);
    vi.mocked(createClient).mockReturnValue(makeMockSupabase() as any);

    const req = makeReq({ user_id: "other-user-uuid-0000-000000000000", role: "viewer" });
    const res = await usersPatch(req);

    expect(res.status).toBe(401);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// TEST 2 — RFC inválido bloqueado → 400
// ═════════════════════════════════════════════════════════════════════════════

describe("profile PATCH — validación de RFC", () => {
  beforeEach(() => {
    vi.mocked(getAuthenticatedTenant).mockResolvedValue(makeAuth("owner") as any);
    vi.mocked(createClient).mockReturnValue(makeMockSupabase() as any);
  });

  const INVALID_RFCS = [
    "abc123",           // demasiado corto
    "XAXX0101010000",   // demasiado largo
    "xabc010101abc",    // minúsculas
    "AB123456ABC",      // letras insuficientes al inicio
    "1234567890123",    // solo números
    "",                 // vacío
  ];

  for (const rfc of INVALID_RFCS) {
    it(`rechaza RFC inválido: "${rfc}"`, async () => {
      const req = makeReq({ rfc });
      const res = await profilePatch(req);
      expect(res.status).toBe(400);
    });
  }

  const VALID_RFCS = [
    "XAXX010101000",    // RFC genérico extranjero (persona moral)
    "ABC010101ABC",     // persona moral ficticia
    "ABCD010101ABC",    // persona física ficticia
  ];

  for (const rfc of VALID_RFCS) {
    it(`acepta RFC válido: "${rfc}"`, async () => {
      const req = makeReq({ rfc });
      const res = await profilePatch(req);
      // 200 or 500 (supabase upsert may vary in mock) — NOT 400
      expect(res.status).not.toBe(400);
    });
  }
});

// ═════════════════════════════════════════════════════════════════════════════
// TEST 3 — API key GET nunca retorna valor real → solo masked booleans
// ═════════════════════════════════════════════════════════════════════════════

describe("vault GET — nunca retorna valores reales de API keys", () => {
  it("retorna solo booleans (hasValue), no strings con valor real", async () => {
    vi.mocked(getAuthenticatedTenant).mockResolvedValue(makeAuth("owner") as any);

    // Supabase returns 2 configured keys for this tenant
    const mockSupa = {
      from: () => ({
        select: () => ({
          eq: () => Promise.resolve({
            data: [{ key_name: "ml_access_token" }, { key_name: "shopify_api_key" }],
            error: null,
          }),
        }),
      }),
    };
    vi.mocked(createClient).mockReturnValue(mockSupa as any);

    const res = await vaultGet();
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body).toHaveProperty("keys");

    // Every value must be a boolean — NEVER a string
    for (const [keyName, value] of Object.entries(body.keys)) {
      expect(typeof value === "boolean",
        `Key "${keyName}" should be boolean but got ${typeof value}: ${value}`).toBe(true);
    }

    // Configured keys must be true, unconfigured must be false
    expect(body.keys["ml_access_token"]).toBe(true);
    expect(body.keys["shopify_api_key"]).toBe(true);
    expect(body.keys["amazon_sp_api_key"]).toBe(false);
    expect(body.keys["meta_access_token"]).toBe(false);
  });

  it("admin también recibe solo booleans", async () => {
    vi.mocked(getAuthenticatedTenant).mockResolvedValue(makeAuth("admin") as any);
    const mockSupa = {
      from: () => ({ select: () => ({ eq: () => Promise.resolve({ data: [], error: null }) }) }),
    };
    vi.mocked(createClient).mockReturnValue(mockSupa as any);

    const res = await vaultGet();
    const body = await res.json();

    for (const value of Object.values(body.keys)) {
      expect(typeof value).toBe("boolean");
    }
  });

  it("viewer recibe 403 — no puede ver el vault", async () => {
    vi.mocked(getAuthenticatedTenant).mockResolvedValue(makeAuth("viewer") as any);
    vi.mocked(createClient).mockReturnValue(makeMockSupabase() as any);

    const res = await vaultGet();
    expect(res.status).toBe(403);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// TEST 4 — config_change_log se escribe en cada PATCH
// ═════════════════════════════════════════════════════════════════════════════

describe("config_change_log — se registra en cada PATCH exitoso", () => {
  it("vault PATCH — loguea [REDACTED] sin valor real", async () => {
    vi.mocked(getAuthenticatedTenant).mockResolvedValue(makeAuth("owner") as any);

    const insertSpy = vi.fn().mockResolvedValue({ error: null });
    const mockSupa = {
      from: (table: string) => ({
        select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }),
        upsert: () => Promise.resolve({ error: null }),
        insert: insertSpy,
      }),
    };
    vi.mocked(createClient).mockReturnValue(mockSupa as any);

    const req = makeReq({ keys: { ml_access_token: "sk-real-secret-value" } });
    const res = await vaultPatch(req);
    expect(res.status).toBe(200);

    // insert must have been called for config_change_log
    expect(insertSpy).toHaveBeenCalled();

    // The logged values must NEVER contain the real secret
    const loggedArg = insertSpy.mock.calls[0][0];
    expect(JSON.stringify(loggedArg)).not.toContain("sk-real-secret-value");
    expect(loggedArg.previous_value).toBe("[REDACTED]");
    expect(loggedArg.new_value).toBe("[REDACTED — actualizado]");
  });

  it("profile PATCH — loguea cambio de campo", async () => {
    vi.mocked(getAuthenticatedTenant).mockResolvedValue(makeAuth("owner") as any);

    const insertSpy = vi.fn().mockResolvedValue({ error: null });
    const mockSupa = {
      from: () => ({
        select: () => ({
          eq: () => ({ single: () => Promise.resolve({ data: { business_name: "Old Name" }, error: null }) }),
        }),
        upsert: () => Promise.resolve({ error: null }),
        insert: insertSpy,
      }),
    };
    vi.mocked(createClient).mockReturnValue(mockSupa as any);

    const req = makeReq({ business_name: "New Name" });
    const res = await profilePatch(req);
    expect(res.status).toBe(200);

    expect(insertSpy).toHaveBeenCalled();
    const loggedArg = insertSpy.mock.calls[0][0];
    expect(loggedArg.field).toBe("profile.business_name");
    expect(loggedArg.previous_value).toBe("Old Name");
    expect(loggedArg.new_value).toBe("New Name");
  });

  it("autonomy PATCH — loguea cambio de nivel", async () => {
    vi.mocked(getAuthenticatedTenant).mockResolvedValue(makeAuth("owner") as any);

    const insertSpy = vi.fn().mockResolvedValue({ error: null });
    const mockSupa = {
      from: () => ({
        select: () => ({
          eq: () => Promise.resolve({
            data: [{ module_id: "erp", autonomy_level: "FULL" }],
            error: null,
          }),
        }),
        upsert: () => Promise.resolve({ error: null }),
        insert: insertSpy,
      }),
    };
    vi.mocked(createClient).mockReturnValue(mockSupa as any);

    const req = makeReq({ erp: "NOTIFY" });
    const res = await autonomyPatch(req);
    expect(res.status).toBe(200);

    expect(insertSpy).toHaveBeenCalled();
    const loggedArg = insertSpy.mock.calls[0][0];
    expect(loggedArg.field).toBe("autonomy.erp");
    expect(loggedArg.previous_value).toBe("FULL");
    expect(loggedArg.new_value).toBe("NOTIFY");
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// TEST 5 — Autonomy: arbitrary module IDs rejected
// ═════════════════════════════════════════════════════════════════════════════

describe("autonomy PATCH — solo módulos conocidos aceptados", () => {
  beforeEach(() => {
    vi.mocked(getAuthenticatedTenant).mockResolvedValue(makeAuth("owner") as any);
    vi.mocked(createClient).mockReturnValue(makeMockSupabase() as any);
  });

  it("rechaza body con clave desconocida", async () => {
    const req = makeReq({ unknown_module: "FULL", ecommerce: "NOTIFY" });
    const res = await autonomyPatch(req);
    expect(res.status).toBe(400);
  });

  it("acepta body con solo módulos conocidos", async () => {
    const insertSpy = vi.fn().mockResolvedValue({ error: null });
    const mockSupa = {
      from: () => ({
        select: () => ({ eq: () => Promise.resolve({ data: [], error: null }) }),
        upsert: () => Promise.resolve({ error: null }),
        insert: insertSpy,
      }),
    };
    vi.mocked(createClient).mockReturnValue(mockSupa as any);

    const req = makeReq({ ecommerce: "FULL", erp: "NOTIFY" });
    const res = await autonomyPatch(req);
    expect(res.status).toBe(200);
  });

  it("rechaza nivel de autonomía inválido", async () => {
    const req = makeReq({ ecommerce: "GODMODE" });
    const res = await autonomyPatch(req);
    expect(res.status).toBe(400);
  });
});
