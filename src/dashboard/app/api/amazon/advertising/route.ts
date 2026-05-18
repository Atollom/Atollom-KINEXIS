import { NextResponse } from 'next/server'

const SANDBOX_ADVERTISING = {
  source: 'sandbox',
  stats: { total_spend: 1181.90, total_sales: 4961, avg_acos: 24.3, avg_roas: 4.12, total_impressions: 163400, total_clicks: 4876 },
  campaigns: [
    { id: 'ac1', name: 'SP - Herramientas Exact Match',    type: 'SP', status: 'enabled', budget: 500, spend: 312.40, impressions: 28400, clicks: 892,  acos: 18.2, roas: 5.49, sales: 1716 },
    { id: 'ac2', name: 'SB - Marca KapTools',             type: 'SB', status: 'enabled', budget: 300, spend: 201.80, impressions: 54200, clicks: 1203, acos: 22.4, roas: 4.46, sales: 900  },
    { id: 'ac3', name: 'SP - Compresores Broad',          type: 'SP', status: 'enabled', budget: 400, spend: 389.10, impressions: 61000, clicks: 2140, acos: 31.5, roas: 3.17, sales: 1235 },
    { id: 'ac4', name: 'SD - Retargeting Visitantes',     type: 'SD', status: 'paused',  budget: 200, spend: 0,      impressions: 0,     clicks: 0,    acos: 0,    roas: 0,    sales: 0    },
    { id: 'ac5', name: 'SP - Taladros Automatch',         type: 'SP', status: 'enabled', budget: 350, spend: 278.60, impressions: 19800, clicks: 641,  acos: 25.1, roas: 3.98, sales: 1110 },
  ],
}

export async function GET() {
  const backendUrl = process.env.PYTHON_BACKEND_URL || 'http://localhost:8000'
  try {
    const res = await fetch(`${backendUrl}/api/sandbox/amazon/advertising`, {
      signal: AbortSignal.timeout(4000),
    })
    if (res.ok) return NextResponse.json(await res.json())
  } catch {
    // fall through to sandbox
  }
  return NextResponse.json(SANDBOX_ADVERTISING)
}
