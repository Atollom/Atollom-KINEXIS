// src/dashboard/app/api/settings/autonomy/route.ts
// API para configurar niveles de autonomía de agentes por módulo
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { getAuthenticatedTenant } from "@/lib/auth";
import { z } from "zod";

const AutonomyLevels = ["FULL", "NOTIFY", "SUPERVISED", "HUMAN_REQUIRED", "PAUSED"] as const;

// Only ecommerce/erp/crm are valid module IDs.
// .strict() rejects any unknown key — prevents arbitrary key injection into tenant_agent_autonomy.
const AutonomySchema = z.object({
  ecommerce: z.enum(AutonomyLevels).optional(),
  erp:       z.enum(AutonomyLevels).optional(),
  crm:       z.enum(AutonomyLevels).optional(),
}).strict().refine(
  (data) => Object.values(data).some((v) => v !== undefined),
  { message: "Se requiere al menos un módulo" }
);

/**
 * GET /api/settings/autonomy
 * Retorna niveles de autonomía por módulo.
 */
export async function GET() {
  const supabase = createClient();
  const auth = await getAuthenticatedTenant(supabase);
  if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  if (!["owner", "admin", "socia"].includes(auth.role)) {
    return NextResponse.json({ error: "Prohibido" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("tenant_agent_autonomy")
    .select("module_id, autonomy_level")
    .eq("tenant_id", auth.tenant_id);

  if (error) {
    console.error("[Autonomy GET] Error:", error);
    // Retornar defaults si no hay registros
    return NextResponse.json({
      autonomy: {
        ecommerce: "FULL",
        erp: "NOTIFY",
        crm: "SUPERVISED",
      },
    });
  }

  const autonomy: Record<string, string> = {
    ecommerce: "FULL",
    erp: "NOTIFY",
    crm: "SUPERVISED",
  };

  for (const row of data || []) {
    autonomy[row.module_id] = row.autonomy_level;
  }

  return NextResponse.json({ autonomy });
}

/**
 * PATCH /api/settings/autonomy
 * Actualiza niveles de autonomía.
 * Body: { ecommerce: "FULL", erp: "NOTIFY", crm: "SUPERVISED" }
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
    const parsed = AutonomySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Obtener valores actuales para logging
    const { data: currentRows } = await supabase
      .from("tenant_agent_autonomy")
      .select("module_id, autonomy_level")
      .eq("tenant_id", auth.tenant_id);

    const currentMap: Record<string, string> = {};
    for (const row of currentRows || []) {
      currentMap[row.module_id] = row.autonomy_level;
    }

    for (const [moduleId, level] of Object.entries(parsed.data) as [string, typeof AutonomyLevels[number] | undefined][]) {
      if (level === undefined) continue;
      // Upsert autonomía
      await supabase
        .from("tenant_agent_autonomy")
        .upsert(
          {
            tenant_id: auth.tenant_id,
            module_id: moduleId,
            autonomy_level: level,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "tenant_id,module_id" }
        );

      // Log si cambió
      const prev = currentMap[moduleId] || "N/A";
      if (prev !== level) {
        await supabase.from("config_change_log").insert({
          tenant_id: auth.tenant_id,
          user_id: auth.id,
          field: `autonomy.${moduleId}`,
          previous_value: prev,
          new_value: level,
          created_at: new Date().toISOString(),
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Autonomy PATCH] Error:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
