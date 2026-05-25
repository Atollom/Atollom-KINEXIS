import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { getAuthenticatedTenant } from "@/lib/auth";
import { mockMLQuestions, mockMLStats } from "@/lib/mockData";

const BACKEND = process.env.PYTHON_BACKEND_URL || "http://localhost:8000";

export async function GET(req: NextRequest) {
  const supabase = createClient();
  const auth = await getAuthenticatedTenant(supabase);
  if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { tenant_id } = auth;

  // Try real ML API via backend (uses ml_credentials table)
  try {
    const { data: creds } = await supabase
      .from("ml_credentials")
      .select("access_token, ml_user_id")
      .eq("tenant_id", tenant_id)
      .single();

    if (creds?.access_token) {
      const res = await fetch(`${BACKEND}/api/ml/questions?tenant_id=${tenant_id}`, {
        headers: { Authorization: `Bearer ${creds.access_token}` },
        signal: AbortSignal.timeout(6000),
      });
      if (res.ok) {
        const data = await res.json();
        const questions = data.questions ?? data.results ?? [];
        if (Array.isArray(questions) && questions.length > 0) {
          return NextResponse.json({ questions, stats: data.stats ?? {}, source: "ml_api" });
        }
      }
    }
  } catch { /* fall through */ }

  // Fallback: mock data
  return NextResponse.json({
    questions: mockMLQuestions,
    stats: { avg_response_time_hrs: mockMLStats.avg_response_time_hrs },
    source: "mock",
  });
}
