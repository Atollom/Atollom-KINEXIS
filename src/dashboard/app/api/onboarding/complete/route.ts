// src/dashboard/app/api/onboarding/complete/route.ts
// Marca el onboarding como completado para el tenant.
// Solo el propietario (owner) puede ejecutar esta acción.
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { getAuthenticatedTenant } from "@/lib/auth";

/**
 * POST /api/onboarding/complete
 * Upsert en tenant_profiles: onboarding_complete = true, onboarding_completed_at = now()
 * Registra en config_change_log para auditoría.
 */
export async function POST(_req: NextRequest) {
  const supabase = createClient();
  const auth = await getAuthenticatedTenant(supabase);

  if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  // Solo owner puede completar el onboarding
  if (auth.role !== "owner") {
    return NextResponse.json(
      { error: "Prohibido: Solo el propietario puede completar el onboarding" },
      { status: 403 }
    );
  }

  try {
    const now = new Date().toISOString();

    const { error } = await supabase
      .from("tenant_profiles")
      .upsert(
        {
          tenant_id:               auth.tenant_id,
          onboarding_complete:     true,
          onboarding_completed_at: now,
          updated_at:              now,
        },
        { onConflict: "tenant_id" }
      );

    if (error) {
      console.error("[Onboarding Complete] Error:", error);
      return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }

    // Auditoría
    await supabase.from("config_change_log").insert({
      tenant_id:      auth.tenant_id,
      user_id:        auth.id,
      field:          "onboarding.complete",
      previous_value: "false",
      new_value:      "true",
      created_at:     now,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Onboarding Complete] Unexpected error:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
