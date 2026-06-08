'use client'

import { Check, Zap, Building2, Globe } from 'lucide-react'

const plans = [
  {
    name: 'Starter',
    price: 999,
    period: 'mes',
    description: 'Para equipos pequeños que inician con automatización',
    icon: Zap,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    features: [
      '500 mensajes Samantha/mes',
      '3 usuarios incluidos',
      '10 GB almacenamiento',
      'CRM básico (leads + pipeline)',
      'ERP básico (facturación CFDI)',
      'Soporte por email',
      '1 marketplace (ML o Shopify)',
    ],
    cta: 'Comenzar gratis 14 días',
    highlighted: false,
  },
  {
    name: 'Growth',
    price: 2499,
    period: 'mes',
    description: 'Para empresas en crecimiento con operación activa',
    icon: Building2,
    color: 'text-green-600',
    bg: 'bg-green-50',
    features: [
      '2,000 mensajes Samantha/mes',
      '10 usuarios incluidos',
      '50 GB almacenamiento',
      'CRM completo + automatización',
      'ERP completo (finanzas + logística)',
      'Todos los marketplaces',
      'WhatsApp Business + Instagram',
      'Soporte prioritario',
      'Agentes IA: todos los 43',
    ],
    cta: 'Elegir Growth',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: 0,
    period: 'personalizado',
    description: 'Para empresas con necesidades específicas y alto volumen',
    icon: Globe,
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    features: [
      'Mensajes Samantha ilimitados',
      'Usuarios ilimitados',
      'Almacenamiento personalizado',
      'Onboarding dedicado',
      'SLA garantizado 99.9%',
      'Integraciones personalizadas',
      'Soporte 24/7 con account manager',
      'Entrenamiento personalizado de IA',
    ],
    cta: 'Contactar ventas',
    highlighted: false,
  },
]

export default function PricingPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">Planes KINEXIS</h1>
        <p className="text-gray-500 mt-2">Automatiza toda tu operación con IA. Sin contratos de permanencia.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto w-full">
        {plans.map(plan => {
          const Icon = plan.icon
          return (
            <div key={plan.name} className={`bg-white rounded-2xl shadow-sm border-2 p-6 flex flex-col ${plan.highlighted ? 'border-green-500 ring-2 ring-green-200' : 'border-gray-100'}`}>
              {plan.highlighted && (
                <div className="text-center mb-4">
                  <span className="px-3 py-1 bg-green-600 text-white text-xs font-semibold rounded-full">Más popular</span>
                </div>
              )}
              <div className={`inline-flex p-3 rounded-xl ${plan.bg} mb-4 w-fit`}>
                <Icon className={`w-6 h-6 ${plan.color}`} />
              </div>
              <h2 className="text-xl font-bold text-gray-900">{plan.name}</h2>
              <p className="text-sm text-gray-500 mt-1 mb-4">{plan.description}</p>

              <div className="mb-6">
                {plan.price > 0 ? (
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-gray-900">${plan.price.toLocaleString()}</span>
                    <span className="text-gray-400 text-sm">MXN/{plan.period}</span>
                  </div>
                ) : (
                  <p className="text-2xl font-bold text-gray-900">Personalizado</p>
                )}
              </div>

              <ul className="space-y-2 flex-1 mb-6">
                {plan.features.map(feat => (
                  <li key={feat} className="flex items-start gap-2 text-sm text-gray-600">
                    <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                    {feat}
                  </li>
                ))}
              </ul>

              <button className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${plan.highlighted ? 'bg-green-600 hover:bg-green-700 text-white' : 'border-2 border-gray-200 hover:border-green-500 text-gray-700 hover:text-green-700'}`}>
                {plan.cta}
              </button>
            </div>
          )
        })}
      </div>

      <p className="text-center text-xs text-gray-400">Todos los precios en MXN + IVA. Factura disponible. Cancela cuando quieras.</p>
    </div>
  )
}
