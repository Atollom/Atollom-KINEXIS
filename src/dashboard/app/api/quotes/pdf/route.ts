import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const backendUrl = process.env.PYTHON_BACKEND_URL || "http://localhost:8000";

  try {
    const res = await fetch(`${backendUrl}/api/agents/crm/quotes/pdf`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "PDF generation failed" }));
      return NextResponse.json(err, { status: res.status });
    }

    const pdfBytes = await res.arrayBuffer();
    const filename = res.headers.get("Content-Disposition")?.match(/filename="(.+?)"/)?.[1]
      ?? "cotizacion.pdf";

    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error("[quotes/pdf]", err);
    return NextResponse.json({ error: "PDF service unavailable" }, { status: 503 });
  }
}
