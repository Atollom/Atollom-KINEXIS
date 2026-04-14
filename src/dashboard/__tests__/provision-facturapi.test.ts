// src/dashboard/__tests__/provision-facturapi.test.ts
// H1 security + behavior tests for /api/onboarding/provision-facturapi
//
// Tests:
//   1. Unauthenticated → 401
//   2. admin role → 403
//   3. socia role → 403
//   4. owner, FACTURAPI_USER_KEY ausente → 200 status:skipped (no bloquea)
//   5. Llamada doble → 200 status:already_provisioned (idempotente, no duplica org)
//   6. RFC vacío / business_name vacío → 422
//   7. RFC inválido (formato malo) → 400, FacturAPI NUNCA es llamada
//   8. FacturAPI 400 → 502, onboarding no bloqueado (response es 502, no 500)
//   9. FacturAPI 200 → 200 status:provisioned, org_id en response
//  10. live_key NUNCA aparece en el response body
//  11. live_key guardada en vault con tenant_id correcto
//  12. Auditoría: config_change_log registra org_id, NO la live_key

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock("@/lib/supabase", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/auth",    () => ({ getAuthenticatedTenant: vi.fn() }));

import { createClient }           from "@/lib/supabase";
import { getAuthenticatedTenant } from "@/lib/auth";
import { POST as provisionPost }  from "../app/api/onboarding/provision-facturapi/route";

// ── Helpers ───────────────────────────────────────────────────────────────────

const FAKE_ORG_ID  = "org_facturapi_abc123";
const FAKE_LIVE_KEY = "sk_live_SUPER_SECRET_9999";

function makeAuth(role: string, tenantId = "tenant-xyz", userId = "user-owner-1") {
  return { id: userId, tenant_id: tenantId, role, name: "Test", email: "t@t.com" };
}

function makeReq(): NextRequest {
  return new NextRequest("http://localhost/api/onboarding/provision-facturapi", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Builds a Supabase mock with configurable data for each table.
 * Tables:
 *   cfdi_tenant_config_ext → existingOrgId (null = not provisioned)
 *   tenant_profiles        → profileData
 *   vault_secrets, config_change_log → tracked via upsertSpy / insertSpy
 */
function makeSupabase(opts: {
  existingOrgId?: string | null;
  profileData?: { rfc: string; business_name: string; tax_regime?: string; postal_code?: string } | null;
  upsertSpy?: ReturnType<typeof vi.fn>;
  insertSpy?: ReturnType<typeof vi.fn>;
} = {}) {
  const {
    existingOrgId = null,
    profileData = { rfc: "KAP930101ABC", business_name: "Kap Tools SA de CV", tax_regime: "601", postal_code: "72973" },
    upsertSpy = vi.fn().mockResolvedValue({ error: null }),
    insertSpy = vi.fn().mockResolvedValue({ error: null }),
  } = opts;

  return {
    from: (table: string) => ({
      select: (_cols?: string) => ({
        eq: (_col: string, _val: string) => ({
          single: () => {
            if (table === "cfdi_tenant_config_ext") {
              return Promise.resolve({
                data: existingOrgId ? { facturapi_org_id: existingOrgId } : null,
                error: null,
              });
            }
            if (table === "tenant_profiles") {
              return Promise.resolve({ data: profileData, error: null });
            }
            return Promise.resolve({ data: null, error: null });
          },
        }),
      }),
      upsert: upsertSpy,
      insert: insertSpy,
    }),
    _upsertSpy: upsertSpy,
    _insertSpy: insertSpy,
  };
}

/** Builds a mock fetch that simulates FacturAPI responses. */
function mockFacturapi(opts: {
  orgStatus?: number;
  orgBody?: object;
  keysStatus?: number;
  keysBody?: object;
} = {}) {
  const {
    orgStatus   = 200,
    orgBody     = { id: FAKE_ORG_ID, name: "Kap Tools" },
    keysStatus  = 200,
    keysBody    = { live: FAKE_LIVE_KEY, test: "sk_test_xxx" },
  } = opts;

  let callCount = 0;
  return vi.fn().mockImplementation(() => {
    callCount++;
    // First call → POST /organizations, second → GET /apikeys
    const status  = callCount === 1 ? orgStatus  : keysStatus;
    const body    = callCount === 1 ? orgBody     : keysBody;
    return Promise.resolve({
      ok:   status >= 200 && status < 300,
      status,
      json: () => Promise.resolve(body),
      text: () => Promise.resolve(JSON.stringify(body)),
    });
  });
}

// ── Setup / teardown ──────────────────────────────────────────────────────────

let originalFetch: typeof global.fetch;
let originalEnv: string | undefined;

beforeEach(() => {
  vi.clearAllMocks();
  originalFetch = global.fetch;
  originalEnv   = process.env.FACTURAPI_USER_KEY;
  process.env.FACTURAPI_USER_KEY = "user_key_atollom_test";
});

afterEach(() => {
  global.fetch = originalFetch;
  if (originalEnv === undefined) {
    delete process.env.FACTURAPI_USER_KEY;
  } else {
    process.env.FACTURAPI_USER_KEY = originalEnv;
  }
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("POST /api/onboarding/provision-facturapi", () => {

  it("1. Unauthenticated → 401", async () => {
    (getAuthenticatedTenant as any).mockResolvedValue(null);
    (createClient as any).mockReturnValue(makeSupabase());
    const res = await provisionPost(makeReq());
    expect(res.status).toBe(401);
  });

  it("2. admin role → 403", async () => {
    (getAuthenticatedTenant as any).mockResolvedValue(makeAuth("admin"));
    (createClient as any).mockReturnValue(makeSupabase());
    const res = await provisionPost(makeReq());
    expect(res.status).toBe(403);
  });

  it("3. socia role → 403", async () => {
    (getAuthenticatedTenant as any).mockResolvedValue(makeAuth("socia"));
    (createClient as any).mockReturnValue(makeSupabase());
    const res = await provisionPost(makeReq());
    expect(res.status).toBe(403);
  });

  it("4. FACTURAPI_USER_KEY ausente → 200 status:skipped, no bloquea onboarding", async () => {
    delete process.env.FACTURAPI_USER_KEY;
    (getAuthenticatedTenant as any).mockResolvedValue(makeAuth("owner"));
    (createClient as any).mockReturnValue(makeSupabase());

    const fetchSpy = vi.fn();
    global.fetch = fetchSpy;

    const res = await provisionPost(makeReq());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("skipped");
    // FacturAPI NUNCA debe ser llamada si no hay user key
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("5. Llamada doble → already_provisioned, FacturAPI NO es llamada de nuevo", async () => {
    (getAuthenticatedTenant as any).mockResolvedValue(makeAuth("owner"));
    (createClient as any).mockReturnValue(makeSupabase({ existingOrgId: FAKE_ORG_ID }));

    const fetchSpy = vi.fn();
    global.fetch = fetchSpy;

    const res = await provisionPost(makeReq());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("already_provisioned");
    expect(body.org_id).toBe(FAKE_ORG_ID);
    // FacturAPI NO debe ser llamada — idempotencia verificada
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("6. RFC vacío (perfil incompleto) → 422", async () => {
    (getAuthenticatedTenant as any).mockResolvedValue(makeAuth("owner"));
    (createClient as any).mockReturnValue(
      makeSupabase({ profileData: { rfc: "", business_name: "Empresa" } })
    );

    const fetchSpy = vi.fn();
    global.fetch = fetchSpy;

    const res = await provisionPost(makeReq());
    expect(res.status).toBe(422);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("7. RFC con formato inválido → 400, FacturAPI NUNCA es llamada", async () => {
    (getAuthenticatedTenant as any).mockResolvedValue(makeAuth("owner"));
    (createClient as any).mockReturnValue(
      makeSupabase({ profileData: { rfc: "INVALID-RFC", business_name: "Empresa" } })
    );

    const fetchSpy = vi.fn();
    global.fetch = fetchSpy;

    const res = await provisionPost(makeReq());
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/RFC/i);
    // FacturAPI debe permanecer sin llamar — validación previa
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("8. FacturAPI devuelve 400 → 502, no 500 (onboarding no bloqueado)", async () => {
    (getAuthenticatedTenant as any).mockResolvedValue(makeAuth("owner"));
    (createClient as any).mockReturnValue(makeSupabase());
    global.fetch = mockFacturapi({ orgStatus: 400, orgBody: { message: "RFC already exists" } });

    const res = await provisionPost(makeReq());
    expect(res.status).toBe(502);
    const body = await res.json();
    // El error body NO debe contener datos internos de FacturAPI sensibles
    expect(body.error).toBeTruthy();
    expect(JSON.stringify(body)).not.toContain("user_key_atollom_test");
  });

  it("9. Happy path: owner + RFC válido → 200 status:provisioned con org_id", async () => {
    (getAuthenticatedTenant as any).mockResolvedValue(makeAuth("owner"));
    (createClient as any).mockReturnValue(makeSupabase());
    global.fetch = mockFacturapi();

    const res = await provisionPost(makeReq());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("provisioned");
    expect(body.org_id).toBe(FAKE_ORG_ID);
  });

  it("10. live_key NUNCA aparece en el response body", async () => {
    (getAuthenticatedTenant as any).mockResolvedValue(makeAuth("owner"));
    (createClient as any).mockReturnValue(makeSupabase());
    global.fetch = mockFacturapi();

    const res = await provisionPost(makeReq());
    const body = await res.json();
    const bodyStr = JSON.stringify(body);

    expect(bodyStr).not.toContain(FAKE_LIVE_KEY);
    expect(bodyStr).not.toContain("live");
    expect(bodyStr).not.toContain("sk_live");
  });

  it("11. live_key guardada en vault con tenant_id correcto", async () => {
    const tenantId = "tenant-test-999";
    (getAuthenticatedTenant as any).mockResolvedValue(makeAuth("owner", tenantId));
    const sb = makeSupabase();
    (createClient as any).mockReturnValue(sb);
    global.fetch = mockFacturapi();

    await provisionPost(makeReq());

    // upsertSpy es llamado dos veces: cfdi_tenant_config_ext + vault_secrets
    expect(sb._upsertSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        tenant_id:       tenantId,
        key_name:        "facturapi_live_key",
        encrypted_value: FAKE_LIVE_KEY,
      }),
      expect.objectContaining({ onConflict: "tenant_id,key_name" })
    );
  });

  it("12. config_change_log registra org_id, live_key nunca en el log", async () => {
    (getAuthenticatedTenant as any).mockResolvedValue(makeAuth("owner", "tenant-log-test"));
    const sb = makeSupabase();
    (createClient as any).mockReturnValue(sb);
    global.fetch = mockFacturapi();

    await provisionPost(makeReq());

    expect(sb._insertSpy).toHaveBeenCalled();
    const logEntry = sb._insertSpy.mock.calls[0][0];
    // El log debe registrar el org_id (no es secreto)
    expect(logEntry.field).toBe("facturapi.org_provisioned");
    expect(logEntry.new_value).toBe(FAKE_ORG_ID);
    // La live_key NO debe aparecer en ningún campo del log
    const logStr = JSON.stringify(logEntry);
    expect(logStr).not.toContain(FAKE_LIVE_KEY);
    expect(logStr).not.toContain("sk_live");
  });
});
