// src/dashboard/app/api/settings/profile/route.ts
// API para perfil de empresa (tenant)
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { getAuthenticatedTenant } from "@/lib/auth";
import { z } from "zod";

const ProfileSchema = z.object({
  business_name: z.string().min(1).max(200).optional(),
  rfc: z.string().regex(/^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/, "RFC inválido").optional(),
  tax_regime: z.string().max(100).optional(),
  postal_code: z.string().regex(/^\d{5}$/, "Código postal debe ser 5 dígitos").optional(),
  logo_url: z.string().url().optional(),
});

/**
 * GET /api/settings/profile
 * Retorna el perfil de empresa del tenant.
 */
export async function GET() {
  const supabase = createClient();
  const auth = await getAuthenticatedTenant(supabase);
  if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { data, error } = await supabase
    .from("tenant_profiles")
    .select("business_name, rfc, tax_regime, postal_code, logo_url, created_at, updated_at")
    .eq("tenant_id", auth.tenant_id)
    .single();

  if (error) {
    // Si no existe, retornar vacío para que el front pueda crear
    return NextResponse.json({
      business_name: "",
      rfc: "",
      tax_regime: "",
      postal_code: "",
      logo_url: "",
    });
  }

  return NextResponse.json(data);
}

/**
 * PATCH /api/settings/profile
 * Actualiza el perfil de empresa.
 */
export async function PATCH(req: NextRequest) {
  const supabase = createClient();
  const auth = await getAuthenticatedTenant(supabase);
  if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  if (!["owner", "admin", "socia"].includes(auth.role)) {
    return NextResponse.json({ error: "Prohibido" }, { status: 403 });
  }

  try {
    const body: unknown = await req.json();
    const parsed = ProfileSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Obtener valores actuales para el log
    const { data: current } = await supabase
      .from("tenant_profiles")
      .select("*")
      .eq("tenant_id", auth.tenant_id)
      .single();

    // Upsert perfil
    const { error: upsertError } = await supabase
      .from("tenant_profiles")
      .upsert(
        {
          tenant_id: auth.tenant_id,
          ...parsed.data,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "tenant_id" }
      );

    if (upsertError) {
      console.error("[Profile PATCH] Error:", upsertError);
      return NextResponse.json({ error: "Error guardando perfil" }, { status: 500 });
    }

    // Loggear cada campo cambiado
    for (const [field, newValue] of Object.entries(parsed.data)) {
      const prevValue = current?.[field] ?? "";
      if (prevValue !== newValue) {
        await supabase.from("config_change_log").insert({
          tenant_id: auth.tenant_id,
          user_id: auth.id,
          field: `profile.${field}`,
          previous_value: String(prevValue),
          new_value: String(newValue),
          created_at: new Date().toISOString(),
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Profile PATCH] Error:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
