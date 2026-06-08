'use client'

import { Globe, FileText, MessageSquare, Package, Clock } from 'lucide-react'

const PORTAL_FEATURES = [
  {
    icon: FileText,
    label: 'Mis facturas',
    desc: 'El cliente puede ver y descargar sus CFDI desde un portal dedicado',
    status: 'planned',
  },
  {
    icon: Package,
    label: 'Estado de pedidos',
    desc: 'Seguimiento en tiempo real de órdenes sin necesidad de contactar soporte',
    status: 'planned',
  },
  {
    icon: MessageSquare,
    label: 'Soporte self-service',
    desc: 'Base de conocimiento y chat para resolver dudas comunes',
    status: 'planned',
  },
  {
    icon: Globe,
    label: 'Portal B2B',
    desc: 'Acceso especial para cuentas empresariales: cotizaciones y historial',
    status: 'planned',
  },
]

export default function CustomerPortalPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Portal del Cliente</h1>
        <p className="text-sm text-gray-500 mt-1">Autoservicio para clientes finales y cuentas B2B</p>
      </div>

      {/* Status banner */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 flex items-start gap-3">
        <Clock className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-blue-900">Módulo planificado — Fase 2</p>
          <p className="text-sm text-blue-700 mt-1">
            El portal del cliente es parte de la hoja de ruta post-MVP. Permite a tus clientes acceder a facturas, pedidos y soporte sin intervención del equipo.
          </p>
        </div>
      </div>

      {/* Features preview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {PORTAL_FEATURES.map(feat => {
          const Icon = feat.icon
          return (
            <div key={feat.label} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 opacity-70">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2.5 bg-gray-50 rounded-xl">
                  <Icon className="w-5 h-5 text-gray-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-700">{feat.label}</h3>
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">Próximamente</span>
                </div>
              </div>
              <p className="text-sm text-gray-400 ml-[52px]">{feat.desc}</p>
            </div>
          )
        })}
      </div>

      {/* Available now */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h2 className="font-semibold text-gray-900 mb-3">Disponible ahora para tu equipo</h2>
        <div className="flex flex-wrap gap-3">
          {[
            { label: 'Tickets de soporte', href: '/crm/support/tickets' },
            { label: 'Facturas CFDI', href: '/erp/cfdi/invoices' },
            { label: 'Base de clientes B2B', href: '/crm/pipeline/b2b' },
          ].map(link => (
            <a key={link.href} href={link.href} className="px-3 py-2 border border-gray-200 hover:border-green-400 hover:text-green-700 text-gray-600 text-sm font-medium rounded-lg transition-colors">
              {link.label} →
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
