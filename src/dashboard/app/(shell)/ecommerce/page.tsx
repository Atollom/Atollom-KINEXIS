'use client'

import Link from 'next/link'
import { ShoppingCart, Package, Tag, RotateCcw, Truck, Clock, ExternalLink } from 'lucide-react'

const platforms = [
  {
    name: 'Mercado Libre',
    status: 'pending',
    links: [
      { label: 'Productos ML', href: '/ecommerce/ml/products' },
      { label: 'Pedidos ML', href: '/ecommerce/ml/orders' },
      { label: 'Fulfillment ML', href: '/ecommerce/ml/fulfillment' },
      { label: 'Preguntas ML', href: '/ecommerce/ml/questions' },
      { label: 'Analytics ML', href: '/ecommerce/ml/analytics' },
    ],
  },
  {
    name: 'Amazon',
    status: 'pending',
    links: [
      { label: 'Productos Amazon', href: '/ecommerce/amazon/products' },
      { label: 'FBA Amazon', href: '/ecommerce/amazon/fba' },
      { label: 'Inventario Amazon', href: '/ecommerce/amazon/inventory' },
      { label: 'Analytics Amazon', href: '/ecommerce/amazon/analytics' },
    ],
  },
  {
    name: 'Shopify',
    status: 'pending',
    links: [
      { label: 'Productos Shopify', href: '/ecommerce/shopify/products' },
      { label: 'Pedidos Shopify', href: '/ecommerce/shopify/orders' },
      { label: 'Fulfillment Shopify', href: '/ecommerce/shopify/fulfillment' },
      { label: 'Analytics Shopify', href: '/ecommerce/shopify/analytics' },
    ],
  },
]

const managementLinks = [
  { label: 'Gestión de Precios', href: '/ecommerce/management/pricing', icon: Tag, desc: 'Agente #6 · Pricing inteligente' },
  { label: 'Inventario unificado', href: '/ecommerce/management/inventory', icon: Package, desc: 'Sincronización cross-platform' },
  { label: 'Devoluciones', href: '/ecommerce/management/returns', icon: RotateCcw, desc: 'Agente #14 · Gestión de retornos' },
  { label: 'Envíos', href: '/ecommerce/management/shipping', icon: Truck, desc: 'Integración Skydropx' },
]

export default function EcommercePage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">E-commerce</h1>
        <p className="text-sm text-gray-500 mt-1">Gestión unificada de canales de venta</p>
      </div>

      {/* Platform status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {platforms.map(platform => (
          <div key={platform.name} className="bg-white rounded-xl shadow-sm border border-yellow-100 p-5 opacity-75">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-900">{platform.name}</h2>
              <span className="flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                <Clock className="w-3 h-3" />
                Certificación pendiente
              </span>
            </div>
            <p className="text-xs text-gray-500 mb-3">Integración en espera de aprobación de desarrollador.</p>
            <div className="space-y-1">
              {platform.links.map(link => (
                <div key={link.href} className="flex items-center gap-2 py-1 text-sm text-gray-400 cursor-not-allowed">
                  <ShoppingCart className="w-3.5 h-3.5" />
                  {link.label}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Management tools (no platform needed) */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Gestión unificada</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {managementLinks.map(link => {
            const Icon = link.icon
            return (
              <Link key={link.href} href={link.href} className="group bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:border-green-200 hover:shadow-md transition-all">
                <div className="p-2.5 bg-green-50 rounded-xl inline-flex mb-3">
                  <Icon className="w-5 h-5 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900 group-hover:text-green-700 transition-colors mb-1">{link.label}</h3>
                <p className="text-xs text-gray-400">{link.desc}</p>
                <p className="text-xs text-green-600 mt-2 font-medium">Ir →</p>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700 flex items-start gap-3">
        <ExternalLink className="w-4 h-4 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold">Integraciones de marketplace en proceso de certificación</p>
          <p className="text-xs mt-1 text-blue-600">
            MercadoLibre, Amazon y Shopify requieren aprobación de sus programas de desarrolladores. Las herramientas de gestión interna están disponibles ahora. La integración completa se activará en cuanto se obtengan las certificaciones.
          </p>
        </div>
      </div>
    </div>
  )
}
