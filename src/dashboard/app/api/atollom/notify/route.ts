// src/dashboard/app/api/atollom/notify/route.ts
// Endpoint interno para notificaciones WhatsApp al superadmin Atollom.
// Solo atollom_admin puede acceder — nunca tenants regulares.
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { getAuthenticatedTenant } from "@/lib/auth";

/**
 * POST /api/atollom/notify
 * Registra una notificación interna para entrega vía WhatsApp al superadmin.
 * Body: { message: string, severity?: "info" | "high" | "critical" }
 *
 * El agente de WhatsApp recoge los registros pending de system_notifications
 * y los despacha al número +525646060947.
 */
export async function POST(req: NextRequest) {
  const supabase = createClient();
  const auth = await getAuthenticatedTenant(supabase);

  if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  // Doble-check: el middleware ya debería haber rechazado, pero defense in depth
  if (auth.role !== "atollom_admin") {
    return NextResponse.json({ error: "Prohibido: Solo Atollom Admin" }, { status: 403 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { message, severity = "info" } = body as { message?: string; severity?: string };

    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json({ error: "message es requerido" }, { status: 400 });
    }

    const validSeverities = ["info", "high", "critical"];
    if (!validSeverities.includes(severity)) {
      return NextResponse.json({ error: "severity inválido" }, { status: 400 });
    }

    const { error } = await supabase.from("system_notifications").insert({
      recipient_phone: "+525646060947",
      channel:         "whatsapp",
      message:         `[KINEXIS SUPERADMIN] ${message.trim()}`,
      severity,
      sent_by:         auth.id,
      status:          "pending",
      created_at:      new Date().toISOString(),
    });

    if (error) {
      console.error("[Atollom Notify] DB insert error:", error);
      return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Atollom Notify] Unexpected error:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
