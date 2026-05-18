import { NextResponse } from "next/server";
import { mockShopifyProducts, mockShopifyStats } from "@/lib/mockData";

const BACKEND = process.env.PYTHON_BACKEND_URL || "http://localhost:8000";

export async function GET() {
  try {
    const res = await fetch(`${BACKEND}/api/sandbox/data/shopify/products?limit=50`, {
      signal: AbortSignal.timeout(4000),
    });
    if (res.ok) {
      const data = await res.json();
      const products = data.products ?? data.results ?? data;
      if (Array.isArray(products) && products.length > 0)
        return NextResponse.json({ products, stats: data.stats ?? mockShopifyStats, source: "sandbox" });
    }
  } catch { /* fall through */ }
  return NextResponse.json({ products: mockShopifyProducts, stats: mockShopifyStats, source: "mock" });
}
