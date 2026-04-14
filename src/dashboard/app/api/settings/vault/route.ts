// src/dashboard/app/api/settings/vault/route.ts
// API para gestionar API keys via Supabase Vault
// Solo owner/admin pueden acceder (validado en middleware)
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { getAuthenticatedTenant } from "@/lib/auth";

/**
 * GET /api/settings/vault
 * Retorna la LISTA de keys configuradas (nunca los valores reales).
 * Respuesta: { keys: { key_name: boolean (hasValue) }[] }
 */
export async function GET() {
  const supabase = createClient();
  const auth = await getAuthenticatedTenant(supabase);
  if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  if (!["owner", "admin", "socia"].includes(auth.role)) {
    return NextResponse.json({ error: "Prohibido" }, { status: 403 });
  }

  // Consultar qué keys tiene el tenant en vault_secrets
  const { data, error } = await supabase
    .from("vault_secrets")
    .select("key_name")
    .eq("tenant_id", auth.tenant_id);

  if (error) {
    console.error("[Vault GET] Error:", error);
    return NextResponse.json({ error: "Error al consultar vault" }, { status: 500 });
  }

  // Definir todas las keys esperadas
  const ALL_KEYS = [
    "ml_access_token",
    "ml_client_id",
    "ml_client_secret",
    "amazon_sp_api_key",
    "amazon_sp_api_secret",
    "amazon_seller_id",
    "shopify_api_key",
    "shopify_api_secret",
    "shopify_store_url",
    "meta_access_token",
    "meta_app_secret",
    "facturapi_api_key",
    "facturapi_secret_key",
  ];

  const configuredKeys = new Set((data || []).map((r: { key_name: string }) => r.key_name));

  const keys = ALL_KEYS.reduce<Record<string, boolean>>((acc, key) => {
    acc[key] = configuredKeys.has(key);
    return acc;
  }, {});

  return NextResponse.json({ keys });
}

/**
 * PATCH /api/settings/vault
 * Actualiza una o más API keys en vault.
 * Body: { keys: { [key_name]: string (valor) } }
 * Loggea el cambio en config_change_log (sin guardar el valor real).
 */
export async function PATCH(req: NextRequest) {
  const supabase = createClient();
  const auth = await getAuthenticatedTenant(supabase);
  if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  if (!["owner", "admin", "socia"].includes(auth.role)) {
    return NextResponse.json({ error: "Prohibido" }, { status: 403 });
  }

  try {
    const body = await req.json() as { keys?: Record<string, string> };

    if (!body.keys || typeof body.keys !== "object") {
      return NextResponse.json({ error: "Formato inválido: se espera { keys: { key_name: value } }" }, { status: 400 });
    }

    const results: Record<string, string> = {};

    for (const [keyName, value] of Object.entries(body.keys)) {
      if (!value || typeof value !== "string") continue;

      // Upsert en vault_secrets
      const { error: upsertError } = await supabase
        .from("vault_secrets")
        .upsert(
          {
            tenant_id: auth.tenant_id,
            key_name: keyName,
            encrypted_value: value, // En producción, esto usa pgcrypto/vault
            updated_at: new Date().toISOString(),
          },
          { onConflict: "tenant_id,key_name" }
        );

      if (upsertError) {
        console.error(`[Vault PATCH] Error upserting ${keyName}:`, upsertError);
        results[keyName] = "error";
        continue;
      }

      results[keyName] = "updated";

      // Loggear en config_change_log — NUNCA guardar el valor real
      await supabase.from("config_change_log").insert({
        tenant_id: auth.tenant_id,
        user_id: auth.id,
        field: `vault.${keyName}`,
        previous_value: "[REDACTED]",
        new_value: "[REDACTED — actualizado]",
        created_at: new Date().toISOString(),
      });
    }

    return NextResponse.json({ success: true, results });
  } catch (err) {
    console.error("[Vault PATCH] Error:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
