import { NextResponse } from "next/server";
import { mockShopifyOrders, mockShopifyStats } from "@/lib/mockData";

const BACKEND = process.env.PYTHON_BACKEND_URL || "http://localhost:8000";

export async function GET() {
  try {
    const res = await fetch(`${BACKEND}/api/sandbox/data/shopify/orders?limit=50`, {
      signal: AbortSignal.timeout(4000),
    });
    if (res.ok) {
      const data = await res.json();
      const orders = data.orders ?? data.results ?? data;
      if (Array.isArray(orders) && orders.length > 0)
        return NextResponse.json({ orders, stats: data.stats ?? mockShopifyStats, source: "sandbox" });
    }
  } catch { /* fall through */ }
  return NextResponse.json({ orders: mockShopifyOrders, stats: mockShopifyStats, source: "mock" });
}
