// src/dashboard/app/api/settings/users/route.ts
// API para gestionar usuarios del tenant
// Solo owner puede cambiar roles (admin puede ver)
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { getAuthenticatedTenant } from "@/lib/auth";
import { z } from "zod";

const VALID_ROLES = ["owner", "admin", "socia", "warehouse", "almacenista", "contador", "agente", "viewer"] as const;

const UpdateRoleSchema = z.object({
  user_id: z.string().uuid(),
  role: z.enum(VALID_ROLES),
});

/**
 * GET /api/settings/users
 * Lista todos los usuarios del tenant con su rol.
 */
export async function GET() {
  const supabase = createClient();
  const auth = await getAuthenticatedTenant(supabase);
  if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  if (!["owner", "admin", "socia"].includes(auth.role)) {
    return NextResponse.json({ error: "Prohibido" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("user_profiles")
    .select("id, full_name, email, role, created_at")
    .eq("tenant_id", auth.tenant_id)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[Users GET] Error:", error);
    return NextResponse.json({ error: "Error consultando usuarios" }, { status: 500 });
  }

  return NextResponse.json({ users: data || [] });
}

/**
 * PATCH /api/settings/users
 * Cambia el rol de un usuario. Solo el owner puede hacerlo.
 * Body: { user_id: string, role: string }
 */
export async function PATCH(req: NextRequest) {
  const supabase = createClient();
  const auth = await getAuthenticatedTenant(supabase);
  if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  // Solo owner puede cambiar roles
  if (auth.role !== "owner") {
    return NextResponse.json({ error: "Solo el propietario puede cambiar roles" }, { status: 403 });
  }

  try {
    const body: unknown = await req.json();
    const parsed = UpdateRoleSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { user_id, role } = parsed.data;

    // No permitir que el owner se cambie a sí mismo a otro rol
    if (user_id === auth.id) {
      return NextResponse.json({ error: "No puedes cambiar tu propio rol" }, { status: 400 });
    }

    // Verificar que el usuario pertenece al mismo tenant
    const { data: targetUser, error: lookupError } = await supabase
      .from("user_profiles")
      .select("id, role, tenant_id")
      .eq("id", user_id)
      .eq("tenant_id", auth.tenant_id)
      .single();

    if (lookupError || !targetUser) {
      return NextResponse.json({ error: "Usuario no encontrado en este tenant" }, { status: 404 });
    }

    const previousRole = targetUser.role;

    // Actualizar rol
    const { error: updateError } = await supabase
      .from("user_profiles")
      .update({ role, updated_at: new Date().toISOString() })
      .eq("id", user_id)
      .eq("tenant_id", auth.tenant_id);

    if (updateError) {
      console.error("[Users PATCH] Error:", updateError);
      return NextResponse.json({ error: "Error actualizando rol" }, { status: 500 });
    }

    // Loggear cambio
    await supabase.from("config_change_log").insert({
      tenant_id: auth.tenant_id,
      user_id: auth.id,
      field: `user_role.${user_id}`,
      previous_value: previousRole,
      new_value: role,
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, user_id, previous_role: previousRole, new_role: role });
  } catch (err) {
    console.error("[Users PATCH] Error:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
