import { NextResponse } from "next/server";
import { CFDI_EMITIDAS, CFDI_STATS } from "@/lib/mockData";

const BACKEND = process.env.PYTHON_BACKEND_URL || "http://localhost:8000";

export async function GET() {
  try {
    const res = await fetch(`${BACKEND}/api/agents/erp/route`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ intent: "get_cfdi_invoices", tenant_id: "demo", data: { limit: 50 } }),
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.result?.invoices)
        return NextResponse.json({ invoices: data.result.invoices, stats: data.result.stats ?? CFDI_STATS, source: "backend" });
    }
  } catch { /* fall through */ }
  return NextResponse.json({ invoices: CFDI_EMITIDAS, stats: CFDI_STATS, source: "mock" });
}
