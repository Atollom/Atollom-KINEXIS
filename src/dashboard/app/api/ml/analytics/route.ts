import { NextResponse } from "next/server";
import { mockMLAnalytics } from "@/lib/mockData";

const BACKEND = process.env.PYTHON_BACKEND_URL || "http://localhost:8000";

export async function GET() {
  try {
    const res = await fetch(`${BACKEND}/api/sandbox/data/ml/metrics`, {
      signal: AbortSignal.timeout(4000),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.summary) return NextResponse.json({ ...data, source: "sandbox" });
    }
  } catch { /* fall through */ }
  return NextResponse.json({ ...mockMLAnalytics, source: "mock" });
}
