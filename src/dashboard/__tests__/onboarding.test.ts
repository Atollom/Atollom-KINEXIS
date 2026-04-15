// src/dashboard/__tests__/onboarding.test.ts
// H1 security tests for the onboarding flow:
//   /api/onboarding/complete — RBAC (owner only)
//   /api/settings/profile   — RFC server-side validation (used by step 3)
//
// Tests:
//   1. Admin intenta POST /api/onboarding/complete → 403
//   2. Viewer → 403
//   3. Socia → 403 (only owner can complete onboarding)
//   4. Unauthenticated → 401
//   5. Owner → 200, sets onboarding_complete = true in DB
//   6. RFC inválido bloqueado en servidor → 400
//   7. RFC válido aceptado → 200
//   8. API key nunca aparece en config_change_log (vault PATCH log redacted)
//   9. Owner completa onboarding → config_change_log registra el evento
//  10. Onboarding completo → upsert incluye onboarding_complete: true

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock("@/lib/supabase", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/auth",    () => ({ getAuthenticatedTenant: vi.fn() }));

import { createClient }           from "@/lib/supabase";
import { getAuthenticatedTenant } from "@/lib/auth";
import { POST as completePost }   from "../app/api/onboarding/complete/route";
import { PATCH as profilePatch }  from "../app/api/settings/profile/route";
import { PATCH as vaultPatch }    from "../app/api/settings/vault/route";

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeAuth(role: string, tenantId = "tenant-abc", userId = "user-123") {
  return { id: userId, tenant_id: tenantId, role, name: "Test", email: "t@t.com" };
}

function makeReq(body: unknown, method = "POST"): NextRequest {
  return new NextRequest("http://localhost/api/test", {
    method,
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

function makeSupabase(opts: {
  upsertError?: any;
  insertSpy?:   ReturnType<typeof vi.fn>;
  singleData?:  any;
} = {}) {
  const { upsertError = null, insertSpy = vi.fn().mockResolvedValue({ error: null }), singleData = null } = opts;
  return {
    from: (_table: string) => ({
      select: () => ({
        eq:  () => ({
          single: () => Promise.resolve({ data: singleData, error: null }),
        }),
      }),
      upsert: () => Promise.resolve({ error: upsertError }),
      insert: insertSpy,
    }),
  };
}

beforeEach(() => { vi.clearAllMocks(); });

// ═════════════════════════════════════════════════════════════════════════════
// TEST 1-4 — RBAC en /api/onboarding/complete
// ═════════════════════════════════════════════════════════════════════════════

describe("POST /api/onboarding/complete — solo owner puede completar", () => {
  it("admin recibe 403", async () => {
    vi.mocked(getAuthenticatedTenant).mockResolvedValue(makeAuth("admin") as any);
    vi.mocked(createClient).mockReturnValue(makeSupabase() as any);

    const res = await completePost(makeReq({}));
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toMatch(/propietario|owner/i);
  });

  it("socia recibe 403", async () => {
    vi.mocked(getAuthenticatedTenant).mockResolvedValue(makeAuth("socia") as any);
    vi.mocked(createClient).mockReturnValue(makeSupabase() as any);

    const res = await completePost(makeReq({}));
    expect(res.status).toBe(403);
  });

  it("viewer recibe 403", async () => {
    vi.mocked(getAuthenticatedTenant).mockResolvedValue(makeAuth("viewer") as any);
    vi.mocked(createClient).mockReturnValue(makeSupabase() as any);

    const res = await completePost(makeReq({}));
    expect(res.status).toBe(403);
  });

  it("unauthenticated recibe 401", async () => {
    vi.mocked(getAuthenticatedTenant).mockResolvedValue(null);
    vi.mocked(createClient).mockReturnValue(makeSupabase() as any);

    const res = await completePost(makeReq({}));
    expect(res.status).toBe(401);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// TEST 5 — Owner completa onboarding → 200 + onboarding_complete = true
// ═════════════════════════════════════════════════════════════════════════════

describe("POST /api/onboarding/complete — owner happy path", () => {
  it("owner recibe 200 y upsert incluye onboarding_complete: true", async () => {
    vi.mocked(getAuthenticatedTenant).mockResolvedValue(makeAuth("owner") as any);

    const capturedUpserts: any[] = [];
    const insertSpy = vi.fn().mockResolvedValue({ error: null });
    const mockSupa = {
      from: (_table: string) => ({
        upsert: (data: any) => {
          capturedUpserts.push(data);
          return Promise.resolve({ error: null });
        },
        insert: insertSpy,
      }),
    };
    vi.mocked(createClient).mockReturnValue(mockSupa as any);

    const res = await completePost(makeReq({}));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);

    // El upsert debe incluir onboarding_complete: true
    expect(capturedUpserts.length).toBeGreaterThan(0);
    expect(capturedUpserts[0].onboarding_complete).toBe(true);
    expect(capturedUpserts[0].onboarding_completed_at).toBeDefined();
  });

  // TEST 9 — config_change_log registra el evento de completion
  it("registra en config_change_log con field 'onboarding.complete'", async () => {
    vi.mocked(getAuthenticatedTenant).mockResolvedValue(makeAuth("owner") as any);

    const insertSpy = vi.fn().mockResolvedValue({ error: null });
    const mockSupa = {
      from: (_table: string) => ({
        upsert: () => Promise.resolve({ error: null }),
        insert: insertSpy,
      }),
    };
    vi.mocked(createClient).mockReturnValue(mockSupa as any);

    await completePost(makeReq({}));

    expect(insertSpy).toHaveBeenCalled();
    const logEntry = insertSpy.mock.calls[0][0];
    expect(logEntry.field).toBe("onboarding.complete");
    expect(logEntry.new_value).toBe("true");
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// TEST 6-7 — RFC validado server-side en /api/settings/profile
// ═════════════════════════════════════════════════════════════════════════════

describe("PATCH /api/settings/profile — RFC validado server-side (paso 3 onboarding)", () => {
  beforeEach(() => {
    vi.mocked(getAuthenticatedTenant).mockResolvedValue(makeAuth("owner") as any);
  });

  const INVALID_RFCS = [
    "abc123",          // minúsculas + muy corto
    "XAXX0101010000",  // demasiado largo
    "AB12345678",      // formato incorrecto
    "",                // vacío (opcional pero vacío no debería pasar el regex)
  ];

  for (const rfc of INVALID_RFCS) {
    it(`rechaza RFC inválido server-side: "${rfc}" → 400`, async () => {
      vi.mocked(createClient).mockReturnValue(makeSupabase() as any);
      const req = makeReq({ rfc }, "PATCH");
      const res = await profilePatch(req);
      expect(res.status).toBe(400);
    });
  }

  it("acepta RFC válido → no 400", async () => {
    vi.mocked(createClient).mockReturnValue(makeSupabase({
      singleData: { business_name: "Empresa" },
    }) as any);
    const req = makeReq({ rfc: "XAXX010101000" }, "PATCH");
    const res = await profilePatch(req);
    expect(res.status).not.toBe(400);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// TEST 8 — API key nunca aparece en config_change_log
// ═════════════════════════════════════════════════════════════════════════════

describe("PATCH /api/settings/vault — API key nunca se loggea en texto plano", () => {
  it("config_change_log contiene [REDACTED], nunca el valor real", async () => {
    vi.mocked(getAuthenticatedTenant).mockResolvedValue(makeAuth("owner") as any);

    const insertSpy = vi.fn().mockResolvedValue({ error: null });
    const mockSupa = {
      from: (_table: string) => ({
        select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }),
        upsert: () => Promise.resolve({ error: null }),
        insert: insertSpy,
      }),
    };
    vi.mocked(createClient).mockReturnValue(mockSupa as any);

    const SECRET = "sk-SUPER-SECRET-API-KEY-12345";
    const req = makeReq({ keys: { ml_access_token: SECRET } }, "PATCH");
    const res = await vaultPatch(req);
    expect(res.status).toBe(200);

    // El log nunca debe contener el valor real
    expect(insertSpy).toHaveBeenCalled();
    const logEntry = insertSpy.mock.calls[0][0];
    expect(JSON.stringify(logEntry)).not.toContain(SECRET);
    expect(logEntry.previous_value).toBe("[REDACTED]");
    expect(logEntry.new_value).toBe("[REDACTED — actualizado]");
  });
});
