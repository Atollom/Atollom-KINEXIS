// src/dashboard/app/api/settings/business-rules/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { getAuthenticatedTenant } from "@/lib/auth";
import { z } from "zod";

const BusinessRulesSchema = z.object({
  ml_margin:           z.number().min(0.01, "Margen ML debe ser > 0"),
  amazon_margin:       z.number().min(0.01, "Margen Amazon debe ser > 0"),
  shopify_margin:      z.number().min(0.01, "Margen Shopify debe ser > 0"),
  b2b_margin:          z.number().min(0.01, "Margen B2B debe ser > 0"),
  stock_safety_days:   z.number().int().min(1),
  stock_critical_days: z.number().int().min(1),
  nps_cooldown_days:   z.number().int().min(1).default(90),
}).refine(
  (d) => d.stock_critical_days < d.stock_safety_days,
  { message: "stock_critical_days debe ser menor que stock_safety_days" }
);

export async function GET(req: NextRequest) {
  const supabase = createClient();
  const auth = await getAuthenticatedTenant(supabase);
  if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { data, error } = await supabase
    .from("tenant_business_rules")
    .select("*")
    .eq("tenant_id", auth.tenant_id)
    .single();

  if (error) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest) {
  const supabase = createClient();
  const auth = await getAuthenticatedTenant(supabase);
  if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  // Only owner|admin can change business rules
  if (!["owner", "admin"].includes(auth.role)) {
    return NextResponse.json({ error: "Prohibido: Se requiere rol Admin/Owner" }, { status: 403 });
  }

  try {
    const body: unknown = await req.json();
    const parsed = BusinessRulesSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("tenant_business_rules")
      .update({ ...parsed.data, updated_at: new Date().toISOString() })
      .eq("tenant_id", auth.tenant_id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, rules: data });

  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
