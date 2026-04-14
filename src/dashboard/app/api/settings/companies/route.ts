// src/dashboard/app/api/settings/companies/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { getAuthenticatedTenant } from "@/lib/auth";
import { z } from "zod";

const EmpresaSchema = z.object({
  id: z.string().uuid().optional(),
  nombre: z.string().min(1),
  rfc: z.string().regex(/^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/, "RFC inválido"),
  regimen_fiscal: z.string().min(1),
  cp_expedicion: z.string().regex(/^\d{5}$/, "Código postal debe ser 5 dígitos"),
  facturapi_org_id: z.string().optional(),
  es_principal: z.boolean().default(false),
  activa: z.boolean().default(true),
});

/**
 * GET /api/settings/companies
 * Lista todas las empresas vinculadas al tenant.
 */
export async function GET() {
  const supabase = createClient();
  const auth = await getAuthenticatedTenant(supabase);
  if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { data, error } = await supabase
    .from("tenant_empresas")
    .select("*")
    .eq("tenant_id", auth.tenant_id)
    .order("es_principal", { ascending: false })
    .order("nombre", { ascending: true });

  if (error) {
    console.error("[Companies GET] Error:", error);
    return NextResponse.json({ error: "Error consultando empresas" }, { status: 500 });
  }

  return NextResponse.json({ companies: data || [] });
}

/**
 * POST /api/settings/companies
 * Agrega una nueva empresa. Solo owner.
 */
export async function POST(req: NextRequest) {
  const supabase = createClient();
  const auth = await getAuthenticatedTenant(supabase);
  if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  if (auth.role !== "owner") {
    return NextResponse.json({ error: "Solo el propietario puede agregar empresas" }, { status: 403 });
  }

  try {
    const body: unknown = await req.json();
    const parsed = EmpresaSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos", details: parsed.error.flatten() }, { status: 400 });
    }

    // Si se marca como principal, quitar el flag a las demás del mismo tenant
    if (parsed.data.es_principal) {
      await supabase
        .from("tenant_empresas")
        .update({ es_principal: false })
        .eq("tenant_id", auth.tenant_id);
    }

    const { data, error } = await supabase
      .from("tenant_empresas")
      .insert({
        ...parsed.data,
        tenant_id: auth.tenant_id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    // Loggear cambio
    await supabase.from("config_change_log").insert({
      tenant_id: auth.tenant_id,
      user_id: auth.id,
      field: "empresa.create",
      previous_value: "",
      new_value: `Nueva empresa: ${data.nombre} (${data.rfc})`,
      created_at: new Date().toISOString()
    });

    return NextResponse.json({ success: true, company: data });
  } catch (err: any) {
    console.error("[Companies POST] Error:", err);
    return NextResponse.json({ error: err.message || "Error interno" }, { status: 500 });
  }
}

/**
 * PATCH /api/settings/companies
 * Actualiza una empresa existente. Solo owner.
 */
export async function PATCH(req: NextRequest) {
  const supabase = createClient();
  const auth = await getAuthenticatedTenant(supabase);
  if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  if (auth.role !== "owner") {
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
  }

  try {
    const body: unknown = await req.json();
    const parsed = EmpresaSchema.partial().extend({ id: z.string().uuid() }).safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }

    const { id, ...updates } = parsed.data;

    // Si se está cambiando a principal
    if (updates.es_principal) {
      await supabase
        .from("tenant_empresas")
        .update({ es_principal: false })
        .eq("tenant_id", auth.tenant_id);
    }

    const { data: current } = await supabase
      .from("tenant_empresas")
      .select("*")
      .eq("id", id)
      .eq("tenant_id", auth.tenant_id)
      .single();

    if (!current) return NextResponse.json({ error: "Empresa no encontrada" }, { status: 404 });

    const { data, error } = await supabase
      .from("tenant_empresas")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("tenant_id", auth.tenant_id)
      .select()
      .single();

    if (error) throw error;

    // Loggear campos relevantes
    for (const [key, val] of Object.entries(updates)) {
      if (current[key] !== val) {
        await supabase.from("config_change_log").insert({
          tenant_id: auth.tenant_id,
          user_id: auth.id,
          field: `empresa.${id}.${key}`,
          previous_value: String(current[key]),
          new_value: String(val),
          created_at: new Date().toISOString()
        });
      }
    }

    return NextResponse.json({ success: true, company: data });
  } catch (err: any) {
    console.error("[Companies PATCH] Error:", err);
    return NextResponse.json({ error: err.message || "Error interno" }, { status: 500 });
  }
}

/**
 * DELETE /api/settings/companies
 * Elimina una empresa. No se puede eliminar la principal.
 */
export async function DELETE(req: NextRequest) {
  const supabase = createClient();
  const auth = await getAuthenticatedTenant(supabase);
  if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  if (auth.role !== "owner") return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Falta ID" }, { status: 400 });

  const { data: target } = await supabase
    .from("tenant_empresas")
    .select("es_principal, nombre")
    .eq("id", id)
    .eq("tenant_id", auth.tenant_id)
    .single();

  if (!target) return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  if (target.es_principal) return NextResponse.json({ error: "No se puede eliminar la empresa principal" }, { status: 400 });

  const { error } = await supabase
    .from("tenant_empresas")
    .delete()
    .eq("id", id)
    .eq("tenant_id", auth.tenant_id);

  if (error) return NextResponse.json({ error: "Error eliminando" }, { status: 500 });
  
  await supabase.from("config_change_log").insert({
    tenant_id: auth.tenant_id,
    user_id: auth.id,
    field: "empresa.delete",
    previous_value: target.nombre,
    new_value: "[ELIMINADA]",
    created_at: new Date().toISOString()
  });

  return NextResponse.json({ success: true });
}
