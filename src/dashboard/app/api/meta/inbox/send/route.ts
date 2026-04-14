// src/dashboard/app/api/meta/inbox/send/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const { phone, text } = await req.json();
    if (!phone || !text) return NextResponse.json({ error: "Missing parameters" }, { status: 400 });

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("tenant_id")
      .eq("id", user.id)
      .single();

    if (!profile?.tenant_id) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

    // 1. Insertar el mensaje outbound
    const { data: message, error: msgError } = await supabase
      .from("whatsapp_messages")
      .insert({
        tenant_id: profile.tenant_id,
        from_number: phone, // El "from_number" en esta tabla parece referirse al cliente, 
                           // revisando 008, from_number es donde viene el msg. 
                           // Para outbound, guardamos el número del cliente en from_number 
                           // y marcamos direction='outbound'.
        to_number: "system", 
        direction: "outbound",
        message_text: text,
        message_type: "text",
        processed: true
      })
      .select()
      .single();

    if (msgError) return NextResponse.json({ error: msgError.message }, { status: 500 });

    // 2. Actualizar la sesión para que aparezca arriba en la lista
    await supabase
      .from("whatsapp_sessions")
      .update({ updated_at: new Date().toISOString() })
      .eq("tenant_id", profile.tenant_id)
      .eq("from_number", phone);

    return NextResponse.json({ success: true, message });
  } catch (err) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
