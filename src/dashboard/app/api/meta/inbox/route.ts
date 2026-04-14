// src/dashboard/app/api/meta/inbox/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";

export async function GET() {
  const supabase = createClient();

  // 1. Verificar sesión y obtener tenant_id
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("tenant_id")
    .eq("id", user.id)
    .single();

  if (!profile?.tenant_id) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

  // 2. Obtener sesiones con el último mensaje
  // Usamos una query que nos de las sesiones y una muestra del último mensaje
  const { data: sessions, error } = await supabase
    .from("whatsapp_sessions")
    .select(`
      id,
      from_number,
      session_type,
      samantha_active,
      updated_at
    `)
    .eq("tenant_id", profile.tenant_id)
    .order("updated_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // 3. Para cada sesión, buscar el último mensaje (preview)
  // Nota: En un sistema de alto tráfico esto debería ser una vista o un trigger que 
  // actualice la sesión con el último mensaje. Para MVP hacemos fetch paralelo limitado.
  const sessionsWithPreview = await Promise.all(
    sessions.map(async (s) => {
      const { data: lastMsg } = await supabase
        .from("whatsapp_messages")
        .select("message_text, created_at, direction")
        .eq("tenant_id", profile.tenant_id)
        .eq("from_number", s.from_number)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      
      return {
        ...s,
        last_message: lastMsg?.message_text || "",
        last_message_at: lastMsg?.created_at || s.updated_at,
        last_message_direction: lastMsg?.direction || "inbound"
      };
    })
  );

  // Re-ordenar por fecha del último mensaje
  sessionsWithPreview.sort((a, b) => 
    new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
  );

  return NextResponse.json({ sessions: sessionsWithPreview });
}
