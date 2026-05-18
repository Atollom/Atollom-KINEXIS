import { NextResponse } from 'next/server'

const SANDBOX_ANALYTICS = {
  source: 'sandbox',
  summary: {
    total_sales: 67543,
    total_orders: 187,
    avg_ticket: 361.20,
    conversion_rate: 4.8,
    growth_vs_prev: 18.3,
    fba_percentage: 73,
    avg_profit_margin: 38.5,
  },
  sales_trend: [
    { date: '2026-05-01', sales: 6200,  orders: 18, avg_ticket: 344 },
    { date: '2026-05-02', sales: 7100,  orders: 21, avg_ticket: 338 },
    { date: '2026-05-03', sales: 6800,  orders: 17, avg_ticket: 400 },
    { date: '2026-05-04', sales: 8200,  orders: 24, avg_ticket: 342 },
    { date: '2026-05-05', sales: 9100,  orders: 28, avg_ticket: 325 },
    { date: '2026-05-06', sales: 7900,  orders: 20, avg_ticket: 395 },
    { date: '2026-05-07', sales: 6500,  orders: 16, avg_ticket: 406 },
    { date: '2026-05-08', sales: 7400,  orders: 19, avg_ticket: 389 },
    { date: '2026-05-09', sales: 6800,  orders: 18, avg_ticket: 378 },
    { date: '2026-05-10', sales: 7543,  orders: 20, avg_ticket: 377 },
  ],
  monthly_sales: [
    { month: 'Nov 2025', revenue: 41200, units: 312, orders: 278 },
    { month: 'Dic 2025', revenue: 58900, units: 445, orders: 401 },
    { month: 'Ene 2026', revenue: 38750, units: 294, orders: 262 },
    { month: 'Feb 2026', revenue: 44100, units: 334, orders: 301 },
    { month: 'Mar 2026', revenue: 52300, units: 396, orders: 355 },
    { month: 'Abr 2026', revenue: 61480, units: 466, orders: 419 },
    { month: 'May 2026', revenue: 67543, units: 511, orders: 461 },
  ],
  top_products: [
    { name: 'Taladro Percutor 20V',     sku: 'KAP-TAL-003-FBA', units_sold: 67,  revenue: 60267, growth: 34.2  },
    { name: 'Kit Herramientas 128pz',   sku: 'KAP-KIT-105-FBM', units_sold: 145, revenue: 95685, growth: 52.7  },
    { name: 'Compresor Portátil 6 Gal', sku: 'KAP-COM-007-FBA', units_sold: 23,  revenue: 34500, growth: 15.8  },
    { name: 'Sierra Circular 7-1/4"',   sku: 'KAP-SIE-210-FBA', units_sold: 19,  revenue: 22800, growth: -8.2  },
    { name: 'Lijadora Orbital 14k OPM', sku: 'KAP-LIJ-450-FBA', units_sold: 89,  revenue: 40930, growth: 78.3  },
  ],
  fulfillment_split: [
    { name: 'FBA', value: 73, sales: 49326 },
    { name: 'FBM', value: 27, sales: 18217 },
  ],
  fees: [
    { label: 'Referral',       amount: 8234, pct: 52 },
    { label: 'FBA Fulfil.',    amount: 3109, pct: 31 },
    { label: 'Almacenamiento', amount: 1200, pct: 9  },
    { label: 'AMS',            amount: 1000, pct: 8  },
  ],
}

export async function GET() {
  const backendUrl = process.env.PYTHON_BACKEND_URL || 'http://localhost:8000'
  try {
    const res = await fetch(`${backendUrl}/api/sandbox/amazon/analytics`, {
      signal: AbortSignal.timeout(4000),
    })
    if (res.ok) return NextResponse.json(await res.json())
  } catch {
    // fall through to sandbox
  }
  return NextResponse.json(SANDBOX_ANALYTICS)
}
