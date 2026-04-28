'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  Building,
  Settings,
  ChevronDown,
  ChevronRight,
  Store,
  Package,
  ShoppingBag,
  MessageSquare,
  TrendingUp,
  DollarSign,
  Headphones,
  FileText,
  Calculator,
  Truck,
  Menu,
  X
} from 'lucide-react'
import Image from 'next/image'

interface MenuItem {
  label: string
  icon?: any
  href?: string
  badge?: string
  children?: MenuItem[]
  roles?: string[]
}

const menuItems: MenuItem[] = [
  {
    label: 'Dashboard',
    icon: LayoutDashboard,
    href: '/dashboard',
    roles: ['owner', 'admin', 'agente', 'almacenista', 'contador']
  },
  {
    label: 'E-commerce',
    icon: ShoppingCart,
    roles: ['owner', 'admin', 'agente', 'almacenista'],
    children: [
      { label: 'Dashboard', icon: LayoutDashboard, href: '/ecommerce' },
      {
        label: 'Mercado Libre',
        icon: Store,
        children: [
          { label: 'Productos', href: '/ecommerce/ml/products' },
          { label: 'Órdenes', href: '/ecommerce/ml/orders' },
          { label: 'Fulfillment', href: '/ecommerce/ml/fulfillment', badge: '#1' },
          { label: 'Preguntas', href: '/ecommerce/ml/questions', badge: '#27' },
          { label: 'Analytics', href: '/ecommerce/ml/analytics' }
        ]
      },
      {
        label: 'Amazon',
        icon: Package,
        children: [
          { label: 'Productos', href: '/ecommerce/amazon/products' },
          { label: 'FBA Manager', href: '/ecommerce/amazon/fba', badge: '#2' },
          { label: 'Inventario', href: '/ecommerce/amazon/inventory' },
          { label: 'Analytics', href: '/ecommerce/amazon/analytics' }
        ]
      },
      {
        label: 'Shopify',
        icon: ShoppingBag,
        children: [
          { label: 'Productos', href: '/ecommerce/shopify/products' },
          { label: 'Órdenes', href: '/ecommerce/shopify/orders' },
          { label: 'Fulfillment', href: '/ecommerce/shopify/fulfillment', badge: '#3' },
          { label: 'Analytics', href: '/ecommerce/shopify/analytics' }
        ]
      },
      {
        label: 'Gestión',
        icon: Settings,
        children: [
          { label: 'Precios', href: '/ecommerce/management/pricing', badge: '#6' },
          { label: 'Inventario', href: '/ecommerce/management/inventory' },
          { label: 'Devoluciones', href: '/ecommerce/management/returns', badge: '#14' },
          { label: 'Envíos', href: '/ecommerce/management/shipping' }
        ]
      }
    ]
  },
  {
    label: 'CRM',
    icon: Users,
    roles: ['owner', 'admin', 'agente'],
    children: [
      { label: 'Dashboard', icon: LayoutDashboard, href: '/crm' },
      {
        label: 'Inbox',
        icon: MessageSquare,
        children: [
          { label: 'WhatsApp', href: '/crm/inbox/whatsapp' },
          { label: 'Instagram', href: '/crm/inbox/instagram' },
          { label: 'Facebook', href: '/crm/inbox/facebook' },
          { label: 'Unificado', href: '/crm/inbox/unified' }
        ]
      },
      {
        label: 'Pipeline',
        icon: TrendingUp,
        children: [
          { label: 'Kanban', href: '/crm/pipeline' },
          { label: 'Leads', href: '/crm/pipeline/leads' },
          { label: 'Lead Scorer', href: '/crm/pipeline/scorer', badge: '#31' },
          { label: 'B2B Collector', href: '/crm/pipeline/b2b', badge: '#4' }
        ]
      },
      {
        label: 'Ventas',
        icon: DollarSign,
        children: [
          { label: 'Cotizaciones', href: '/crm/sales/quotes', badge: '#32' },
          { label: 'Oportunidades', href: '/crm/sales/opportunities' },
          { label: 'Seguimiento', href: '/crm/sales/follow-ups', badge: '#33' },
          { label: 'Cerrados', href: '/crm/sales/deals' }
        ]
      },
      {
        label: 'Soporte',
        icon: Headphones,
        children: [
          { label: 'Tickets', href: '/crm/support/tickets', badge: '#37' },
          { label: 'NPS', href: '/crm/support/nps', badge: '#19' },
          { label: 'Base Conocimiento', href: '/crm/support/kb' }
        ]
      }
    ]
  },
  {
    label: 'ERP',
    icon: Building,
    roles: ['owner', 'admin', 'contador', 'almacenista'],
    children: [
      { label: 'Dashboard', icon: LayoutDashboard, href: '/erp' },
      {
        label: 'CFDI / SAT',
        icon: FileText,
        children: [
          { label: 'Dashboard', href: '/erp/cfdi' },
          { label: 'Facturas', href: '/erp/cfdi/invoices' },
          { label: 'Generar CFDI', href: '/erp/cfdi/billing', badge: '#13' },
          { label: 'Compliance', href: '/erp/cfdi/compliance' },
          { label: 'Impresión', href: '/erp/cfdi/print', badge: '#24' }
        ]
      },
      {
        label: 'Contabilidad',
        icon: Calculator,
        children: [
          { label: 'Dashboard', href: '/erp/accounting' },
          { label: 'Catálogo', href: '/erp/accounting/chart' },
          { label: 'Diario', href: '/erp/accounting/journal' },
          { label: 'Reportes', href: '/erp/accounting/reports' }
        ]
      },
      {
        label: 'Finanzas',
        icon: TrendingUp,
        children: [
          { label: 'Snapshot', href: '/erp/finance', badge: '#18' },
          { label: 'CxC', href: '/erp/finance/receivables' },
          { label: 'CxP', href: '/erp/finance/payables' },
          { label: 'Bancos', href: '/erp/finance/banking' },
          { label: 'Cash Flow', href: '/erp/finance/cashflow' }
        ]
      },
      {
        label: 'Inventario',
        icon: Package,
        children: [
          { label: 'Monitor', href: '/erp/inventory', badge: '#5' },
          { label: 'Productos', href: '/erp/inventory/products' },
          { label: 'Almacenes', href: '/erp/inventory/warehouses' },
          { label: 'Movimientos', href: '/erp/inventory/movements' },
          { label: 'Valorización', href: '/erp/inventory/valuation' }
        ]
      },
      {
        label: 'Compras',
        icon: ShoppingCart,
        children: [
          { label: 'Órdenes', href: '/erp/purchases/orders', badge: '#30' },
          { label: 'Proveedores', href: '/erp/purchases/suppliers', badge: '#16' },
          { label: 'Recepción', href: '/erp/purchases/receiving' }
        ]
      },
      {
        label: 'Logística',
        icon: Truck,
        children: [
          { label: 'Envíos', href: '/erp/logistics/shipping', badge: '#25' },
          { label: 'Rastreo', href: '/erp/logistics/tracking' },
          { label: 'Paqueterías', href: '/erp/logistics/carriers' }
        ]
      }
    ]
  },
  {
    label: 'Configuración',
    icon: Settings,
    href: '/settings',
    roles: ['owner', 'admin']
  }
]

function NavItem({ item, depth = 0 }: { item: MenuItem; depth?: number }) {
  const pathname = usePathname()
  const [expanded, setExpanded] = useState(() => {
    if (!item.children) return false
    return item.children.some(c =>
      c.href ? pathname.startsWith(c.href) : false
    ) || ['E-commerce', 'CRM', 'ERP'].includes(item.label)
  })

  const isActive = (href?: string) =>
    href ? pathname === href || pathname.startsWith(href + '/') : false

  const active = isActive(item.href)

  if (item.children) {
    return (
      <div className={depth === 0 ? 'mb-1' : ''}>
        <button
          onClick={() => setExpanded(v => !v)}
          style={{ color: 'var(--text-secondary)' }}
          className={`
            w-full flex items-center justify-between rounded-lg transition-colors
            ${depth === 0 ? 'px-3 py-2 text-sm font-semibold' : 'px-3 py-1.5 text-xs font-medium'}
            hover:bg-black/5 dark:hover:bg-white/5 hover:!text-[color:var(--text-primary)]
          `}
        >
          <span className="flex items-center gap-2">
            {item.icon && <item.icon className="w-4 h-4 flex-shrink-0" />}
            {item.label}
          </span>
          {expanded
            ? <ChevronDown className="w-3 h-3" />
            : <ChevronRight className="w-3 h-3" />}
        </button>
        {expanded && (
          <div className={`mt-0.5 space-y-0.5 ${depth === 0 ? 'ml-3' : 'ml-4'}`}>
            {item.children.map(child => (
              <NavItem key={child.label} item={child} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <Link
      href={item.href || '#'}
      style={active
        ? { color: 'var(--accent-primary)', backgroundColor: 'rgba(205,255,0,0.1)' }
        : { color: 'var(--text-muted)' }
      }
      className={`
        flex items-center gap-2 rounded-lg transition-colors
        ${depth === 0 ? 'px-3 py-2 text-sm font-semibold' : 'px-3 py-1.5 text-xs'}
        ${!active ? 'hover:bg-black/5 dark:hover:bg-white/5 hover:!text-[color:var(--text-primary)]' : 'font-semibold'}
      `}
    >
      {item.icon && <item.icon className="w-4 h-4 flex-shrink-0" />}
      <span className="truncate">{item.label}</span>
      {item.badge && (
        <span
          className="ml-auto text-[10px] px-1.5 py-0.5 rounded flex-shrink-0"
          style={{ backgroundColor: 'rgba(205,255,0,0.1)', color: 'var(--accent-primary)' }}
        >
          {item.badge}
        </span>
      )}
    </Link>
  )
}

export function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false)

  const inner = (
    <aside
      className="w-[260px] h-full flex flex-col flex-shrink-0 transition-colors duration-300"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderRight: '1px solid var(--border-color)',
      }}
    >
      {/* Logo */}
      <div className="p-5" style={{ borderBottom: '1px solid var(--border-color)' }}>
        <div className="flex items-center gap-3">
          <Image src="/branding/atollom-icon.png" alt="Atollom" width={32} height={32} className="rounded-lg flex-shrink-0" />
          <Image src="/branding/logo.png" alt="KINEXIS" width={110} height={32} className="h-7 w-auto object-contain" priority />
        </div>
        <p className="text-[9px] mt-2 tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>
          By Atollom Labs
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-0.5 custom-scrollbar">
        {menuItems.map(item => (
          <NavItem key={item.label} item={item} depth={0} />
        ))}
      </nav>
    </aside>
  )

  return (
    <>
      {/* Desktop */}
      <div className="hidden lg:flex h-full">{inner}</div>

      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg"
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
        }}
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
      </button>

      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          <div className="lg:hidden fixed inset-0 z-40 flex">
            <div className="flex h-full">{inner}</div>
            <div className="flex-1 bg-black/50" onClick={() => setMobileOpen(false)} />
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden fixed top-4 left-[268px] z-50 p-2 rounded-lg"
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
            }}
            aria-label="Close menu"
          >
            <X className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
          </button>
        </>
      )}
    </>
  )
}
