import { NextResponse } from 'next/server'

const SANDBOX_BI = {
  source: 'sandbox',
  stats: { total_dashboards: 3, total_widgets: 9, total_views: 368, shared_users: 5 },
  dashboards: [
    {
      id: 'bi1', name: 'Executive Overview', description: 'Vista 360° para dirección',
      widgets: [
        { id: 'w1', type: 'metric', title: 'Revenue MTD',        data_source: 'sales',     size: 'sm' },
        { id: 'w2', type: 'chart',  title: 'Ventas por Canal',   data_source: 'sales',     size: 'lg' },
        { id: 'w3', type: 'table',  title: 'Top 10 Productos',   data_source: 'products',  size: 'md' },
        { id: 'w4', type: 'metric', title: 'ROAS Global',        data_source: 'marketing', size: 'sm' },
      ],
      shared_with: ['admin@kaptools.com', 'ventas@kaptools.com'],
      created_by: 'Carlos Cortés', last_updated: '2026-05-09T14:30:00Z', views: 234,
    },
    {
      id: 'bi2', name: 'Marketing Performance', description: 'ROI y conversiones por canal',
      widgets: [
        { id: 'w5', type: 'chart',  title: 'ROAS por Canal',       data_source: 'marketing', size: 'lg' },
        { id: 'w6', type: 'metric', title: 'CAC Promedio',         data_source: 'marketing', size: 'sm' },
        { id: 'w7', type: 'chart',  title: 'Embudo Conversión',    data_source: 'funnel',    size: 'md' },
      ],
      shared_with: ['marketing@kaptools.com'],
      created_by: 'Laura Méndez', last_updated: '2026-05-10T09:00:00Z', views: 89,
    },
    {
      id: 'bi3', name: 'Inventory Intelligence', description: 'Stock, rotación y reorden',
      widgets: [
        { id: 'w8', type: 'table',  title: 'SKUs críticos',  data_source: 'inventory', size: 'md' },
        { id: 'w9', type: 'metric', title: 'Turnover Rate',  data_source: 'inventory', size: 'sm' },
      ],
      shared_with: ['almacen@kaptools.com'],
      created_by: 'Carlos Cortés', last_updated: '2026-05-08T16:00:00Z', views: 45,
    },
  ],
}

export async function GET() {
  const backendUrl = process.env.PYTHON_BACKEND_URL || 'http://localhost:8000'
  try {
    const res = await fetch(`${backendUrl}/api/sandbox/bi`, {
      signal: AbortSignal.timeout(4000),
    })
    if (res.ok) return NextResponse.json(await res.json())
  } catch {
    // fall through to sandbox
  }
  return NextResponse.json(SANDBOX_BI)
}
