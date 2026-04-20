'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight, Home } from 'lucide-react'

const segmentLabels: Record<string, string> = {
  dashboard: 'Dashboard',
  ecommerce: 'E-commerce',
  crm: 'CRM',
  erp: 'ERP',
  ml: 'Mercado Libre',
  amazon: 'Amazon',
  shopify: 'Shopify',
  management: 'Gestión',
  products: 'Productos',
  orders: 'Órdenes',
  fulfillment: 'Fulfillment',
  questions: 'Preguntas',
  analytics: 'Analytics',
  fba: 'FBA Manager',
  inventory: 'Inventario',
  pricing: 'Precios',
  returns: 'Devoluciones',
  shipping: 'Envíos',
  inbox: 'Inbox',
  whatsapp: 'WhatsApp',
  instagram: 'Instagram',
  facebook: 'Facebook',
  unified: 'Unificado',
  pipeline: 'Pipeline',
  leads: 'Leads',
  scorer: 'Lead Scorer',
  b2b: 'B2B Collector',
  sales: 'Ventas',
  quotes: 'Cotizaciones',
  opportunities: 'Oportunidades',
  'follow-ups': 'Seguimiento',
  deals: 'Cerrados',
  support: 'Soporte',
  tickets: 'Tickets',
  nps: 'NPS',
  kb: 'Base de Conocimiento',
  cfdi: 'CFDI / SAT',
  invoices: 'Facturas',
  billing: 'Generar CFDI',
  compliance: 'Compliance',
  print: 'Impresión',
  accounting: 'Contabilidad',
  chart: 'Catálogo',
  journal: 'Diario',
  reports: 'Reportes',
  finance: 'Finanzas',
  receivables: 'CxC',
  payables: 'CxP',
  banking: 'Bancos',
  cashflow: 'Cash Flow',
  warehouses: 'Almacenes',
  movements: 'Movimientos',
  valuation: 'Valorización',
  purchases: 'Compras',
  suppliers: 'Proveedores',
  receiving: 'Recepción',
  logistics: 'Logística',
  tracking: 'Rastreo',
  carriers: 'Paqueterías',
  settings: 'Configuración',
}

export function Breadcrumbs() {
  const pathname = usePathname()
  const segments = pathname.split('/').filter(Boolean)

  const crumbs = segments.map((seg, i) => ({
    href: '/' + segments.slice(0, i + 1).join('/'),
    label: segmentLabels[seg] ?? seg.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
  }))

  return (
    <nav className="flex items-center gap-1.5 text-xs text-white/40" aria-label="Breadcrumb">
      <Link href="/dashboard" className="hover:text-white/70 transition-colors">
        <Home className="w-3.5 h-3.5" />
      </Link>

      {crumbs.map((crumb, i) => (
        <span key={crumb.href} className="flex items-center gap-1.5">
          <ChevronRight className="w-3 h-3" />
          {i === crumbs.length - 1 ? (
            <span className="text-white/80 font-medium">{crumb.label}</span>
          ) : (
            <Link href={crumb.href} className="hover:text-white/70 transition-colors">
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  )
}
