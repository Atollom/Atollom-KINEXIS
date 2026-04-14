// src/dashboard/__tests__/atollom.test.ts
// H1 security + behavior tests for Atollom internal routes:
//   /api/atollom/notify — superadmin WhatsApp notification
//
// Tests:
//   1. Unauthenticated → 401
//   2. owner role → 403 (middleware enforces, route double-checks)
//   3. admin role → 403
//   4. atollom_admin → 200, inserts into system_notifications
//   5. Missing message body → 400
//   6. Empty message string → 400
//   7. Invalid severity → 400
//   8. Default severity "info" used when omitted
//   9. Inserted record has correct fields (recipient, channel, status: pending)
//  10. DB error → 500 (graceful)

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock("@/lib/supabase", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/auth",    () => ({ getAuthenticatedTenant: vi.fn() }));

import { createClient }           from "@/lib/supabase";
import { getAuthenticatedTenant } from "@/lib/auth";
import { POST as notifyPost }     from "../app/api/atollom/notify/route";

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeAuth(role: string, userId = "user-superadmin") {
  return { id: userId, tenant_id: null, role, name: "Test", email: "t@t.com" };
}

function makeReq(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/atollom/notify", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

function makeSupabase(insertError: any = null) {
  const insertSpy = vi.fn().mockResolvedValue({ error: insertError });
  const sb = {
    from: (_table: string) => ({
      insert: insertSpy,
    }),
    _insertSpy: insertSpy,
  };
  return sb;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("POST /api/atollom/notify", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("1. Unauthenticated → 401", async () => {
    (getAuthenticatedTenant as any).mockResolvedValue(null);
    (createClient as any).mockReturnValue(makeSupabase());

    const res = await notifyPost(makeReq({ message: "test" }));
    expect(res.status).toBe(401);
  });

  it("2. owner role → 403", async () => {
    (getAuthenticatedTenant as any).mockResolvedValue(makeAuth("owner"));
    (createClient as any).mockReturnValue(makeSupabase());

    const res = await notifyPost(makeReq({ message: "test" }));
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toContain("Atollom Admin");
  });

  it("3. admin role → 403", async () => {
    (getAuthenticatedTenant as any).mockResolvedValue(makeAuth("admin"));
    (createClient as any).mockReturnValue(makeSupabase());

    const res = await notifyPost(makeReq({ message: "test" }));
    expect(res.status).toBe(403);
  });

  it("4. atollom_admin → 200", async () => {
    (getAuthenticatedTenant as any).mockResolvedValue(makeAuth("atollom_admin"));
    (createClient as any).mockReturnValue(makeSupabase());

    const res = await notifyPost(makeReq({ message: "Alerta sistema", severity: "high" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it("5. Missing message → 400", async () => {
    (getAuthenticatedTenant as any).mockResolvedValue(makeAuth("atollom_admin"));
    (createClient as any).mockReturnValue(makeSupabase());

    const res = await notifyPost(makeReq({ severity: "info" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/message/i);
  });

  it("6. Empty message string → 400", async () => {
    (getAuthenticatedTenant as any).mockResolvedValue(makeAuth("atollom_admin"));
    (createClient as any).mockReturnValue(makeSupabase());

    const res = await notifyPost(makeReq({ message: "   " }));
    expect(res.status).toBe(400);
  });

  it("7. Invalid severity → 400", async () => {
    (getAuthenticatedTenant as any).mockResolvedValue(makeAuth("atollom_admin"));
    (createClient as any).mockReturnValue(makeSupabase());

    const res = await notifyPost(makeReq({ message: "test", severity: "urgent" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/severity/i);
  });

  it("8. Default severity is 'info' when omitted", async () => {
    (getAuthenticatedTenant as any).mockResolvedValue(makeAuth("atollom_admin", "uid-123"));
    const sb = makeSupabase();
    (createClient as any).mockReturnValue(sb);

    await notifyPost(makeReq({ message: "Prueba sin severity" }));

    expect(sb._insertSpy).toHaveBeenCalledWith(
      expect.objectContaining({ severity: "info" })
    );
  });

  it("9. Inserted record has correct recipient, channel, status, sent_by", async () => {
    const userId = "uid-superadmin-xyz";
    (getAuthenticatedTenant as any).mockResolvedValue(makeAuth("atollom_admin", userId));
    const sb = makeSupabase();
    (createClient as any).mockReturnValue(sb);

    await notifyPost(makeReq({ message: "Critical alert", severity: "critical" }));

    expect(sb._insertSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        recipient_phone: "+525646060947",
        channel:         "whatsapp",
        status:          "pending",
        sent_by:         userId,
        severity:        "critical",
      })
    );
  });

  it("10. DB insert error → 500", async () => {
    (getAuthenticatedTenant as any).mockResolvedValue(makeAuth("atollom_admin"));
    (createClient as any).mockReturnValue(makeSupabase({ message: "DB connection failed" }));

    const res = await notifyPost(makeReq({ message: "test", severity: "info" }));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBeTruthy();
  });
});
