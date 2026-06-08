'use client'

import { useEffect, useState } from 'react'
import { DollarSign, Package, ShoppingCart, Truck, TrendingUp, AlertTriangle, FileText, Warehouse } from 'lucide-react'
import Link from 'next/link'

interface ERPSnapshot {
  finance: { receivables: number; payables: number; overdue: number }
  inventory: { skus: number; low_stock: number; total_value: number }
  purchases: { pending: number; in_transit: number }
  logistics: { active_shipments: number }
  cfdi: { this_month: number; total_invoiced: number }
}

function fmt(n: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n)
}

const modules = [
  {
    title: 'Finanzas',
    icon: DollarSign,
    color: 'text-green-600',
    bg: 'bg-green-50',
    links: [
      { label: 'Cuentas por Cobrar', href: '/erp/finance/receivables' },
      { label: 'Cuentas por Pagar', href: '/erp/finance/payables' },
      { label: 'Flujo de Caja', href: '/erp/finance/cashflow' },
      { label: 'Banca', href: '/erp/finance/banking' },
    ],
  },
  {
    title: 'Contabilidad',
    icon: FileText,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    links: [
      { label: 'Catálogo de Cuentas', href: '/erp/accounting/chart' },
      { label: 'Libro Diario', href: '/erp/accounting/journal' },
      { label: 'Reportes', href: '/erp/accounting/reports' },
    ],
  },
  {
    title: 'CFDI',
    icon: FileText,
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    links: [
      { label: 'Facturas', href: '/erp/cfdi/invoices' },
      { label: 'Facturación', href: '/erp/cfdi/billing' },
      { label: 'Cumplimiento', href: '/erp/cfdi/compliance' },
    ],
  },
  {
    title: 'Inventario',
    icon: Package,
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    links: [
      { label: 'Productos', href: '/erp/inventory/products' },
      { label: 'Almacenes', href: '/erp/inventory/warehouses' },
      { label: 'Movimientos', href: '/erp/inventory/movements' },
      { label: 'Valuación', href: '/erp/inventory/valuation' },
    ],
  },
  {
    title: 'Compras',
    icon: ShoppingCart,
    color: 'text-yellow-600',
    bg: 'bg-yellow-50',
    links: [
      { label: 'Órdenes', href: '/erp/purchases/orders' },
      { label: 'Proveedores', href: '/erp/purchases/suppliers' },
      { label: 'Recepción', href: '/erp/purchases/receiving' },
    ],
  },
  {
    title: 'Logística',
    icon: Truck,
    color: 'text-cyan-600',
    bg: 'bg-cyan-50',
    links: [
      { label: 'Envíos', href: '/erp/logistics/shipping' },
      { label: 'Rastreo', href: '/erp/logistics/tracking' },
      { label: 'Carriers', href: '/erp/logistics/carriers' },
    ],
  },
]

export default function ERPPage() {
  const [snapshot, setSnapshot] = useState<ERPSnapshot | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.allSettled([
      fetch('/api/erp/finance/receivables').then(r => r.json()),
      fetch('/api/erp/finance/payables').then(r => r.json()),
      fetch('/api/erp/inventory/valuation').then(r => r.json()),
      fetch('/api/erp/purchases/receiving').then(r => r.json()),
      fetch('/api/erp/logistics/shipping').then(r => r.json()),
    ]).then(([recv, pay, inv, purch, ship]) => {
      const r = recv.status === 'fulfilled' ? recv.value : {}
      const p = pay.status === 'fulfilled' ? pay.value : {}
      const i = inv.status === 'fulfilled' ? inv.value : {}
      const pu = purch.status === 'fulfilled' ? purch.value : {}
      const s = ship.status === 'fulfilled' ? ship.value : {}

      setSnapshot({
        finance: {
          receivables: r.stats?.total_receivables ?? 0,
          payables: p.stats?.total_payables ?? 0,
          overdue: (r.stats?.overdue_amount ?? 0) + (p.stats?.overdue_amount ?? 0),
        },
        inventory: {
          skus: i.stats?.sku_count ?? 0,
          low_stock: 0,
          total_value: i.stats?.total_value ?? 0,
        },
        purchases: {
          pending: pu.stats?.pending ?? 0,
          in_transit: pu.stats?.pending ?? 0,
        },
        logistics: { active_shipments: s.stats?.active ?? 0 },
        cfdi: { this_month: 0, total_invoiced: r.stats?.total_receivables ?? 0 },
      })
    }).finally(() => setLoading(false))
  }, [])

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">ERP — Recursos Empresariales</h1>
        <p className="text-sm text-gray-500 mt-1">Finanzas, inventario, compras y logística en un solo lugar</p>
      </div>

      {/* KPI strip */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-5 animate-pulse h-24 border border-gray-100" />
          ))}
        </div>
      ) : snapshot && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-2"><TrendingUp className="w-4 h-4 text-green-500" /><span className="text-xs text-gray-500">Por cobrar</span></div>
            <p className="text-xl font-bold text-green-700">{fmt(snapshot.finance.receivables)}</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-2"><Warehouse className="w-4 h-4 text-orange-500" /><span className="text-xs text-gray-500">Valor inventario</span></div>
            <p className="text-xl font-bold text-orange-700">{fmt(snapshot.inventory.total_value)}</p>
            <p className="text-xs text-gray-400">{snapshot.inventory.skus} SKUs</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-2"><Truck className="w-4 h-4 text-cyan-500" /><span className="text-xs text-gray-500">Envíos activos</span></div>
            <p className="text-2xl font-bold text-cyan-700">{snapshot.logistics.active_shipments}</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-2"><AlertTriangle className="w-4 h-4 text-red-500" /><span className="text-xs text-gray-500">Vencido total</span></div>
            <p className="text-xl font-bold text-red-600">{fmt(snapshot.finance.overdue)}</p>
          </div>
        </div>
      )}

      {/* Module grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {modules.map(mod => {
          const Icon = mod.icon
          return (
            <div key={mod.title} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className={`px-5 py-4 border-b border-gray-100 flex items-center gap-3`}>
                <div className={`p-2 rounded-lg ${mod.bg}`}>
                  <Icon className={`w-5 h-5 ${mod.color}`} />
                </div>
                <h2 className="font-semibold text-gray-900">{mod.title}</h2>
              </div>
              <div className="p-3">
                {mod.links.map(link => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors group"
                  >
                    <span className="text-sm text-gray-700 group-hover:text-green-700 transition-colors">{link.label}</span>
                    <span className="text-gray-300 group-hover:text-green-500 transition-colors text-xs">→</span>
                  </Link>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
