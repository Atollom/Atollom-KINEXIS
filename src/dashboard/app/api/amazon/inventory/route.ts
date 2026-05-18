import { NextResponse } from 'next/server'

const SANDBOX_INVENTORY = {
  source: 'sandbox',
  stats: {
    total_products: 52, fba_products: 38, fbm_products: 14, active_listings: 47,
    total_inventory_value: 145678, fba_inventory_units: 214, monthly_revenue: 67543,
    avg_profit_margin: 47.1, pending_shipments: 4, low_stock_alerts: 3,
    units_sold_month: 511, best_seller_rank: 634,
  },
  items: [
    { sku: 'KAP-TAL-003-FBA', asin: 'B08XYZ1001', title: 'Taladro Percutor Inalámbrico 20V',  fnsku: 'X001ABCDEF', fulfillment_center: 'PHX7', quantity: 145, reserved: 12, inbound: 50,  unfulfillable: 2, storage_type: 'standard', age_days: 45,  last_updated: '2026-05-10T14:00:00Z' },
    { sku: 'KAP-COM-007-FBA', asin: 'B09ABC2002', title: 'Compresor Aire 6 Galones 150 PSI',  fnsku: 'X002GHIJKL', fulfillment_center: 'PHX7', quantity: 34,  reserved: 3,  inbound: 25,  unfulfillable: 1, storage_type: 'oversize', age_days: 67,  last_updated: '2026-05-10T13:45:00Z' },
    { sku: 'KAP-SIE-210-FBA', asin: 'B06GHI4004', title: 'Sierra Circular 7-1/4" 15 Amp',    fnsku: 'X003MNOPQR', fulfillment_center: 'DFW6', quantity: 8,   reserved: 1,  inbound: 40,  unfulfillable: 0, storage_type: 'standard', age_days: 23,  last_updated: '2026-05-10T13:30:00Z' },
    { sku: 'KAP-LIJ-450-FBA', asin: 'B08JKL5005', title: 'Lijadora Orbital 2.4A 14000 OPM',  fnsku: 'X004STUVWX', fulfillment_center: 'ONT8', quantity: 0,   reserved: 0,  inbound: 68,  unfulfillable: 7, storage_type: 'standard', age_days: 34,  last_updated: '2026-05-10T13:00:00Z' },
    { sku: 'KAP-TAL-001-FBA', asin: 'B05MNO6006', title: 'Taladro Inalámbrico 12V Maletín',  fnsku: 'X005YZABCD', fulfillment_center: 'PHX7', quantity: 23,  reserved: 2,  inbound: 30,  unfulfillable: 0, storage_type: 'standard', age_days: 89,  last_updated: '2026-05-10T12:00:00Z' },
    { sku: 'KAP-SIE-210-OLD', asin: 'B06GHI4004', title: 'Sierra Circular 7-1/4" (Lote Mar)', fnsku: 'X006EFGHIJ', fulfillment_center: 'DFW6', quantity: 4,   reserved: 0,  inbound: 0,   unfulfillable: 2, storage_type: 'standard', age_days: 245, last_updated: '2026-05-10T11:00:00Z' },
  ],
}

export async function GET() {
  const backendUrl = process.env.PYTHON_BACKEND_URL || 'http://localhost:8000'
  try {
    const res = await fetch(`${backendUrl}/api/sandbox/amazon/inventory`, {
      signal: AbortSignal.timeout(4000),
    })
    if (res.ok) return NextResponse.json(await res.json())
  } catch {
    // fall through to sandbox
  }
  return NextResponse.json(SANDBOX_INVENTORY)
}
