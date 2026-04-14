// src/dashboard/app/api/onboarding/provision-facturapi/route.ts
// Crea la organización FacturAPI del tenant en background durante el onboarding.
// Solo el owner puede llamar este endpoint (mismo guard que /api/onboarding/*).
// El cliente NUNCA configura FacturAPI — Atollom lo hace aquí con FACTURAPI_USER_KEY.
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { getAuthenticatedTenant } from "@/lib/auth";

const FACTURAPI_BASE = "https://www.facturapi.io/v2";

// RFC SAT CFDI 4.0 — same regex as profile/route.ts and facturapi_adapter.py
const RFC_REGEX = /^[A-ZÑ&]{3,4}[0-9]{6}[A-Z0-9]{3}$/;

/**
 * POST /api/onboarding/provision-facturapi
 * Flujo:
 *   1. Lee datos fiscales del tenant desde tenant_profiles
 *   2. Llama POST /v2/organizations en FacturAPI con FACTURAPI_USER_KEY
 *   3. Obtiene la live key de la organización
 *   4. Guarda org_id en cfdi_tenant_config_ext
 *   5. Guarda live key en vault_secrets como 'facturapi_live_key'
 *
 * Idempotente: si el tenant ya tiene org_id, retorna 200 sin crear duplicado.
 */
export async function POST(_req: NextRequest) {
  const supabase = createClient();
  const auth = await getAuthenticatedTenant(supabase);

  if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (auth.role !== "owner") {
    return NextResponse.json(
      { error: "Solo el propietario puede aprovisionar facturación" },
      { status: 403 }
    );
  }

  const userKey = process.env.FACTURAPI_USER_KEY;
  if (!userKey) {
    // No bloqueamos el onboarding — el provisioning se puede reintentar después
    console.error("[FacturAPI Provision] FACTURAPI_USER_KEY no configurado");
    return NextResponse.json({ status: "skipped", reason: "user_key_not_configured" });
  }

  try {
    // ── 1. Verificar idempotencia ─────────────────────────────────────────
    const { data: existing } = await supabase
      .from("cfdi_tenant_config_ext")
      .select("facturapi_org_id")
      .eq("tenant_id", auth.tenant_id)
      .single();

    if (existing?.facturapi_org_id) {
      return NextResponse.json({
        status: "already_provisioned",
        org_id: existing.facturapi_org_id,
      });
    }

    // ── 2. Leer datos fiscales del tenant ────────────────────────────────
    const { data: profile } = await supabase
      .from("tenant_profiles")
      .select("business_name, rfc, tax_regime, postal_code")
      .eq("tenant_id", auth.tenant_id)
      .single();

    if (!profile?.rfc || !profile?.business_name) {
      return NextResponse.json(
        { error: "RFC y razón social son requeridos para crear la organización FacturAPI" },
        { status: 422 }
      );
    }

    // Defense-in-depth: validate RFC format before calling FacturAPI
    // (profile PATCH already validates, but data may be stale or patched directly in DB)
    if (!RFC_REGEX.test(profile.rfc.toUpperCase())) {
      return NextResponse.json(
        { error: "RFC con formato inválido — actualiza tus datos fiscales antes de continuar" },
        { status: 400 }
      );
    }

    // ── 3. Crear organización en FacturAPI ───────────────────────────────
    const orgPayload = {
      name: profile.business_name,
      legal: {
        name: profile.business_name,
        rfc: profile.rfc.toUpperCase(),
        tax_system: profile.tax_regime || "601",
        address: { zip: profile.postal_code || "00000" },
      },
    };

    const orgRes = await fetch(`${FACTURAPI_BASE}/organizations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${Buffer.from(`${userKey}:`).toString("base64")}`,
      },
      body: JSON.stringify(orgPayload),
    });

    if (!orgRes.ok) {
      const errBody = await orgRes.text().catch(() => "");
      console.error("[FacturAPI Provision] Error creando org:", orgRes.status, errBody);
      return NextResponse.json(
        { error: "Error al crear organización en FacturAPI", detail: orgRes.status },
        { status: 502 }
      );
    }

    const orgData = await orgRes.json();
    const orgId: string = orgData.id;

    // ── 4. Obtener live key de la organización ───────────────────────────
    const keysRes = await fetch(`${FACTURAPI_BASE}/organizations/${orgId}/apikeys`, {
      headers: {
        "Authorization": `Basic ${Buffer.from(`${userKey}:`).toString("base64")}`,
      },
    });

    if (!keysRes.ok) {
      console.error("[FacturAPI Provision] Error obteniendo API keys para org", orgId);
      return NextResponse.json(
        { error: "Organización creada pero no se pudo obtener la API key" },
        { status: 502 }
      );
    }

    const keysData = await keysRes.json();
    const liveKey: string | undefined = keysData.live;

    if (!liveKey) {
      console.error("[FacturAPI Provision] Live key vacía para org", orgId);
      return NextResponse.json(
        { error: "FacturAPI no devolvió live key para la organización" },
        { status: 502 }
      );
    }

    // ── 5. Guardar org_id en cfdi_tenant_config_ext ──────────────────────
    const { error: upsertErr } = await supabase
      .from("cfdi_tenant_config_ext")
      .upsert(
        {
          tenant_id:          auth.tenant_id,
          facturapi_org_id:   orgId,
          rfc_emisor:         profile.rfc.toUpperCase(),
          nombre_emisor:      profile.business_name,
          regimen_fiscal:     profile.tax_regime || "601",
          cp_expedicion:      profile.postal_code || "00000",
          updated_at:         new Date().toISOString(),
        },
        { onConflict: "tenant_id" }
      );

    if (upsertErr) {
      console.error("[FacturAPI Provision] Error guardando org_id:", upsertErr);
    }

    // ── 6. Guardar live key en vault — NUNCA en logs ─────────────────────
    const { error: vaultErr } = await supabase
      .from("vault_secrets")
      .upsert(
        {
          tenant_id:       auth.tenant_id,
          key_name:        "facturapi_live_key",
          encrypted_value: liveKey,        // En prod: usar pgcrypto / Supabase Vault real
          updated_at:      new Date().toISOString(),
        },
        { onConflict: "tenant_id,key_name" }
      );

    if (vaultErr) {
      console.error("[FacturAPI Provision] Error guardando live key en vault:", vaultErr);
    }

    // Auditoría — sin registrar el valor real de la key
    await supabase.from("config_change_log").insert({
      tenant_id:      auth.tenant_id,
      user_id:        auth.id,
      field:          "facturapi.org_provisioned",
      previous_value: "none",
      new_value:      orgId,
      created_at:     new Date().toISOString(),
    });

    return NextResponse.json({ status: "provisioned", org_id: orgId });

  } catch (err: any) {
    console.error("[FacturAPI Provision] Error inesperado:", err);
    return NextResponse.json({ error: "Error interno durante el aprovisionamiento" }, { status: 500 });
  }
}
